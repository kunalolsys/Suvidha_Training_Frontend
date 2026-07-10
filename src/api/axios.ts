import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.BASE_URL,
  // timeout: 30000,
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
    if (error.response?.status === 401) {
      localStorage.removeItem("token");

      const path = window.location.pathname;

      // Admin routes
      if (path.startsWith("/admin")) {
        if (path !== "/admin") {
          window.location.href = "/admin";
        }
      }
      // Employee routes
      else {
        if (path !== "/") {
          window.location.href = "/";
        }
      }
    }

    return Promise.reject(error.response?.data || error);
  }
);

export default axiosInstance;