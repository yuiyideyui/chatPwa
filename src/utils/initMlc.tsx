import { CreateWebWorkerMLCEngine, WebWorkerMLCEngine } from "@mlc-ai/web-llm";
import { ref } from "vue";
import { useMlcStore } from "@/store";
import { EbMessage } from "@yuiyideyui/everybody-ui";
import { installIngCom } from "@/components/installCom";
const url = window.location.origin;
const ModelList = {
  "Llama-3.2-1B-Instruct-q4f16_1-MLC": {
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
  "Qwen3-1.7B-q4f16_1-MLC": {
    model: url + "/models/Qwen3-1.7B-q4f16_1-MLC", // 权重路径
    model_id: "Qwen3-1.7B-q4f16_1-MLC",
    // 这里的 WASM 库必须与模型版本严格对应
    model_lib: url + "/wasm/Qwen3-1.7B-q4f16_1-ctx4k_cs1k-webgpu.wasm",
    low_resource_required: true,
    overrides: {
      context_window_size: 4096,
    },
  },
} as const;
let workerInstance: Worker | null = null;
let engine: WebWorkerMLCEngine | null = null;
const downloadProgress = ref(0);
export async function installMlc(name: keyof typeof ModelList) {
  return new Promise<boolean>(async (resolve) => {
    const mlcStore = useMlcStore();
    if (mlcStore.generator !== null) return;
    const model = ModelList[name];
    if (!model) {
      EbMessage({
        jsx: () => <>未找到适配当前设备的模型</>,
        position: "top",
        timeClose: 1000,
      });
      return;
    }
    const close = installIngCom(downloadProgress)
    workerInstance = new Worker(
      new URL("@/worker/mlc.worker.ts", import.meta.url),
      {
        type: "module",
      },
    );
    engine = await CreateWebWorkerMLCEngine(
      workerInstance,
      model.model_id, // 这里的 ID 要与配置一致
      {
        initProgressCallback: (p) => {
          const progress = p.progress * 100;
          downloadProgress.value = Math.round(progress);
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
    console.info("engine", engine);
    if (downloadProgress.value === 100) {
      downloadProgress.value = 0;
      close();
    }
    mlcStore.setGenerator(engine);
    resolve(true);
  });
}
export async function uninstallMlc(name: string) {
  const mlcStore = useMlcStore();

  try {
    await cleandbs(name);
    if (engine?.modelId![0] !== name) {
      return;
    }
    // 1️⃣ 卸载 engine
    if (engine) {
      await engine.unload();
      mlcStore.setGenerator(null);
      engine = null;
    }

    // 2️⃣ 终止 worker
    if (workerInstance) {
      workerInstance.terminate();
      workerInstance = null;
    }
    console.log("✅ 模型已彻底删除");
  } catch (err) {
    console.error("❌ 删除失败", err);
  }
}
export async function unActiveMlc() {
  const mlcStore = useMlcStore();
  try {
    // 1️⃣ 卸载 engine
    if (engine) {
      await engine.unload();
      mlcStore.setGenerator(null);
      engine = null;
    }

    // 2️⃣ 终止 worker
    if (workerInstance) {
      workerInstance.terminate();
      workerInstance = null;
    }
    console.log("✅ 模型停用成功");
  } catch (err) {
    console.error("❌ 模型停用失败", err);
  }
}
const cleandbs = async (name: string) => {
  // 3️⃣ 获取所有 DB
  const dbs: IDBDatabaseInfo[] = await indexedDB.databases();

  // 4️⃣ 并发清理
  await Promise.all(
    dbs
      .filter((db) => db.name?.includes("webllm"))
      .map((db) => clearDb(db.name!, name)),
  );
};
function clearDb(dbName: string, keyword: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      const db = request.result;

      const tx = db.transaction(db.objectStoreNames, "readwrite");

      tx.onerror = () => reject(tx.error);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };

      // 遍历所有 store（关键优化点）
      for (const storeName of db.objectStoreNames) {
        const store = tx.objectStore(storeName);

        const getKeysReq = store.getAllKeys();

        getKeysReq.onsuccess = () => {
          const keys = getKeysReq.result as string[];

          keys.forEach((key) => {
            if (typeof key === "string" && key.includes(keyword)) {
              store.delete(key);
            }
          });
        };
      }
    };
  });
}
