import path from 'node:path';
import vue from '@vitejs/plugin-vue';
import envify from 'process-envify';
import tailwindColors from 'tailwindcss/colors';
import {
  presetIcons,
  presetTypography,
  presetWebFonts,
  presetWind4,
  transformerDirectives,
} from 'unocss';
import unocss from 'unocss/vite';
import { defineConfig } from 'vite';
import vueRoutes from 'vite-plugin-vue-routes';

export default defineConfig({
  define: envify({
    API_URL: process.env.API_URL || '',
  }),
  plugins: [
    unocss({
      presets: [
        presetWind4({
          preflights: {
            reset: true,
          },
        }),
        presetTypography(),
        presetIcons(),
        presetWebFonts({
          fonts: {
            sans: ['Roboto:400,500,600,700,800'],
            mono: ['Roboto Mono:400,500,600,700,800'],
          },
        }),
      ],
      transformers: [transformerDirectives()],
      theme: {
        colors: {
          primary: tailwindColors.indigo,
          secondary: tailwindColors.neutral,
          success: tailwindColors.emerald,
          danger: tailwindColors.rose,
          warning: tailwindColors.amber,
          info: tailwindColors.sky,
        },
      },
    }),
    vue(),
    vueRoutes(),
  ],
  resolve: {
    alias: {
      '~': path.resolve(import.meta.dirname, 'src'),
      '@': path.resolve(import.meta.dirname, 'src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        ws: true,
      },
    },
  },
});
