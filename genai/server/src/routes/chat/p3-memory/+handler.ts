import { randomUUID } from 'node:crypto';
import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import type { ModelMessage } from 'ai';
import { streamText } from 'ai';

import gemini from '~/utils/gemini.ts';

interface ChatRequestBody {
  conversationId?: ReturnType<typeof randomUUID>; // 對話編號，第一次請求時可能不存在
  messages: ModelMessage[]; // 這次請求中，使用者發送的新訊息（例如，一個 {role: 'user', content: '...'} 的陣列）
}

// 模擬資料庫儲存
// 在插件作用域外或插件內部但函數外部聲明，確保它在所有請求之間共享
// Map 的鍵是 conversationId (string)，值是該對話的所有 ModelMessage 陣列
const conversationHistory = new Map<
  ChatRequestBody['conversationId'],
  ChatRequestBody['messages']
>();

// 🟡
export default (async (app) => {
  // 1. 建立對話編號
  // 2. 將對話紀錄儲存至對話編號
  // 3. 使用者做第二次以上回覆，將先前對話紀錄一併給 AI 模型，以實作「短期記憶」
  app.post('', { sse: true }, async (request, reply) => {
    const body = JSON.parse(request.body as string) as ChatRequestBody;

    let currentConversationId = body.conversationId;

    // 建立對話編號 (或使用現有的)
    if (!currentConversationId) {
      currentConversationId = randomUUID();
      // 如果是新的對話，透過 SSE 發送 conversationId 給客戶端
      // 客戶端需要監聽 'conversationId' 事件來獲取這個 ID
      await reply.sse.send({ event: 'conversationId', data: currentConversationId });
    }

    // 從 Map 中獲取該對話的歷史紀錄
    const previousMessages: ModelMessage[] = conversationHistory.get(currentConversationId) || [];

    // 使用者做第二次以上回覆，將先前對話紀錄一併給 AI 模型，以實作「短期記憶」
    // 將先前的對話紀錄與使用者這次的新訊息合併，作為給 AI 模型的完整上下文
    const messagesForAI: ModelMessage[] = [...previousMessages, ...body.messages];

    let aiResponseContent = ''; // 用於收集 AI 的完整回覆

    const { textStream } = streamText({
      model: gemini.model,
      system: ``,
      messages: messagesForAI,
    });

    for await (const textPart of textStream) {
      aiResponseContent += textPart; // 收集 AI 的回覆片段
      await reply.sse.send({ data: textPart });
    }

    // 將對話紀錄儲存至對話編號
    // 將 AI 的完整回覆也添加到對話紀錄中
    const aiMessage: ModelMessage = { role: 'assistant', content: aiResponseContent };
    const updatedHistory: ModelMessage[] = [...messagesForAI, aiMessage];

    // 將更新後的完整對話紀錄儲存到 Map 中
    conversationHistory.set(currentConversationId, updatedHistory);

    // 結束 SSE 連接
    return reply.sse.close();
  });

  // [enhancement] Summarize messages
  // [
  //   { role: 'assistant', content: '__SUMMARY_CONTENT__' },
  //   { role: 'user', content: '__USER_CONTENT__' },
  //   { role: 'assistant', content: '__ASSISTANT_CONTENT__' },
  // ]
  // 1. 當訊息過多時，定期將舊的對話紀錄進行摘要，以節省 Token
  app.post('/summarize', { sse: true }, async (request, reply) => {
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

  // [in production] Use a checkpointer backed by a database
  app.post('/checkpointer', { sse: true }, async (request, reply) => {
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
