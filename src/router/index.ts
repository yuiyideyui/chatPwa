import { createWebHashHistory, createRouter } from "vue-router";
import selectAiPage from "@/views/selectAiPage/selectAiPageIndex.vue";
import chatPage from "@/views/chatPage/chatPageIndex.vue";

const routes = [
  { path: "/", component: selectAiPage },
  { path: "/chatPage", component: chatPage },
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
});
