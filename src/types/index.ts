export interface User {
  id: number;
  username: string;
  phoneNumber: number;
  firstName: string;
  lastName: string;
  birthDate: string;
  isAdmin: boolean;
  photo: string | null;
  createdDate: string;
  updatedDate: string;
}

export interface News {
  id: number;
  title: string;
  description: string;
  image: string | null;
  createdDate: string;
  updatedDate: string;
}

export interface Tournament {
  id: number;
  name: string;
  logo: string | null;
  startDate: string;
  capacity: number;
  prizeMoney: number;
  tournamentStatusId: number;
  tournamentStatusName: string;
  tournamentTypeId: number;
  tournamentTypeName: string;
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

export interface DictionaryItem {
  id: number;
  name: string;
  isActive: boolean;
  createdDate: string;
  updatedDate: string;
}

export interface ApiError {
  status: number;
  error: string;
  message: string;
  path: string;
}
