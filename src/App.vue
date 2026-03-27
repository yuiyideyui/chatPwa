<script setup lang="ts">
import PWABadge from "./components/PWABadge.vue";
import { onMounted, ref } from "vue";
import { getAllChatHistory, openDB } from "./utils/chatIndexedDb";
import { useChatStore } from "./store";
import { router } from "./router";
import { pipeline, env } from "@huggingface/transformers";

const chatStore = useChatStore();

const downloadProgress = ref(0);
const isLoading = ref(true); // 控制提示文字显示
const initTransformers = async () => {
  env.allowLocalModels = true;
  env.backends.onnx.wasm!.wasmPaths = "http://localhost:5173/wasm/";
  // Specify a custom location for models (defaults to '/models/').
  env.localModelPath = "http://localhost:5173/models/";

  // Disable the loading of remote models from the Hugging Face Hub:

  const generator = await pipeline(
    "text-generation",
    "onnx-community/Qwen2.5-0.5B-Instruct",
    {
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
              isLoading.value = false;
            }, 800);
          }
        }
      },
    },
  );

  // 3. 定义对话消息 (Chat 格式)
  const messages = [
    { role: "system", content: "你是一个乐于助人的 AI 助手。" },
    { role: "user", content: "你好！请简单介绍一下你自己。" },
  ];

  // 4. 生成回复
  const output = await generator(messages, {
    max_new_tokens: 128,
    do_sample: false, // 设为 false 以获得确定的输出
  });
  console.log("output", output);
};
onMounted(async () => {
  initTransformers();
  const indexDb = await openDB();
  if (indexDb) {
    const history = await getAllChatHistory(indexDb);
    if (history.length > 0) {
      chatStore.setChatHistory(history);
      chatStore.setCurrentChat(history[0]!.id);
      router.push("/chatPage");
    } else {
      router.push("/");
    }
  }
});
</script>

<template>
  <div class="top-progress-container">
    <div v-if="isLoading" class="loading-toast">
      <span class="spinner"></span>
      模型加载中 {{ Math.round(downloadProgress) }}%
    </div>
  </div>
  <router-view></router-view>
  <PWABadge />
</template>
<style scoped>
/* 进度条容器 */
.top-progress-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 9999;
  pointer-events: none;
}

/* 加载提示标签 */
.loading-toast {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 12px;
  color: #007aff;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid rgba(79, 172, 254, 0.2);
}

/* 一个简单的旋转动画 */
.spinner {
  width: 12px;
  height: 12px;
  border: 2px solid #4facfe;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
