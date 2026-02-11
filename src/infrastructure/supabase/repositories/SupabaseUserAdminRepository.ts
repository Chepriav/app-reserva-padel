import type { UserAdminRepository } from '@domain/ports/repositories/UserAdminRepository';
import type { User, ApprovalStatus } from '@domain/entities/User';
import { InfrastructureError } from '@domain/errors/DomainErrors';
import type { Result } from '@shared/types/Result';
import { ok, fail } from '@shared/types/Result';
import { supabase } from '../client';
import { toDomain, approvalStatusToDb } from '../mappers/userMapper';
import { cleanupUserRelations } from '../helpers/userCleanupHelper';

export class SupabaseUserAdminRepository implements UserAdminRepository {
  async findPendingUsers(): Promise<Result<User[]>> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('estado_aprobacion', 'pendiente')
        .order('created_at', { ascending: false });

      if (error) {
        return fail(new InfrastructureError('Error fetching pending users', error));
      }

      return ok((data || []).map(toDomain));
    } catch (err) {
      return fail(new InfrastructureError('Error fetching pending users', err));
    }
  }

  async findApprovedUsers(): Promise<Result<User[]>> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('estado_aprobacion', 'aprobado')
        .order('nombre', { ascending: true });

      if (error) {
        return fail(new InfrastructureError('Error fetching approved users', error));
      }

      return ok((data || []).map(toDomain));
    } catch (err) {
      return fail(new InfrastructureError('Error fetching approved users', err));
    }
  }

  async findApartmentChangeRequests(): Promise<Result<User[]>> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .not('vivienda_solicitada', 'is', null)
        .order('updated_at', { ascending: false });

      if (error) {
        return fail(new InfrastructureError('Error fetching apartment change requests', error));
      }

      return ok((data || []).map(toDomain));
    } catch (err) {
      return fail(new InfrastructureError('Error fetching apartment change requests', err));
    }
  }

  async updateApprovalStatus(userId: string, status: ApprovalStatus): Promise<Result<void>> {
    try {
      const { error } = await supabase
        .from('users')
        .update({ estado_aprobacion: approvalStatusToDb(status) })
        .eq('id', userId);

      if (error) {
        return fail(new InfrastructureError('Error updating approval status', error));
      }

      return ok(undefined);
    } catch (err) {
      return fail(new InfrastructureError('Error updating approval status', err));
    }
  }

  async toggleAdminRole(userId: string, isAdmin: boolean): Promise<Result<User>> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ es_admin: isAdmin })
        .eq('id', userId)
        .select();

      if (error) {
        return fail(new InfrastructureError('Error toggling admin role', error));
      }

      return ok(toDomain(data[0]));
    } catch (err) {
      return fail(new InfrastructureError('Error toggling admin role', err));
    }
  }

  async deleteUserWithRelations(userId: string): Promise<Result<void>> {
    try {
      await cleanupUserRelations(userId, { removeAdminContent: true });

      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) {
        return fail(new InfrastructureError('Error deleting user', error));
      }

      return ok(undefined);
    } catch (err) {
      return fail(new InfrastructureError('Error deleting user', err));
    }
  }

  async setRequestedApartment(userId: string, apartment: string): Promise<Result<void>> {
    try {
      const { error } = await supabase
        .from('users')
        .update({ vivienda_solicitada: apartment })
        .eq('id', userId);

      if (error) {
        return fail(new InfrastructureError('Error requesting apartment change', error));
      }

      return ok(undefined);
    } catch (err) {
      return fail(new InfrastructureError('Error requesting apartment change', err));
    }
  }

  async clearApartmentRequest(userId: string): Promise<Result<void>> {
    try {
      const { error } = await supabase
        .from('users')
        .update({ vivienda_solicitada: null })
        .eq('id', userId);

      if (error) {
        return fail(new InfrastructureError('Error clearing apartment request', error));
      }

      return ok(undefined);
    } catch (err) {
      return fail(new InfrastructureError('Error clearing apartment request', err));
    }
  }

  async approveApartmentChange(userId: string): Promise<Result<void>> {
    try {
      // Fetch the requested apartment
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('vivienda_solicitada')
        .eq('id', userId)
        .single();

      if (fetchError || !userData?.vivienda_solicitada) {
        return fail(new InfrastructureError('No pending apartment request found'));
      }

      // Update apartment and clear request
      const { error } = await supabase
        .from('users')
        .update({
          vivienda: userData.vivienda_solicitada,
          vivienda_solicitada: null,
        })
        .eq('id', userId);

      if (error) {
        return fail(new InfrastructureError('Error approving apartment change', error));
      }

      return ok(undefined);
    } catch (err) {
      return fail(new InfrastructureError('Error approving apartment change', err));
    }
  }
}
