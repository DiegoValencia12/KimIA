import { createApp } from "vue";
import { createPinia } from "pinia";

import * as pdfjsLib from "pdfjs-dist";

import App from "./App.vue";
import router from "./router";

pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

const app = createApp(App);

app.use(createPinia());
app.use(router);

app.mount("#app");
