<script setup lang="ts">
import PWABadge from "./components/PWABadge.vue";
import { onMounted, ref } from "vue";
import { DB_NAME_ENUM, getAllChatHistory, openDB } from "./utils/chatIndexedDb";
import { useChatStore, useUserStore } from "./store";
import { router } from "./router";
import { initMlc } from "./utils/initMlc";
import { selectEngine } from "./utils/utils";
import { initTransformers, initTranslator } from "./utils/initTransformer";
import { isLoadingChatModel } from "./hook/gobalHook";

const chatStore = useChatStore();
const userStore = useUserStore();
const downloadProgress = ref(0);
userStore.initIsMobile();
onMounted(async () => {
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
  if (userStore.isMobile) {
    const indexDbEn = await openDB(1, DB_NAME_ENUM.chatDbEn);
    if (indexDbEn) {
      const historyEn = await getAllChatHistory(indexDbEn);
      if (historyEn.length > 0) {
        chatStore.setChatHistoryEn(historyEn);
      }
    }
    // 初始化翻译->避免同时加载mlc导致卡死
    await initTranslator();
  }
  selectEngine().then((res) => {
    console.info("引擎：", res);
    if (res === "mlc") {
      initMlc(downloadProgress, isLoadingChatModel);
    } else {
      initTransformers(downloadProgress, isLoadingChatModel);
    }
  });
});
</script>

<template>
  <div class="top-progress-container">
    <div v-if="isLoadingChatModel" class="loading-toast">
      <span class="spinner"></span>
      <span v-if="Math.round(downloadProgress) !== 100">
        模型加载中 {{ Math.round(downloadProgress) }}%
      </span>
      <span v-else> 正在初始化... </span>
    </div>
  </div>
  <router-view></router-view>
  <PWABadge />
</template>
<style scoped>
/* 进度条容器 */
.top-progress-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 9999;
  pointer-events: none;
}

/* 加载提示标签 */
.loading-toast {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 12px;
  color: #007aff;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid rgba(79, 172, 254, 0.2);
}

/* 一个简单的旋转动画 */
.spinner {
  width: 12px;
  height: 12px;
  border: 2px solid #4facfe;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
