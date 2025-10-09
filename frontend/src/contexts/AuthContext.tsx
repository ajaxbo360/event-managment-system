import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  type ReactNode,
} from "react";
import authService from "../services/auth.ts";
import type {
  AuthContextType,
  LoginData,
  RegisterData,
  User,
} from "@/types/types.js";

interface AuthProviderProps {
  children: ReactNode;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth on mount
  useEffect(() => {
    initAuth();
  }, []);

  const initAuth = async () => {
    try {
      authService.initializeAuth();

      if (authService.isAuthenticated()) {
        const storedUser = authService.getUser();
        setUser(storedUser);

        try {
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
          localStorage.setItem("user", JSON.stringify(currentUser));
        } catch (error) {
          // Token invalid, clear auth
          logout();
        }
      }
    } catch (error) {
      console.error("Auth initialization failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const register = async (registerData: RegisterData) => {
    const data = await authService.register(registerData);
    // setUser(data.user);
    return data;
  };

  const login = async (loginData: LoginData) => {
    const data = await authService.login(loginData);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const isAuthenticated = () => {
    return !!user;
  };

  const isAdmin = () => {
    return user?.role === "admin";
  };

  const value = {
    user,
    loading,
    register,
    login,
    logout,
    isAuthenticated,
    isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export default AuthContext;
