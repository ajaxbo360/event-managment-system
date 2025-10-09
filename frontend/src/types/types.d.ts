export interface User {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
}
export interface RegisterData {
  name: string;
  email: string;
  password: string;
  passwordConfirmation: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  register: (data: RegisterData) => Promise<AuthResponse>;
  login: (data: LoginData) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  isAuthenticated: () => boolean;
  isAdmin: () => boolean;
}
