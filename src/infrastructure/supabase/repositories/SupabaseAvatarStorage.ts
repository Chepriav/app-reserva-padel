import { Platform } from 'react-native';
import { decode } from 'base64-arraybuffer';
import { supabase } from '@infrastructure/supabase/client';
import { ok, fail } from '@shared/types/Result';
import type { Result } from '@shared/types/Result';
import { InfrastructureError } from '@domain/errors/DomainErrors';
import type { AvatarStoragePort } from '@domain/ports/repositories/AvatarStoragePort';

const AVATAR_BUCKET = 'Avatar';

export class SupabaseAvatarStorage implements AvatarStoragePort {
  async upload(userId: string, imageUri: string): Promise<Result<string>> {
    try {
      const fileName = `${userId}/avatar-${Date.now()}.jpg`;
      const fileDataResult = await this.toArrayBuffer(imageUri);
      if (!fileDataResult.success) return fileDataResult;
      const fileData = fileDataResult.value;

      await this.deleteOldAvatars(userId);

      const { error } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(fileName, fileData, { contentType: 'image/jpeg', upsert: true });

      if (error) return fail(new InfrastructureError(error.message, error));

      const { data: urlData } = supabase.storage
        .from(AVATAR_BUCKET)
        .getPublicUrl(fileName);

      return ok(urlData.publicUrl);
    } catch (err) {
      return fail(new InfrastructureError(
        (err as Error).message || 'Error uploading avatar',
        err,
      ));
    }
  }

  isLocalUri(uri: string): boolean {
    return !!uri && (
      uri.startsWith('file://') ||
      uri.startsWith('blob:') ||
      uri.startsWith('data:')
    );
  }

  private async toArrayBuffer(imageUri: string): Promise<Result<ArrayBuffer>> {
    if (Platform.OS === 'web') {
      if (imageUri.startsWith('data:')) {
        return ok(decode(imageUri.split(',')[1]));
      }
      if (imageUri.startsWith('blob:')) {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        const base64 = await this.blobToBase64(blob);
        return ok(decode(base64.split(',')[1]));
      }
      return fail(new InfrastructureError('Unsupported image format on web'));
    }

    // React Native: read file as base64
    const FileSystem = require('expo-file-system');
    const base64: string = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return ok(decode(base64));
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private async deleteOldAvatars(userId: string): Promise<void> {
    try {
      const { data: files } = await supabase.storage
        .from(AVATAR_BUCKET)
        .list(userId);

      if (files && files.length > 0) {
        const paths = files.map((f) => `${userId}/${f.name}`);
        await supabase.storage.from(AVATAR_BUCKET).remove(paths);
      }
    } catch {
      // Non-critical: old avatar cleanup failure is acceptable
    }
  }
}
