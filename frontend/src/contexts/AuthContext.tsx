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

  // Check token expiration
  useEffect(() => {
    const interval = setInterval(() => {
      checkTokenExpiration();
    }, 10 * 1000); // 10 seconds

    return () => clearInterval(interval);
  }, []);

  const checkTokenExpiration = () => {
    const tokenTimestamp = localStorage.getItem("token_timestamp");
    if (tokenTimestamp) {
      const tokenAge = Date.now() - parseInt(tokenTimestamp);
      const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

      if (tokenAge > TWENTY_FOUR_HOURS) {
        console.warn("Token expired, logging out...");
        logout();
      }
    }
  };
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
    // token timestamp
    localStorage.setItem("token_timestamp", Date.now().toString());

    return data;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    localStorage.removeItem("token_timestamp");
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
