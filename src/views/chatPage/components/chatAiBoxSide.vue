<template>
  <Transition name="fade">
    <div
      v-if="isOpen"
      @click="$emit('close')"
      class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-100"
    ></div>
  </Transition>

  <Transition name="slide">
    <aside
      v-if="isOpen"
      class="fixed top-0 left-0 h-full w-[280px] bg-white dark:bg-[#0f172a] z-101 shadow-2xl flex flex-col border-r border-slate-200 dark:border-slate-800"
    >
      <div class="p-4 pt-6">
        <button
          @click="startNewChat"
          class="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-indigo-500/20"
        >
          <span class="i-solar-add-circle-bold-duotone text-xl"></span>
          <span>开启新角色对话</span>
        </button>
      </div>

      <nav class="flex-1 overflow-y-auto px-3 no-scrollbar space-y-6 py-2">
        <section>
          <p
            class="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3"
          >
            最近对话
          </p>
          <div class="space-y-1">
            <div
              v-for="chat in chatStore.chatHistory"
              :key="chat.id"
              @click="selectChat(chat.id)"
              :class="[
                'group flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all relative',
                chatStore.currentChat?.id === chat.id
                  ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400',
              ]"
            >
              <span
                class="i-solar-chat-round-line-line-duotone text-lg shrink-0"
              ></span>
              <span class="text-sm truncate pr-6 font-medium">{{
                chat.title
              }}</span>

              <div
                class="absolute right-2 flex gap-1 group-hover:opacity-100 transition-opacity"
              >
                <button
                  @click.stop="handleDelete(chat.id)"
                  class="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-500 hover:text-red-600 rounded-md transition-colors"
                  title="删除对话"
                >
                  <span
                    class="i-solar-trash-bin-trash-bold text-sm block"
                  ></span>
                </button>
              </div>
            </div>
          </div>
        </section>

        <section>
          <p
            class="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3"
          >
            更早之前
          </p>
          <!-- <div class="space-y-1 opacity-70">
            <div class="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-not-allowed">
              <span class="i-solar-history-line-duotone text-lg shrink-0"></span>
              <span class="text-sm truncate font-medium">去年的创意方案回顾</span>
            </div>
          </div> -->
        </section>
      </nav>

      <div
        class="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50"
      >
        <div
          class="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <div
            class="w-9 h-9 rounded-full bg-gradient-to-tr from-orange-400 to-rose-400 flex items-center justify-center text-white font-bold text-xs shadow-sm"
          >
            JD
          </div>
          <div class="flex-1 truncate">
            <p class="text-sm font-bold truncate">yui</p>
            <p class="text-[10px] text-slate-500 font-medium">noName用户</p>
          </div>
          <span
            class="i-solar-settings-bold-duotone text-slate-400 text-lg"
          ></span>
        </div>
      </div>
    </aside>
  </Transition>
</template>

<script setup lang="ts">
import { useChatStore } from "@/store";
import { router } from "@/router";
const chatStore = useChatStore();
defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits(["close", "select-chat", "new-chat"]);

// const chatHistory = ref(chatStore.chatHistory)

const selectChat = (id: number) => {
  chatStore.setCurrentChat(id);
  emit("select-chat", id);
  // 移动端选择后自动关闭
  emit("close");
};

const handleDelete = (id: number) => {
  chatStore.deleteChat(id);
  if (chatStore.chatHistory.length > 0) {
    chatStore.setCurrentChat(chatStore.chatHistory[0]!.id);
  } else {
    router.push("/");
  }
};

const startNewChat = () => {
  emit("new-chat");
  emit("close");
  router.push("/");
};
</script>

<style scoped>
/* 侧边栏滑入动画 */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(-100%);
}

/* 遮罩层淡入动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}
</style>
