import { publicClient } from './client';
import type { DictionaryItem } from '../types';

export const getTournamentTypes = () =>
  publicClient.get<DictionaryItem[]>('/api/dictionary/tournament-types');

export const getTournamentStatuses = () =>
  publicClient.get<DictionaryItem[]>('/api/dictionary/tournament-statuses');
