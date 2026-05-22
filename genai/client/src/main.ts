import { createApp } from 'vue';

import 'virtual:uno.css';

import router from '~/plugins/router.ts';

import App from './App.vue';

const app = createApp(App);

app.use(router);

app.mount('#app-root');
