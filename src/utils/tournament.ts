import type { Tournament } from '../types';

export const TOURNAMENT_STATUS = { ACTIVE: 1, UPCOMING: 2, FINISHED: 3 } as const;

export const isEditable = (tournament: Pick<Tournament, 'tournamentStatusId'>): boolean =>
  tournament.tournamentStatusId === TOURNAMENT_STATUS.UPCOMING;
