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
import {
  useTransformerStore,
  TranslateType,
} from "../transformerStore/transformerStoreIndex";

export const useChatStore = defineStore("chat", () => {
  const userStore = useUserStore();
  const transformerStore = useTransformerStore();
  const MEMORY_GROUP_SIZE = 4;
  const MEMORY_KEY = "conversation";
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

  const formatMessageContent = (message: IChatMessage) => {
    if (typeof message.content === "string") {
      return message.content;
    }
    const talk = message.content.talkResponse || "";
    const status =
      "status" in message.content && message.content.status
        ? `状态：${message.content.status}`
        : "";
    const options =
      "options" in message.content && message.content.options?.length
        ? `选项：${message.content.options.join("、")}`
      : "";
    return [talk, status, options].filter(Boolean).join(" | ");
  };

  const finalizedMessages = (chat: IChatHistory) => {
    return chat.chatContent.filter(
      (item) => item.role !== "system" && !(item.role === "assistant" && item.typing),
    );
  };

  const summarizeMemoryChunk = async (
    messages: IChatMessage[],
    promptLang: "zh" | "en" = "zh",
  ) => {
    if (!aiChat) {
      return messages.map((item) => formatMessageContent(item)).join("\n");
    }
    const summaryPrompt = promptLang === "zh" ? `请你总结以下对话片段，生成一条“长期记忆”用于后续对话上下文压缩。
要求：
1. 保留关键事实（人物关系、目标、冲突、约定、重要线索）。
2. 只输出一段简短总结，不要解释过程，不要使用 markdown。
3. 保持与原对话一致的语言。
对话片段：
${messages
  .map(
    (item) =>
      `${item.role === "user" ? "用户" : item.role === "assistant" ? "角色" : "系统"}：${formatMessageContent(item)}`,
  )
  .join("\n")}` : `Summarize the dialogue chunk below into ONE reusable long-term memory for context compression.
Requirements:
1. Keep key facts only (relationships, goals, conflicts, agreements, clues).
2. Output one short paragraph only. No markdown, no extra explanation.
3. Keep the same language as the dialogue (English).
Dialogue:
${messages
  .map(
    (item) =>
      `${item.role === "user" ? "User" : item.role === "assistant" ? "Assistant" : "System"}: ${formatMessageContent(item)}`,
  )
  .join("\n")}`;
    const summarizeMessages: IChatMessage[] = [
      {
        role: "system",
        content:
          promptLang === "zh"
            ? "你是对话记忆压缩助手，只返回可复用的简短记忆。"
            : "You are a dialogue memory compressor. Return concise reusable memory only.",
        chatTime: "",
      },
      {
        role: "user",
        content: summaryPrompt,
        chatTime: "",
      },
    ];
    let output = "";
    output = await aiChat(summarizeMessages, (data: string) => {
      output += data;
    });
    return output.trim();
  };

  const saveMemoryForChat = async (
    chat: IChatHistory | null,
    promptLang: "zh" | "en" = "zh",
  ) => {
    if (!chat) return;
    const availableMessages = finalizedMessages(chat);
    const expectedMemoryCount = Math.floor(
      availableMessages.length / MEMORY_GROUP_SIZE,
    );
    const memoryList = chat.memory[MEMORY_KEY] || [];
    if (expectedMemoryCount <= memoryList.length) return;
    const targetMessages = availableMessages.slice(
      expectedMemoryCount * MEMORY_GROUP_SIZE - MEMORY_GROUP_SIZE,
      expectedMemoryCount * MEMORY_GROUP_SIZE,
    );
    const eventContent = await summarizeMemoryChunk(targetMessages, promptLang);
    const chatTime = targetMessages[targetMessages.length - 1]?.chatTime || "";
    chat.memory[MEMORY_KEY] = [...memoryList, { chatTime, eventContent }];
  };

  const saveChatMemory = async () => {
    if (userStore.isMobile) {
      await saveMemoryForChat(currentChatEn.value, "en");
      const enMemory =
        currentChatEn.value?.memory?.[MEMORY_KEY]?.[
          (currentChatEn.value?.memory?.[MEMORY_KEY]?.length || 1) - 1
        ]?.eventContent || "";
      if (enMemory && currentChat.value) {
        const memoryList = currentChat.value.memory[MEMORY_KEY] || [];
        const expectedMemoryCount = Math.floor(
          finalizedMessages(currentChat.value).length / MEMORY_GROUP_SIZE,
        );
        if (expectedMemoryCount > memoryList.length) {
          let zhMemory = enMemory;
          try {
            zhMemory = await transformerStore.translate(
              enMemory,
              TranslateType.EnToZh,
            );
          } catch (error) {
            console.error("memory translate fail:", error);
          }
          const time =
            finalizedMessages(currentChat.value).slice(
              expectedMemoryCount * MEMORY_GROUP_SIZE - MEMORY_GROUP_SIZE,
              expectedMemoryCount * MEMORY_GROUP_SIZE,
            )[MEMORY_GROUP_SIZE - 1]?.chatTime || "";
          currentChat.value.memory[MEMORY_KEY] = [
            ...memoryList,
            { chatTime: time, eventContent: zhMemory },
          ];
        }
      }
      return;
    }
    await saveMemoryForChat(currentChat.value, "zh");
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
    saveChatMemory,
  };
});
