import { defineStore } from "pinia";
import { readonly, ref, computed } from "vue";
import type { IChatHistory, IChatMessage } from "./chatStoreIndex.type";
import {
  openDB,
  addChatData,
  deleteChatData,
  DB_NAME_ENUM,
} from "@/utils/chatIndexedDb";
import { useUserStore } from "@/store";

export const useChatStore = defineStore("chat", () => {
  const userStore = useUserStore();
  // 1. 内部状态
  const _chatHistory = ref<IChatHistory[]>([]);
  const _chatHistoryEn = ref<IChatHistory[]>([]);
  // 存储当前选中对话的 ID，而不是整个对象，这样可以确保数据源始终唯一
  const _currentChatId = ref<number | null>(null);

  // 2. 对外暴露的只读数据
  const chatHistory = readonly(_chatHistory);
  const chatHistoryEn = readonly(_chatHistoryEn);
  // 使用 computed 实时获取当前选中的对话对象
  // 这样无论是在 chatHistory 里修改了内容，currentChat 都会同步更新
  const currentChat = computed(() => {
    return (
      _chatHistory.value.find((item) => item.id === _currentChatId.value) ||
      null
    );
  });

  const currentChatEn = computed(() => {
    return (
      _chatHistoryEn.value.find((item) => item.id === _currentChatId.value) ||
      null
    );
  });

  const setChatHistory = (history: IChatHistory[]) => {
    _chatHistory.value = history;
  };
  const setChatHistoryEn = (history: IChatHistory[]) => {
    _chatHistoryEn.value = history;
  };

  // 3. 操作方法
  // 添加新的对话
  const addChatHistory = (chat: IChatHistory, chatEn?: IChatHistory) => {
    // 检查是否已存在（防止重复添加）
    const index = _chatHistory.value.findIndex((item) => item.id === chat.id);
    if (index === -1) {
      _chatHistory.value.push(chat);
      if (userStore.isMobile && chatEn) {
        _chatHistoryEn.value.push(chatEn);
      }
    }
  };

  // 设置当前选中的对话
  const setCurrentChat = (id: number) => {
    _currentChatId.value = id;
  };

  // 更新当前对话的内容（例如 Ollama 返回流时调用）
  const updateCurrentChatContent = (
    chatData: IChatHistory["chatContent"][number],
    chatDataEn?: IChatHistory["chatContent"][number],
  ) => {
    const chat = _chatHistory.value.find(
      (item) => item.id === _currentChatId.value,
    );
    if (chat) {
      (chat.chatContent as IChatMessage[]).push(chatData);
    }
    if (userStore.isMobile && chatDataEn) {
      const chatEn = _chatHistoryEn.value.find(
        (item) => item.id === _currentChatId.value,
      );
      if (chatEn) {
        (chatEn.chatContent as IChatMessage[]).push(chatDataEn);
      }
    }
  };

  const deleteChat = async (id: number) => {
    _chatHistory.value = _chatHistory.value.filter((item) => item.id !== id);
    _chatHistoryEn.value = _chatHistoryEn.value.filter(
      (item) => item.id !== id,
    );
    const db = await openDB();
    deleteChatData(db, id);
    if (userStore.isMobile) {
      const dbEn = await openDB(1, DB_NAME_ENUM.chatDbEn);
      deleteChatData(dbEn, id);
    }
  };

  const saveToIndexedDB = async () => {
    const db = await openDB();
    addChatData(db, currentChat.value!);
    if (userStore.isMobile) {
      const dbEn = await openDB(1, DB_NAME_ENUM.chatDbEn);
      addChatData(dbEn, currentChatEn.value!);
    }
  };

  const initHistory = () => {
    _chatHistory.value = [];
    if (userStore.isMobile) {
      _chatHistoryEn.value = [];
    }
    _currentChatId.value = null;
  };

  const aiChat:
    | ((
        messages: IChatMessage[],
        chunkCallBack: (data: string) => void,
      ) => Promise<string>)
    | ((
        messages: IChatMessage[],
        callback_function: (data: string) => void,
      ) => Promise<string>) = undefined as any;

  return {
    chatHistory,
    currentChat,
    currentChatEn,
    addChatHistory,
    setCurrentChat,
    updateCurrentChatContent,
    initHistory,
    saveToIndexedDB,
    setChatHistory,
    deleteChat,
    setChatHistoryEn,
    chatHistoryEn,
    aiChat,
  };
});
