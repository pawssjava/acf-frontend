import { apiClient } from './client';
import type { User } from '../types';

export const getUsers = () =>
  apiClient.get<User[]>('/api/users');

export const getUserById = (id: number) =>
  apiClient.get<User>(`/api/users/${id}`);

export const updateUser = (id: number, data: { firstName: string; lastName: string; birthDate: string }) =>
  apiClient.put<User>(`/api/users/${id}`, data);

export const deleteUser = (id: number) =>
  apiClient.delete(`/api/users/${id}`);

export const uploadUserPhoto = (id: number, file: File) => {
  const fd = new FormData();
  fd.append('file', file);
  return apiClient.post<User>(`/api/users/${id}/photo`, fd);
};
