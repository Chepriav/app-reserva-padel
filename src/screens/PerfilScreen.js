import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Image,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { colors } from '../constants/colors';
import { CustomAlert } from '../components/CustomAlert';
import { ViviendaSelector } from '../components/ViviendaSelector';
import { NIVELES_JUEGO, parseVivienda, combinarVivienda, formatearVivienda, esViviendaValida } from '../constants/config';
import { validarPerfil, validarViviendaComponentes } from '../utils/validators';

// Importar ImageManipulator solo en plataformas nativas
let ImageManipulator;
if (Platform.OS !== 'web') {
  ImageManipulator = require('expo-image-manipulator');
}

export default function PerfilScreen() {
  const { user, logout, updateProfile } = useAuth();

  // Estado para CustomAlert
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    buttons: [],
  });

  // Estado para modo edición
  const [editMode, setEditMode] = useState(false);
  const [nombre, setNombre] = useState(user?.nombre || '');
  const [telefono, setTelefono] = useState(user?.telefono || '');
  // Vivienda estructurada
  const viviendaParsed = parseVivienda(user?.vivienda);
  const [escalera, setEscalera] = useState(viviendaParsed?.escalera || '');
  const [piso, setPiso] = useState(viviendaParsed?.piso || '');
  const [puerta, setPuerta] = useState(viviendaParsed?.puerta || '');
  const [nivelJuego, setNivelJuego] = useState(user?.nivelJuego || null);
  const [fotoPerfil, setFotoPerfil] = useState(user?.fotoPerfil || null);
  const [saving, setSaving] = useState(false);
  const [showNivelPicker, setShowNivelPicker] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Verificar si necesita actualizar vivienda al nuevo formato
  const necesitaActualizarVivienda = user?.vivienda && !esViviendaValida(user.vivienda);

  // Validar si una URL de imagen es válida
  const isValidImageUrl = (url) => {
    if (!url) return false;
    // Aceptar URLs de Cloudinary o cualquier URL https válida
    return url.startsWith('https://res.cloudinary.com/') ||
           (url.startsWith('https://') && !url.includes('undefined'));
  };

  // Sincronizar estado local con datos del usuario cuando cambian
  useEffect(() => {
    if (user && !editMode) {
      setNombre(user.nombre || '');
      setTelefono(user.telefono || '');
      // Parsear vivienda estructurada
      const parsed = parseVivienda(user.vivienda);
      setEscalera(parsed?.escalera || '');
      setPiso(parsed?.piso || '');
      setPuerta(parsed?.puerta || '');
      setNivelJuego(user.nivelJuego || null);
      // Solo usar fotoPerfil si es una URL válida
      const fotoValida = isValidImageUrl(user.fotoPerfil) ? user.fotoPerfil : null;
      setFotoPerfil(fotoValida);
      setImageError(false); // Resetear error al cambiar usuario
    }
  }, [user, editMode]);

  // Cancelar edición y resetear formulario
  const cancelarEdicion = () => {
    setNombre(user?.nombre || '');
    setTelefono(user?.telefono || '');
    const parsed = parseVivienda(user?.vivienda);
    setEscalera(parsed?.escalera || '');
    setPiso(parsed?.piso || '');
    setPuerta(parsed?.puerta || '');
    setNivelJuego(user?.nivelJuego || null);
    setFotoPerfil(user?.fotoPerfil || null);
    setEditMode(false);
    setShowNivelPicker(false);
  };

  // Seleccionar imagen de la galería
  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      setAlertConfig({
        visible: true,
        title: 'Permiso Requerido',
        message: 'Necesitamos acceso a tu galería para cambiar la foto de perfil',
        buttons: [{ text: 'OK', onPress: () => {} }],
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      let imageUri = result.assets[0].uri;

      // Comprimir imagen solo en plataformas nativas
      if (Platform.OS !== 'web' && ImageManipulator) {
        const manipResult = await ImageManipulator.manipulateAsync(
          imageUri,
          [{ resize: { width: 800, height: 800 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );
        imageUri = manipResult.uri;
      }

      setFotoPerfil(imageUri);
      setImageError(false); // Resetear error al seleccionar nueva imagen
    }
  };

  // Eliminar foto de perfil
  const handleDeleteImage = () => {
    setAlertConfig({
      visible: true,
      title: 'Eliminar Foto',
      message: '¿Estás seguro de que quieres eliminar tu foto de perfil?',
      buttons: [
        { text: 'Cancelar', style: 'cancel', onPress: () => {} },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            setFotoPerfil(null);
            setImageError(false);
          },
        },
      ],
    });
  };

  // Guardar cambios del perfil
  const handleGuardarPerfil = async () => {
    // Validar vivienda
    const viviendaValidacion = validarViviendaComponentes(escalera, piso, puerta);
    if (!viviendaValidacion.valido) {
      const errores = Object.values(viviendaValidacion.errores).join('\n');
      setAlertConfig({
        visible: true,
        title: 'Error en vivienda',
        message: errores,
        buttons: [{ text: 'OK', onPress: () => {} }],
      });
      return;
    }

    // Combinar vivienda
    const vivienda = combinarVivienda(escalera, piso, puerta);

    const validacion = validarPerfil({
      nombre,
      telefono,
      vivienda,
      nivelJuego,
    });

    if (!validacion.valido) {
      const errores = Object.values(validacion.errores).join('\n');
      setAlertConfig({
        visible: true,
        title: 'Errores de validación',
        message: errores,
        buttons: [{ text: 'OK', onPress: () => {} }],
      });
      return;
    }

    setSaving(true);
    const result = await updateProfile({
      nombre,
      telefono,
      vivienda,
      nivelJuego,
      fotoPerfil,
    });
    setSaving(false);

    if (result.success) {
      setEditMode(false);
      setShowNivelPicker(false);
      setAlertConfig({
        visible: true,
        title: 'Perfil Actualizado',
        message: 'Tus cambios han sido guardados exitosamente',
        buttons: [{ text: 'OK', onPress: () => {} }],
      });
    } else {
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: result.error || 'No se pudo actualizar el perfil',
        buttons: [{ text: 'OK', onPress: () => {} }],
      });
    }
  };

  const handleLogout = () => {
    setAlertConfig({
      visible: true,
      title: 'Cerrar Sesión',
      message: '¿Estás seguro de que quieres cerrar sesión?',
      buttons: [
        { text: 'Cancelar', style: 'cancel', onPress: () => {} },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            const result = await logout();

            if (!result.success) {
              setAlertConfig({
                visible: true,
                title: 'Error',
                message: result.error || 'No se pudo cerrar sesión',
                buttons: [{ text: 'OK', onPress: () => {} }],
              });
            }
            // Si success = true, el AuthContext observer redirigirá automáticamente
          },
        },
      ],
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.avatarContainer}
          onPress={editMode ? handlePickImage : undefined}
          disabled={!editMode}
        >
          {fotoPerfil && !imageError ? (
            <Image
              source={{ uri: fotoPerfil }}
              style={styles.avatarImage}
              onError={() => setImageError(true)}
            />
          ) : (
            <Text style={styles.avatarText}>
              {user?.nombre
                ?.split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2) || '?'}
            </Text>
          )}
          {editMode && (
            <View style={styles.cameraOverlay}>
              <Text style={styles.cameraIcon}>📷</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Botones de foto en modo edición */}
        {editMode && (
          <View style={styles.photoButtons}>
            <TouchableOpacity
              style={styles.photoButton}
              onPress={handlePickImage}
            >
              <Text style={styles.photoButtonText}>
                {fotoPerfil ? 'Cambiar Foto' : 'Añadir Foto'}
              </Text>
            </TouchableOpacity>
            {fotoPerfil && (
              <TouchableOpacity
                style={[styles.photoButton, styles.deletePhotoButton]}
                onPress={handleDeleteImage}
              >
                <Text style={styles.deletePhotoButtonText}>Eliminar</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <Text style={styles.nombre}>{user?.nombre}</Text>
        <Text style={styles.email}>{user?.email}</Text>

        {!editMode && (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setEditMode(true)}
          >
            <Text style={styles.editButtonText}>✏️ Editar Perfil</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información Personal</Text>

        <View style={styles.infoCard}>
          {/* Nombre */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nombre</Text>
            {editMode ? (
              <TextInput
                style={styles.infoInput}
                value={nombre}
                onChangeText={setNombre}
                autoCapitalize="words"
              />
            ) : (
              <Text style={styles.infoValue}>{user?.nombre}</Text>
            )}
          </View>

          <View style={styles.separator} />

          {/* Teléfono */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Teléfono</Text>
            {editMode ? (
              <TextInput
                style={styles.infoInput}
                value={telefono}
                onChangeText={setTelefono}
                keyboardType="phone-pad"
              />
            ) : (
              <Text style={styles.infoValue}>{user?.telefono}</Text>
            )}
          </View>

          <View style={styles.separator} />

          {/* Vivienda */}
          <View style={styles.infoRowVertical}>
            <Text style={styles.infoLabel}>Vivienda</Text>
            {editMode ? (
              <View style={styles.viviendaSelectorContainer}>
                <ViviendaSelector
                  escalera={escalera}
                  piso={piso}
                  puerta={puerta}
                  onChangeEscalera={setEscalera}
                  onChangePiso={setPiso}
                  onChangePuerta={setPuerta}
                />
              </View>
            ) : (
              <Text style={styles.infoValue}>
                {esViviendaValida(user?.vivienda)
                  ? formatearVivienda(user?.vivienda)
                  : user?.vivienda}
              </Text>
            )}
          </View>

          {/* Aviso de migración de vivienda */}
          {necesitaActualizarVivienda && !editMode && (
            <View style={styles.migracionAviso}>
              <Text style={styles.migracionTexto}>
                Tu vivienda tiene el formato antiguo. Por favor, actualiza tus datos.
              </Text>
              <TouchableOpacity
                style={styles.migracionBoton}
                onPress={() => setEditMode(true)}
              >
                <Text style={styles.migracionBotonTexto}>Actualizar Vivienda</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.separator} />

          {/* Nivel de Juego */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nivel de Juego</Text>
            {editMode ? (
              <TouchableOpacity
                style={styles.nivelSelector}
                onPress={() => setShowNivelPicker(!showNivelPicker)}
              >
                <Text style={styles.nivelSelectorText}>
                  {nivelJuego
                    ? NIVELES_JUEGO.find((n) => n.value === nivelJuego)?.label
                    : 'Seleccionar'}
                </Text>
                <Text style={styles.nivelSelectorArrow}>▼</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.infoValue}>
                {nivelJuego
                  ? NIVELES_JUEGO.find((n) => n.value === nivelJuego)?.label
                  : 'No especificado'}
              </Text>
            )}
          </View>

          {/* Nivel Picker Dropdown */}
          {editMode && showNivelPicker && (
            <View style={styles.nivelPickerContainer}>
              {NIVELES_JUEGO.map((nivel) => (
                <TouchableOpacity
                  key={nivel.value}
                  style={[
                    styles.nivelOption,
                    nivelJuego === nivel.value && styles.nivelOptionSelected,
                  ]}
                  onPress={() => {
                    setNivelJuego(nivel.value);
                    setShowNivelPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.nivelOptionText,
                      nivelJuego === nivel.value &&
                        styles.nivelOptionTextSelected,
                    ]}
                  >
                    {nivel.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {user?.esAdmin && (
            <>
              <View style={styles.separator} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Rol</Text>
                <View style={styles.adminBadge}>
                  <Text style={styles.adminText}>Administrador</Text>
                </View>
              </View>
            </>
          )}
        </View>
      </View>

      {/* Botones de Guardar/Cancelar en modo edición */}
      {editMode && (
        <View style={styles.editButtons}>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.buttonDisabled]}
            onPress={handleGuardarPerfil}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Guardar Cambios</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={cancelarEdicion}
            disabled={saving}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Acerca de</Text>
        <View style={styles.infoCard}>
          <Text style={styles.aboutText}>
            App de Reservas de Pádel
          </Text>
          <Text style={styles.aboutVersion}>Versión 1.0.0</Text>
          <Text style={styles.aboutNote}>
            Aplicación para gestionar reservas de pistas de pádel en la urbanización
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>
        Desarrollado con React Native y Expo
      </Text>

      {/* CustomAlert component */}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onDismiss={() => setAlertConfig({ ...alertConfig, visible: false })}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    paddingTop: Platform.OS === 'web' ? 40 : 60,
    paddingBottom: 40,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  nombre: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
  },
  adminBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  adminText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  aboutText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  aboutVersion: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  aboutNote: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.accent,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.primary,
  },
  cameraIcon: {
    fontSize: 16,
  },
  photoButtons: {
    flexDirection: 'row',
    marginTop: 8,
    marginBottom: 8,
    gap: 8,
  },
  photoButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  photoButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  deletePhotoButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.3)',
  },
  deletePhotoButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  editButton: {
    marginTop: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  infoInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    padding: 8,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.background,
    textAlign: 'right',
  },
  nivelSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    padding: 8,
    backgroundColor: colors.background,
  },
  nivelSelectorText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    textAlign: 'right',
    marginRight: 8,
  },
  nivelSelectorArrow: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  nivelPickerContainer: {
    marginTop: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    overflow: 'hidden',
  },
  nivelOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  nivelOptionSelected: {
    backgroundColor: colors.primary,
  },
  nivelOptionText: {
    fontSize: 16,
    color: colors.text,
  },
  nivelOptionTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  editButtons: {
    padding: 16,
    paddingTop: 0,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: colors.disabled,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: 12,
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
  logoutButton: {
    backgroundColor: colors.error,
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginTop: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.textSecondary,
    paddingVertical: 20,
  },
  infoRowVertical: {
    paddingVertical: 12,
  },
  viviendaSelectorContainer: {
    marginTop: 8,
  },
  migracionAviso: {
    backgroundColor: colors.accent + '20',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  migracionTexto: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
  },
  migracionBoton: {
    backgroundColor: colors.accent,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  migracionBotonTexto: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
