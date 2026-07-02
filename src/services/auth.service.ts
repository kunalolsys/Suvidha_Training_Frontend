import { api } from "@/api/api";
import { API } from "@/api/endpoints";
import { Designation } from "@/mocks/designations";
import { Employee } from "@/mocks/employees";

export interface LoginResponse {
  token: string;
  user: Employee;
}

export const loginUser = async (
  userName: string
): Promise<LoginResponse> => {
  const res = await api.post(`${API.AUTH}/login`, {
    userName,
  });

  return res.data;
};