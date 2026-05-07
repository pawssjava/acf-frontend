import { apiClient } from './client';
import type { User } from '../types';

export const getUsers = () =>
  apiClient.get<User[]>('/api/users');

export const getUserById = (id: number) =>
  apiClient.get<User>(`/api/users/${id}`);

export const updateUser = (id: number, data: { firstName: string; lastName: string; birthDate: string; photo?: string }) =>
  apiClient.put<User>(`/api/users/${id}`, data);

export const deleteUser = (id: number) =>
  apiClient.delete(`/api/users/${id}`);
