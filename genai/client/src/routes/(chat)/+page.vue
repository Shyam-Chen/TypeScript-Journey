<script lang="ts" setup>
import { nextTick, onUnmounted, ref } from 'vue';
import MarkdownRenderer from './MarkdownRenderer.vue';
import useStore from './store.ts';

const { state, getters, actions, $reset } = useStore();

onUnmounted(() => $reset());

const userName = ref('使用者');
const userInput = ref('');
const isLoading = ref(false);
const chatContainer = ref(null);
const autoScroll = ref(true);

const messages = ref([
  // 測試資料範例
  // { role: 'user', content: '你好，請幫我寫一個 UI。' },
  // { role: 'assistant', content: '沒問題！這是一個仿照 Gemini 的設計。' }
]);

// const scrollToBottom = async () => {
//   await nextTick();
//   if (chatContainer.value) {
//     chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
//   }
// };

// const handleSend = async () => {
//   if (!userInput.value.trim() || isLoading.value) return;

//   const userText = userInput.value;
//   messages.value.push({ role: 'user', content: userText });
//   userInput.value = '';
//   scrollToBottom();

//   // 模擬 AI 回應
//   isLoading.value = true;

//   setTimeout(() => {
//     isLoading.value = false;
//     messages.value.push({
//       role: 'assistant',
//       content:
//         '這是一個使用 Vue SFC 與 Tailwind CSS 構建的 Gemini UI 範例。它包含了自動滾動、深色模式配色方案以及輸入框的動態樣式。',
//     });
//     scrollToBottom();
//   }, 1500);
// };
</script>

<template>
  <div class="flex flex-col h-screen bg-[#131314] text-[#e3e3e3] font-sans">
    <!-- 聊天內容區域 -->
    <main ref="chatContainer" class="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
      <div class="max-w-3xl mx-auto px-4 py-8">
        <!-- 初始狀態的問候語 -->
        <div v-if="state.messages.length === 0" class="mt-20 mb-12">
          <h1
            class="text-5xl font-medium bg-gradient-to-r from-[#4285f4] via-[#9b72cb] to-[#d96570] bg-clip-text text-transparent mb-2"
          >
            哈囉，{{ userName }}
          </h1>
          <p class="text-3xl text-[#444746] font-medium">我今天能幫你做什麼嗎？</p>
        </div>

        <!-- 訊息列表 -->
        <div class="space-y-10">
          <div v-for="(msg, index) in state.messages" :key="index">
            <!-- 使用者訊息 -->
            <div v-if="msg.role === 'user'" class="flex flex-col items-end">
              <div
                class="bg-[#1e1f20] px-5 py-3 rounded-2xl max-w-[85%] text-[#e3e3e3] leading-relaxed"
              >
                {{ msg.content }}
              </div>
            </div>

            <!-- AI 回應 -->
            <div v-else class="flex gap-4 group">
              <!-- AI 圖示 (Gemini 閃爍感) -->
              <div
                class="w-8 h-8 rounded-full bg-gradient-to-tr from-[#4285f4] to-[#9b72cb] flex-shrink-0 flex items-center justify-center mt-1"
              >
                <svg viewBox="0 0 24 24" class="w-5 h-5 text-white fill-current">
                  <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
                </svg>
              </div>

              <div class="flex-1 space-y-4 pt-1">
                <MarkdownRenderer :content="msg.content" />
                <!-- <div class="prose prose-invert max-w-none leading-relaxed text-[#e3e3e3]">
                  {{ msg.content }}
                </div> -->

                <!-- 操作按鈕 (滑鼠移入時顯示更明顯) -->
                <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    class="p-2 hover:bg-[#2d2f31] rounded-full text-[#8e918f] hover:text-[#e3e3e3]"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"
                      ></path>
                    </svg>
                  </button>
                  <button
                    class="p-2 hover:bg-[#2d2f31] rounded-full text-[#8e918f] hover:text-[#e3e3e3]"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3zm7-13h3a2 2 0 012 2v7a2 2 0 01-2 2h-3"
                      ></path>
                    </svg>
                  </button>
                  <button
                    class="p-2 hover:bg-[#2d2f31] rounded-full text-[#8e918f] hover:text-[#e3e3e3]"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                      ></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 載入中動畫 -->
          <div v-if="state.connecting" class="flex gap-4">
            <div class="w-8 h-8 rounded-full bg-[#2d2f31] animate-pulse"></div>
            <div class="flex-1 space-y-2">
              <div class="h-4 bg-[#1e1f20] rounded w-3/4 animate-pulse"></div>
              <div class="h-4 bg-[#1e1f20] rounded w-1/2 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- 底部輸入區域 -->
    <footer class="p-4 bg-gradient-to-t from-[#131314] via-[#131314] to-transparent">
      <div class="max-w-3xl mx-auto">
        <div
          class="relative bg-[#1e1f20] rounded-3xl p-2 flex flex-col gap-2 focus-within:bg-[#282a2c] transition-all border border-transparent focus-within:border-[#333537]"
        >
          <!-- 輸入框 -->
          <textarea
            v-model="state.prompt"
            @keydown.enter.exact.prevent="actions.sendPrompt()"
            rows="1"
            placeholder="在這邊輸入提示詞"
            class="w-full bg-transparent border-none focus:ring-0 text-[#e3e3e3] placeholder-[#8e918f] px-4 py-2 resize-none min-h-[56px] overflow-y-auto"
          ></textarea>

          <!-- 功能按鈕 -->
          <div class="flex items-center justify-between px-2 pb-1">
            <div class="flex items-center gap-1">
              <button class="p-2 text-[#e3e3e3] hover:bg-[#2d2f31] rounded-full transition">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  ></path>
                </svg>
              </button>
              <button class="p-2 text-[#e3e3e3] hover:bg-[#2d2f31] rounded-full transition">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                  ></path>
                </svg>
              </button>
            </div>

            <div class="flex items-center gap-2">
              <button class="p-2 text-[#e3e3e3] hover:bg-[#2d2f31] rounded-full transition">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  ></path>
                </svg>
              </button>
              <button
                @click="actions.sendPrompt()"
                :disabled="state.connecting"
                class="p-2 transition rounded-full"
                :class="state.prompt.trim() ? 'text-[#4285f4] hover:bg-[#2d2f31]' : 'text-[#444746]'"
              >
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <p class="text-center text-[11px] text-[#8e918f] mt-3">
          Gemini 可能會顯示不準確的資訊，因此請務必查證其回覆。
        </p>
      </div>
    </footer>
  </div>
</template>

<style lang="scss" scoped>
/* 隱藏捲動條 */
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* 讓 Textarea 自動換行時看起來更好 */
textarea:focus {
  outline: none;
}
</style>
