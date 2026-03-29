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
      output = await translatorEnToZh.value!(text, {
        // 关键参数：重复惩罚。值 > 1.0 会降低重复词出现的概率
        repetition_penalty: 1.2,
        // 建议：使用 beam search 提高质量，避免贪婪搜索陷入局部最优
        num_beams: 3,
        // 告诉模型在遇到句子结束符 (EOS) 时停止
        early_stopping: true,
      } as GenerationConfig | any);
    } else {
      output = await translatorZhToEn.value!(text, {
        // 关键参数：重复惩罚。值 > 1.0 会降低重复词出现的概率
        repetition_penalty: 1.2,
        // 建议：使用 beam search 提高质量，避免贪婪搜索陷入局部最优
        num_beams: 3,
        // 告诉模型在遇到句子结束符 (EOS) 时停止
        early_stopping: true,
      } as GenerationConfig | any);
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
