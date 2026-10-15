import { API_BASE_URL } from '@/lib/env'
import { apiClient } from './client';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
   mobile?: string; 
}

export interface AuthResponse {
  access_token: string;
  user: AuthUser;
}

export async function login(req: LoginRequest): Promise<AuthUser> {
  const res = await apiClient.post<AuthResponse>('/auth/login', req);
  window.localStorage.setItem('access_token', res.data.access_token);
  return res.data.user;
}

export async function register(req: RegisterRequest): Promise<AuthUser> {
  // Prefer using the configured API base, but fall back to the hostinger
  // register endpoint if necessary. The external service expects a
  // POST to /api/register.
  const externalUrl =
    `${API_BASE_URL}/api/register`;

  // Use full URL so this works even if NEXT_PUBLIC_API_BASE_URL isn't set.
  const res = await apiClient.post<any>(externalUrl, req);

  const data = res.data ?? {};
  if (data?.access_token) {
    window.localStorage.setItem('access_token', data.access_token);
  }

  // Try to return the server user object when available, otherwise return the raw data.
  return (data.user as AuthUser) ?? (data as AuthUser);
}

export async function logout(): Promise<void> {
  try {
    await apiClient.post('/auth/logout');
  } finally {
    window.localStorage.removeItem('access_token');
  }
}

