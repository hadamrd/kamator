import { boot } from "quasar/wrappers";
import axios from "axios";
import { useAuthStore } from '../stores/useAuthStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}

export default boot(async ({ app }) => {
  app.config.globalProperties.$axios = axios;
  app.config.globalProperties.$api = api;

  api.interceptors.request.use((config) => {
    const methodsRequiringCSRF = ["post", "put", "delete"];
    if (methodsRequiringCSRF.includes(config.method?.toLowerCase() ?? "")) {
      const csrfToken = getCookie("csrftoken");
      if (csrfToken) {
        config.headers["X-CSRFToken"] = csrfToken;
      }
    }
    return config;
  });
  await useAuthStore().authCheck();
});

export { axios, api };
