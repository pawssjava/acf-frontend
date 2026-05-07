import { apiClient } from './client';
import type { Tournament, Participant, TournamentResult } from '../types';

export const getTournaments = () =>
  apiClient.get<Tournament[]>('/api/tournaments');

export const getTournamentById = (id: number) =>
  apiClient.get<Tournament>(`/api/tournaments/${id}`);

export interface TournamentPayload {
  name: string;
  startDate: string;
  capacity: number;
  prizeMoney: number;
  tournamentStatusId: number;
  tournamentTypeId: number;
}

export const createTournament = (data: TournamentPayload) =>
  apiClient.post<Tournament>('/api/tournaments', data);

export const updateTournament = (id: number, data: TournamentPayload) =>
  apiClient.put<Tournament>(`/api/tournaments/${id}`, data);

export const deleteTournament = (id: number) =>
  apiClient.delete(`/api/tournaments/${id}`);

export const uploadTournamentLogo = (id: number, file: File) => {
  const fd = new FormData();
  fd.append('file', file);
  return apiClient.post<Tournament>(`/api/tournaments/${id}/logo`, fd);
};

// Participants
export const getParticipants = (tournamentId: number) =>
  apiClient.get<Participant[]>(`/api/tournaments/${tournamentId}/participants`);

export const registerParticipant = (tournamentId: number, userId: number) =>
  apiClient.post<Participant>(`/api/tournaments/${tournamentId}/participants`, { userId });

export const unregisterParticipant = (tournamentId: number, userId: number) =>
  apiClient.delete(`/api/tournaments/${tournamentId}/participants/${userId}`);

// Results
export const getResults = (tournamentId: number) =>
  apiClient.get<TournamentResult[]>(`/api/tournaments/${tournamentId}/results`);

export const addResult = (tournamentId: number, data: { userId: number; place: number; score: number }) =>
  apiClient.post<TournamentResult>(`/api/tournaments/${tournamentId}/results`, data);

export const updateResult = (tournamentId: number, userId: number, data: { userId: number; place: number; score: number }) =>
  apiClient.put<TournamentResult>(`/api/tournaments/${tournamentId}/results/${userId}`, data);

export const deleteResult = (tournamentId: number, userId: number) =>
  apiClient.delete(`/api/tournaments/${tournamentId}/results/${userId}`);
