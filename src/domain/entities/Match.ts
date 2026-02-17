import type { SkillLevel } from './User';

export type MatchStatus = 'searching' | 'full' | 'cancelled';
export type MatchType = 'open' | 'with_reservation';
export type PlayerStatus = 'confirmed' | 'pending' | 'rejected';

export interface Player {
  id: string;
  matchId: string;
  userId: string | null;
  userName: string;
  userApartment: string | null;
  userPhoto: string | null;
  skillLevel: SkillLevel | null;
  isExternal: boolean;
  status: PlayerStatus;
  createdAt: string;
}

export interface Match {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorApartment: string;
  creatorPhoto: string | null;
  creatorLevel: SkillLevel | null;
  reservationId: string | null;
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  courtName: string | null;
  type: MatchType;
  message: string | null;
  preferredLevel: string | null;
  status: MatchStatus;
  isClass: boolean;
  levels: string[] | null;
  minParticipants: number;
  maxParticipants: number;
  studentPrice: number | null;
  groupPrice: number | null;
  players: Player[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateMatchData {
  creatorId: string;
  creatorName: string;
  creatorApartment: string;
  reservationId?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  courtName?: string;
  type?: MatchType;
  message?: string;
  preferredLevel?: string;
  isClass?: boolean;
  levels?: string[];
  minParticipants?: number;
  maxParticipants?: number;
  studentPrice?: number;
  groupPrice?: number;
  initialPlayers?: Omit<Player, 'id' | 'matchId' | 'createdAt'>[];
}

export interface UpdateMatchData {
  message?: string;
  preferredLevel?: string;
  reservationId?: string;
  type?: MatchType;
  date?: string;
  startTime?: string;
  endTime?: string;
  courtName?: string;
  levels?: string[];
  minParticipants?: number;
  maxParticipants?: number;
  studentPrice?: number;
  groupPrice?: number;
}

export interface AddPlayerData {
  userId?: string;
  userName: string;
  userApartment?: string;
  skillLevel?: SkillLevel;
  isExternal?: boolean;
}
