import { env, pipeline } from "@huggingface/transformers";
import { IDBCache } from "./IDBCache";
import { useTransformerStore } from "@/store/transformerStore/transformerStoreIndex";
import type { Ref } from "vue";

const url = window.location.origin;
env.allowRemoteModels = true;
env.allowLocalModels = true;
env.backends.onnx.wasm!.proxy = false; // 开启多线程代理
env.backends.onnx.logLevel = "verbose";
env.backends.onnx.wasm!.wasmPaths = url + "/wasm/";
env.localModelPath = url + "/models/";
env.useCustomCache = true;
//存储models -> indexdbDb
env.customCache = IDBCache;
env.useBrowserCache = false;

export const initTransformers = async (
  downloadProgress: Ref<number>,
  isLoading: Ref<boolean>,
) => {
  const transformerStore = useTransformerStore();

  const generator = await pipeline("text-generation", "Qwen2.5-0.5B-Instruct", {
    device: "webgpu",
    dtype: "q4",
    progress_callback: (p: any) => {
      if (p.file === "onnx/model_q4.onnx") {
        if (p.status === "progress") {
          downloadProgress.value = p.progress;
        } else if (p.status === "done") {
          downloadProgress.value = 100;
          setTimeout(() => {
            if (downloadProgress.value === 100) downloadProgress.value = 0;
          }, 100);
        }
      }
    },
  });
  isLoading.value = false;
  transformerStore.setGenerator(generator);
};

export const initTranslator = async () => {
  console.info("初始化翻译模块");
  const transformerStore = useTransformerStore();
  const [translatorEnToZh, translatorZhToEn] = await Promise.all([
    pipeline("translation", "opus-mt-en-zh"),
    pipeline("translation", "opus-mt-zh-en"),
  ]);
  console.info("初始化翻译模块完成");
  transformerStore.setTranslatorEnToZh(translatorEnToZh);
  transformerStore.setTranslatorZhToEn(translatorZhToEn);
};
