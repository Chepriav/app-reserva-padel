import React from 'react';
import { View, Text, TouchableOpacity, Image, Platform, StyleSheet } from 'react-native';
import { colors } from '../../../constants/colors';

export function ProfileHeader({ user, editMode, fotoPerfil, imageError, onImageError, onPickImage, onDeleteImage, onEditPress }) {
  const initials = user?.nombre
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
      >
        {fotoPerfil && !imageError ? (
          <Image source={{ uri: fotoPerfil }} style={styles.avatarImage} onError={onImageError} />
        ) : (
          <Text style={styles.avatarText}>{initials}</Text>
        )}
        {editMode && (
          <View style={styles.cameraOverlay}>
            <Text style={styles.cameraIcon}>📷</Text>
          </View>
        )}
      </TouchableOpacity>

      {editMode && (
        <View style={styles.photoButtons}>
          <TouchableOpacity style={styles.photoButton} onPress={onPickImage}>
            <Text style={styles.photoButtonText}>{fotoPerfil ? 'Cambiar Foto' : 'Añadir Foto'}</Text>
          </TouchableOpacity>
          {fotoPerfil && (
            <TouchableOpacity style={[styles.photoButton, styles.deletePhotoButton]} onPress={onDeleteImage}>
              <Text style={styles.deletePhotoButtonText}>Eliminar</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <Text style={styles.nombre}>{user?.nombre}</Text>
      <Text style={styles.email}>{user?.email}</Text>

      {!editMode && (
        <TouchableOpacity style={styles.editButton} onPress={onEditPress}>
          <Text style={styles.editButtonText}>✏️ Editar Perfil</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    paddingTop: Platform.OS === 'web' ? 40 : 60,
    paddingBottom: 40,
  },
  avatarContainer: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: colors.secondary,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: { fontSize: 36, fontWeight: 'bold', color: '#fff' },
  avatarImage: { width: 100, height: 100, borderRadius: 50 },
  cameraOverlay: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: colors.accent, width: 32, height: 32, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: colors.primary,
  },
  cameraIcon: { fontSize: 16 },
  photoButtons: { flexDirection: 'row', marginTop: 8, marginBottom: 8, gap: 8 },
  photoButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
  },
  photoButtonText: { color: '#fff', fontSize: 12, fontWeight: '500' },
  deletePhotoButton: { backgroundColor: 'rgba(255, 0, 0, 0.3)' },
  deletePhotoButtonText: { color: '#fff', fontSize: 12, fontWeight: '500' },
  nombre: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  email: { fontSize: 16, color: '#fff', opacity: 0.9 },
  editButton: {
    marginTop: 12, backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
  },
  editButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
