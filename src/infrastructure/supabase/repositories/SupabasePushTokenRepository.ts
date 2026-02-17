import { supabase } from '@infrastructure/supabase/client';
import { ok, fail } from '@shared/types/Result';
import type { Result } from '@shared/types/Result';
import { InfrastructureError } from '@domain/errors/DomainErrors';
import type { PushTokenRepository } from '@domain/ports/repositories/PushTokenRepository';

export class SupabasePushTokenRepository implements PushTokenRepository {
  async save(userId: string, token: string, platform: string): Promise<Result<void>> {
    try {
      const { error } = await supabase.from('push_tokens').upsert(
        { user_id: userId, token, platform, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,token' },
      );
      if (error) return fail(new InfrastructureError(error.message, error));
      return ok(undefined);
    } catch (e) {
      return fail(new InfrastructureError('Failed to save push token', e));
    }
  }

  async remove(userId: string, token: string): Promise<Result<void>> {
    try {
      const { error } = await supabase
        .from('push_tokens')
        .delete()
        .eq('user_id', userId)
        .eq('token', token);
      if (error) return fail(new InfrastructureError(error.message, error));
      return ok(undefined);
    } catch (e) {
      return fail(new InfrastructureError('Failed to remove push token', e));
    }
  }

  async findByUser(userId: string): Promise<Result<string[]>> {
    try {
      const { data, error } = await supabase
        .from('push_tokens')
        .select('token')
        .eq('user_id', userId);
      if (error) return fail(new InfrastructureError(error.message, error));
      return ok((data ?? []).map((row) => row.token as string));
    } catch (e) {
      return fail(new InfrastructureError('Failed to find push tokens', e));
    }
  }
}
