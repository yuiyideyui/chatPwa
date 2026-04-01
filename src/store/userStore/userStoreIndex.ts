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
    isMobile.value = !!(
      navigator.userAgent.match(/Android/i) ||
      navigator.userAgent.match(/webOS/i) ||
      navigator.userAgent.match(/iPhone/i) ||
      navigator.userAgent.match(/iPad/i) ||
      navigator.userAgent.match(/iPod/i) ||
      navigator.userAgent.match(/BlackBerry/i) ||
      navigator.userAgent.match(/Windows Phone/i)
    );
    const chatStore = useChatStore();
    const mlcStore = useMlcStore();
    const transformerStore = useTransformerStore();
    chatStore.aiChat = async (
      messages: IChatMessage[],
      options: (data: string) => void,
    ) => {
      if (userInfo.value.type === "transformers") {
        return await transformerStore.aiChat(messages, options);
      } else {
        return await mlcStore.aiChat(messages, options);
      }
    };
  }

  return {
    userInfo,
    setEngineType,
    /**是否是移动设备 */
    isMobile,
    /**初始化设备信息 */
    initIsMobile,
  };
});
