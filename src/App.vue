<script setup lang="tsx">
import PWABadge from "./components/PWABadge.vue";
import { onMounted, ref, watch } from "vue";
import { DB_NAME_ENUM, getAllChatHistory, openDB } from "./utils/chatIndexedDb";
import { useChatStore, useUserStore } from "./store";
import { router } from "./router";
import { initMlc } from "./utils/initMlc";
import { selectEngine } from "./utils/utils";
import { initTransformers, initTranslator } from "./utils/initTransformer";
import { isLoadingChatModel} from "./hook/gobalHook";
import { showInstallTTS, startInstallTTS } from "@/components/TTS/TTScom";

const chatStore = useChatStore();
const userStore = useUserStore();
const downloadProgress = ref(0);
userStore.initIsMobile();

const init = async() => {
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
    const unwatch = watch(() => isLoadingChatModel.value, (newVal) => {
      if(!newVal) {
        console.log('userStore.isTTSInstalled',userStore.isTTSInstalled)
        if(userStore.isTTSInstalled) {
          startInstallTTS()
        }else{
          showInstallTTS()
        }
        unwatch()
      }
    });
    if (res === "mlc") {
      initMlc(downloadProgress, isLoadingChatModel);
    } else {
      initTransformers(downloadProgress, isLoadingChatModel);
    }
  });
}
onMounted(() => {
  init()
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