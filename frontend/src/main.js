import { createApp } from "vue";
import { createPinia } from "pinia";

import App from "./App.vue";
import router from "./router";

const app = createApp(App);

app.use(createPinia());
app.use(router);

app.mount("#app");

/*Te comparto esta página del IMSS. ¿Me podrías sacar los requisitos del alta patronal? Aquí está el link: https://www.gob.mx/imss/articulos/alta-patronal-e-inscripcion-en-el-seguro-de-riesgos-de-trabajo-o-reanudacion-de-actividades-para-personas-fisicas?idiom=es */
