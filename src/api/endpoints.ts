let API_BASE_URL = import.meta.env.VITE_API_URL;
export const API = {
  AUTH: `${API_BASE_URL}/auth`,

  USER: `${API_BASE_URL}/users`,

  EMPLOYEE: `${API_BASE_URL}/employees`,

  STORE: `${API_BASE_URL}/stores`,

  DESIGNATION: `${API_BASE_URL}/designation`,

  VIDEO: `${API_BASE_URL}/videos`,

  QUESTION: `${API_BASE_URL}/questions`,

  REPORT: `${API_BASE_URL}/reports`,

  DASHBOARD: `${API_BASE_URL}/dashboard`,

  PROGRESS: `${API_BASE_URL}/progress`,
};