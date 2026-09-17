import axios from "axios";



const axiosInstance = axios.create({
  baseURL: "https://chat-app-backend-tlq8.onrender.com/api",
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