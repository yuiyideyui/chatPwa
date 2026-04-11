import { defineStore } from "pinia";
import { ref } from "vue";
import { useChatStore, useMlcStore, useTransformerStore } from "@/store";
import type { IChatMessage } from "../chatStore/chatStoreIndex.type";
export const useUserStore = defineStore("user", () => {
  const userInfo = ref<{
    name: string;
    type: "mlc" | "transformers" | null;
  }>({
    name: "",
    type: null,
  });
  const setEngineType = (type: "mlc" | "transformers") => {
    userInfo.value.type = type;
  };

  //是否是移动设备
  const isMobile = ref(false);
  //初始化设备信息
  function initIsMobile() {
    console.log('Initializing device information...');
    // isMobile.value = !!(
    //   navigator.userAgent.match(/Android/i) ||
    //   navigator.userAgent.match(/webOS/i) ||
    //   navigator.userAgent.match(/iPhone/i) ||
    //   navigator.userAgent.match(/iPad/i) ||
    //   navigator.userAgent.match(/iPod/i) ||
    //   navigator.userAgent.match(/BlackBerry/i) ||
    //   navigator.userAgent.match(/Windows Phone/i)
    // );
    isMobile.value = true
    const chatStore = useChatStore();
    const mlcStore = useMlcStore();
    const transformerStore = useTransformerStore();
    chatStore.setAIChat(async (
      messages: IChatMessage[],
      options: (data: string) => void,
      isFormatted: boolean,
    ) => {
      if (userInfo.value.type === "transformers") {
        return await transformerStore.aiChat(messages, options,isFormatted);
      } else {
        return await mlcStore.aiChat(messages, options,isFormatted);
      }
    })
  }

  /**是否允许安装TTS */
  const isTTSInstalled = ref(localStorage.getItem('isTTSInstalled') === 'true' || false);
  const setTTSStorage = (isInstalled: boolean) => {
    isTTSInstalled.value = isInstalled;
    localStorage.setItem('isTTSInstalled', isInstalled.toString());
  }

  return {
    userInfo,
    setEngineType,
    /**是否是移动设备 */
    isMobile,
    /**初始化设备信息 */
    initIsMobile,
    isTTSInstalled,
    setTTSStorage
  };
});
