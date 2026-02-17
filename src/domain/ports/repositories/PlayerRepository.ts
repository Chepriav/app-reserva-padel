import type { Result } from '@shared/types/Result';
import type { Player, AddPlayerData, PlayerStatus } from '@domain/entities/Match';

export interface PlayerRepository {
  findByMatch(matchId: string): Promise<Result<Player[]>>;
  findByMatchAndUser(matchId: string, userId: string): Promise<Result<Player | null>>;
  add(matchId: string, data: AddPlayerData, status: PlayerStatus): Promise<Result<Player>>;
  updateStatus(playerId: string, status: PlayerStatus): Promise<Result<Player>>;
  remove(playerId: string): Promise<Result<void>>;
  recalculateMatchStatus(matchId: string): Promise<Result<void>>;
}
