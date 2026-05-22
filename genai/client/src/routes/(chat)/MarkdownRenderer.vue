<script lang="ts" setup>
import { fromHighlighter } from '@shikijs/markdown-it/core';
import { useDark } from '@vueuse/core';
import MarkdownIt from 'markdown-it';
import { createHighlighterCore } from 'shiki/core';
import { createOnigurumaEngine } from 'shiki/engine/oniguruma';
import { computed, onBeforeMount } from 'vue';

import useHighlighter from './useHighlighter.ts';

const props = withDefaults(
  defineProps<{
    content?: string;
  }>(),
  {
    content: '',
  },
);

const isDark = useDark();

const highlighter = useHighlighter();

onBeforeMount(async () => {
  if (highlighter.state.core) return;

  const highlighterCore = await createHighlighterCore({
    themes: [import('@shikijs/themes/github-dark'), import('@shikijs/themes/github-light')],
    langs: [
      // --- 基礎與文件 ---
      import('@shikijs/langs/markdown'),
      import('@shikijs/langs/diff'), // AI 建議修改程式碼時必備
      import('@shikijs/langs/mermaid'), // AI 畫圖表常用

      // --- Web 前端 (含現代框架) ---
      import('@shikijs/langs/javascript'),
      import('@shikijs/langs/typescript'),
      import('@shikijs/langs/jsx'),
      import('@shikijs/langs/tsx'),
      import('@shikijs/langs/html'),
      import('@shikijs/langs/css'),
      import('@shikijs/langs/scss'),
      import('@shikijs/langs/vue'),
      import('@shikijs/langs/svelte'),
      import('@shikijs/langs/astro'),

      // --- 主流後端與系統語言 ---
      import('@shikijs/langs/python'), // AI/資料科學第一名
      import('@shikijs/langs/java'),
      import('@shikijs/langs/go'),
      import('@shikijs/langs/rust'),
      import('@shikijs/langs/cpp'), // 即 C++
      import('@shikijs/langs/c'),
      import('@shikijs/langs/csharp'), // 即 C#
      import('@shikijs/langs/php'),
      import('@shikijs/langs/ruby'),
      import('@shikijs/langs/elixir'), // 現代高並發語言
      import('@shikijs/langs/zig'),

      // --- 移動端與跨平台 ---
      import('@shikijs/langs/dart'), // Flutter
      import('@shikijs/langs/swift'),
      import('@shikijs/langs/kotlin'),

      // --- 資料、設定與 Ops (DevOps) ---
      import('@shikijs/langs/json'),
      import('@shikijs/langs/yaml'),
      import('@shikijs/langs/toml'),
      import('@shikijs/langs/xml'),
      import('@shikijs/langs/sql'),
      import('@shikijs/langs/bash'), // 包含 sh
      import('@shikijs/langs/powershell'),
      import('@shikijs/langs/nix'),
      import('@shikijs/langs/dockerfile'),
      import('@shikijs/langs/nginx'),
      import('@shikijs/langs/makefile'),
      import('@shikijs/langs/terraform'), // HCL

      // --- 專業領域 (科學、資料、API) ---
      import('@shikijs/langs/r'),
      import('@shikijs/langs/julia'),
      import('@shikijs/langs/latex'), // 數學公式
      import('@shikijs/langs/graphql'),
      import('@shikijs/langs/prisma'), // ORM
      import('@shikijs/langs/proto'), // gRPC
      import('@shikijs/langs/solidity'), // 區塊鏈
    ],
    engine: createOnigurumaEngine(import('shiki/wasm')),
  });

  highlighter.state.core = highlighterCore;
});

const md = new MarkdownIt({
  html: true,
  breaks: true,
  linkify: true,
  typographer: true,
});

const renderedMarkdown = computed(() => {
  if (highlighter.state.core) {
    md.use(
      fromHighlighter(highlighter.state.core, {
        theme: isDark.value ? 'github-dark' : 'github-light',
        fallbackLanguage: 'md',
      }),
    );
  }

  // TODO: 如果要用 textarea 作為提示輸入且算繪使用者的提示輸入，需要再搭配 dompurify，使用 tiptap 可忽略
  return md.render(props.content);
});
</script>

<template>
  <div class="MarkdownRenderer" v-html="renderedMarkdown"></div>
</template>

<style lang="scss" scoped>
.MarkdownRenderer {
  > :deep(:first-child) {
    @apply mt-1!;
  }

  > :deep(:last-child) {
    @apply mb-1!;
  }
}

/** p */
:deep(p) {
  @apply my-5;
}

/** h1 */
:deep(h1) {
  @apply mt-2 mb-4 text-4xl font-extrabold;
}

/** h2 */
:deep(h2) {
  @apply mt-2 mb-4 text-3xl font-bold;
}

/** h3 */
:deep(h3) {
  @apply mt-2 mb-4 text-2xl font-semibold;
}

/** h4 */
:deep(h4) {
  @apply mt-2 mb-4 text-xl font-medium;
}

/** ul */
:deep(ul) {
  @apply mt-1 mb-5 list-disc ml-6;
}

:deep(ul > li) {
  @apply my-2;
}

/** ol */
:deep(ol) {
  @apply mt-1 mb-5 list-decimal ml-6;
}

:deep(ol > li) {
  @apply my-2;
}

/** code */
:deep(code:not([class^='language'])) {
  @apply mb-0.5 px-1.5 py-1 h-fit font-mono font-normal inline-block whitespace-nowrap text-gray-700 bg-gray-300 text-sm leading-none align-middle rounded overflow-auto;
}

/** code block */
:deep(pre) {
  @apply max-w-180 overflow-auto;
  @apply my-5 p-4 border border-gray-300 rounded-lg;
}

.dark .MarkdownRenderer {
  :deep(pre) {
    @apply border-gray-500;
  }
}

/** table */
:deep(table) {
  @apply my-5;
}

:deep(thead) {
  @apply text-gray-800 bg-gray-200;
}

:deep(th) {
  @apply px-2.5 py-1.5 border;
}

:deep(td) {
  @apply px-2.5 py-1.5 border;
}

.dark .MarkdownRenderer {
  :deep(thead) {
    @apply text-gray-300 bg-gray-700;
  }

  :deep(th) {
    @apply border-gray-500;
  }

  :deep(td) {
    @apply border-gray-500;
  }
}

/** a */
:deep(a) {
  @apply text-primary-500 hover:underline hover:text-primary-600;
}

/** blockquote */
:deep(blockquote) {
  @apply px-2 border-l-4 border-slate-500;
}
</style>
