import { apiClient } from './client';
import type { User, UserTournamentsPage, MatchesPage } from '../types';

export const getMe = () =>
  apiClient.get<User>('/api/users/me');

export const getUsers = () =>
  apiClient.get<User[]>('/api/users');

export const getUserById = (id: number) =>
  apiClient.get<User>(`/api/users/${id}`);

export const updateUser = (id: number, data: {
  firstName: string;
  lastName: string;
  birthDate: string;
  cityId?: number | null;
  clubId?: number | null;
}) =>
  apiClient.put<User>(`/api/users/${id}`, data);

export const deleteUser = (id: number) =>
  apiClient.delete(`/api/users/${id}`);

export const uploadUserPhoto = (id: number, file: File) => {
  const fd = new FormData();
  fd.append('file', file);
  return apiClient.post<User>(`/api/users/${id}/photo`, fd);
};

export const verifyUser = (id: number, file: File) => {
  const fd = new FormData();
  fd.append('file', file);
  return apiClient.post<User>(`/api/users/${id}/verify`, fd);
};

export const changePassword = (id: number, data: { currentPassword: string; newPassword: string }) =>
  apiClient.post(`/api/users/${id}/change-password`, data);

export const getUserTournaments = (id: number, page = 0, size = 10) =>
  apiClient.get<UserTournamentsPage>(`/api/users/${id}/tournaments`, { params: { page, size } });

export const getUserMatches = (id: number, page = 0, size = 10) =>
  apiClient.get<MatchesPage>(`/api/users/${id}/matches`, { params: { page, size } });
