import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import mongodb from '@fastify/mongodb';
import rateLimit from '@fastify/rate-limit';
import sse from '@fastify/sse';
import underPressure from '@fastify/under-pressure';
import websocket from '@fastify/websocket';
import fastify from 'fastify';

import router from '~/plugins/router.ts';

export default () => {
  const app = fastify({
    logger: {
      transport: {
        target: '@fastify/one-line-logger',
      },
    },
  });

  app.register(cors, { origin: new RegExp(process.env.SITE_URL, 'gi') });
  app.register(helmet);
  app.register(jwt, { secret: process.env.SECRET_KEY });
  // app.register(mongodb, { url: process.env.MONGODB_URL });
  app.register(rateLimit);
  app.register(underPressure, { exposeStatusRoute: '/api/healthz' });
  app.register(websocket);
  app.register(sse);

  app.register(router);

  return app;
};
