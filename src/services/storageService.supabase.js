import { supabase } from './supabaseConfig';
import { Platform } from 'react-native';
import { decode } from 'base64-arraybuffer';

const AVATAR_BUCKET = 'Avatar';

/**
 * Storage service using Supabase Storage
 * Replaces Cloudinary for profile photos
 */
export const storageService = {
  /**
   * Uploads an avatar image to Supabase Storage
   * @param {string} userId - User ID
   * @param {string} imageUri - Image URI (file://, blob:, data:)
   * @returns {Promise<string>} Public URL of the image
   */
  async uploadAvatar(userId, imageUri) {
    try {
      const fileName = `${userId}/avatar-${Date.now()}.jpg`;
      let fileData;
      const contentType = 'image/jpeg';

      if (Platform.OS === 'web') {
        // Web: convertir blob o data URI a ArrayBuffer
        if (imageUri.startsWith('data:')) {
          const base64 = imageUri.split(',')[1];
          fileData = decode(base64);
        } else if (imageUri.startsWith('blob:')) {
          const response = await fetch(imageUri);
          const blob = await response.blob();
          const base64 = await this.blobToBase64(blob);
          fileData = decode(base64.split(',')[1]);
        } else {
          throw new Error('Formato de imagen no soportado en web');
        }
      } else {
        // React Native: leer archivo como base64
        const FileSystem = require('expo-file-system');
        const base64 = await FileSystem.readAsStringAsync(imageUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        fileData = decode(base64);
      }

      // Eliminar avatar anterior si existe
      await this.deleteOldAvatars(userId);

      // Subir nueva imagen
      const { data, error } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(fileName, fileData, {
          contentType,
          upsert: true,
        });

      if (error) {
        throw new Error(error.message || 'Error al subir imagen');
      }

      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from(AVATAR_BUCKET)
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      throw new Error(error.message || 'Error al subir la foto de perfil');
    }
  },

  /**
   * Converts a Blob to base64 (for web)
   */
  blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  },

  /**
   * Deletes old avatars from user
   */
  async deleteOldAvatars(userId) {
    try {
      const { data: files } = await supabase.storage
        .from(AVATAR_BUCKET)
        .list(userId);

      if (files && files.length > 0) {
        const filesToDelete = files.map((file) => `${userId}/${file.name}`);
        await supabase.storage.from(AVATAR_BUCKET).remove(filesToDelete);
      }
    } catch {
      // Ignore errors when deleting old avatars
    }
  },

  /**
   * Checks if the URI is local (needs to be uploaded)
   */
  isLocalImageUri(uri) {
    return uri && (
      uri.startsWith('file://') ||
      uri.startsWith('blob:') ||
      uri.startsWith('data:')
    );
  },
};
