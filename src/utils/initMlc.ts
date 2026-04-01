import { CreateWebWorkerMLCEngine } from "@mlc-ai/web-llm";
import type { Ref } from "vue";
import { useMlcStore, useUserStore } from "@/store";
const url = window.location.origin;
const ModelList = {
  mobile: {
    model: url + "/models/Llama-3.2-1B-Instruct-q4f16_1-MLC", // 权重路径
    model_id: "Llama-3.2-1B-Instruct-q4f16_1-MLC",
    // 这里的 WASM 库必须与模型版本严格对应
    model_lib:
      url + "/wasm/Llama-3.2-1B-Instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm",
    low_resource_required: true,
    overrides: {
      context_window_size: 2048,
    },
  },
  pc: {
    model: url + "/models/Qwen3-1.7B-q4f16_1-MLC", // 权重路径
    model_id: "Qwen3-1.7B-q4f16_1-MLC",
    // 这里的 WASM 库必须与模型版本严格对应
    model_lib: url + "/wasm/Qwen3-1.7B-q4f16_1-ctx4k_cs1k-webgpu.wasm",
    low_resource_required: true,
    overrides: {
      context_window_size: 4096,
    },
  },
};

export async function initMlc(
  downloadProgress: Ref<number>,
  isLoading: Ref<boolean>,
) {
  const mlcStore = useMlcStore();
  const userStore = useUserStore();
  if (mlcStore.generator !== null) return;
  const model = ModelList[userStore.isMobile ? "mobile" : "pc"];
  const engine = await CreateWebWorkerMLCEngine(
    new Worker(new URL("@/worker/mlc.worker.ts", import.meta.url), {
      type: "module",
    }),
    model.model_id, // 这里的 ID 要与配置一致
    {
      initProgressCallback: (p) => {
        const progress = p.progress * 100;
        downloadProgress.value = progress;
        if (p.progress === 1) {
          console.info("设备状态", p.text);
          downloadProgress.value = 100;
        }
      },
      appConfig: {
        model_list: [model],
        useIndexedDBCache: true,
      },
    },
  );
  console.log("engine", engine);
  if (downloadProgress.value === 100) {
    downloadProgress.value = 0;
  }
  isLoading.value = false;
  mlcStore.setGenerator(engine);
}
