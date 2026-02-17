import { ok } from '@shared/types/Result';
import type { Result } from '@shared/types/Result';
import type { PushDeliveryPort } from '@domain/ports/repositories/PushDeliveryPort';
import type { PushTokenRepository } from '@domain/ports/repositories/PushTokenRepository';

/**
 * Delivers push notifications via both Web Push (Supabase Edge Function)
 * and Expo Push (mobile). Both channels are tried in parallel; failures are
 * swallowed since push delivery is non-critical.
 */
export class CombinedPushDelivery implements PushDeliveryPort {
  constructor(private readonly tokenRepository: PushTokenRepository) {}

  async sendToUser(
    userId: string,
    title: string,
    body: string,
    data: Record<string, unknown> = {},
  ): Promise<Result<void>> {
    await Promise.allSettled([
      this.sendWebPush(userId, title, body, data),
      this.sendExpoPush(userId, title, body, data),
    ]);
    return ok(undefined);
  }

  private async sendWebPush(
    userId: string,
    title: string,
    body: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) return;

    await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({ userId, title, body, data }),
    });
  }

  private async sendExpoPush(
    userId: string,
    title: string,
    body: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    const tokensResult = await this.tokenRepository.findByUser(userId);
    if (!tokensResult.success || tokensResult.value.length === 0) return;

    const messages = tokensResult.value.map((token) => ({
      to: token,
      sound: 'default',
      title,
      body,
      data,
    }));

    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });
  }
}
