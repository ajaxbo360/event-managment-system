import type { AuthResponse, LoginData, RegisterData } from '@/types/types.js';
import api from './api.ts';

/**
 * Auth API Service
 */
const authService = {
  
  
  /**
   * Register new user
   */
  
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/register', {
    name: data.name,
    email: data.email,
    password: data.password,
    password_confirmation: data.passwordConfirmation,
    });
    
    return response.data;
  },

  /**
   * Login user
   */
  async login(data:LoginData):Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/login', {
      email:data.email,
      password:data.password,
    });
    
    // Store token in localStorage
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Set token in axios default headers
      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
    }
    
    return response.data;
  },

  /**
   * Logout user
   */
  async logout() {
    try {
      await api.post('/logout');
    } finally {
      // Clear storage and headers even if request fails
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete api.defaults.headers.common['Authorization'];
    }
  },

  /**
   * Get current authenticated user
   */
  async getCurrentUser() {
    const response = await api.get('/me');
    return response.data;
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!localStorage.getItem('token');
  },

  /**
   * Get stored token
   */
  getToken() {
    return localStorage.getItem('token');
  },

  /**
   * Get stored user
   */
  getUser() {
    const token = this.getToken();
  if (!token) return null;
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
  },

  /**
   * Initialize auth (call on app start)
   */
  initializeAuth() {
    const token = this.getToken();
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  },
};

export default authService;