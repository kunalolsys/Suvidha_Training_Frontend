export interface Designation {
  _id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}
export interface Store {
  _id: string;
  name: string;
  code: string;
}
export interface Employee {
  _id: string;
  employeeId: string;
  name: string;
  email: string;
  role: "Admin" | "Employee";
  designation: Designation | null;
  store: Store | null;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}