import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';

import auth from '~/middleware/auth.ts';

export default (async (app) => {
  app.get('', async (_request, reply) => {
    return reply.send({ text: '' });
  });
}) as FastifyPluginAsyncTypebox;
