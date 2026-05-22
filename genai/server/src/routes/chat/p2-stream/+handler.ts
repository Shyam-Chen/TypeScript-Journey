import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import type { ModelMessage } from 'ai';
import { streamText } from 'ai';

import gemini from '~/utils/gemini.ts';

// 🟢
export default (async (app) => {
  app.post('', { sse: true }, async (request, reply) => {
    const body = JSON.parse(request.body as string) as { messages: ModelMessage[] };

    const { textStream } = streamText({
      model: gemini.model,
      system: ``,
      messages: body.messages,
    });

    for await (const textPart of textStream) {
      await reply.sse.send({ data: textPart });
    }
  });
}) as FastifyPluginAsyncTypebox;
