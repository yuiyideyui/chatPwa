<template>
  <div
    class="flex flex-col h-100vh w-100vw bg-[#f8fafc] dark:bg-[#0f172a] transition-colors duration-500 overflow-hidden text-slate-900 dark:text-slate-100 font-sans"
  >
    <chatAiBoxSide
      :is-open="isSidebarOpen"
      @close="isSidebarOpen = false"
      @new-chat="handleNewChat"
    />
    <header
      class="flex items-center justify-between px-6 h-16 shrink-0 backdrop-blur-xl bg-white/70 dark:bg-[#1e293b]/70 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50"
    >
      <div class="flex items-center gap-3">
        <div class="relative" @click="()=>isSidebarOpen = true">
          <div
            class="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20"
          >
            <img v-if="messages" :src="chatStore.currentChat!.imgUrl" alt="" class="w-full h-full object-cover">
          </div>
          <div
            class="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full"
          ></div>
        </div>
        <div>
          <h2 class="font-bold text-sm tracking-tight leading-tight">{{ chatStore.currentChat?.roleName }}</h2>
          <!-- <p class="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
            {{ chatStore.currentChat?.system }}
          </p> -->
        </div>
      </div>
      <div class="flex gap-4">
        <button
          @click="isDark = !isDark"
          class="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <span
            :class="
              isDark
                ? 'i-solar-sun-2-bold-duotone'
                : 'i-solar-moon-bold-duotone'
            "
            class="text-xl"
          ></span>
        </button>
      </div>
    </header>

    <main
      ref="scrollRef"
      class="flex-1 overflow-y-auto px-4 py-4 space-y-6 no-scrollbar pb-32"
    >
      <div
        v-if="messages && messages.length <= 1"
        class="py-10 flex flex-col items-center animate-fade-in"
      >
        <div
          class="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6"
        >
          <img :src="chatStore.currentChat!.imgUrl" alt="" class="w-full h-full object-cover">
        </div>
        <h1 class="text-xl font-bold mb-2">{{ chatStore.currentChat!.roleName }}</h1>
        <p class="text-slate-500 text-sm mb-8">
          {{ chatStore.currentChat!.system }}
        </p>
      </div>

      <div
        v-for="(msg, index) in messages"
        :key="index"
        :class="[
          'flex w-full message-bounce',
          msg.role === 'user' ? 'justify-end' : 'justify-start',
        ]"
      >
        <div
          :class="[
            'max-w-[85%] px-5 py-3.5 relative shadow-sm',
            msg.role === 'user'
              ? 'bg-indigo-600 text-white rounded-t-2xl rounded-bl-2xl rounded-br-4px'
              : 'bg-white dark:bg-slate-800 rounded-t-2xl rounded-br-2xl rounded-bl-4px border border-slate-100 dark:border-slate-700',
          ]"
        >
          <div class="text-[15px] leading-relaxed whitespace-pre-wrap">
            {{ msg.content }}
            <span
              v-if="msg?.typing"
              class="inline-block w-2 h-2 bg-indigo-400 rounded-full animate-ping ml-1"
            ></span>
          </div>

          <div
            :class="[
              'text-[9px] mt-1 opacity-50',
              msg.role === 'user' ? 'text-right' : 'text-left',
            ]"
          >
            {{
              new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            }}
          </div>
        </div>
      </div>
    </main>

    <footer
      class="fixed bottom-0 left-0 px-4 w-[calc(100%-2rem)] pb-6 bg-gradient-to-t from-[#f8fafc] dark:from-[#0f172a] via-[#f8fafc] dark:via-[#0f172a] to-transparent"
    >
      <div class="max-w-screen-md mx-auto relative group">
        <div
          class="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[30px] opacity-0 group-focus-within:opacity-20 blur transition duration-1000"
        ></div>

        <div
          class="relative bg-white dark:bg-slate-800 rounded-[28px] border border-slate-200 dark:border-slate-700 p-2 flex items-end shadow-2xl"
        >
          <button
            @click="resetInput"
            class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
          >
            <span
              class="i-solar-paperclip-bold-duotone text-xl text-slate-400"
            ></span>
          </button>

          <textarea
            v-model="inputContent"
            rows="1"
            placeholder="输入您的问题..."
            class="flex-1 bg-transparent border-none outline-none py-3 px-3 text-sm max-h-32 overflow-y-auto resize-none"
            @input="adjustHeight"
            @keydown.enter.prevent="sendMessage"
            ref="inputRef"
          ></textarea>

          <button
            @click="sendMessage"
            :disabled="!inputContent.trim() || isThinking"
            :class="[
              'w-10 h-10 flex items-center justify-center rounded-2xl transition-all duration-300',
              inputContent.trim()
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/40'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-400',
            ]"
          >
            <span
              :class="
                isThinking
                  ? 'i-solar-stop-bold'
                  : 'i-solar-arrow-up-bold-duotone'
              "
              class="text-xl c-[#39c5bb]"
              >I</span
            >
          </button>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="tsx">
