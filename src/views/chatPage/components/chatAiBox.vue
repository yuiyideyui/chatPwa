<template>
  <div
    class="flex flex-col h-100vh w-100vw bg-[#f8fafc] dark:bg-[#0f172a] transition-colors duration-500 overflow-hidden text-slate-900 dark:text-slate-100 font-sans"
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
          class="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[30px] opacity-0 group-focus-within:opacity-20 blur transition duration-1000"
        ></div>

        <div
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
            placeholder="输入您的问题..."
            class="flex-1 bg-transparent border-none outline-none py-3 px-3 text-sm max-h-32 overflow-y-auto resize-none"
            @input="adjustHeight"
            @keydown.enter.prevent="() => sendMessage()"
            ref="inputRef"
          ></textarea>

          <button
            @click="() => sendMessage()"
            :disabled="!inputContent.trim() || isThinking"
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
import { TextStreamer } from "@huggingface/transformers";
import { useUserStore } from "@/store";
import { parseMlcTalkResponse } from "./parseMlcTalkRespone";
import { StoryGameTemplate } from "./storyGameTemplate.tsx";
import { TranslateType } from "@/store/transformerStore/transformerStoreIndex.ts";
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

const sendMessage = async (userOptionsPrompt?: string) => {
  const userPrompt = userOptionsPrompt || inputContent.value;
  if (!userPrompt.trim()) return;

  const chat = chatStore.currentChat; // 获取当前的 IChatHistory 实例
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
        .map(
          (m) =>
            ({
              role: m.role,
              content: m.content,
              chatTime: m.chatTime,
            }) as IChatMessage,
        ); // 强制断言
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
[Insert the specific character background or world-building here]

# Task Instructions:
1. **Communication Style**: In the talkResponse field, interact with the user in a natural, human-like manner. Avoid environmental descriptions within the dialogue.
2. **Progression**: Use the options field to provide the user with choices or next steps for the conversation.
3. **Atmosphere**: Use the textBackground field to describe the user's current specific location, surroundings, or the prevailing mood.
4. **Context Update**: Use the status field to provide a brief update on the current situation or the relationship between the two characters.
5. **Strict Prohibition**: Output ONLY in valid JSON format. No conversational filler or explanatory text outside the JSON is allowed.

# Constraint Format:
{
  "talkResponse": "Your character's dialogue here",
  "options": ["Option 1", "Option 2", "Option 3"],
  "textBackground": "Description of the scene and atmosphere",
  "status": "Summary of the current situation"
}`
          : `# 游戏设定:

# 任务说明：
1. 表达方式：在 talkResponse 字段中，你与用户对话，需要符合人类对话的习惯，不需要环境描述。
2. 决策推进：通过 options 提供给用户下一步与你的对话和选项。
3. 场景描述：通过 textBackground 字段提供给用户当前所处的具体位置或氛围。
4. 状态更新：通过 status 字段提供给用户两人的当前处境。
5. 严格禁令：只允许输出 JSON 格式，禁止任何解释性文本。
# 约束格式：
{"talkResponse": "", "options": ["选项1", "选项2", ...], "textBackground": "", "status": ""}
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
      output = await mlcStore.aiChat(contextMessages, streamer);
    } else if (userStore.userInfo.type === "transformers") {
      const streamer = new TextStreamer(transformerStore.generator!.tokenizer, {
        skip_prompt: true,
        callback_function: (text) => {
          aiMsg.content.talkResponse += text;
          scrollToBottom();
        },
      });
      output = await transformerStore.aiChat(contextMessages, streamer);
    }
    if (chatStore.currentChat.gameType === GameType.STORYGAME) {
    } else {
      aiMsg.content.talkResponse = output;
    }
    aiMsg.typing = false;
    aiMsg.chatTime = new Date().toLocaleString();
    if (userStore.isMobile) {
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
