import axios from "axios";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const axiosInstance = axios.create({
  baseURL: apiUrl,
  headers: {
    "Content-Type": "application/json"
  }
});

// Helper to get token from zustand persist
const getTokenFromZustand = () => {
  try {
    const storage = localStorage.getItem('user-storage');
    if (!storage) return null;
    
    const parsed = JSON.parse(storage);
    // zustand persist structure: { state: { user: { token } }, version }
    const user = parsed?.state?.user;
    
    // support all common token field names
    return user?.token || user?.accessToken || user?.access_token || null;
  } catch (e) {
    console.error("Failed to parse user-storage", e);
    return null;
  }
};

axiosInstance.interceptors.request.use((config) => {
  // For FormData, let browser set boundary
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }

  const token = getTokenFromZustand();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default axiosInstance;