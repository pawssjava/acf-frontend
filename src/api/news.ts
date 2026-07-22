import { publicClient, apiClient } from './client';
import type { News } from '../types';

export const getNewsList = (archived?: boolean) => {
  const params: Record<string, boolean> = {};
  if (archived) params.archived = true;
  const client = archived ? apiClient : publicClient;
  return client.get<News[]>('/api/news', { params });
};

export const getNewsById = (id: number) =>
  publicClient.get<News>(`/api/news/${id}`);

export const createNews = (data: { title: string; description: string }) =>
  apiClient.post<News>('/api/news', data);

export const updateNews = (id: number, data: { title: string; description: string }) =>
  apiClient.put<News>(`/api/news/${id}`, data);

export const deleteNews = (id: number) =>
  apiClient.delete(`/api/news/${id}`);

export const archiveNews = (id: number) =>
  apiClient.patch<News>(`/api/news/${id}/archive`);

export const restoreNews = (id: number) =>
  apiClient.patch<News>(`/api/news/${id}/restore`);

export const uploadNewsImage = (id: number, file: File) => {
  const fd = new FormData();
  fd.append('file', file);
  return apiClient.post<News>(`/api/news/${id}/image`, fd);
};
