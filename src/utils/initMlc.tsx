import { CreateWebWorkerMLCEngine, deleteModelInCache, deleteModelWasmInCache, WebWorkerMLCEngine } from "@mlc-ai/web-llm";
import type { Ref } from "vue";
import { useMlcStore, useUserStore } from "@/store";
import { EbMessage } from "@yuiyideyui/everybody-ui";
const url = window.location.origin;
const ModelList = {
  mobile: {
    'Llama-3.2-1B-Instruct-q4f32_1-MLC': {
      model: url + "/models/Llama-3.2-1B-Instruct-q4f32_1-MLC", // 权重路径
      model_id: "Llama-3.2-1B-Instruct-q4f32_1-MLC",
      // 这里的 WASM 库必须与模型版本严格对应
      model_lib:
        url + "/wasm/Llama-3.2-1B-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm",
      low_resource_required: true,
      overrides: {
        context_window_size: 2048,
      },
    }
  },
  pc: {
    "Qwen3-1.7B-q4f16_1-MLC": {
      model: url + "/models/Qwen3-1.7B-q4f16_1-MLC", // 权重路径
      model_id: "Qwen3-1.7B-q4f16_1-MLC",
      // 这里的 WASM 库必须与模型版本严格对应
      model_lib: url + "/wasm/Qwen3-1.7B-q4f16_1-ctx4k_cs1k-webgpu.wasm",
      low_resource_required: true,
      overrides: {
        context_window_size: 4096,
      },
    }
  }
};
let workerInstance: Worker | null = null;
let engine: WebWorkerMLCEngine | null = null
export async function initMlc(
  downloadProgress: Ref<number>,
  isLoading: Ref<boolean>,
) {
  const mlcStore = useMlcStore();
  const userStore = useUserStore();
  if (mlcStore.generator !== null) return;
  const model = Object.values(ModelList[userStore.isMobile ? "mobile" : "pc"])[0];
  if (!model) {
    EbMessage({
      jsx: () => <>未找到适配当前设备的模型</>,
      position: "top",
      timeClose: 1000
    });
    return
  }
  workerInstance = new Worker(new URL("@/worker/mlc.worker.ts", import.meta.url), {
    type: "module",
  })
  engine = await CreateWebWorkerMLCEngine(
    workerInstance,
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
export async function uninstallMlc(modelId:string) {
  const userStore = useUserStore();

  const modelConfig = Object.values(
    ModelList[userStore.isMobile ? "mobile" : "pc"]
  ).find(m => m.model_id === modelId);

  if (!modelConfig) return;

  try {
    // ✅ 1. 先卸载 engine
    if (engine) {
      await engine.unload();
      engine = null;
    }

    // ✅ 2. 终止 worker（很关键）
    if (workerInstance) {
      workerInstance.terminate();
      workerInstance = null;
    }

    // ✅ 3. 删除模型权重缓存
    await deleteModelInCache(modelId, {
      model_list: [modelConfig], // ⚠️ 必须完全一致
    });

    // ✅ 4. 删除 WASM 缓存（必须开）
    if (modelConfig.model_lib) {
      await deleteModelWasmInCache(modelConfig.model_lib, {
        model_list: [modelConfig], // ⚠️ 必须完全一致
      });
    }

    // ✅ 5. 强制清理 IndexedDB（兜底方案）
    const dbs = await indexedDB.databases();
    for (const db of dbs) {
      if (db.name?.includes("webllm")) {
        indexedDB.deleteDatabase(db.name);
      }
    }

    console.log("✅ 模型已彻底删除");
  } catch (err) {
    console.error("❌ 删除失败", err);
  }
}