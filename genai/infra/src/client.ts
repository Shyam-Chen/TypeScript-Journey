import * as k8s from '@pulumi/kubernetes';

import { k8sProvider, clientImage } from './index.ts';

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

export const clientService = new k8s.core.v1.Service(
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
