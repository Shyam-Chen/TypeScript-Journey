import { randomUUID } from 'node:crypto';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { QdrantClient } from '@qdrant/js-client-rest';
import type { ModelMessage } from 'ai';
import { embed, embedMany, generateText, jsonSchema, stepCountIs, streamText, tool } from 'ai';
import Type from 'typebox';

import auth from '~/middleware/auth.ts';
import chunkText from '~/utils/chunkText.ts';

const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });
const llm = google('gemini-3-flash-preview');
const embeddingModel = google.embeddingModel('gemini-embedding-001');

const qdrant = new QdrantClient({ url: process.env.QDRANT_URL });
const COLLECTION_NAME = 'my-knowledge-base';

export default (async (app) => {
  // 🟢
  app.post('', { sse: true }, async (request, reply) => {
    const body = JSON.parse(request.body as string) as { messages: ModelMessage[] };

    // 只留近 5 則的來回對話紀錄
    const limitedMessages = body.messages.slice(-10);

    const { textStream } = streamText({
      model: llm,
      system: ``,
      messages: limitedMessages,
    });

    for await (const textPart of textStream) {
      await reply.sse.send({ data: textPart });
    }
  });

  // 單次摘要 - Summarize messages
  // 🟢
  app.post('/summarize', { sse: true }, async (request, reply) => {
    const body = JSON.parse(request.body as string) as { messages: ModelMessage[] };

    // 保留 5 則的來回對話紀錄
    const SUMMARY_THRESHOLD = 10;

    let chatHistory = body.messages;
    let contextSummary = '';

    // Enhancement: 整合進資料庫，做累加摘要
    if (body.messages.length > SUMMARY_THRESHOLD) {
      const messagesToSummarize = body.messages.slice(0, -SUMMARY_THRESHOLD);
      const recentMessages = body.messages.slice(-SUMMARY_THRESHOLD);

      // 呼叫 LLM 進行摘要
      const { text } = await generateText({
        model: llm,
        system: `你是一個專業的對話管理助手。請將提供的對話紀錄總結成一段精簡的摘要，保留關鍵的事實、用戶偏好與目前的任務進度。摘要必須非常簡短。`,
        prompt: `請總結以下對話：\n${messagesToSummarize.map((m) => `${m.role}: ${m.content}`).join('\n')}`,
      });

      contextSummary = `這是先前對話的摘要背景：${text}`;
      chatHistory = recentMessages;
    }

    const { textStream } = streamText({
      model: llm,
      system: contextSummary,
      messages: chatHistory,
    });

    for await (const textPart of textStream) {
      await reply.sse.send({ data: textPart });
    }
  });

  // ---

  // 🟡
  app.post('/embed', async (_request, reply) => {
    // 推薦的參數設定
    // https://ai.google.dev/gemini-api/docs/embeddings?hl=zh-tw#model-versions
    const OUTPUT_DIMENSIONALITY = 3072; // gemini-embedding-001 預設是 3072，建議 768、1536 或 3072
    const CHUNK_SIZE = 800; // 每個 chunk 的字數
    const CHUNK_OVERLAP = 80; // 每個 chunk 的重疊字元為 10% 的 CHUNK_SIZE，確保語意連續

    //  檢查並建立 Qdrant Collection (如果不存在)
    const collections = await qdrant.getCollections();
    const exists = collections.collections.some((c) => c.name === COLLECTION_NAME);

    if (!exists) {
      await qdrant.createCollection(COLLECTION_NAME, {
        vectors: {
          size: OUTPUT_DIMENSIONALITY,
          distance: 'Cosine', // 餘弦相似度
        },
      });
    }

    const body = {
      content: `
        ### 特別休假日數計算基礎

        員工在本公司連續工作滿一定時間後，得依下列規定作為核給年度特別休假日數計算基礎：

        - 六個月以上一年未滿者，給予三日。
        - 一年以上二年未滿者，每年七日。
        - 二年以上三年未滿者，每年十日。
        - 三年以上五年未滿者，每年十四日。
        - 五年以上十年未滿者，每年十五日。
        - 十年以上者，每一年加給一日，但總日數不得超過三十日。
      `,
      summary: '特別休假給假要點',
    };

    // 嘗試 `@langchain/textsplitters`
    const chunks = chunkText(body.content, CHUNK_SIZE, CHUNK_OVERLAP);

    const { embeddings } = await embedMany({
      model: embeddingModel,
      values: chunks,
    });

    const points = embeddings.map((vector, index) => ({
      id: randomUUID(),
      vector,
      payload: {
        text: chunks[index],
        // source: 'manual_input',
        timestamp: new Date().toISOString(),
      },
    }));

    await qdrant.upsert(COLLECTION_NAME, {
      wait: true,
      points: points,
    });

    return reply.send({ message: 'OK' });
  });

  // 🟡
  app.post('/query', { sse: true }, async (request, reply) => {
    const body = JSON.parse(request.body as string);

    const input = `入職滿半年有幾天特休？`;

    const { embedding } = await embed({
      model: embeddingModel,
      value: input,
    });

    // 從 Qdrant 進行向量搜尋
    const searchResults = await qdrant.search(COLLECTION_NAME, {
      vector: embedding,
      limit: 3,
      with_payload: true,
    });

    // 組合 Context
    const context = searchResults.map(
      (r) => `
      ${r.payload?.text}

      ${r.payload?.source ? `資料來源：${r.payload?.source}` : ''}
    `,
    );

    const { textStream } = streamText({
      model: llm,
      prompt: `
        你是一個專業的助手，請根據以下提供的「參考資料」回答使用者的提問。
        如果資料中沒有提到，請回答不知道。
        回覆時請務必註明資料來源。

        ### 參考資料：
        ${context}

        ### 使用者的提問：
        ${input}
      `,
    });

    for await (const textPart of textStream) {
      await reply.sse.send({ data: textPart });
    }
  });

  // ---

  // 🔴
  app.post('/tool', { sse: true, onRequest: [auth] }, async (request, reply) => {
    const input = `我還有剩下幾天的特休可用？`;

    const { textStream } = streamText({
      model: llm,
      prompt: `${input}`,
      tools: {
        username: tool({
          description: 'Get the username',
          inputSchema: jsonSchema(
            Type.Object({
              username: Type.String({ description: 'The username to get the username for' }),
            }),
          ),
          async execute({ username }) {
            const users = app.mongo.db?.collection('users');

            const user = await users?.findOne(
              { username: { $eq: request.user.username } },
              { projection: { password: 0, secret: 0 } },
            );

            return { username };
          },
        }),
      },
    });

    for await (const textPart of textStream) {
      await reply.sse.send({ data: textPart });
    }
  });

  // ---

  // 🔴
  app.post('/step', { sse: true, onRequest: [auth] }, async (request, reply) => {
    // 當前用戶名
    // request.user.username

    const body = JSON.parse(request.body as string) as { messages: ModelMessage[] };

    const limitedMessages = body.messages.slice(-10);

    const { textStream } = streamText({
      model: llm,
      messages: limitedMessages,
      system: '你是一個企業 HR 助手。你可以回答關於公司政策的問題，也可以查詢員工個人的特休資訊。',
      tools: {
        // 工具一：查詢 HR 規章 (RAG)
        queryHRPolicy: tool({
          description: '查詢公司的 HR 規章、福利、請假流程等一般性政策。',
          inputSchema: jsonSchema(
            Type.Object({
              query: Type.String({ description: '要搜尋的政策關鍵字' }),
            }),
          ),
          async execute({ query }) {
            // 這裡實作你的向量資料庫檢索邏輯 (例如 Pinecone, Supabase Vector)
            // const docs = await vectorStore.search(query);
            return { content: '根據規章第 5 條，病假每年有 30 天半薪...' };
          },
        }),

        // 工具二：查詢個人資料 (Doc / SQL / API)
        getUserVacationBalance: tool({
          description: '查詢特定員工剩餘的特休天數。',
          inputSchema: jsonSchema(Type.Object({})), // 不需要參數，因為我們會從 Context 拿 userId
          async execute() {
            // 這裡實作你的資料庫查詢
            // const balance = await db.vacation.findFirst({ where: { userId } });
            const balance = 12.5;
            return { daysRemaining: balance, userId: request.user.username };
          },
        }),
      },

      // 自動執行工具並回傳結果給 AI
      stopWhen: stepCountIs(5),
    });

    await reply.sse.send({ data: '' });
  });
}) as FastifyPluginAsyncTypebox;
