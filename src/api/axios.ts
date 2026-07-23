import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.BASE_URL,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const isAuthRequest = error.config?.url?.includes("/login") || error.config?.url?.includes("/auth");

    if (error.response?.status === 401) {
      // 🟢 AGAR LOGIN API SE 401 AAYA HAI (Invalid email/pass)
      if (isAuthRequest) {
        // Return standard error payload so handleSubmit gets res.success = false
        return Promise.reject(error.response?.data || error);
      }

      // 🔴 AGAR SECURED API SE 401 AAYA HAI (Token expired/invalid)
      localStorage.removeItem("token");
      localStorage.removeItem("stu_emp");
      window.dispatchEvent(new Event("unauthorized"));

      return new Promise(() => {}); // Stop UI re-renders on protected routes
    }

    return Promise.reject(error.response?.data || error);
  }
);

export default axiosInstance;