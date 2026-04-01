<template>
  <div
    class="flex flex-col h-100dvh w-100vw bg-[#f8fafc] dark:bg-[#0f172a] transition-colors duration-500 overflow-hidden text-slate-900 dark:text-slate-100 font-sans"
  >
    <chatAiBoxSide
      :is-open="isSidebarOpen"
      @close="isSidebarOpen = false"
      @new-chat="handleNewChat"
    />
    <header
      class="flex items-center justify-between px-6 h-16 shrink-0 backdrop-blur-xl bg-white/70 dark:bg-[#1e293b]/70 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50"
    >
      <div class="flex items-center gap-3">
        <div class="relative" @click="() => (isSidebarOpen = true)">
          <div
            class="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20"
          >
            <img
              v-if="messages"
              :src="chatStore.currentChat!.imgUrl"
              alt=""
              class="w-full h-full object-cover"
            />
          </div>
          <div
            class="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full"
          ></div>
        </div>
        <div>
          <h2 class="font-bold text-sm tracking-tight leading-tight">
            {{ chatStore.currentChat?.roleName }}
          </h2>
          <!-- <p class="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
            {{ chatStore.currentChat?.system }}
          </p> -->
        </div>
      </div>
      <div class="flex gap-4">
        <button
          @click="isDark = !isDark"
          class="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <span
            :class="
              isDark
                ? 'i-solar-sun-2-bold-duotone'
                : 'i-solar-moon-bold-duotone'
            "
            class="text-xl"
          ></span>
        </button>
      </div>
    </header>

    <main
      ref="scrollRef"
      class="flex-1 overflow-y-auto px-4 py-4 space-y-6 no-scrollbar pb-32"
    >
      <div
        v-if="messages && messages.length <= 1"
        class="py-10 flex flex-col items-center animate-fade-in"
      >
        <div
          class="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6"
        >
          <img
            :src="chatStore.currentChat!.imgUrl"
            alt=""
            class="w-full h-full object-cover"
          />
        </div>
        <h1 class="text-xl font-bold mb-2">
          {{ chatStore.currentChat!.roleName }}
        </h1>
        <p class="text-slate-500 text-sm mb-8">
          {{ chatStore.currentChat!.system }}
        </p>
      </div>

      <div
        v-for="(msg, index) in messages"
        :key="index"
        :class="[
          'flex w-full message-bounce',
          msg.role === 'user' ? 'justify-end' : 'justify-start',
        ]"
      >
        <div
          :class="[
            'max-w-[85%] px-5 py-3.5 relative shadow-sm',
            msg.role === 'user'
              ? 'bg-indigo-600 text-white rounded-t-2xl rounded-bl-2xl rounded-br-4px'
              : 'bg-white dark:bg-slate-800 rounded-t-2xl rounded-br-2xl rounded-bl-4px border border-slate-100 dark:border-slate-700',
          ]"
        >
          <div class="text-[15px] leading-relaxed whitespace-pre-wrap">
            <!-- jsx解析 -->
            <StoryGameTemplate
              :msg="msg"
              :game-type="chatStore.currentChat!.gameType"
              @select-option="handleSelectOption"
            />
            <span
              v-if="msg?.typing"
              class="inline-block w-2 h-2 bg-indigo-400 rounded-full animate-ping ml-1"
            ></span>
          </div>

          <div
            :class="[
              'text-[9px] mt-1 opacity-50',
              msg.role === 'user' ? 'text-right' : 'text-left',
            ]"
          >
            {{
              new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            }}
          </div>
        </div>
      </div>
    </main>

    <footer
      class="fixed bottom-0 left-0 px-4 w-[calc(100%-2rem)] pb-6 bg-gradient-to-t from-[#f8fafc] dark:from-[#0f172a] via-[#f8fafc] dark:via-[#0f172a] to-transparent"
    >
      <div class="max-w-screen-md mx-auto relative group">
        <div
          v-if="!messages?.length"
          class="text-center text-slate-500 text-sm mb-8 animate-fade-in w-20 h-10 leading-10 m-auto bg-white dark:bg-slate-800 rounded-[28px] border border-slate-200 dark:border-slate-700 p-2 shadow-2xl cursor-pointer dark:color-[#39c5bb]"
          @click="handleStartTextChat"
        >
          开始
        </div>
        <div
          v-else
          class="relative bg-white dark:bg-slate-800 rounded-[28px] border border-slate-200 dark:border-slate-700 p-2 flex items-end shadow-2xl"
        >
          <button
            @click="resetInput"
            class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
          >
            <span
              class="i-solar-paperclip-bold-duotone text-xl text-slate-400"
            ></span>
          </button>

          <textarea
            v-model="inputContent"
            rows="1"
            placeholder="输入..."
            class="flex-1 bg-transparent border-none outline-none py-3 px-3 text-sm max-h-32 overflow-y-auto resize-none"
            @input="adjustHeight"
            @keydown.enter.prevent="() => sendMessage()"
            ref="inputRef"
          ></textarea>

          <button
            @click="() => sendMessage()"
            :disabled="!inputContent.trim()"
            :class="[
              'w-10 h-10 flex items-center justify-center rounded-2xl transition-all duration-300',
              inputContent.trim()
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/40'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-400',
            ]"
          >
            <span
              :class="
                isThinking
                  ? 'i-solar-stop-bold'
                  : 'i-solar-arrow-up-bold-duotone'
              "
              class="text-xl c-[#39c5bb]"
              >I</span
            >
          </button>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="tsx">
