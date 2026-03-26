import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vite";
import vueDevTools from 'vite-plugin-vue-devtools'
import vue from "@vitejs/plugin-vue";
import UnoCSS from 'unocss/vite'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { fileURLToPath } from "node:url";
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    UnoCSS(),
    vueJsx(),
    vueDevTools(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      registerType: "autoUpdate",
      injectRegister: 'auto',

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
        globPatterns: ["**/*.{js,css,html,svg,png,ico,json,bin}"],
        // 如果模型文件很大（超过 2MB），建议增加这个限制以免构建报错
        maximumFileSizeToCacheInBytes: 100 * 1024 * 1024,
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
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "credentialless",
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
