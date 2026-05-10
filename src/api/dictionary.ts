import { publicClient } from './client';
import type { DictionaryItem, City, Club } from '../types';

export const getTournamentTypes = () =>
  publicClient.get<DictionaryItem[]>('/api/dictionary/tournament-types');

export const getTournamentStatuses = () =>
  publicClient.get<DictionaryItem[]>('/api/dictionary/tournament-statuses');

export const getCities = () =>
  publicClient.get<City[]>('/api/dictionary/cities');

export const getClubs = () =>
  publicClient.get<Club[]>('/api/dictionary/clubs');
