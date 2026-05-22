import { createGoogleGenerativeAI } from '@ai-sdk/google';

const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });

export default {
  model: google('gemini-3-flash-preview'),
  embeddingModel: google.embeddingModel('gemini-embedding-001'),
};
