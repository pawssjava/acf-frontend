import { publicClient, apiClient } from './client';
import type { DictionaryItem, City, Club, CityRecord, ClubRecord } from '../types';

export const getTournamentTypes = () =>
  publicClient.get<DictionaryItem[]>('/api/dictionary/tournament-types');

export const getTournamentStatuses = () =>
  publicClient.get<DictionaryItem[]>('/api/dictionary/tournament-statuses');

export const getCities = () =>
  publicClient.get<City[]>('/api/dictionary/cities');

export const getClubs = () =>
  publicClient.get<Club[]>('/api/dictionary/clubs');

type MultilingualBody = { nameRu: string; nameKk: string; nameEn: string };

export const adminGetCities = () => apiClient.get<CityRecord[]>('/api/dictionary/cities');
export const adminCreateCity = (body: MultilingualBody) => apiClient.post<CityRecord>('/api/dictionary/cities', body);
export const adminUpdateCity = (id: number, body: MultilingualBody) => apiClient.put<CityRecord>(`/api/dictionary/cities/${id}`, body);
export const adminDeleteCity = (id: number) => apiClient.delete(`/api/dictionary/cities/${id}`);

export const adminGetClubs = () => apiClient.get<ClubRecord[]>('/api/dictionary/clubs');
export const adminCreateClub = (body: MultilingualBody) => apiClient.post<ClubRecord>('/api/dictionary/clubs', body);
export const adminUpdateClub = (id: number, body: MultilingualBody) => apiClient.put<ClubRecord>(`/api/dictionary/clubs/${id}`, body);
export const adminDeleteClub = (id: number) => apiClient.delete(`/api/dictionary/clubs/${id}`);

export const adminGetStatuses = () => apiClient.get<DictionaryItem[]>('/api/dictionary/tournament-statuses');
export const adminCreateStatus = (body: MultilingualBody) => apiClient.post<DictionaryItem>('/api/dictionary/tournament-statuses', body);
export const adminUpdateStatus = (id: number, body: MultilingualBody) => apiClient.put<DictionaryItem>(`/api/dictionary/tournament-statuses/${id}`, body);
export const adminDeleteStatus = (id: number) => apiClient.delete(`/api/dictionary/tournament-statuses/${id}`);

export const adminGetTypes = () => apiClient.get<DictionaryItem[]>('/api/dictionary/tournament-types');
export const adminCreateType = (body: MultilingualBody) => apiClient.post<DictionaryItem>('/api/dictionary/tournament-types', body);
export const adminUpdateType = (id: number, body: MultilingualBody) => apiClient.put<DictionaryItem>(`/api/dictionary/tournament-types/${id}`, body);
export const adminDeleteType = (id: number) => apiClient.delete(`/api/dictionary/tournament-types/${id}`);
