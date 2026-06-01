import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";

export const api = axios.create({
  baseURL: API_BASE
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function mediaUrl(url) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  const root = API_BASE.replace(/\/api$/, "");
  return `${root}${url}`;
}
