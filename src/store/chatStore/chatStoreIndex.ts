import { defineStore } from "pinia";
import { readonly, ref, computed } from "vue";
import type { IChatHistory, IChatMessage } from "./chatStoreIndex.type";
import { GameType } from "./chatStoreIndex.type";
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

  const formatMessageContent = (message: IChatMessage, lang: 'zh' | 'en') => {
    if (typeof message.content === "string") {
      return message.content;
    }
    const talk = message.content.talkResponse || "";
    const status =
      "status" in message.content && message.content.status
        ? `${lang === 'zh' ? '状态' : 'Status'}：${message.content.status}`
        : "";
    const options =
      "options" in message.content && message.content.options?.length
        ? `${lang === 'zh' ? '选项' : 'Options'}：${message.content.options.join("、")}`
        : "";
    return [talk, status, options].filter(Boolean).join(" | ");
  };

  const finalizedMessages = (chat: IChatHistory) => {
    return chat.chatContent.filter(
      (item) => item.role !== "system" && !(item.role === "assistant" && item.typing),
    );
  };

  // 使用AI总结一组消息为长期记忆
  const summarizeMessagesWithAI = async (
    targetMessages: IChatMessage[],
    chat: IChatHistory,
  ): Promise<string> => {
    // 检查AI是否已初始化
    if (!aiChat.value) {
      console.warn("[Memory Summary] AI engine not initialized, falling back to text concatenation");
      return fallbackSummarize(targetMessages);
    }

    try {
      // 根据游戏类型构造summarize prompt
      const summaryPrompt = buildSummaryPrompt(targetMessages, chat.gameType);

      // 构造消息数组供AI处理
      const summaryMessages: IChatMessage[] = [
        {
          role: "user",
          content: summaryPrompt,
        } as IChatMessage,
      ];

      // 调用AI生成总结，设置较低温度确保一致性
      let summary = "";
      console.log('summaryMessages',summaryMessages)
      const result = await aiChat.value(summaryMessages, (chunk: string) => {
        console.log("[Memory Summary] Received chunk from AI:", chunk);
        summary += chunk;
      }, false);

      const finalSummary = summary || result;
      console.log("[Memory Summary] AI generated summary:", finalSummary);
      // 验证总结有效性
      if (finalSummary?.trim().length > 0) {
        return finalSummary.trim();
      }

      console.warn("[Memory Summary] AI returned empty summary, falling back to text concatenation");
      return fallbackSummarize(targetMessages);
    } catch (error) {
      console.warn("[Memory Summary] AI summarization failed:", error);
      // 异常时降级到原有的拼接逻辑
      return fallbackSummarize(targetMessages);
    }
  };

  // 构造针对不同游戏类型的summary prompt
  const buildSummaryPrompt = (
    targetMessages: IChatMessage[],
    gameType: GameType,
  ): string => {
    if (userStore.isMobile) {
      const formattedMessages = targetMessages
        .map(
          (item) =>
            `${item.role === "user" ? "[User]" : "[Character]"} ${formatMessageContent(item,'en')}`,
        )
        .join("\n");

      const baseInstruction = `You are a professional memory summarization assistant. Please summarize the following conversation into a concise and clear memory record.\n\nConversation:\n${formattedMessages}\n\n`;

      const typeSpecificInstruction = {
        [GameType.TXT]: "Summarize only the key points of the dialogue between the user and the character, preserving essential information and context.",
        [GameType.TXTGAME]: "Summarize the dialogue, the user's choices, and the changes in game state to help understand the story progression.",
        [GameType.STORYGAME]: "Summarize the story background, interactions, character development, and state changes to form a complete event record.",
      }[gameType];

      return (
        baseInstruction +
        `\nSummary Requirements:\n1. Length: around 100–150 words\n2. ${typeSpecificInstruction}\n3. Only summarize existing content; do not infer or fabricate new information\n4. Format: [Time] User → Character → Choice/Result, specific content, for easy future recall\n\nPlease provide the summary directly without any additional explanation:`
      );
    } else {
      const formattedMessages = targetMessages
        .map(
          (item) =>
            `${item.role === "user" ? "【用户】" : "【角色】"}${formatMessageContent(item,'zh')}`,
        )
        .join("\n");

      const baseInstruction = `你是一个专业的记忆总结助手。请总结以下对话内容为一段简洁清晰的回忆记录。\n\n对话内容：\n${formattedMessages}\n\n`;

      const typeSpecificInstruction = {
        [GameType.TXT]: "只需总结用户和角色的对话要点，保留关键信息和上下文。",
        [GameType.TXTGAME]: "需要总结对话内容、用户的选择决定以及游戏状态变化，帮助理解故事进展。",
        [GameType.STORYGAME]: "需要总结故事背景、互动过程、角色发展及状态变化，形成完整的事件记录。",
      }[gameType];

      return (
        baseInstruction +
        `\n总结要求：\n1. 字数限制：100-150字左右\n2. ${typeSpecificInstruction}\n3. 仅总结已有内容，不推理或虚构新内容\n4. 格式：【时间】用户→角色→选择/结果，具体内容，便于后续回忆\n\n请直接给出总结，不需要额外说明：`
      );
    }

  };

  // Fallback方案：使用原有的拼接逻辑
  const fallbackSummarize = (targetMessages: IChatMessage[]): string => {
    if(userStore.isMobile){
      return targetMessages
      .map((item) => `${item.role === "user" ? "user" : "role"}：${formatMessageContent(item,'zh')}`)
      .join("\n");
    }else{
      return targetMessages
      .map((item) => `${item.role === "user" ? "用户" : "角色"}：${formatMessageContent(item,'zh')}`)
      .join("\n");
    }
  };

  // 获取待保存的消息及相关数据（不进行保存）
  const getMemoryData = (chat: IChatHistory | null) => {
    if (!chat) return null;
    const availableMessages = finalizedMessages(chat);
    const expectedMemoryCount = Math.floor(
      availableMessages.length / MEMORY_GROUP_SIZE,
    );
    const memoryList = chat.memory[MEMORY_KEY] || [];
    if (expectedMemoryCount <= memoryList.length) return null;
    const targetMessages = availableMessages.slice(
      expectedMemoryCount * MEMORY_GROUP_SIZE - MEMORY_GROUP_SIZE,
      expectedMemoryCount * MEMORY_GROUP_SIZE,
    );
    const chatTime = targetMessages[targetMessages.length - 1]?.chatTime || "";
    return { targetMessages, chatTime, memoryList };
  };

  const saveChatMemory = async () => {

    const chatData = userStore.isMobile ? getMemoryData(currentChatEn.value) : getMemoryData(currentChat.value);
    if (!chatData) return;

    const { targetMessages, chatTime, memoryList } = chatData;

    try {
      let summary = "";
      if (userStore.isMobile) {
        summary = await summarizeMessagesWithAI(
          targetMessages,
          currentChatEn.value!,
        );
        currentChatEn.value!.memory[MEMORY_KEY] = [
          ...memoryList,
          { chatTime, eventContent: summary },
        ];
        console.log('currentChatEn',currentChatEn.value)
        const transformerStore = useTransformerStore();
        const chineseSummary = await transformerStore.translate(
          summary,
          TranslateType.EnToZh,
        );
        currentChat.value!.memory[MEMORY_KEY] = [
          ...getMemoryData(currentChat.value)?.memoryList || [],
          { chatTime, eventContent: chineseSummary },
        ];
      } else {
        summary = await summarizeMessagesWithAI(
          targetMessages,
          currentChat.value!,
        );
        // Step 2: 保存到中文版本
        currentChat.value!.memory[MEMORY_KEY] = [
          ...memoryList,
          { chatTime, eventContent: summary },
        ];
      }
    } catch (error) {
      console.error("[Memory Save] Unexpected error:", error);
    }
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

  const aiChat = ref<((messages: IChatMessage[], callback: (data: string) => void, isFormatted: boolean) => Promise<string>)>();
  const setAIChat = (fn:
    | ((
      messages: IChatMessage[],
      chunkCallBack: (data: string) => void,
      isFormatted: boolean,
    ) => Promise<string>)
    | ((
      messages: IChatMessage[],
      callback_function: (data: string) => void,
      isFormatted: boolean,
    ) => Promise<string>)) => {
    aiChat.value = fn;
  };
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
    setAIChat,
    saveChatMemory,
  };
});
