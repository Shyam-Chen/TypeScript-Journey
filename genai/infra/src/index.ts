import * as docker from '@pulumi/docker';
import * as google from '@pulumi/google-native';
import * as k8s from '@pulumi/kubernetes';
import * as pulumi from '@pulumi/pulumi';

// Config
const config = new pulumi.Config();
const gcpConfig = new pulumi.Config('gcp');
const project = gcpConfig.require('project');
// Use a default region if not specified, e.g. us-central1
const region = gcpConfig.get('region') || 'us-central1';
const zone = `${region}-a`;

const stack = pulumi.getStack();

// 1. Google Artifact Registry to store Docker images
const repo = new google.artifactregistry.v1beta2.Repository('repo', {
  project: project,
  location: region,
  repositoryId: `repo-${stack}`,
  format: 'DOCKER',
});

const imageName = (name: string) =>
  pulumi.interpolate`${location}-docker.pkg.dev/${project}/${repo.repositoryId}/${name}:v1`;

// 2. Build and Push Docker Images
const location = region;

export const serverImage = new docker.Image('server-image', {
  imageName: pulumi.interpolate`${location}-docker.pkg.dev/${project}/${repo.name}/${stack}-server:latest`,
  build: {
    context: '../server',
    platform: 'linux/amd64',
  },
});

export const clientImage = new docker.Image('client-image', {
  imageName: pulumi.interpolate`${location}-docker.pkg.dev/${project}/${repo.name}/${stack}-client:latest`,
  build: {
    context: '../client',
    platform: 'linux/amd64',
  },
});

// 3. Create GKE Cluster
// Upgraded to e2-standard-2 to support MongoDB, Redis, Qdrant + Apps
const cluster = new google.container.v1.Cluster('cluster', {
  project: project,
  location: zone,
  initialNodeCount: 1, // Start with 1 node, can scale if needed, but standard-2 should hold for dev
  nodeConfig: {
    machineType: 'e2-standard-2', // 2 vCPU, 8GB RAM
    diskSizeGb: 50, // Increase disk slightly for DBs
    oauthScopes: ['https://www.googleapis.com/auth/cloud-platform'],
  },
});

// Export Kubeconfig
const kubeconfig = pulumi
  .all([cluster.name, cluster.endpoint, cluster.masterAuth])
  .apply(([name, endpoint, auth]) => {
    const context = `${project}_${zone}_${name}`;
    return `apiVersion: v1
clusters:
- cluster:
    certificate-authority-data: ${auth.clusterCaCertificate}
    server: https://${endpoint}
  name: ${context}
contexts:
- context:
    cluster: ${context}
    user: ${context}
  name: ${context}
current-context: ${context}
kind: Config
preferences: {}
users:
- name: ${context}
  user:
    exec:
      apiVersion: client.authentication.k8s.io/v1beta1
      command: gke-gcloud-auth-plugin
      installHint: Install gke-gcloud-auth-plugin for use with kubectl by running 'gcloud components install gke-gcloud-auth-plugin'
      provideClusterInfo: true
`;
  });

// 4. K8s Provider
export const k8sProvider = new k8s.Provider('k8s-provider', {
  kubeconfig: kubeconfig,
});

// 5. Helm Charts for Databases

// MongoDB (Bitnami) - Target v8 (image tag usually controlled by chart version, checking latest chart uses 7.0/8.0)
// Using bitnami/mongodb
const mongo = new k8s.helm.v3.Chart(
  'mongodb',
  {
    chart: 'mongodb',
    version: '15.0.0', // Approx version, ensures stability. Bitnami algo usually points to latest stable.
    fetchOpts: { repo: 'https://charts.bitnami.com/bitnami' },
    values: {
      auth: {
        rootPassword: 'securePassword123!',
        usernames: ['app-user'],
        passwords: ['securePassword123!'],
        databases: ['genai'],
      },
      architecture: 'standalone', // Simpler for dev
    },
  },
  { provider: k8sProvider },
);

// Redis (Bitnami)
const redis = new k8s.helm.v3.Chart(
  'redis',
  {
    chart: 'redis',
    version: '18.0.0',
    fetchOpts: { repo: 'https://charts.bitnami.com/bitnami' },
    values: {
      auth: {
        password: 'securePassword123!',
      },
      architecture: 'standalone',
    },
  },
  { provider: k8sProvider },
);

// Qdrant (Official)
const qdrant = new k8s.helm.v3.Chart(
  'qdrant',
  {
    chart: 'qdrant',
    fetchOpts: { repo: 'https://qdrant.github.io/qdrant-helm' },
    values: {
      // Default config is usually fine for dev
    },
  },
  { provider: k8sProvider },
);

// Connection Strings (derived from Helm release names)
// MongoDB: mongodb://root:password@mongodb.default.svc.cluster.local:27017/genai
// Redis: redis://:password@redis-master.default.svc.cluster.local:6379
// Qdrant: http://qdrant.default.svc.cluster.local:6333

const mongoUri =
  'mongodb://root:securePassword123!@mongodb.default.svc.cluster.local:27017/genai?authSource=admin';
const redisUri = 'redis://:securePassword123!@redis-master.default.svc.cluster.local:6379';
const qdrantUri = 'http://qdrant.default.svc.cluster.local:6333';

// 6. Deploy Server
const appLabels = { app: 'genai-server' };
const serverDeployment = new k8s.apps.v1.Deployment(
  'server-deployment',
  {
    metadata: { labels: appLabels },
    spec: {
      replicas: 1,
      selector: { matchLabels: appLabels },
      template: {
        metadata: { labels: appLabels },
        spec: {
          containers: [
            {
              name: 'server',
              image: serverImage.imageName,
              ports: [{ containerPort: 3000 }],
              env: [
                { name: 'MONGODB_URL', value: mongoUri },
                { name: 'REDIS_URL', value: redisUri },
                { name: 'QDRANT_URL', value: qdrantUri },
                { name: 'PORT', value: '3000' },
                { name: 'HOST', value: '0.0.0.0' },
                // Add Gemini API Key if needed, assuming env var or secret
                // { name: "GEMINI_API_KEY", value: ... }
              ],
            },
          ],
        },
      },
    },
  },
  { provider: k8sProvider, dependsOn: [mongo, redis, qdrant] }, // Ensure DBs are up first
);

const serverService = new k8s.core.v1.Service(
  'server-service',
  {
    metadata: {
      name: 'server',
      labels: appLabels,
    },
    spec: {
      type: 'ClusterIP',
      ports: [{ port: 3000, targetPort: 3000 }],
      selector: appLabels,
    },
  },
  { provider: k8sProvider },
);

// 7. Deploy Client
const clientLabels = { app: 'genai-client' };
const clientDeployment = new k8s.apps.v1.Deployment(
  'client-deployment',
  {
    metadata: { labels: clientLabels },
    spec: {
      replicas: 1,
      selector: { matchLabels: clientLabels },
      template: {
        metadata: { labels: clientLabels },
        spec: {
          containers: [
            {
              name: 'client',
              image: clientImage.imageName,
              ports: [{ containerPort: 80 }],
            },
          ],
        },
      },
    },
  },
  { provider: k8sProvider },
);

const clientService = new k8s.core.v1.Service(
  'client-service',
  {
    metadata: { labels: clientLabels },
    spec: {
      type: 'LoadBalancer',
      ports: [{ port: 80, targetPort: 80 }],
      selector: clientLabels,
    },
  },
  { provider: k8sProvider },
);

// Exports
export const clientUrl = clientService.status.loadBalancer.ingress[0].ip;
export const kubeconfigOut = kubeconfig;
