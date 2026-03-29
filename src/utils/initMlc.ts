import { CreateWebWorkerMLCEngine } from "@mlc-ai/web-llm";
import type { Ref } from "vue";
import { useMlcStore } from "@/store/mlcStore/mlcStoreIndex";
export async function initMlc(
  downloadProgress: Ref<number>,
  isLoading: Ref<boolean>,
) {
  const mlcStore = useMlcStore();
  if (mlcStore.generator !== null) return;
  const url = window.location.origin;
  const engine = await CreateWebWorkerMLCEngine(
    new Worker(new URL("@/worker/mlc.worker.ts", import.meta.url), {
      type: "module",
    }),
    "gemma-2-2b-it-q4f16_1-MLC", // 这里的 ID 要与配置一致
    {
      initProgressCallback: (p) => {
        const progress = p.progress * 100;
        downloadProgress.value = progress;
        if (p.progress === 1) {
          downloadProgress.value = 100;
          setTimeout(() => {
            if (downloadProgress.value === 100) downloadProgress.value = 0;
            isLoading.value = false;
          }, 100);
        }
      },
      appConfig: {
        model_list: [
          {
            model: url + "/models/gemma-2-2b-it-q4f16_1-MLC", // 权重路径
            model_id: "gemma-2-2b-it-q4f16_1-MLC",
            // 这里的 WASM 库必须与模型版本严格对应
            model_lib:
              url + "/wasm/gemma-2-2b-it-q4f16_1-ctx4k_cs1k-webgpu.wasm",
            low_resource_required: true,
            overrides: {
              context_window_size: 2048,
            },
          },
        ],

        useIndexedDBCache: true,
      },
    },
  );
  console.log("engine", engine);
  mlcStore.setGenerator(engine);
}
