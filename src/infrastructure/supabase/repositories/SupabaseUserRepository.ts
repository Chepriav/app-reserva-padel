import type { UserRepository } from '@domain/ports/repositories/UserRepository';
import type { User, ApartmentUser, RegisterData, ProfileUpdate } from '@domain/entities/User';
import { InfrastructureError, ProfileUpdateError } from '@domain/errors/DomainErrors';
import type { Result } from '@shared/types/Result';
import { ok, fail } from '@shared/types/Result';
import { supabase } from '../client';
import { toDomain, toApartmentUserDomain, toDbProfileUpdate, toDbCreateRow } from '../mappers/userMapper';
import { cleanupUserRelations } from '../helpers/userCleanupHelper';
import { storageService } from '../../../services/storageService.supabase';

export class SupabaseUserRepository implements UserRepository {
  async findById(userId: string): Promise<Result<User | null>> {
    try {
      // Use direct fetch for non-blocking performance on web
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

      if (supabaseUrl && supabaseKey && typeof fetch !== 'undefined') {
        // Try to get access token from localStorage for auth
        let accessToken = supabaseKey;
        if (typeof window !== 'undefined' && window.localStorage) {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
              try {
                const data = JSON.parse(localStorage.getItem(key)!);
                if (data?.access_token) {
                  accessToken = data.access_token;
                  break;
                }
              } catch {
                // Ignore parsing errors
              }
            }
          }
        }

        const response = await fetch(
          `${supabaseUrl}/rest/v1/users?id=eq.${userId}&select=*`,
          {
            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );

        if (!response.ok) return ok(null);

        const users = await response.json();
        const row = users[0];
        return ok(row ? toDomain(row) : null);
      }

      // Fallback to Supabase client
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !data) return ok(null);
      return ok(toDomain(data));
    } catch (err) {
      return fail(new InfrastructureError('Error fetching user', err));
    }
  }

  async findByApartment(apartment: string): Promise<Result<ApartmentUser[]>> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, nombre, email, foto_perfil, nivel_juego')
        .eq('vivienda', apartment)
        .eq('estado_aprobacion', 'aprobado')
        .order('nombre', { ascending: true });

      if (error) {
        return fail(new InfrastructureError('Error fetching apartment users', error));
      }

      return ok((data || []).map(toApartmentUserDomain));
    } catch (err) {
      return fail(new InfrastructureError('Error fetching apartment users', err));
    }
  }

  async create(userId: string, data: RegisterData): Promise<Result<void>> {
    try {
      const row = toDbCreateRow(userId, data);
      const { error } = await supabase.from('users').insert(row);

      if (error) {
        return fail(new InfrastructureError('Error creating user profile', error));
      }

      return ok(undefined);
    } catch (err) {
      return fail(new InfrastructureError('Error creating user profile', err));
    }
  }

  async updateProfile(userId: string, updates: ProfileUpdate): Promise<Result<User>> {
    try {
      // Upload photo if it's a local URI
      if (updates.profilePhoto && storageService.isLocalImageUri(updates.profilePhoto)) {
        try {
          updates = {
            ...updates,
            profilePhoto: await storageService.uploadAvatar(userId, updates.profilePhoto),
          };
        } catch (uploadError) {
          return fail(
            new ProfileUpdateError(
              (uploadError as Error).message || 'Error uploading profile photo',
              uploadError,
            ),
          );
        }
      }

      const mappedUpdates = toDbProfileUpdate(updates);

      const { error } = await supabase
        .from('users')
        .update(mappedUpdates)
        .eq('id', userId);

      if (error) {
        return fail(new ProfileUpdateError('Error updating profile', error));
      }

      // Re-fetch updated user
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (!userData) {
        return fail(new ProfileUpdateError('User not found after update'));
      }

      return ok(toDomain(userData));
    } catch (err) {
      return fail(new ProfileUpdateError('Error updating profile', err));
    }
  }

  async deleteWithRelations(userId: string): Promise<Result<void>> {
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
}
