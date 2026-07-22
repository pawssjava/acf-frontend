import { publicClient, apiClient } from './client';
import type { DictionaryItem, City, Club, CityRecord, ClubRecord, DictPage } from '../types';

export const getTournamentTypes = () =>
  publicClient.get<DictPage<DictionaryItem>>('/api/dictionary/tournament-types', { params: { size: 1000 } });

export const getTournamentStatuses = () =>
  publicClient.get<DictPage<DictionaryItem>>('/api/dictionary/tournament-statuses', { params: { size: 1000 } });

export const getDisciplines = () =>
  publicClient.get<DictPage<DictionaryItem>>('/api/dictionary/disciplines', { params: { size: 1000 } });

export const getCities = () =>
  publicClient.get<DictPage<City>>('/api/dictionary/cities', { params: { size: 1000 } });

export const getClubs = () =>
  publicClient.get<DictPage<Club>>('/api/dictionary/clubs', { params: { size: 1000 } });

type MultilingualBody = { nameRu: string; nameKk: string; nameEn: string };

export const adminGetCities = (page = 0, size = 20) =>
  apiClient.get<DictPage<CityRecord>>('/api/dictionary/cities', { params: { page, size } });
export const adminCreateCity = (body: MultilingualBody) => apiClient.post<CityRecord>('/api/dictionary/cities', body);
export const adminUpdateCity = (id: number, body: MultilingualBody) => apiClient.put<CityRecord>(`/api/dictionary/cities/${id}`, body);
export const adminDeleteCity = (id: number) => apiClient.delete(`/api/dictionary/cities/${id}`);

export const adminGetClubs = (page = 0, size = 20) =>
  apiClient.get<DictPage<ClubRecord>>('/api/dictionary/clubs', { params: { page, size } });
export const adminCreateClub = (body: MultilingualBody) => apiClient.post<ClubRecord>('/api/dictionary/clubs', body);
export const adminUpdateClub = (id: number, body: MultilingualBody) => apiClient.put<ClubRecord>(`/api/dictionary/clubs/${id}`, body);
export const adminDeleteClub = (id: number) => apiClient.delete(`/api/dictionary/clubs/${id}`);

export const adminGetStatuses = (page = 0, size = 20) =>
  apiClient.get<DictPage<DictionaryItem>>('/api/dictionary/tournament-statuses', { params: { page, size } });
export const adminCreateStatus = (body: MultilingualBody) => apiClient.post<DictionaryItem>('/api/dictionary/tournament-statuses', body);
export const adminUpdateStatus = (id: number, body: MultilingualBody) => apiClient.put<DictionaryItem>(`/api/dictionary/tournament-statuses/${id}`, body);
export const adminDeleteStatus = (id: number) => apiClient.delete(`/api/dictionary/tournament-statuses/${id}`);

export const adminGetTypes = (page = 0, size = 20) =>
  apiClient.get<DictPage<DictionaryItem>>('/api/dictionary/tournament-types', { params: { page, size } });
export const adminCreateType = (body: MultilingualBody) => apiClient.post<DictionaryItem>('/api/dictionary/tournament-types', body);
export const adminUpdateType = (id: number, body: MultilingualBody) => apiClient.put<DictionaryItem>(`/api/dictionary/tournament-types/${id}`, body);
export const adminDeleteType = (id: number) => apiClient.delete(`/api/dictionary/tournament-types/${id}`);

export const adminGetDisciplines = (page = 0, size = 20) =>
  apiClient.get<DictPage<DictionaryItem>>('/api/dictionary/disciplines', { params: { page, size } });
export const adminCreateDiscipline = (body: MultilingualBody) => apiClient.post<DictionaryItem>('/api/dictionary/disciplines', body);
export const adminUpdateDiscipline = (id: number, body: MultilingualBody) => apiClient.put<DictionaryItem>(`/api/dictionary/disciplines/${id}`, body);
export const adminDeleteDiscipline = (id: number) => apiClient.delete(`/api/dictionary/disciplines/${id}`);
