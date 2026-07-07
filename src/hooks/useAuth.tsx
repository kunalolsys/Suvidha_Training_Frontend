import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Employee } from '@/mocks/employees';
import { loginUser } from '@/services/auth.service';

interface AuthContextType {
  user: Employee | null;
  success: boolean;
  message: string;
  login: (userName: string, role: string) => Promise<any>;
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
type LoginResult = {
  success: boolean;
  message: string;
};
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Employee | null>(getStoredUser);

  const login = useCallback(
    async (userName: string, role: string): Promise<LoginResult> => {
      try {
        const { token, user, success, message } = await loginUser(userName, role);

        setUser(user);

        localStorage.setItem("token", token);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        
        return { success, message };
      } catch (error) {
        return {
          success: false,
          message: "Login failed",
        };;
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