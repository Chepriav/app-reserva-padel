import { supabase } from '@infrastructure/supabase/client';
import { ok, fail } from '@shared/types/Result';
import type { Result } from '@shared/types/Result';
import type { Reservation, CreateReservationData } from '@domain/entities/Reservation';
import { InfrastructureError, RpcNotFoundError } from '@domain/errors/DomainErrors';
import { toDomain } from '../mappers/reservationMapper';

export class ReservationRpcHelper {
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
        p_nueva_duracion: duration,
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
