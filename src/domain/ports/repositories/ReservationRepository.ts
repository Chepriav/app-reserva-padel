import type { Result } from '@shared/types/Result';
import type { Reservation, CreateReservationData, ReservationStatistics, ConversionInfo } from '@domain/entities/Reservation';

export interface ReservationRepository {
  findById(id: string): Promise<Result<Reservation | null>>;
  findByApartment(apartment: string): Promise<Result<Reservation[]>>;
  findByUserId(userId: string): Promise<Result<Reservation[]>>;
  findByDateAndCourt(date: string, courtId: string): Promise<Result<Reservation[]>>;
  findByDate(date: string): Promise<Result<Reservation[]>>;
  findAll(): Promise<Result<Reservation[]>>;
  create(data: CreateReservationData): Promise<Result<Reservation>>;
  cancel(id: string): Promise<Result<void>>;
  updatePriority(id: string, priority: import('@domain/entities/Reservation').ReservationPriority): Promise<Result<Reservation>>;
  getStatistics(): Promise<Result<ReservationStatistics>>;
  getConversionInfo(reservationId: string): Promise<Result<ConversionInfo | null>>;
  createWithRpc(data: CreateReservationData): Promise<Result<Reservation>>;
  displaceThenCreate(displacedId: string, data: CreateReservationData): Promise<Result<Reservation>>;
  recalculateConversions(apartment: string): Promise<Result<void>>;
}