import { ref, nextTick, watch, computed, reactive } from "vue";
import chatAiBoxSide from "./chatAiBoxSide.vue";
import { useChatStore, useMlcStore, useTransformerStore } from "@/store";
import {
  GameType,
  type IChatHistory,
  type IChatMessage,
  type IStoryGameAssistant,
} from "@/store/chatStore/chatStoreIndex.type";
import { useUserStore } from "@/store";
import { parseMlcTalkResponse } from "./parseMlcTalkRespone.ts";
import { StoryGameTemplate } from "../../../components/mlcStory/storyGameTemplate.tsx";
import { TranslateType } from "@/store/transformerStore/transformerStoreIndex.ts";
import { isLoadingChatModel } from "@/hook/gobalHook.ts";
import { dialogMessage } from "@/components/dialogMessage.tsx";
const userStore = useUserStore();
const chatStore = useChatStore();
const transformerStore = useTransformerStore();
// 侧边栏
const isSidebarOpen = ref(false);
const handleNewChat = () => {
  console.log("handleNewChat");
};

const inputRef = ref<HTMLElement | null>(null);
const isDark = ref(true);
const inputContent = ref("");
const isThinking = ref(false);
const scrollRef = ref<HTMLElement | null>(null);
// 假设你的消息接口定义如下
const messages = computed<
  (IChatHistory["chatContent"][number] & { typing?: boolean })[] | null
>(() => {
  return chatStore.currentChat?.chatContent || null;
});

const resetInput = () => {
  inputContent.value = "";
  resetInputHeight();
};

const resetInputHeight = () => {
  if (inputRef.value && inputContent.value.length === 0) {
    inputRef.value.style.height = "auto";
  }
};

const adjustHeight = (e: any) => {
  const el = e.target;
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
  resetInputHeight();
};

const scrollToBottom = async (isFirst = false) => {
  await nextTick();
  if (scrollRef.value) {
    scrollRef.value.scrollTo({
      top: scrollRef.value.scrollHeight,
      behavior: isFirst ? "auto" : "smooth",
    });
  }
};

const handleStartTextChat = () => {
  const text = `
生成游戏的序章
    `;
  sendMessage(text);
};

