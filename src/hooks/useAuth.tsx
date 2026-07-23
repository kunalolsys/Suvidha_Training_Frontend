import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { Employee } from '@/mocks/employees';
import { loginUser } from '@/services/auth.service';

interface AuthContextType {
  user: Employee | null;
  login: (userName: string, role: string) => Promise<LoginResult>;
  logout: () => void;
  isAuthenticated: boolean;
}

type LoginResult = {
  success: boolean;
  message: string;
};

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = 'stu_emp';

// Token aur User DONO hone par hi user restored hoga
function getStoredUser(): Employee | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const token = localStorage.getItem('token');

    if (stored && token) return JSON.parse(stored);
  } catch {
    // ignore
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Employee | null>(getStoredUser);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // 🔴 IMPORTANT: Axios Interceptor 401 Unauthorized Event Listener
  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener("unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener("unauthorized", handleUnauthorized);
    };
  }, [logout]);

  const login = useCallback(
    async (userName: string, role: string): Promise<LoginResult> => {
      try {
        const { token, user, success, message } = await loginUser(userName, role);

        setUser(user);
        localStorage.setItem("token", token);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));

        return { success, message };
      } catch (error: any) {
        return {
          success: false,
          message: error?.message || "Login failed",
        };
      }
    },
    []
  );

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