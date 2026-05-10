import { publicClient, apiClient } from './client';
import type { Partner } from '../types';

export const getPartnersList = () =>
  publicClient.get<Partner[]>('/api/partners');

export const getPartnerById = (id: number) =>
  publicClient.get<Partner>(`/api/partners/${id}`);

export const createPartner = (data: { name: string; description: string; hyperlink: string }) =>
  apiClient.post<Partner>('/api/partners', data);

export const updatePartner = (id: number, data: { name: string; description: string; hyperlink: string }) =>
  apiClient.put<Partner>(`/api/partners/${id}`, data);

export const deletePartner = (id: number) =>
  apiClient.delete(`/api/partners/${id}`);

export const uploadPartnerLogo = (id: number, file: File) => {
  const fd = new FormData();
  fd.append('file', file);
  return apiClient.post<Partner>(`/api/partners/${id}/logo`, fd);
};
