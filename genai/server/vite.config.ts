import { resolve } from 'node:path';
import envify from 'process-envify';
import { defineConfig } from 'vite';
import fastify from 'vite-plugin-fastify';
import fastifyRoutes from 'vite-plugin-fastify-routes';

export default defineConfig({
  define: envify({
    NODE_ENV: process.env.NODE_ENV || 'development',
    HOST: process.env.HOST || 'localhost',
    PORT: process.env.PORT || 3000,

    GEMINI_API_KEY: process.env.GEMINI_API_KEY || 'AI...',
    MONGODB_URL: process.env.MONGODB_URL || 'mongodb://root:password@127.0.0.1:27017/mydb',
    REDIS_URL: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
    QDRANT_URL: process.env.QDRANT_URL || 'http://127.0.0.1:6333',
    SITE_URL: process.env.SITE_URL || 'http://localhost:5173',
    SECRET_KEY: process.env.SECRET_KEY || 'tNTnXLYkhB5xMaAF9HKiu13ftxehU79K',
  }),
  plugins: [
    fastify({
      serverPath: './src/main.ts',
    }),
    fastifyRoutes(),
  ],
  build: {
    rollupOptions: {
      output: {
        exports: 'named',
        preserveModules: true,
        preserveModulesRoot: resolve(import.meta.dirname, 'src'),
      },
    },
  },
  resolve: {
    alias: {
      '~': resolve(import.meta.dirname, 'src'),
    },
  },
  test: {
    globals: true,
  },
});
