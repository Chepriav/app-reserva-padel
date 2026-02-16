export type ReservationStatus = 'confirmed' | 'cancelled' | 'completed';
export type ReservationPriority = 'guaranteed' | 'provisional';

export interface Reservation {
  id: string;
  courtId: string;
  courtName: string;
  userId: string;
  userName: string;
  apartment: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  status: ReservationStatus;
  priority: ReservationPriority;
  players: string[];
  conversionTimestamp: string | null;
  conversionRule: string | null;
  convertedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReservationData {
  courtId: string;
  userId: string;
  userName: string;
  apartment: string;
  date: string;
  startTime: string;
  endTime: string;
  players?: string[];
  forceDisplacement?: boolean;
}

export interface ReservationStatistics {
  totalReservations: number;
  confirmedReservations: number;
  cancelledReservations: number;
  todayReservations: number;
  weekReservations: number;
}

export interface ConversionInfo {
  id: string;
  priority: ReservationPriority;
  conversionTimestamp: string | null;
  conversionRule: string | null;
  convertedAt: string | null;
  timeRemaining: number | null;
}
