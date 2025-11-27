export interface User {
  _id: string;
  name: string;
  email: string;
  googleId?: string;
  isAdmin: boolean;
  createdAt?: string;
}

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  isAdmin: boolean;
}

export interface GoogleCredentialResponse {
  credential: string;
}

export interface AuthContextType {
  token: string | null;
  user: AuthUser | null;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  isAdmin: boolean;
  isAuthenticated: boolean;
}

export interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export interface ApiResponse<T = any> {
  message?: string;
  data?: T;
  error?: string;
}

export interface SendEmailRequest {
  message: string;
  emails?: string[];
  sendToAll?: boolean;
}