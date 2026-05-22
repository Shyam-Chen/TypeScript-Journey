import * as k8s from '@pulumi/kubernetes';

import { k8sProvider, serverImage } from './index.ts';

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

export const serverService = new k8s.core.v1.Service(
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
