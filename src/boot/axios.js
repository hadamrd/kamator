import { boot } from "quasar/wrappers";
import axios from "axios";
import { useAuthStore } from '../stores/useAuthStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
  // Remove withCredentials since we're using token auth
});

// Add token interceptor instead of CSRF
api.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('auth_token'); // or more secure storage
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

export default boot(async ({ app }) => {
  app.config.globalProperties.$axios = axios;
  app.config.globalProperties.$api = api;

  await useAuthStore().authCheck();
});

export { axios, api };
