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
  password_confirmation: string;
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
  duration: number; // in minutes
  location: string;
  capacity: number;
  waitlist_capacity: number;
  status: 'draft' | 'published';
  
  // Counts
  confirmed_count: number;        // NEW: number of confirmed users
  waitlist_count: number;         // NEW: number of waitlisted users
  registered_count?: number;      // OLD: keep for backward compatibility
  
  // Available spots
  available_spots: number;        // spots available in main capacity
  available_waitlist_spots: number; // NEW: spots available in waitlist
  
  // Status flags
  is_full: boolean;               // main capacity is full
  is_waitlist_full: boolean;      // NEW: waitlist is full
  is_joined: boolean;             // user has joined (confirmed or waitlist)
  
  // User's specific registration status
  registration_status: 'confirmed' | 'waitlist' | null; // NEW: user's specific status
}


export interface ConflictingEvent {
  id: number;
  name: string;
  date_time: string;
  end_time: string;
}

export interface JoinEventResponse {
  message: string;
   registration_status: 'confirmed' | 'waitlist' | null;
  event: Event;
  conflicting_events?: ConflictingEvent[];
}