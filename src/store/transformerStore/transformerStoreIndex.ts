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
  do_sample: false,
  num_beams: 1, // 贪婪搜索是防止幻觉的最佳手段
  max_new_tokens: 256, // 翻译任务不需要 512 这么长，短一点更稳
  repetition_penalty: 1.1,
};
export const useTransformerStore = defineStore("transformer", () => {
  const generator = shallowRef<TextGenerationPipeline | null>(null);
  const setGenerator = (data: TextGenerationPipeline) => {
    generator.value = data;
  };
  const aiChat = async (
    messages: IChatMessage[],
    callback_function: (data: string) => void,
    isFormatted: boolean,
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
    const streamer = new TextStreamer(generator.value!.tokenizer, {
      skip_prompt: true,
      callback_function,
    });
    const output = await generator.value!(sendMessages, {
      max_new_tokens: 512, // 对话初期限制长度，防止它跑偏
      do_sample: true,
      temperature: 0.2, // 降低温度，增加确定性
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
  const setTranslatorEnToZh = (data: TranslationPipeline | null) => {
    translatorEnToZh.value = data;
  };

  const translatorZhToEn = shallowRef<TranslationPipeline | null>(null);
  const setTranslatorZhToEn = (data: TranslationPipeline | null) => {
    translatorZhToEn.value = data;
  };

  const translate = async (text: string, options: TranslateType) => {
    let output;
    if (options === TranslateType.EnToZh) {
      output = await translatorEnToZh.value!(
        text,
        translatorConfig as GenerationConfig | any,
      );
    } else {
      output = await translatorZhToEn.value!(
        text,
        translatorConfig as GenerationConfig | any,
      );
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
    translatorZhToEn,
    translatorEnToZh,
    translate,
  };
});
