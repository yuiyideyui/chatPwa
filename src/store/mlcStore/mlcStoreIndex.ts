import { defineStore } from "pinia";
import { shallowRef } from "vue";
import type { ResponseFormat, WebWorkerMLCEngine } from "@mlc-ai/web-llm";
import type { IChatMessage } from "../chatStore/chatStoreIndex.type";
import { Type } from "@sinclair/typebox";
/**
 * 定义元数据的 Schema
 */
const metaSchema = Type.Object({
  talkResponse: Type.String(),
  options: Type.Array(Type.String(), {
    maxItems: 5,
    minItems: 3,
  }),
  textBackground: Type.String(),
  status: Type.String(),
});
export const useMlcStore = defineStore("mlc", () => {
  const generator = shallowRef<WebWorkerMLCEngine | null>(null);
  const setGenerator = (data: WebWorkerMLCEngine) => {
    generator.value = data;
  };

  async function aiChat(
    messages: IChatMessage[],
    chunkCallBack: (data: string) => void,
    isFormatted: boolean,
  ): Promise<string> {
    console.log('isFormatted',isFormatted)
    if (!generator.value) throw new Error("Engine not initialized");

    const prepareSendMessages = async (messages: any[]) => {
      const sendMessages = await Promise.all(
        messages.map(async (item) => {
          let content = "";
          // 处理内容提取逻辑
          if (typeof item.content === "object" && item.content !== null) {
            content = JSON.stringify(item.content) || "";
          } else {
            content = String(item.content || "");
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
                json_schema: metaSchema,
              },
              end: "\n</game_meta>",
            },
          ],
          at_least_one: true,
          stop_after_first: true,
        },
      },
    };
    const response_format = isFormatted ? { response_format:responseFormat } : {};
    const chunks = await generator.value.chat.completions.create({
      messages: sendMessages,
      temperature: 0.8,
      top_p: 0.9,
      stream: true,
      max_tokens: 512,
      ...response_format
    });
    let fullOutput = "";
    let isMetaArea = "start"; // 是否进入了元数据标签区
    let responseText = "";
    let tagBuffer = "";

    for await (const chunk of chunks) {
      const delta = chunk.choices[0]?.delta?.content || "";
      if (!delta || delta.trim() === "") continue;
      //不格式化直接输出
      if(!isFormatted){
        fullOutput += delta;
        chunkCallBack(delta);
        continue;
      }
      // console.info("🛵delta", delta);
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
    console.log('responseText',responseText)
    return responseText;
  }

  return { generator, setGenerator, aiChat };
});
