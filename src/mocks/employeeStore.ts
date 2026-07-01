import { employees as initialEmployees, type Employee } from '@/mocks/employees';

let employeeStore = [...initialEmployees];

export function getAllEmployees(): Employee[] {
  return [...employeeStore];
}

export function getEmployeeById(id: string): Employee | undefined {
  return employeeStore.find((e) => e.id === id);
}

export function findEmployeeByEmail(email: string): Employee | undefined {
  return employeeStore.find((e) => e.email.toLowerCase() === email.toLowerCase());
}

export function addEmployee(employee: Employee): void {
  employeeStore = [...employeeStore, employee];
}

export function updateEmployee(id: string, updates: Partial<Employee>): void {
  employeeStore = employeeStore.map((e) => (e.id === id ? { ...e, ...updates } : e));
}

export function deleteEmployee(id: string): void {
  employeeStore = employeeStore.filter((e) => e.id !== id);
}

export function getNextEmployeeId(): string {
  const employeeIds = employeeStore
    .filter((e) => e.id.startsWith('emp-'))
    .map((e) => parseInt(e.id.split('-')[1], 10));
  const max = employeeIds.length > 0 ? Math.max(...employeeIds) : 0;
  return `emp-${String(max + 1).padStart(3, '0')}`;
}

export function getEmployeesByDesignation(designation: string): Employee[] {
  return employeeStore.filter((e) => e.designation === designation);
}

export function getEmployeeCount(): number {
  return employeeStore.filter((e) => e.role === 'employee').length;
}

export function getAllStores(): { storeId: string; storeName: string; employeeCount: number }[] {
  const storeMap = new Map<string, { storeId: string; storeName: string; employeeCount: number }>();
  employeeStore
    .filter((e) => e.role === 'employee')
    .forEach((e) => {
      const existing = storeMap.get(e.storeId);
      if (existing) {
        existing.employeeCount += 1;
      } else {
        storeMap.set(e.storeId, { storeId: e.storeId, storeName: e.storeName, employeeCount: 1 });
      }
    });
  return Array.from(storeMap.values()).sort((a, b) => a.storeName.localeCompare(b.storeName));
}

export function getEmployeesByStore(storeName: string): Employee[] {
  return employeeStore.filter((e) => e.storeName === storeName && e.role === 'employee');
}

export function getEmployeesByStoreId(storeId: string): Employee[] {
  return employeeStore.filter((e) => e.storeId === storeId && e.role === 'employee');
}