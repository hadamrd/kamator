import { boot } from 'quasar/wrappers';
import { useAuthStore } from 'src/stores/useAuthStore';

export default boot(({ router }) => {

  router.beforeEach((to, from, next) => {
    const authStore = useAuthStore();
    if (to.meta.requiresAuth && authStore.loggedOut) {
      next({ path: '/login' });
    } else if (to.meta.guestOnly && !authStore.loggedOut) {
      next({ path: '/' });
    } else {
      next();
    }
  });
});
