import { defineStore } from 'pinia'
import { api } from 'src/boot/axios'
import { Notify } from 'quasar'
import { Loading } from 'quasar'
import { queryClient } from 'src/boot/vue-query'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    error: '',
    loading: false,
    authInterval: null,
    sessionId: null,
    loggedOut: true,
  }),

  getters: {
    isLoggedIn: (state) => !!state.user,
    hasPermission: (state) => (permName) => {
      return state.user?.permissions?.includes(permName) ?? false
    },
    hasRequestApprovePerms() {
      return this.hasPermission('demands.can_approve')
    }
  },

  actions: {
    async login(username, password) {
      this.loading = true;

      try {
        await api.post("/app_auth/login/", { username, password });
        await this.authCheck();
        return true;
      } catch (error) {
        console.log(error);
        if (error.code === 'ERR_NETWORK') {
          this.error = "Network Error: Unable to reach remote server.";
        } else if (error.response) {
          if (error.response.data?.non_field_errors) {
            this.error = error.response.data.non_field_errors;
          } else if (error.response.data.error) {
            this.error = error.response.data.error;
          } else {
            this.error = error.response.data;
          }
        } else {
          this.error = "An unexpected error occurred";
        }
        this.user = null;
        this.loggedOut = true;
        return false;
      } finally {
        this.loading = false;
      }
    },

    async authCheck() {
      Loading.show();
      this.loading = true;

      try {
        const response = await api.get("app_auth/auth-check");
        const data = response.data;

        if (data.isAuthenticated && data.user) {
          this.user = data.user;
          this.sessionId = data.session_id;
          this.error = "";
          this.loggedOut = false;

          if (!this.authInterval) {
            this.authInterval = setInterval(() => {
              this.authCheck();
            }, 1000 * 60 * 21); // Check every 21 minutes
          }

          if (this.router.currentRoute.value.path === "/login") {
            this.router.push("/");
          }
        } else {
          this.error = "";
          this.loggedOut = true;

          if (this.authInterval) {
            clearInterval(this.authInterval);
          }
          this.authInterval = null;

          if (this.router.currentRoute.value.path !== "/login") {
            this.router.push("/login");
          }
        }

        return true;
      } catch (error) {
        console.error(error);
        if (error.code === "ERR_NETWORK") {
          Notify.create({
            color: "negative",
            message: "Network Error: Unable to reach remote server.",
            icon: "wifi_off",
            position: "top",
            timeout: 1000,
          });
        }
        this.error = error;
        this.loggedOut = true;

        if (this.router.currentRoute.value.path !== "/login") {
          this.router.push("/login");
        }

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
        queryClient.clear();
        await this.handleLogout();
      } catch (error) {
        console.error('Logout error:', error);
        this.error = error.response?.data?.error ?? 'Logout failed';
      } finally {
        this.loading = false;
      }
    },

    handleLogout() {
      this.user = null;
      this.sessionId = null;
      this.error = '';
      this.loggedOut = true;

      if (this.authInterval) {
        clearInterval(this.authInterval);
        this.authInterval = null;
      }

      // Clear any cached data
      queryClient.clear();
    },

    async fetchSessionId() {
      try {
        const response = await api.get('app_auth/session-id');
        this.sessionId = response.data.session_id;
        return this.sessionId;
      } catch (error) {
        console.error('Failed to fetch session ID:', error);
        return null;
      }
    }
  }
});
