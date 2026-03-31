import { defineStore } from "pinia";
import { shallowRef } from "vue";
import {
  TextGenerationPipeline,
  TextStreamer,
  TranslationPipeline,
} from "@huggingface/transformers";
import type { IChatMessage } from "../chatStore/chatStoreIndex.type";
import type { GenerationConfig } from "@mlc-ai/web-llm";

export enum TranslateType {
  EnToZh = "en-to-zh",
  ZhToEn = "zh-to-en",
}
const translatorConfig = {
  // 1. 核心：禁用采样。强制模型每次都选概率最高的词（Greedy Search）
  // 这是防止“加料”最有效的手段
  do_sample: false,

  // 2. 束搜索：设为 1 即为贪婪搜索。
  // 如果想要翻译更稳健一点可以设为 2-3，但 1 是最不容易“自作多情”的
  num_beams: 1,

  // 3. 长度控制：防止 AI 翻译完之后觉得没说够，继续往下编
  // 设置最大生成长度，通常为输入的 2-3 倍即可
  max_new_tokens: 512,

  // 4. 重复惩罚：保持在 1.0 - 1.2 之间。
  // 太高（如 2.0）会导致模型为了不重复而被迫找奇怪的同义词，反而变“加料”
  repetition_penalty: 1.1,

  // 5. 早期停止：配合 num_beams > 1 使用
  early_stopping: true,
}
export const useTransformerStore = defineStore("transformer", () => {
  const generator = shallowRef<TextGenerationPipeline | null>(null);
  const setGenerator = (data: TextGenerationPipeline) => {
    generator.value = data;
  };
  const aiChat = async (
    messages: IChatMessage[],
    streamer: TextStreamer,
  ): Promise<string> => {
    const sendMessages = messages.map((item) => {
      return {
        role: item.role,
        content:
          typeof item.content === "object"
            ? item.content.talkResponse
            : item.content,
      };
    });
    const output = await generator.value!(sendMessages, {
      max_new_tokens: 100, // 对话初期限制长度，防止它跑偏
      do_sample: true,
      temperature: 0.3, // 降低温度，增加确定性
      top_p: 0.8,
      repetition_penalty: 1.25, // 核心：防止它开始念经
      no_repeat_ngram_size: 3, // 物理禁止复读
      streamer,
    });
    console.log("output", output);
    //@ts-ignore
    const text =
      //@ts-ignore
      output[0].generated_text[output[0].generated_text.length - 1].content;
    return text;
  };

  const translatorEnToZh = shallowRef<TranslationPipeline | null>(null);
  const setTranslatorEnToZh = (data: TranslationPipeline) => {
    translatorEnToZh.value = data;
  };

  const translatorZhToEn = shallowRef<TranslationPipeline | null>(null);
  const setTranslatorZhToEn = (data: TranslationPipeline) => {
    translatorZhToEn.value = data;
  };

  const translate = async (text: string, options: TranslateType) => {
    let output;
    if (options === TranslateType.EnToZh) {
      output = await translatorEnToZh.value!(text, translatorConfig as GenerationConfig | any);
    } else {
      output = await translatorZhToEn.value!(text, translatorConfig as GenerationConfig | any);
    }
    console.log("output", output);
    //@ts-ignore
    const outText = output[0].translation_text;
    return outText;
  };

  return {
    generator,
    setGenerator,
    aiChat,
    setTranslatorEnToZh,
    setTranslatorZhToEn,
    translate,
  };
});
