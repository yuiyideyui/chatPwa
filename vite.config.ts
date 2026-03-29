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
    https: true,
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
