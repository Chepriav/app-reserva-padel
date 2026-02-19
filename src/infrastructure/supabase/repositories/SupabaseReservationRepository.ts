import { supabase } from '@infrastructure/supabase/client';
import { ok, fail } from '@shared/types/Result';
import type { Result } from '@shared/types/Result';
import type { ReservationRepository } from '@domain/ports/repositories/ReservationRepository';
import type {
  Reservation,
  CreateReservationData,
  ReservationStatistics,
  ConversionInfo,
  ReservationPriority,
} from '@domain/entities/Reservation';
import {
  InfrastructureError,
  ReservationNotFoundError,
  RpcNotFoundError,
} from '@domain/errors/DomainErrors';
import { toDomain, toDbInsert, toConversionInfoDomain, priorityToDb } from '../mappers/reservationMapper';
import { ReservationRpcHelper } from './ReservationRpcHelper';

export class SupabaseReservationRepository implements ReservationRepository {
  private readonly rpcHelper = new ReservationRpcHelper();
  async findById(id: string): Promise<Result<Reservation | null>> {
    try {
      const { data, error } = await supabase
        .from('reservas')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) return fail(new InfrastructureError('Error fetching reservation', error));
      return ok(data ? toDomain(data) : null);
    } catch (err) {
      return fail(new InfrastructureError('Unexpected error fetching reservation', err));
    }
  }

  async findByApartment(apartment: string): Promise<Result<Reservation[]>> {
    try {
      const { data, error } = await supabase
        .from('reservas')
        .select('*')
        .eq('vivienda', apartment)
        .order('fecha', { ascending: false })
        .order('hora_inicio', { ascending: false });

      if (error) {
        if (error.code === '42703' || error.message?.includes('vivienda')) {
          return ok([]);
        }
        return fail(new InfrastructureError('Error fetching apartment reservations', error));
      }

      return ok((data ?? []).map(toDomain));
    } catch (err) {
      return ok([]);
    }
  }

  async findByUserId(userId: string): Promise<Result<Reservation[]>> {
    try {
      const { data, error } = await supabase
        .from('reservas')
        .select('*')
        .eq('usuario_id', userId)
        .order('fecha', { ascending: false })
        .order('hora_inicio', { ascending: false });

      if (error) return fail(new InfrastructureError('Error fetching user reservations', error));
      return ok((data ?? []).map(toDomain));
    } catch (err) {
      return fail(new InfrastructureError('Unexpected error fetching user reservations', err));
    }
  }

  async findByDateAndCourt(date: string, courtId: string): Promise<Result<Reservation[]>> {
    try {
      const { data, error } = await supabase
        .from('reservas')
        .select('*')
        .eq('pista_id', courtId)
        .eq('fecha', date)
        .eq('estado', 'confirmada');

      if (error) return fail(new InfrastructureError('Error fetching reservations by date/court', error));
      return ok((data ?? []).map(toDomain));
    } catch (err) {
      return fail(new InfrastructureError('Unexpected error', err));
    }
  }

  async findByDate(date: string): Promise<Result<Reservation[]>> {
    try {
      const { data, error } = await supabase
        .from('reservas')
        .select('*')
        .eq('fecha', date)
        .eq('estado', 'confirmada');

      if (error) return fail(new InfrastructureError('Error fetching reservations by date', error));
      return ok((data ?? []).map(toDomain));
    } catch (err) {
      return fail(new InfrastructureError('Unexpected error', err));
    }
  }

  async findAll(): Promise<Result<Reservation[]>> {
    try {
      const { data, error } = await supabase
        .from('reservas')
        .select('*')
        .order('fecha', { ascending: false })
        .order('hora_inicio', { ascending: false });

      if (error) return fail(new InfrastructureError('Error fetching all reservations', error));
      return ok((data ?? []).map(toDomain));
    } catch (err) {
      return fail(new InfrastructureError('Unexpected error', err));
    }
  }

  async create(data: CreateReservationData): Promise<Result<Reservation>> {
    // This path is only used in the manual fallback (when RPC is unavailable).
    // The caller is responsible for determining priority before calling create().
    return this._insertWithPriority(data, 'guaranteed');
  }

  private async _insertWithPriority(
    data: CreateReservationData,
    priority: ReservationPriority,
  ): Promise<Result<Reservation>> {
    try {
      // Fetch court name
      const { data: court } = await supabase
        .from('pistas')
        .select('nombre')
        .eq('id', data.courtId)
        .single();

      const courtName = (court as { nombre?: string })?.nombre ?? 'Pista';
      const insertRow = toDbInsert(data, courtName, priority);

      const { data: row, error } = await supabase
        .from('reservas')
        .insert(insertRow)
        .select()
        .single();

      if (error) {
        // Retry without priority column if schema mismatch
        if (error.message?.includes('prioridad') || error.code === '42703') {
          const { prioridad: _p, ...rowWithoutPriority } = insertRow as Record<string, unknown>;
          const retry = await supabase
            .from('reservas')
            .insert(rowWithoutPriority)
            .select()
            .single();
          if (retry.error) {
            return fail(new InfrastructureError('Error creating reservation', retry.error));
          }
          return ok(toDomain(retry.data as Record<string, unknown>));
        }
        return fail(new InfrastructureError('Error creating reservation', error));
      }

      return ok(toDomain(row as Record<string, unknown>));
    } catch (err) {
      return fail(new InfrastructureError('Unexpected error creating reservation', err));
    }
  }

  async cancel(id: string): Promise<Result<void>> {
    try {
      const { error } = await supabase
        .from('reservas')
        .update({ estado: 'cancelada', updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) return fail(new InfrastructureError('Error cancelling reservation', error));

      return ok(undefined);
    } catch (err) {
      return fail(new InfrastructureError('Unexpected error cancelling reservation', err));
    }
  }

  async updatePriority(id: string, priority: ReservationPriority): Promise<Result<Reservation>> {
    try {
      const { data, error } = await supabase
        .from('reservas')
        .update({ prioridad: priorityToDb(priority) })
        .eq('id', id)
        .select()
        .single();

      if (error) return fail(new InfrastructureError('Error updating priority', error));
      return ok(toDomain(data as Record<string, unknown>));
    } catch (err) {
      return fail(new InfrastructureError('Unexpected error updating priority', err));
    }
  }

  async getStatistics(): Promise<Result<ReservationStatistics>> {
    try {
      const { data, error } = await supabase.from('reservas').select('*');
      if (error) return fail(new InfrastructureError('Error fetching statistics', error));

      const all = (data ?? []).map(toDomain);
      const today = new Date().toISOString().split('T')[0];

      return ok({
        totalReservations: all.length,
        confirmedReservations: all.filter((r) => r.status === 'confirmed').length,
        cancelledReservations: all.filter((r) => r.status === 'cancelled').length,
        todayReservations: all.filter((r) => r.date === today).length,
        weekReservations: all.filter((r) => {
          const diff = Math.floor(
            (new Date(r.date).getTime() - new Date(today).getTime()) / 86400000,
          );
          return diff >= 0 && diff <= 7;
        }).length,
      });
    } catch (err) {
      return fail(new InfrastructureError('Unexpected error fetching statistics', err));
    }
  }

  async getConversionInfo(reservationId: string): Promise<Result<ConversionInfo | null>> {
    try {
      const { data, error } = await supabase
        .from('reservas')
        .select('id, prioridad, conversion_timestamp, conversion_rule, converted_at')
        .eq('id', reservationId)
        .maybeSingle();

      if (error) return fail(new InfrastructureError('Error fetching conversion info', error));
      return ok(data ? toConversionInfoDomain(data as Record<string, unknown>) : null);
    } catch (err) {
      return fail(new InfrastructureError('Unexpected error', err));
    }
  }

  async createWithRpc(data: CreateReservationData): Promise<Result<Reservation>> {
    return this.rpcHelper.createWithRpc(data);
  }

  async displaceThenCreate(
    displacedId: string,
    data: CreateReservationData,
  ): Promise<Result<Reservation>> {
    return this.rpcHelper.displaceThenCreate(displacedId, data);
  }

  async recalculateConversions(apartment: string): Promise<Result<void>> {
    return this.rpcHelper.recalculateConversions(apartment);
  }
}
