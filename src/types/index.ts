export interface User {
  id: number;
  username: string;
  phoneNumber: number;
  firstName: string | null;
  lastName: string | null;
  birthDate: string | null;
  isAdmin: boolean;
  isVerified: boolean;
  photo: string | null;
  cityId: number | null;
  cityNameRu: string | null;
  cityNameKk: string | null;
  cityNameEn: string | null;
  clubId: number | null;
  clubNameRu: string | null;
  createdDate: string;
  updatedDate: string;
}

export interface City {
  id: number;
  nameRu: string;
  nameKk: string;
  nameEn: string;
}

export interface Club {
  id: number;
  nameRu: string;
  nameKk: string;
  nameEn: string;
}

export interface CityRecord {
  id: number;
  nameRu: string;
  nameKk: string;
  nameEn: string;
  isActive: boolean;
  createdDate: string;
  updatedDate: string;
}

export interface ClubRecord {
  id: number;
  nameRu: string;
  nameKk: string;
  nameEn: string;
  isActive: boolean;
  createdDate: string;
  updatedDate: string;
}

export interface MatchEntry {
  matchId: number;
  tournamentId: number;
  tournamentName: string;
  opponentId: number | null;
  opponentUsername: string | null;
  opponentPhoto: string | null;
  myScore: number;
  opponentScore: number;
  result: 'WIN' | 'LOSS' | 'DRAW';
  status: string;
  updatedDate: string;
}

export interface MatchesPage {
  content: MatchEntry[];
  page: number;
  size: number;
  total: number;
  totalPages: number;
}

export interface News {
  id: number;
  title: string;
  description: string;
  image: string | null;
  createdDate: string;
  updatedDate: string;
}

export type TournamentFormat = 'SINGLE_ELIMINATION' | 'SWISS' | 'EKPL';
export type TournamentPhase = 'PLAYOFF' | 'SWISS' | 'REGULAR_SEASON' | 'COMPLETED';
export type MatchStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'BYE';

export interface Tournament {
  id: number;
  name: string;
  logo: string | null;
  startDate: string;
  endDate: string;
  format: TournamentFormat;
  phase: TournamentPhase | null;
  totalRounds: number | null;
  capacity: number;
  prizeMoney: number;
  tournamentStatusId: number;
  tournamentStatusNameRu: string;
  tournamentStatusNameKk: string;
  tournamentStatusNameEn: string;
  tournamentTypeId: number;
  tournamentTypeNameRu: string;
  tournamentTypeNameKk: string;
  tournamentTypeNameEn: string;
  createdDate: string;
  updatedDate: string;
}

export interface Participant {
  id: number;
  tournamentId: number;
  userId: number;
  username: string;
  firstName: string;
  lastName: string;
  registeredDate: string;
  psn: string;
}

export interface TournamentResult {
  id: number;
  tournamentId: number;
  userId: number;
  username: string;
  firstName: string;
  lastName: string;
  place: number;
  score: number;
  createdDate: string;
}

export interface TournamentMatch {
  id: number;
  phase: string;
  roundNumber: number;
  matchNumber: number;
  groupName: string | null;
  participant1Id: number | null;
  participant1Username: string | null;
  participant1FirstName: string | null;
  participant1LastName: string | null;
  participant2Id: number | null;
  participant2Username: string | null;
  participant2FirstName: string | null;
  participant2LastName: string | null;
  score1: number | null;
  score2: number | null;
  winnerId: number | null;
  status: MatchStatus;
  nextMatchId: number | null;
}

export interface GroupStanding {
  userId: number;
  groupName: string | null;
  username: string;
  firstName: string;
  lastName: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  scoreDiff: number;
  swissPoints: number;
  buchholz: number;
}

export interface GroupDto {
  groupName: string;
  matches: TournamentMatch[];
  standings: GroupStanding[];
}

export interface PlayoffRoundDto {
  roundNumber: number;
  roundName: string;
  matches: TournamentMatch[];
}

export interface BracketDto {
  format: TournamentFormat;
  phase: TournamentPhase | null;
  groups: GroupDto[];
  playoffRounds: PlayoffRoundDto[];
}

export interface Partner {
  id: number;
  name: string;
  logo: string | null;
  description: string;
  hyperlink: string;
  createdDate: string;
  updatedDate: string;
}

export interface DictionaryItem {
  id: number;
  nameRu: string;
  nameKk: string;
  nameEn: string;
  isActive: boolean;
  createdDate: string;
  updatedDate: string;
}

export interface DictPage<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface ApiError {
  status: number;
  error: string;
  message: string;
  path: string;
}

export interface RegistrationLogEntry {
  id: number;
  tournamentId: number;
  userId: number;
  username: string;
  firstName: string;
  lastName: string;
  action: 'REGISTER' | 'UNREGISTER';
  psn: string;
  createdDate: string;
}

export interface RegistrationLogPage {
  content: RegistrationLogEntry[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface UserTournamentEntry {
  tournamentId: number;
  tournamentName: string;
  logo: string | null;
  startDate: string;
  endDate: string;
  tournamentStatusId: number;
  tournamentStatusNameRu: string;
  tournamentStatusNameKk: string;
  tournamentStatusNameEn: string;
  tournamentTypeId: number;
  tournamentTypeNameRu: string;
  tournamentTypeNameKk: string;
  tournamentTypeNameEn: string;
  format: string;
  place: number | null;
  score: number | null;
}

export interface UserTournamentsPage {
  content: UserTournamentEntry[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface EducationMaterialDto {
  id: number;
  title: string;
  description: string;
  category: string | null;
  thumbnailUrl: string | null;
  presentationUrl: string | null;
  videoUrl: string | null;
  ordering: number;
  createdDate: string;
  updatedDate: string;
}

export interface EducationPage {
  content: EducationMaterialDto[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export type SmsAction = 'REGISTRATION' | 'FORGOT_PASSWORD';

export interface SmsLogEntry {
  id: number;
  phoneNumber: string;
  code: string;
  action: SmsAction;
  sentAt: string;
  expiresAt: string;
  verifiedAt: string | null;
  used: boolean;
}

export interface SmsLogPage {
  content: SmsLogEntry[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
