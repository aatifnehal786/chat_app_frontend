import axios from "axios";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const axiosInstance = axios.create({
  baseURL: apiUrl,
  withCredentials: true, // IMPORTANT for cookie auth
  headers: {
    "Content-Type": "application/json"
  }
});

// Auto add auth token if needed (fallback)
axiosInstance.interceptors.request.use((config) => {
  // For FormData, let browser set content-type
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  return config;
});

export default axiosInstance;
