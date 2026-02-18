import type { Result } from '@shared/types/Result';

export interface AvatarStoragePort {
  upload(userId: string, imageUri: string): Promise<Result<string>>;
  isLocalUri(uri: string): boolean;
}
