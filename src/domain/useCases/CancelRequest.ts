import type { Result } from '@shared/types/Result';
import { ok } from '@shared/types/Result';
import type { PlayerRepository } from '@domain/ports/repositories/PlayerRepository';

export class CancelRequest {
  constructor(private readonly playerRepository: PlayerRepository) {}

  async execute(matchId: string, userId: string): Promise<Result<void>> {
    const playerResult = await this.playerRepository.findByMatchAndUser(matchId, userId);
    if (!playerResult.success) return playerResult;
    if (!playerResult.value) return ok(undefined); // Already not in match

    return this.playerRepository.remove(playerResult.value.id);
  }
}
