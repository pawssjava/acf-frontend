import { apiClient } from './client';
import type { SmsLogPage } from '../types';

export interface SmsLogParams {
  phone?: string;
  used?: boolean;
  page?: number;
  size?: number;
}

export function fetchSmsLog(params: SmsLogParams) {
  return apiClient.get<SmsLogPage>('/api/admin/sms-log', { params });
}
