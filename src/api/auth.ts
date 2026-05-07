import { publicClient } from './client';
import type { User } from '../types';

export const sendSms = (phone: string) =>
  publicClient.post('/api/auth/send-sms', { phone });

export interface RegisterPayload {
  phone: string;
  code: string;
  username: string;
  firstName: string;
  lastName: string;
  birthDate: string;
}

export const register = (data: RegisterPayload) =>
  publicClient.post<User>('/api/auth/register', data);
