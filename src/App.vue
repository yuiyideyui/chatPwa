<script setup lang="tsx">
import PWABadge from "./components/PWABadge.vue";
import { onMounted, ref } from "vue";
import { DB_NAME_ENUM, getAllChatHistory, openDB } from "./utils/chatIndexedDb";
import { useChatStore, useUserStore } from "./store";
import { router } from "./router";
import { selectEngine } from "./utils/utils.tsx";

const chatStore = useChatStore();
const userStore = useUserStore();
userStore.initIsMobile();

const init = async () => {
  const indexDb = await openDB();
  if (indexDb) {
    const history = await getAllChatHistory(indexDb);
    if (history.length > 0) {
      chatStore.setChatHistory(history);
      chatStore.setCurrentChat(history[0]!.id);
      router.push("/chatPage");
    } else {
      router.push("/");
    }
  }
  //选择使用什么llm引擎
  selectEngine();
  //初始化设置
  userStore.initAISetting();
  //初始化llm
  userStore.initAIChat();
  if (userStore.isMobile) {
    const indexDbEn = await openDB(1, DB_NAME_ENUM.chatDbEn);
    if (indexDbEn) {
      const historyEn = await getAllChatHistory(indexDbEn);
      if (historyEn.length > 0) {
        chatStore.setChatHistoryEn(historyEn);
      }
    }
  }
};
onMounted(() => {
  init();
});
</script>

<template>
  <router-view></router-view>
  <PWABadge />
</template>
