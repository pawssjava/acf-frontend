import { publicClient } from './client';
import type { User } from '../types';

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_expires_in: number;
  token_type: string;
}

export interface RegisterPayload {
  phone: string;
  code: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  birthDate: string;
}

export const sendSms = (phone: string) =>
  publicClient.post('/api/auth/send-sms', { phone });

export const register = (data: RegisterPayload) =>
  publicClient.post<User>('/api/auth/register', data);

export const forgotPasswordSendSms = (phone: string) =>
  publicClient.post('/api/auth/forgot-password/send-sms', { phone });

export const forgotPasswordReset = (phone: string, code: string, newPassword: string) =>
  publicClient.post('/api/auth/forgot-password/reset', { phone, code, newPassword });

export const loginUser = (username: string, password: string) =>
  publicClient.post<TokenResponse>('/api/auth/login', { username, password });

export const refreshToken = (token: string) =>
  publicClient.post<TokenResponse>('/api/auth/refresh', { refreshToken: token });

export const logoutUser = (token: string) =>
  publicClient.post('/api/auth/logout', { refreshToken: token });
