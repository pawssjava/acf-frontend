import { publicClient, apiClient, BASE_URL } from './client';
import type { EducationMaterialDto, EducationPage } from '../types';

export const getEducationList = (params: { page: number; size: number; category?: string }) =>
  publicClient.get<EducationPage>('/api/education', { params });

export const getEducationById = (id: number) =>
  publicClient.get<EducationMaterialDto>(`/api/education/${id}`);

interface EducationPayload {
  title: string;
  description: string;
  category: string | null;
  ordering: number;
}

export const createEducation = (data: EducationPayload) =>
  apiClient.post<EducationMaterialDto>('/api/education', data);

export const updateEducation = (id: number, data: EducationPayload) =>
  apiClient.put<EducationMaterialDto>(`/api/education/${id}`, data);

export const deleteEducation = (id: number) =>
  apiClient.delete(`/api/education/${id}`);

export const uploadEducationThumbnail = (id: number, file: File) => {
  const fd = new FormData();
  fd.append('file', file);
  return apiClient.post<EducationMaterialDto>(`/api/education/${id}/thumbnail`, fd);
};

export const uploadEducationPresentation = (id: number, file: File) => {
  const fd = new FormData();
  fd.append('file', file);
  return apiClient.post<EducationMaterialDto>(`/api/education/${id}/presentation`, fd);
};

export const uploadEducationVideo = (
  id: number,
  file: File,
  token: string,
  onProgress: (pct: number) => void,
): Promise<EducationMaterialDto> =>
  new Promise<EducationMaterialDto>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = e => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () =>
      xhr.status === 200
        ? resolve(JSON.parse(xhr.responseText) as EducationMaterialDto)
        : reject(new Error(xhr.responseText));
    xhr.onerror = () => reject(new Error('Upload failed'));
    xhr.open('POST', `${BASE_URL}/api/education/${id}/video`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    const fd = new FormData();
    fd.append('file', file);
    xhr.send(fd);
  });
