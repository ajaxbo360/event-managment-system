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

export interface Event {
  id: number;
  name: string;
  description: string;
  date_time: string;
  duration: number; // minutes
  location: string;
  capacity: number;
  waitlist_capacity: number;
  status: 'published' | 'draft';
  confirmed_count: number;
  waitlist_count: number;
  available_spots: number;
  available_waitlist_spots: number;
  is_full: boolean;
  is_waitlist_full: boolean;
  is_joined: boolean
  registered_at?: string;
}

export interface ConflictingEvent {
  id: number;
  name: string;
  date_time: string;
  end_time: string;
}

export interface JoinEventResponse {
  message: string;
  is_joined: boolean
  event: Event;
  conflicting_events?: ConflictingEvent[];
}