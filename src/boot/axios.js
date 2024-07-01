import { boot } from "quasar/wrappers";
import axios from "axios";

const api = axios.create({
  baseURL: `http://127.0.0.1:8001`,
  withCredentials: true,
});

// Helper function to get CSRF token from cookie
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop().split(";").shift() || null;
  }
  return null;
}

export default boot(async ({ app }) => {
  // for use inside Vue files through this.$axios and this.$api
  app.config.globalProperties.$axios = axios;
  app.config.globalProperties.$api = api;
  // Set the X-CSRFToken header for all POST/PUT/DELETE requests
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
});

export { axios, api };
