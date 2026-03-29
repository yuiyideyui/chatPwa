import { defineStore } from "pinia";
import { shallowRef } from "vue";
import type { WebWorkerMLCEngine } from "@mlc-ai/web-llm";
import type { IChatMessage } from "../chatStore/chatStoreIndex.type";
import { useUserStore } from "../userStore/userStoreIndex";
import { TranslateType } from "../transformerStore/transformerStoreIndex";

/**
 * 定义元数据的 Schema
 */
const metaSchema = {
  type: "object",
  properties: {
    talkResponse: { type: "string" },
    options: {
      type: "array",
      items: { type: "string" },
      maxItems: 5,
      minItems: 0,
    },
    textBackground: { type: "string" },
    status: { type: "string" },
  },
  required: ["talkResponse", "options", "textBackground", "status"],
};
export const useMlcStore = defineStore("mlc", () => {
  const userStore = useUserStore();
  const generator = shallowRef<WebWorkerMLCEngine | null>(null);
  const setGenerator = (data: WebWorkerMLCEngine) => {
    generator.value = data;
  };

  async function aiChat(
    messages: IChatMessage[],
    chunkCallBack: (data: string) => void,
  ): Promise<string> {
    if (!generator.value) throw new Error("Engine not initialized");

    const prepareSendMessages = async (messages: any[]) => {
      const userStore = useUserStore();
      let transformerStore: any = null;

      // 1. 只有移动端且需要翻译时，才进行一次性导入
      if (userStore.isMobile) {
        const { useTransformerStore } =
          await import("../transformerStore/transformerStoreIndex");
        transformerStore = useTransformerStore();
      }

      // 2. 使用 Promise.all 处理异步翻译
      const sendMessages = await Promise.all(
        messages.map(async (item, index) => {
          const isLast = index === messages.length - 1;
          let content = "";

          // 处理内容提取逻辑
          if (typeof item.content === "object" && item.content !== null) {
            content = item.content.talkResponse || "";
          } else {
            content = String(item.content || "");
          }

          // 3. 移动端翻译逻辑：仅针对最后一条消息（通常是用户刚输入的内容）
          if (userStore.isMobile && isLast && transformerStore) {
            // 假设 translate 是一个异步方法
            content = await transformerStore.translate(
              content,
              TranslateType.ZhToEn,
            );
          }

          return {
            role: item.role,
            content: content,
          };
        }),
      );

      return sendMessages;
    };
    const sendMessages = await prepareSendMessages(messages);
    console.log("sendMessages", sendMessages);
    // 使用参考示例中的 triggered_tags 结构
    const responseFormat: any = {
      type: "structural_tag",
      structural_tag: {
        type: "structural_tag",
        format: {
          type: "triggered_tags",
          triggers: ["<game_meta>"],
          tags: [
            {
              begin: "<game_meta>\n",
              content: { type: "json_schema", json_schema: metaSchema },
              end: "\n</game_meta>",
            },
          ],
          at_least_one: true,
          stop_after_first: true,
        },
      },
    };

    const chunks = await generator.value.chat.completions.create({
      messages: sendMessages,
      temperature: 0.8,
      top_p: 0.9,
      stream: true,
      response_format: responseFormat,
      max_tokens: 256,
      extra_body: {
        enable_thinking: true,
      },
    });
    // console.log(
    //   "chunks.choices[0]!.message.content!",
    //   chunks.choices[0]!.message.content!,
    // );
    // return chunks.choices[0]!.message.content!;
    let fullOutput = "";
    let isMetaArea = false; // 是否进入了元数据标签区

    for await (const chunk of chunks) {
      const delta = chunk.choices[0]?.delta?.content || "";
      fullOutput += delta;

      // 逻辑：一旦检测到标签开始，停止向 UI 回传文本
      if (delta.includes("<game_meta>")) {
        isMetaArea = true;
      }

      // 只有在非标签区，才直接把内容喂给 UI（实现丝滑流式）
      if (!isMetaArea && delta) {
        // 如果 delta 包含标签前缀的部分，做一次截断处理（可选）
        const cleanDelta = delta.split("<game_meta>")[0];
        if (cleanDelta) {
          chunkCallBack(cleanDelta);
        }
      }
    }

    // 结束后，你可以从 fullOutput 中提取 JSON 并进行逻辑处理
    // 比如：const meta = JSON.parse(fullOutput.match(/<game_meta>\n([\s\S]*?)\n<\/game_meta>/)[1]);
    return fullOutput;
  }

  return { generator, setGenerator, aiChat };
});
