import { defineStore } from "pinia";
import { ref, shallowRef } from "vue";
import type { ResponseFormat, WebWorkerMLCEngine } from "@mlc-ai/web-llm";
import type { IChatMessage } from "../chatStore/chatStoreIndex.type";
import { useUserStore } from "../userStore/userStoreIndex";
import { Type } from "@sinclair/typebox";
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
          // const isLast = index === messages.length - 1;
          let content = "";

          // 处理内容提取逻辑
          if (typeof item.content === "object" && item.content !== null) {
            content = JSON.stringify(item.content) || "";
          } else {
            content = String(item.content || "");
          }

          // 3. 移动端翻译逻辑：仅针对最后一条消息（通常是用户刚输入的内容）
          // if (userStore.isMobile && isLast && transformerStore) {
          //   // 假设 translate 是一个异步方法
          //   content = await transformerStore.translate(
          //     content,
          //     TranslateType.ZhToEn,
          //   );
          // }

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
    const responseFormat: ResponseFormat = {
      type: "structural_tag",
      structural_tag: {
        type: "structural_tag",
        format: {
          type: "triggered_tags",
          triggers: ["<game_meta>"],
          tags: [
            {
              begin: "<game_meta>\n",
              type: "tag",
              content: {
                type: "json_schema",
                json_schema: Type.Object({
                  talkResponse: Type.String(),
                  options: Type.Array(Type.String(), {
                    maxItems: 5,
                    minItems: 3,
                  }),
                  textBackground: Type.String(),
                  status: Type.String(),
                }),
              },
              end: "\n</game_meta>",
            },
          ],
          at_least_one: true,
          stop_after_first: true,
        },
      },
    };
    // const responseFormat: ResponseFormat  = {
    //   type: "structural_tag",
    //   structural_tag: {
    //     type: "structural_tag",
    //     format: {
    //       type: "triggered_tags",
    //       triggers: [
    //         "<talkResponse>",
    //         "<textBackground>",
    //         "<status>",
    //         "<options>",
    //       ],
    //       tags: [
    //         {
    //           begin: "<talkResponse>\n",
    //           content: { type: "string" },
    //           end: "\n</talkResponse>",
    //         },
    //         {
    //           begin: "<textBackground>\n",
    //           content: { type: "string" },
    //           end: "\n</textBackground>",
    //         },
    //         {
    //           begin: "<status>\n",
    //           content: { type: "string" },
    //           end: "\n</status>",
    //         },
    //         {
    //           begin: "<options>\n",
    //           content: { type: "array", items: { type: "string" } },
    //           end: "\n</options>",
    //         },
    //       ],
    //       at_least_one: true,
    //       stop_after_first: true,
    //     },
    //   },
    // };

    const chunks = await generator.value.chat.completions.create({
      messages: sendMessages,
      temperature: 0.8,
      top_p: 0.9,
      stream: true,
      response_format: responseFormat,
      max_tokens: 512,
    });
    let fullOutput = "";
    let isMetaArea = "start"; // 是否进入了元数据标签区
    let responseText = "";
    let tagBuffer = "";

    for await (const chunk of chunks) {
      const delta = chunk.choices[0]?.delta?.content || "";
      if (!delta || delta.trim() === "") continue;

      console.info("🛵delta", delta);
      fullOutput += delta;

      if (isMetaArea === "end") {
        // 重要：不要在这里 break！让 AsyncGenerator 自然消耗完流，
        // 防止底层 WebWorker 一直处于忙碌状态，从而引发第二次死锁
        continue;
      }

      // 逻辑：一旦检测到标签开始，切换状态
      if (isMetaArea === "start") {
        if (fullOutput.includes("<game_meta>")) {
          isMetaArea = "ing";
          // 提取出本 chunk 中 <game_meta> 之后可能包含的实际内容
          const splitParts = delta.split("<game_meta>");
          if (splitParts.length > 1) {
            const afterTag = splitParts[1];
            if (afterTag) {
              responseText += afterTag;
              chunkCallBack(afterTag);
            }
          }
        } else {
          // 可选：如果你想在 UI 展示标签前的文本，加在这里
          // responseText += delta;
          // chunkCallBack(delta);
        }
        continue;
      }

      if (isMetaArea === "ing") {
        if (delta.includes("<") || tagBuffer.length > 0) {
          tagBuffer += delta;
          // 检查缓冲区是否已经包含完整的结束标签
          if (tagBuffer.includes("</game_meta>")) {
            isMetaArea = "end";
            // 如果 </game_meta> 前面有残留正常字符，应该补充一下
            const beforeEndTag = tagBuffer.split("</game_meta>")[0];
            if (beforeEndTag) {
              chunkCallBack(beforeEndTag);
              responseText += beforeEndTag;
            }
            tagBuffer = ""; // 清空
          }
          // 容错处理：如果 tagBuffer 里的内容已经很长且不匹配标签开头，说明不是标签
          else if (tagBuffer.length > 20 && !tagBuffer.startsWith("</")) {
            chunkCallBack(tagBuffer);
            responseText += tagBuffer;
            tagBuffer = "";
          }
        } else {
          responseText += delta;
          chunkCallBack(delta);
        }
      }
    }
    return responseText;
  }

  return { generator, setGenerator, aiChat };
});
