import { env, pipeline } from "@huggingface/transformers";
import { IDBTransformerCache } from "./IDBTransformerCache";
import { useTransformerStore } from "@/store/transformerStore/transformerStoreIndex";
import { ref, type Ref } from "vue";
import { installIngCom } from "@/components/installCom";

const url = window.location.origin;
env.allowRemoteModels = true;
env.allowLocalModels = true;
env.backends.onnx.wasm!.proxy = false; // 开启多线程代理
env.backends.onnx.logLevel = "verbose";
env.backends.onnx.wasm!.wasmPaths = url + "/wasm/";
env.localModelPath = url + "/models/";
env.useCustomCache = true;
//存储models -> indexdbDb
env.customCache = IDBTransformerCache;
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
const transformerspPogress_callback =
  (downloadProgress: Ref<number>) => (p: any) => {
    if (p.status === "progress") {
      downloadProgress.value = Math.round(p.progress);
    } else if (p.status === "done") {
      downloadProgress.value = 100;
    }
  };

/**
 * 通用模型加载函数
 * @param {string} modelName 模型标识符 (例如 'opus-mt-en-zh')
 * @param {string} storeSetter transformerStore 对应的 setter 方法名
 */
const loadTranslationModel = async (
  modelName: string,
  storeSetter: "setTranslatorEnToZh" | "setTranslatorZhToEn",
) => {
  const downloadProgress = ref(0);
  const transformerStore = useTransformerStore();
  const close = installIngCom(downloadProgress);

  try {
    const translator = await pipeline("translation", modelName, {
      dtype: "q8",
      progress_callback: transformerspPogress_callback(downloadProgress),
    });

    // 将生成的实例存入 store
    if (transformerStore[storeSetter]) {
      transformerStore[storeSetter](translator);
    }

    return translator;
  } finally {
    // 无论成功失败都关闭加载组件
    close();
  }
};
const translatorMap = {
  "opus-mt-en<->zh": {
    installFn: async () => {
      return new Promise(async (resolve) => {
        await Promise.all([
          loadTranslationModel("opus-mt-en-zh", "setTranslatorEnToZh"),
          loadTranslationModel("opus-mt-zh-en", "setTranslatorZhToEn"),
        ]);
        resolve(true);
      });
    },
    uninstallFn: async (name: string) => {
      //中英互译---卸载
      const transformerStore = useTransformerStore();
      await IDBTransformerCache.delete(name);
      transformerStore.translatorEnToZh?.dispose();
      transformerStore.setTranslatorEnToZh(null);

      await IDBTransformerCache.delete(name);
      transformerStore.translatorZhToEn?.dispose();
      transformerStore.setTranslatorZhToEn(null);
    },
  },
} as const;
export const installTranslator = async (name: keyof typeof translatorMap) => {
  await translatorMap[name].installFn();
};
export const uninstallTranslatorDB = async (
  name: keyof typeof translatorMap,
) => {
  await translatorMap[name].uninstallFn(name);
};
