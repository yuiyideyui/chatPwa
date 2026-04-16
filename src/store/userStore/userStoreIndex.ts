import { defineStore } from "pinia";
import { ref } from "vue";
import { useChatStore, useMlcStore, useTransformerStore } from "@/store";
import type { IChatMessage } from "../chatStore/chatStoreIndex.type";
import {
  getAiSettings,
  getResourceGroups,
  setAiSettings,
  type ResourceGroup,
} from "@/views/settingPage/resourceGroups.tsx";
import { getStorage, setStorage } from "@/utils/storage";
export type AISetting = Record<
  string,
  {
    title: ResourceGroup["title"];
    icon: ResourceGroup["icon"];
    items: {
      name: ResourceGroup["items"][number]["name"];
      id: ResourceGroup["items"][number]["id"];
      status: ResourceGroup["items"][number]["status"];
      isActive: ResourceGroup["items"][number]["isActive"];
    }[];
  }
>;
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
    isMobile.value = true;
  }
  //现在默认都使用webllm
  function initAIChat() {
    const chatStore = useChatStore();
    const mlcStore = useMlcStore();
    const transformerStore = useTransformerStore();
    chatStore.setAIChat(
      async (
        messages: IChatMessage[],
        options: (data: string) => void,
        isFormatted: boolean,
      ) => {
        try {
          if (userInfo.value.type === "transformers") {
            return await transformerStore.aiChat(
              messages,
              options,
              isFormatted,
            );
          } else {
            return await mlcStore.aiChat(messages, options, isFormatted);
          }
        } catch (error) {
          console.error(error);
          return "安装llm失败或者没有安装llm，请先安装llm";
        }
      },
    );
  }

  const initAISetting = () => {
    const aiSetting: AISetting = getStorage("aiSetting");
    if (!aiSetting) {
      //设置默认的ai设置
      const res = getAiSettings();
      setStorage("aiSetting", res);
    } else {
      //设置ai设置
      setAiSettings(aiSetting);
      Object.values(getResourceGroups()).forEach((item) => {
        item.items.forEach((item) => {
          if (item.isActive) {
            item.installCallback();
          }
        });
      });
    }
  };

  return {
    userInfo,
    setEngineType,
    /**是否是移动设备 */
    isMobile,
    /**初始化设备信息 */
    initIsMobile,
    /**初始化AI聊天 webllm  */
    initAIChat,
    initAISetting,
  };
});
