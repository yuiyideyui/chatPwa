<script setup lang="ts">
import PWABadge from "./components/PWABadge.vue";
import { onMounted } from "vue";
import { getAllChatHistory, openDB } from "./utils/chatIndexedDb";
import { useChatStore } from "./store";
import { router } from "./router";
const chatStore = useChatStore();

onMounted(async () => {
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
// import * as webllm from "@mlc-ai/web-llm";
// const appConfig: webllm.AppConfig = {
//   model_list: [
//     {
//       model: "https://huggingface.co/mlc-ai/Qwen2.5-3B-Instruct-q4f16_1-MLC",
//       model_id: "Qwen2.5-3B-Instruct-q4f16_1-MLC",
//       model_lib:
//         webllm.modelLibURLPrefix +
//         webllm.modelVersion +
//         "/Qwen2.5-3B-Instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm",
//     },
//     // Add your own models here...
//   ],
// };
// const selectedModel = "Qwen2.5-3B-Instruct-q4f16_1-MLC";
// const engine: webllm.MLCEngineInterface = await webllm.CreateMLCEngine(
//   selectedModel,
//   { appConfig: appConfig },
// );
// const reply = await engine.chat.completions.create({
//   messages: [
//     { role: "system", content: "你是一个乐于助人的助手。" },
//     { role: "user", content: "你好，请介绍一下你自己。" },
//   ],
//   temperature: 0.7,
//   max_tokens: 512,
// });
// console.log('reply',reply)
</script>

<template>
  <router-view></router-view>
  <PWABadge />
</template>

<style scoped></style>
