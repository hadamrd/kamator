import { defineStore } from 'pinia'
import { api } from 'src/boot/axios'
import { Loading } from 'quasar'
import { queryClient } from 'src/boot/vue-query'
import { useWebSocketStore } from 'src/stores/webSocketStore'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    error: '',
    loading: false,
    authInterval: null,
    token: localStorage.getItem('auth_token'), // Add token to state
    loggedOut: !localStorage.getItem('auth_token'),
  }),

  actions: {
    async login(username, password) {
      this.loading = true;

      try {
        // Use new token endpoint
        const response = await api.post("/api/token-auth/", { username, password });
        const { token, user } = response.data;

        // Store token
        localStorage.setItem('auth_token', token);
        this.token = token;

        await this.authCheck();
        return true;
      } catch (error) {
        console.log(error);
        if (error.code === 'ERR_NETWORK') {
          this.error = "Network Error: Unable to reach remote server.";
        } else if (error.response?.data) {
          this.error = error.response.data.non_field_errors
            || error.response.data.error
            || error.response.data;
        } else {
          this.error = "An unexpected error occurred";
        }
        this.user = null;
        this.token = null;
        this.loggedOut = true;
        localStorage.removeItem('auth_token');
        return false;
      } finally {
        this.loading = false;
      }
    },

    async authCheck() {
      if (!this.token) {
        this.handleLogout();
        return false;
      }

      Loading.show();
      this.loading = true;

      try {
        const response = await api.get("app_auth/auth-check");
        const data = response.data;

        if (data.isAuthenticated && data.user) {
          this.user = data.user;
          this.error = "";
          this.loggedOut = false;

          if (!this.authInterval) {
            this.authInterval = setInterval(() => {
              this.authCheck();
            }, 1000 * 60 * 21);
          }

          if (this.router.currentRoute.value.path === "/login") {
            this.router.push("/");
          }
          useWebSocketStore().initializeStore();
          return true;
        } else {
          this.handleLogout();
          return false;
        }
      } catch (error) {
        console.error(error);
        this.handleLogout();
        return false;
      } finally {
        this.loading = false;
        Loading.hide();
      }
    },

    async logout() {
      this.loading = true;
      try {
        await api.post('app_auth/logout/');
      } finally {
        this.handleLogout();
        this.loading = false;
      }
    },

    handleLogout() {
      localStorage.removeItem('auth_token');
      this.token = null;
      this.user = null;
      this.error = '';
      this.loggedOut = true;

      if (this.authInterval) {
        clearInterval(this.authInterval);
        this.authInterval = null;
      }

      useWebSocketStore().disconnect();
      queryClient.clear();

      if (this.router.currentRoute.value.path !== "/login") {
        this.router.push("/login");
      }
    }
  }
});
