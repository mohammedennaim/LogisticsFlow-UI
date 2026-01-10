// Modèles d'authentification correspondant à l'API LogisticsFlow

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  contact: string;
  role?: string;
  active?: boolean;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

export interface TokenRefreshRequest {
  refreshToken: string;
}

export interface TokenRefreshResponse {
  accessToken: string;
  refreshToken: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  contact: string;
  role: UserRole;
  active: boolean;
}

export enum UserRole {
  ADMIN = 'ADMIN',
  CLIENT = 'CLIENT',
  WAREHOUSE_MANAGER = 'WAREHOUSE_MANAGER'
}

export interface ApiError {
  error: string;
  message: string;
  timestamp?: number;
}
