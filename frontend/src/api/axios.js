// frontend/src/api/axios.js
import axios from "axios";

// If you have VITE_API_URL in .env, it will use that.
// Otherwise it defaults to your local backend.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  withCredentials: false,
});

// Attach JWT token automatically for every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token"); // must match AuthContext key
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

//  Optional: if token expired / invalid, clear and redirect
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.status === 401) {
      // keep it simple: clear token so UI updates
      localStorage.removeItem("token");
      localStorage.removeItem("role");
    }
    return Promise.reject(error);
  }
);

export default api;