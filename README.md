# ChatPWA

ChatPWA 是一个渐进式 Web 应用（PWA），提供快速、响应式且以隐私为优先的本地 AI 对话体验。它完全运行在浏览器中，基于 WebGPU 和现代 Web Worker 架构，可在本地设备上运行大语言模型（LLM），无需与任何外部服务器通信。

![alt text](image.png)![alt text](image-1.png)![alt text](image-2.png)

## ✨ 功能特点

- **100% 本地 AI：** 使用 `@mlc-ai/web-llm` 基于 WebGPU 在本地运行模型（如 `Llama-3.2-1B-Instruct`），聊天数据不会上传。
- **PWA 应用：** 支持桌面和移动端安装，具备离线能力（基于 Workbox Service Worker）。
- **Web Worker 架构：** 将 AI 推理任务放入 Worker 线程，保证 UI 流畅。
- **本地缓存：** 使用 IndexedDB（`idb`）缓存模型和聊天记录，避免重复下载。
- **Transformers 支持：** 集成 `@huggingface/transformers`，支持浏览器端推理。

## 🚧 开发计划：

- [✔️] PWA离线应用PC
- [ ] PWA离线应用移动端
- [✔️] 移动端使用（骁龙8 gen 3 8G chrome浏览器）待继续添加
- [✔️] 桌面端使用
- [ ] 数据模块
  - [✔️] 聊天记录
  - [ ] 长期记忆
  - [ ] 知识库
- [✔️] 中英文互译
- [ ] TTS(sherpa-onnx) 使用 Qwen 3.5 onnx?
- [ ] ASR(sherpa-onnx)
- [ ] KWS(sherpa-onnx)

## 🛠️ 技术栈

### 前端框架

- Vue 3（Composition API + `<script setup>`）
- Vite
- TypeScript

### 状态管理与路由

- Pinia
- Vue Router 4

### 样式

- UnoCSS
- JSX（`@vitejs/plugin-vue-jsx`）

### AI 推理

- `@mlc-ai/web-llm`
- `@huggingface/transformers`

### PWA 与存储

- `vite-plugin-pwa` / workbox
- idb（IndexedDB 封装）

## 🚀 快速开始

### 前置要求

- 安装 Node.js
- 使用支持 WebGPU 的浏览器（Chrome / Edge）

### 安装

```bash
npm install
# 或
yarn install
# 或
pnpm install
```

### 模型准备

请将模型和 wasm 文件放入：

```
public/models/
public/wasm/
```

并与 `src/utils/initMlc.ts` 配置保持一致。

### 启动开发

```bash
npm run dev
```

> 注意：开发环境需要 HTTPS（使用 vite-plugin-mkcert），否则 WebGPU / Worker 可能无法运行。

### 构建生产

```bash
npm run build
```

预览：

```bash
npm run preview
```

## ⚙️ 配置说明

- `src/utils/initMlc.ts`：WebLLM 初始化、模型配置、缓存策略
- `src/utils/initTransformer.ts`：Transformers 配置

## 📄 License

MIT License
