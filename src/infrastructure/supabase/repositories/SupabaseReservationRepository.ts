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

export class SupabaseReservationRepository implements ReservationRepository {
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
      const { data: updated, error } = await supabase
        .from('reservas')
        .update({ estado: 'cancelada', updated_at: new Date().toISOString() })
        .eq('id', id)
        .select();

      if (error) return fail(new InfrastructureError('Error cancelling reservation', error));
      if (!updated || updated.length === 0) {
        return fail(new ReservationNotFoundError());
      }

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
    try {
      const [startH, startM] = data.startTime.split(':').map(Number);
      const [endH, endM] = data.endTime.split(':').map(Number);
      const duration = (endH * 60 + endM) - (startH * 60 + startM);

      const { data: rpcResult, error } = await supabase.rpc('criar_reserva_con_prioridad', {
        p_pista_id: data.courtId,
        p_usuario_id: data.userId,
        p_usuario_nombre: data.userName,
        p_vivienda: data.apartment,
        p_fecha: data.date,
        p_hora_inicio: data.startTime,
        p_hora_fin: data.endTime,
        p_duracion: duration,
        p_jugadores: data.players ?? [],
      });

      if (error) {
        if (error.code === 'PGRST202' || error.message?.includes('function')) {
          return fail(new RpcNotFoundError());
        }
        return fail(new InfrastructureError(error.message ?? 'RPC error', error));
      }

      const rpc = rpcResult as { success: boolean; error?: string; reserva_id?: string };
      if (!rpc.success) {
        return fail(new InfrastructureError(rpc.error ?? 'RPC returned failure'));
      }

      const { data: row } = await supabase
        .from('reservas')
        .select('*')
        .eq('id', rpc.reserva_id)
        .single();

      return ok(toDomain(row as Record<string, unknown>));
    } catch (err) {
      return fail(new InfrastructureError('Unexpected error in createWithRpc', err));
    }
  }

  async displaceThenCreate(
    displacedId: string,
    data: CreateReservationData,
  ): Promise<Result<Reservation>> {
    try {
      const [startH, startM] = data.startTime.split(':').map(Number);
      const [endH, endM] = data.endTime.split(':').map(Number);
      const duration = (endH * 60 + endM) - (startH * 60 + startM);

      const { data: rpcResult, error } = await supabase.rpc('desplazar_reserva_y_crear_nueva', {
        p_reserva_a_desplazar_id: displacedId,
        p_nueva_pista_id: data.courtId,
        p_nuevo_usuario_id: data.userId,
        p_nuevo_usuario_nombre: data.userName,
        p_nueva_vivienda: data.apartment,
        p_nueva_fecha: data.date,
        p_nueva_hora_inicio: data.startTime,
        p_nueva_hora_fin: data.endTime,
        p_nueva_duracion: duration,
        p_nuevos_jugadores: data.players ?? [],
      });

      if (error) {
        if (error.code === 'PGRST202' || error.message?.includes('function')) {
          return fail(new RpcNotFoundError());
        }
        return fail(new InfrastructureError(error.message ?? 'RPC error', error));
      }

      const rpc = rpcResult as { success: boolean; error?: string; nueva_reserva_id?: string };
      if (!rpc.success) {
        return fail(new InfrastructureError(rpc.error ?? 'RPC returned failure'));
      }

      const { data: row } = await supabase
        .from('reservas')
        .select('*')
        .eq('id', rpc.nueva_reserva_id)
        .single();

      return ok(toDomain(row as Record<string, unknown>));
    } catch (err) {
      return fail(new InfrastructureError('Unexpected error in displaceThenCreate', err));
    }
  }

  async recalculateConversions(apartment: string): Promise<Result<void>> {
    try {
      const { error } = await supabase.rpc('recalculate_vivienda_conversions', {
        p_vivienda: apartment,
      });

      if (error) {
        // RPC not available — silently succeed
        if (error.code === 'PGRST202' || error.message?.includes('function')) {
          return ok(undefined);
        }
        return fail(new InfrastructureError('Error recalculating conversions', error));
      }

      return ok(undefined);
    } catch (err) {
      return ok(undefined); // Non-critical
    }
  }
}
