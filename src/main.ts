import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import "./initCss";
import { router } from "./router";
import "./initWebFn";
const pinia = createPinia();
const app = createApp(App);
app.use(pinia);
app.use(router);
app.mount("#app");
//@ts-ignore
// new VConsole();
