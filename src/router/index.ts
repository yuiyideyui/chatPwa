import { createWebHashHistory, createRouter } from "vue-router";
const routes = [
  { path: "/", component: ()=> import("@/views/selectAiPage/selectAiPageIndex.vue") },
  { path: "/chatPage", component: ()=> import("@/views/chatPage/chatPageIndex.vue") },
  { path: "/setting", component: () => import("@/views/settingPage/settingPageIndex.vue") },
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
});