import { ref, nextTick, watch, computed } from "vue";
import chatAiBoxSide from "./chatAiBoxSide.vue";
import { useChatStore } from '@/store'
import type { IChatHistory } from "@/store/chatStore/chatStoreIndex.type";

const chatStore = useChatStore()
// 侧边栏
const isSidebarOpen = ref(false);
const handleNewChat = ()=>{
  console.log('handleNewChat');
}

const inputRef = ref<HTMLElement | null>(null);
const isDark = ref(true);
const inputContent = ref("");
const isThinking = ref(false);
const scrollRef = ref<HTMLElement | null>(null);
// 假设你的消息接口定义如下 
const messages = computed<(IChatHistory['chatContent'][number] & {typing?:boolean})[] | null>(()=>{
  return chatStore.currentChat?.chatContent || null;
})

const resetInput = () => {
  inputContent.value = "";
  if (inputRef.value) {
    inputRef.value.style.height = "auto";
  }
};

const adjustHeight = (e: any) => {
  const el = e.target;
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
  if (inputContent.value.length === 0) resetInput();
};

const scrollToBottom = async (isFirst = false) => {
  await nextTick();
  if (scrollRef.value) {
    scrollRef.value.scrollTo({
      top: scrollRef.value.scrollHeight,
      behavior: isFirst ? "auto" : "smooth",
    });
  }
};

const sendMessage = async () => {
  const userPrompt = inputContent.value;
  if (!userPrompt.trim()) return;

  const chat = chatStore.currentChat; // 获取当前的 IChatHistory 实例
  if (!chat) return;

  // 1. 更新 UI：添加用户消息
  const currentTime = new Date().toLocaleString();
  const userMessage = { role: 'user', content: userPrompt, chatTime: currentTime } as const;
  
  // 这里直接操作 chatContent 以便后续存入 IndexedDB/Store
  chatStore.updateCurrentChatContent(userMessage); 
  inputContent.value = '';
  isThinking.value = true;

  // 2. 准备 AI 消息占位
  const aiMsg:IChatHistory["chatContent"][number] = { role: 'assistant', content: {text:''}, chatTime: '', typing: true };
  // 注意：这里为了 UI 渲染，我们可能依然需要 messages.value = chat.chatContent
  // 假设你的页面是直接绑定 chat.chatContent 的
  chatStore.updateCurrentChatContent(aiMsg);

  try {
    // 3. 构建上下文消息列表
    // 提取历史记录中的 role 和 content，过滤掉还在 typing 的占位消息
    const contextMessages = chat.chatContent
      .filter(m => m.content !== '' || m.role === 'user')
      .map(m => ({
        role: m.role,
        content: m.content
      }));

    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.2:3b',
        messages: [
          { role: 'system', content: `你是一个游戏百科全书。当前选中的角色世界观是：${chat.system}` },
          ...contextMessages // 注入历史上下文
        ],
        stream: true,
      }),
    });

    if (!response.body) return;

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const json = JSON.parse(line);
          if (json.message?.content) {
            aiMsg.content = json.message.content;
            scrollToBottom();
          }
          if (json.done) {
            aiMsg.typing = false;
            aiMsg.chatTime = new Date().toLocaleString();
            // 这里可以触发保存到 IndexedDB 的逻辑
            chatStore.saveToIndexedDB(); 
          }
        } catch (e) {
          console.error("流解析失败", e);
        }
      }
    }
  } catch (error) {
    aiMsg.content.text = "连接失败，请检查 Ollama 服务。";
    aiMsg.typing = false;
  } finally {
    isThinking.value = false;
  }
};

// 监听暗号模式切换
watch(
  isDark,
  (val) => {
    if (val) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  },
  { immediate: true },
);

watch(()=>chatStore.currentChat?.id,()=>{
  scrollToBottom(true)
},{
  immediate:true
})
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* 物理弹簧感动画 */
.message-bounce {
  animation: messageBounce 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
}

@keyframes messageBounce {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* 渐入 */
.animate-fade-in {
  animation: fadeIn 0.6s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* 自定义消息气泡的细微不对称 */
.rounded-t-2xl {
  border-top-left-radius: 1.25rem;
  border-top-right-radius: 1.25rem;
}
.rounded-br-4px {
  border-bottom-right-radius: 4px;
}
.rounded-bl-4px {
  border-bottom-left-radius: 4px;
}
</style>
