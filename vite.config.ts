import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vite";
import vueDevTools from "vite-plugin-vue-devtools";
import vue from "@vitejs/plugin-vue";
import UnoCSS from "unocss/vite";
import vueJsx from "@vitejs/plugin-vue-jsx";
import { fileURLToPath } from "node:url";
import basicSsl from "@vitejs/plugin-basic-ssl";
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    UnoCSS(),
    vueJsx(),
    vueDevTools(),
    basicSsl(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      registerType: "autoUpdate",
      injectRegister: "auto",

      pwaAssets: {
        disabled: false,
        config: true,
      },

      manifest: {
        name: "chatPwa",
        short_name: "chatPwa",
        description: "chatPwa",
        theme_color: "#ffffff",
      },

      injectManifest: {
        globPatterns: [
          "**/*.{js,css,html,svg,png,ico,json,bin,wasm,mjs,onnx,onnx_data}",
        ],
        maximumFileSizeToCacheInBytes: 500 * 1024 * 1024,
      },

      devOptions: {
        enabled: false,
        navigateFallback: "index.html",
        suppressWarnings: true,
        type: "module",
      },
    }),
  ],
  server: {
    headers: {
      // 开启跨源隔离，允许 SharedArrayBuffer
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
    host: true,
    port: 5555,
  },
  preview: {
    host: true,
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    target: "esnext",
    minify: "terser", // 有时 esbuild 压缩会导致 Worker 内部变量冲突
    polyfillModulePreload: false,
    rollupOptions: {
      output: {
        // 确保不会生成依赖 DOM 的代码块
        format: "es",
      },
    },
  },
  worker: {
    format: "es",
    // 关键：在 Worker 打包时不应用某些可能导致 DOM 操作的插件
  },
});
