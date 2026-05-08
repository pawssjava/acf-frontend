import { apiClient } from './client';
import type { User, UserTournamentsPage } from '../types';

export const getMe = () =>
  apiClient.get<User>('/api/users/me');

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

export const getUserTournaments = (id: number, page = 0, size = 10) =>
  apiClient.get<UserTournamentsPage>(`/api/users/${id}/tournaments`, { params: { page, size } });
