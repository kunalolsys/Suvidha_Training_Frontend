import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Employee } from '@/mocks/employees';
import { findEmployeeByEmail } from '@/mocks/employees';

interface AuthContextType {
  user: Employee | null;
  login: (email: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = 'stu_emp';

function getStoredUser(): Employee | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Employee | null>(getStoredUser);

  const login = useCallback((email: string): boolean => {
    const employee = findEmployeeByEmail(email);
    if (employee) {
      setUser(employee);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(employee));
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}