import axios from "axios";

export const AUTH_TOKEN_KEY = "nhs19_admin_token";
export const AUTH_USER_KEY = "nhs19_admin_user";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5050/api"
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;
