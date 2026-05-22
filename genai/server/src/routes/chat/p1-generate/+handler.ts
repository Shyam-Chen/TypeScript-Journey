import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { generateText } from 'ai';

import gemini from '~/utils/gemini.ts';

// 🟢
export default (async (app) => {
  /*
  $ curl --request GET \
         --url http://localhost:3000/api/chat
  */
  app.get('', async (_request, reply) => {
    const { text } = await generateText({
      model: gemini.model,
      system: ``,
      prompt: `什麼是 Generative AI？`,
    });

    return reply.send({ text });
  });
}) as FastifyPluginAsyncTypebox;
