import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Employee } from '@/mocks/employees';
import { findEmployeeByEmail } from '@/mocks/employees';
import { loginUser } from '@/services/auth.service';

interface AuthContextType {
  user: Employee | null;
  login: (userName: string) => Promise<any>;
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

  const login = useCallback(
    async (userName: string): Promise<boolean> => {
      try {
        const { token, user } = await loginUser(userName);

        setUser(user);

        localStorage.setItem("token", token);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));

        return true;
      } catch (error) {
        console.error(error);
        return false;
      }
    },
    []
  );

  const logout = useCallback(() => {
    setUser(null);
    localStorage.clear();
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