const sendMessage = async (userOptionsPrompt?: string) => {
  if (isLoadingChatModel.value || isThinking.value) {
    dialogMessage({
      jsx: (
        <div>
          <p>当前有任务正在进行，请稍后再试</p>
        </div>
      ),
      position: "center",
      timeClose: 1000,
    });
    return;
  }
  const userPrompt = userOptionsPrompt || inputContent.value;
  console.log("userPrompt", userPrompt);
  if (!userPrompt.trim()) return;

  const chat = chatStore.currentChat; // 获取当前的 IChatHistory 实例
  console.log("chat", chat);
  if (!chat) return;

  // 1. 更新 UI：添加用户消息
  const currentTime = new Date().toLocaleString();
  const userMessage = {
    role: "user",
    content: userPrompt,
    chatTime: currentTime,
  } as const;
  const userMessageEn = userStore.isMobile
    ? ({
        role: "user",
        content: await transformerStore.translate(
          userPrompt,
          TranslateType.ZhToEn,
        ),
        chatTime: currentTime,
      } as const)
    : undefined;
  console.log("userMessageEn", userMessageEn);
  // 这里直接操作 chatContent 以便后续存入 IndexedDB/Store
  chatStore.updateCurrentChatContent(userMessage, userMessageEn);
  resetInput();
  scrollToBottom();
  isThinking.value = true;

  // 2. 准备 AI 消息占位
  const aiMsg: IStoryGameAssistant = reactive<IStoryGameAssistant>({
    role: "assistant",
    content: { talkResponse: "", options: [], textBackground: "", status: "" },
    chatTime: "",
    typing: true,
  });
  const aiMsgEn = userStore.isMobile
    ? reactive<IStoryGameAssistant>({
        role: "assistant",
        content: {
          talkResponse: "",
          options: [],
          textBackground: "",
          status: "",
        },
        chatTime: "",
        typing: true,
      })
    : undefined;
  // 注意：这里为了 UI 渲染，我们可能依然需要 messages.value = chat.chatContent
  // 假设你的页面是直接绑定 chat.chatContent 的
  chatStore.updateCurrentChatContent(aiMsg, aiMsgEn);
  try {
    // 3. 构建上下文消息列表
    // 提取历史记录中的 role 和 content，过滤掉还在 typing 的占位消息
    let contextMessages: IChatMessage[] = [];
    if (userStore.isMobile) {
      contextMessages = chatStore
        .currentChatEn!.chatContent.filter(
          (m) => !(m.role === "assistant" && m.typing),
        )
        .map((m) => {
          return {
            role: m.role,
            content: m.content,
            chatTime: m.chatTime,
          } as IChatMessage;
        }); // 强制断言
    } else {
      contextMessages = chat.chatContent
        .filter((m) => !(m.role === "assistant" && m.typing))
        .map(
          (m) =>
            ({
              role: m.role,
              content: m.content,
              chatTime: m.chatTime,
            }) as IChatMessage,
        ); // 强制断言
    }

    contextMessages.unshift({
      role: "system",
      content:
        (userStore.isMobile ? chatStore.currentChatEn!.system : chat.system) +
        (userStore.isMobile
          ? `# Game Setting:

# Task Instructions:
1. **Expression**: Use the talkResponse field to describe the current plot and narrative content.
2. **Decision Advancement**: Provide next-step choices via the options field based on the user's current situation to drive the game's progression. Do not repeat previous options.
3. **Scene Description**: Use the textBackground field to describe the user's specific location or the current atmosphere.
4. **Status Update**: Use the status field to provide an overview of the user's current circumstances.
5. **Strict Mandate**: Output JSON format only. Any explanatory text is strictly prohibited. Avoid using double quotes within JSON string values (use single quotes or ensure proper escaping if necessary).

# Constraint Format:
{
  "talkResponse": "Your character's dialogue here",
  "options": ["Option 1", "Option 2", "Option 3"],
  "textBackground": "Description of the scene and atmosphere",
  "status": "Summary of the current situation"
}`
          : `# Task: 剧情推动
根据用户输入，以 JSON 格式续写剧情。

# JSON 字段说明 (Strict):
1. talkResponse: 描述剧情、对话或你的动作。
2. options: 提供 2-5 个推动剧情的选择（禁止重复之前的选项）。
3. textBackground: 描述当前环境（如：腐烂的泥土味、幽暗的树影）。
4. status: 简述玩家处境（如：被包围、精疲力竭、暂时安全）。

# Output Rules (CRITICAL):
- [Constraint 1] ONLY output a single JSON object. 
- [Constraint 2] NO explanation or text outside the JSON.
- [Constraint 3] DO NOT use double quotes (") inside JSON values. Use single quotes (') instead.
- [Constraint 4] Ensure the JSON is valid and minified.

# JSON Template:
{"talkResponse": "剧情内容", "options": ["选项1", "选项2"], "textBackground": "场景描述", "status": "状态"}
`),
      chatTime: "",
    });
    let output = "";
    const translateArray: Promise<void>[] = [];
    if (userStore.userInfo.type === "mlc") {
      const mlcStore = useMlcStore();
      const streamer = (text: string) => {
        const resText = parseMlcTalkResponse(text);
        if (resText) {
          if (typeof resText === "object" && !("endType" in resText)) {
            if (resText.type === "options") {
              const currLength = aiMsg.content[resText.type].length;
              if (resText.next) {
                aiMsg.content[resText.type][currLength - 1] = aiMsg.content[
                  resText.type
                ][currLength - 1]!.replace(/"(?:,)?$/, "");
                if (userStore.isMobile && aiMsgEn) {
                  aiMsgEn.content[resText.type][currLength - 1] =
                    aiMsgEn.content[resText.type][currLength - 1]!.replace(
                      /"(?:,)?$/,
                      "",
                    );
                  translateArray.push(
                    transformerStore
                      .translate(
                        aiMsg.content[resText.type][currLength - 1]!,
                        TranslateType.EnToZh,
                      )
                      .then((res) => {
                        aiMsg.content[resText.type][currLength - 1] = res;
                      }),
                  );
                }
                if (!resText.isEnd) {
                  aiMsg.content[resText.type].push("");
                  if (userStore.isMobile && aiMsgEn) {
                    aiMsgEn.content[resText.type].push("");
                  }
                }
              } else {
                aiMsg.content[resText.type][currLength - 1] += resText.content!;
                if (userStore.isMobile && aiMsgEn) {
                  aiMsgEn.content[resText.type][currLength - 1] +=
                    resText.content!;
                }
              }
            } else {
              aiMsg.content[resText.type] += resText.content;
              if (userStore.isMobile && aiMsgEn) {
                aiMsgEn.content[resText.type] += resText.content;
              }
            }
          } else if (typeof resText === "object" && "endType" in resText) {
            //移动端需要转中文
            if (userStore.isMobile) {
              translateArray.push(
                transformerStore
                  .translate(
                    aiMsg.content[resText.endType],
                    TranslateType.EnToZh,
                  )
                  .then((res) => {
                    aiMsg.content[resText.endType] = res;
                  }),
              );
            }
          } else {
            aiMsg.content.talkResponse += resText;
          }
        }
        scrollToBottom();
      };
      console.log("contextMessages", contextMessages);
      output = await mlcStore.aiChat(contextMessages, streamer);
    } else if (userStore.userInfo.type === "transformers") {
      // const streamer = new TextStreamer(transformerStore.generator!.tokenizer, {
      //   skip_prompt: true,
      //   callback_function: (text) => {
      //     aiMsg.content.talkResponse += text;
      //     scrollToBottom();
      //   },
      // });
      const callback_function = (text: string) => {
        aiMsg.content.talkResponse += text;
        scrollToBottom();
      };
      output = await transformerStore.aiChat(
        contextMessages,
        callback_function,
      );
    }
    if (chatStore.currentChat.gameType === GameType.STORYGAME) {
    } else {
      aiMsg.content.talkResponse = output;
    }
    const currTime = new Date().toLocaleString();
    aiMsg.typing = false;
    aiMsg.chatTime = currTime;
    if (userStore.isMobile) {
      aiMsgEn!.typing = false;
      aiMsgEn!.chatTime = currTime;
      await Promise.all(translateArray);
    }
    chatStore.saveToIndexedDB();
  } catch (error) {
    console.error(error);
    aiMsg.content.talkResponse = "生成失败请重试";
    // sendMessage()
    aiMsg.typing = false;
  } finally {
    isThinking.value = false;
  }
};
const handleSelectOption = (option: string) => {
  sendMessage(option);
};
// 监听暗号模式切换
watch(
  isDark,
  (val) => {
    if (val) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  },
  { immediate: true },
);

watch(
  () => chatStore.currentChat?.id,
  () => {
    scrollToBottom(true);
  },
  {
    immediate: true,
  },
);
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* 物理弹簧感动画 */
.message-bounce {
  animation: messageBounce 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
}

@keyframes messageBounce {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* 渐入 */
.animate-fade-in {
  animation: fadeIn 0.6s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* 自定义消息气泡的细微不对称 */
.rounded-t-2xl {
  border-top-left-radius: 1.25rem;
  border-top-right-radius: 1.25rem;
}
.rounded-br-4px {
  border-bottom-right-radius: 4px;
}
.rounded-bl-4px {
  border-bottom-left-radius: 4px;
}
</style>
