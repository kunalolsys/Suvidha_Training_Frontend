import { api } from "@/api/api";
import { API } from "@/api/endpoints";
import { Employee } from "@/mocks/employees";

export interface LoginResponse {
  token: string;
  user: Employee;
  success: boolean;
  message: string;
}

export const loginUser = async (
  userName: string,
  role: string
): Promise<LoginResponse> => {
  try {
    const res = await api.post(`${API.AUTH}/login`, {
      userName,
      role,
    });
    return res.data;
  } catch (error) {
    return error
  }
};