import React from 'react';
import { View, Text, TouchableOpacity, Image, Platform, StyleSheet } from 'react-native';
import { colors } from '../../../constants/colors';
import { Ionicons } from '@expo/vector-icons';

export function ProfileHeader({ user, editMode, profilePhoto, imageError, onImageError, onPickImage, onDeleteImage, onEditPress }) {
  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.avatarContainer}
        onPress={editMode ? onPickImage : undefined}
        disabled={!editMode}
        accessibilityLabel={editMode ? 'Cambiar foto de perfil' : undefined}
      >
        {profilePhoto && !imageError ? (
          <Image source={{ uri: profilePhoto }} style={styles.avatarImage} onError={onImageError} />
        ) : (
          <Text style={styles.avatarText}>{initials}</Text>
        )}
        {editMode && (
          <View style={styles.cameraOverlay}>
            <Ionicons name="camera" size={14} color="#fff" />
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{user?.name}</Text>
        <Text style={styles.email} numberOfLines={1}>{user?.email}</Text>

        {editMode ? (
          <View style={styles.photoButtons}>
            <TouchableOpacity style={styles.photoButton} onPress={onPickImage}>
              <Text style={styles.photoButtonText}>{profilePhoto ? 'Cambiar foto' : 'Añadir foto'}</Text>
            </TouchableOpacity>
            {profilePhoto && (
              <TouchableOpacity style={[styles.photoButton, styles.deletePhotoButton]} onPress={onDeleteImage}>
                <Text style={styles.photoButtonText}>Eliminar</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <TouchableOpacity style={styles.editButton} onPress={onEditPress}>
            <Ionicons name="create-outline" size={15} color="#fff" />
            <Text style={styles.editButtonText}>Editar perfil</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'web' ? 16 : 48,
    paddingBottom: 16,
  },
  avatarContainer: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: colors.secondary,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  avatarImage: { width: 68, height: 68, borderRadius: 34 },
  cameraOverlay: {
    position: 'absolute', bottom: -2, right: -2,
    backgroundColor: colors.accent, width: 26, height: 26, borderRadius: 13,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: colors.primary,
  },
  info: { flex: 1, minWidth: 0 },
  name: { fontSize: 20, fontWeight: '700', color: '#fff' },
  email: { fontSize: 14, color: '#fff', opacity: 0.85, marginTop: 2 },
  photoButtons: { flexDirection: 'row', marginTop: 8, gap: 8 },
  photoButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
  },
  photoButtonText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  deletePhotoButton: { backgroundColor: 'rgba(255, 0, 0, 0.3)' },
  editButton: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start',
    marginTop: 8, backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
  },
  editButtonText: { color: '#fff', fontSize: 13, fontWeight: '600' },
});
