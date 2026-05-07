import { publicClient, apiClient } from './client';
import type { News } from '../types';

export const getNewsList = () =>
  publicClient.get<News[]>('/api/news');

export const getNewsById = (id: number) =>
  publicClient.get<News>(`/api/news/${id}`);

export const createNews = (data: { title: string; description: string }) =>
  apiClient.post<News>('/api/news', data);

export const updateNews = (id: number, data: { title: string; description: string }) =>
  apiClient.put<News>(`/api/news/${id}`, data);

export const deleteNews = (id: number) =>
  apiClient.delete(`/api/news/${id}`);

export const uploadNewsImage = (id: number, file: File) => {
  const fd = new FormData();
  fd.append('file', file);
  return apiClient.post<News>(`/api/news/${id}/image`, fd);
};
