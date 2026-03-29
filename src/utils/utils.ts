import { useUserStore } from "@/store";
export async function selectEngine() {
  const userStore = useUserStore();
  // 1. 检测 WebGPU 支持
  //@ts-ignore
  if (!navigator.gpu) {
    console.warn("不支持 WebGPU，回退到 Transformers.js (CPU/WebGL)");
    userStore.setEngineType("transformers");
    return "transformers";
  }
  //@ts-ignore
  const adapter = await navigator.gpu.requestAdapter();
  for (const key in adapter.info) {
    console.log(key, adapter.info[key]);
  }
  if (!adapter) {
    userStore.setEngineType("transformers");
    return "transformers";
  } else {
    userStore.setEngineType("mlc");
    return "mlc";
  }
}

export function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
