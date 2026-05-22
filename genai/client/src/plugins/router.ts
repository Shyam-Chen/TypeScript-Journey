import routes from 'virtual:vue-routes';
import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (to.hash) return { selector: to.hash };
    return savedPosition || from.meta.scrollPosition || { top: 0 };
  },
});

export default router;
