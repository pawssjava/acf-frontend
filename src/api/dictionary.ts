import { apiClient } from './client';
import type { DictionaryItem } from '../types';

export const getTournamentTypes = () =>
  apiClient.get<DictionaryItem[]>('/api/dictionary/tournament-types');

export const getTournamentStatuses = () =>
  apiClient.get<DictionaryItem[]>('/api/dictionary/tournament-statuses');
