import axiosInstance from "./axios";

export const api = {
  get: async <T = any>(url: string, params = {}): Promise<T> => {
    return axiosInstance.get(url, { params });
  },

  post: async <T = any>(url: string, data = {}): Promise<T> => {
    return axiosInstance.post(url, data);
  },

  put: async <T = any>(url: string, data = {}): Promise<T> => {
    return axiosInstance.put(url, data);
  },

  patch: async <T = any>(url: string, data = {}): Promise<T> => {
    return axiosInstance.patch(url, data);
  },

  delete: async <T = any>(url: string): Promise<T> => {
    return axiosInstance.delete(url);
  },
};