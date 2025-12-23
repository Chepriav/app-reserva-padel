import { supabase } from './supabaseConfig';
import { Platform } from 'react-native';
import { decode } from 'base64-arraybuffer';

const AVATAR_BUCKET = 'Avatar';

/**
 * Servicio de almacenamiento con Supabase Storage
 * Reemplaza Cloudinary para fotos de perfil
 */
export const storageService = {
  /**
   * Sube una imagen de avatar a Supabase Storage
   * @param {string} userId - ID del usuario
   * @param {string} imageUri - URI de la imagen (file://, blob:, data:)
   * @returns {Promise<string>} URL pública de la imagen
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
   * Convierte un Blob a base64 (para web)
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
   * Elimina avatares anteriores del usuario
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
      // Ignorar errores al eliminar avatares antiguos
    }
  },

  /**
   * Verifica si la URI es local (necesita subirse)
   */
  isLocalImageUri(uri) {
    return uri && (
      uri.startsWith('file://') ||
      uri.startsWith('blob:') ||
      uri.startsWith('data:')
    );
  },
};
