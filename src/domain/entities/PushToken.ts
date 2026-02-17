export type PushPlatform = 'ios' | 'android' | 'web';

export interface PushToken {
  userId: string;
  token: string;
  platform: PushPlatform;
  updatedAt: string;
}
