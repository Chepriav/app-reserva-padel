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
  Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { colors } from '../constants/colors';
import { CustomAlert } from '../components/CustomAlert';
import { ApartmentSelector } from '../components/ApartmentSelector';
import { NIVELES_JUEGO, parseVivienda, combinarVivienda, formatearVivienda, esViviendaValida } from '../constants/config';
import { validarPerfil, validarViviendaComponentes } from '../utils/validators';
import { authService } from '../services/authService.supabase';
import { notificationService } from '../services/notificationService';
import { webPushService } from '../services/webPushService';

// Importar ImageManipulator solo en plataformas nativas
let ImageManipulator;
if (Platform.OS !== 'web') {
  ImageManipulator = require('expo-image-manipulator');
}

export default function PerfilScreen() {
  const { user, logout, updateProfile, refreshUser, notificationMessage, clearNotificationMessage } = useAuth();

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

  // Estado para modal de solicitud de cambio de vivienda
  const [solicitudModal, setSolicitudModal] = useState({
    visible: false,
    escalera: '',
    piso: '',
    puerta: '',
    saving: false,
  });
  const [cancelingSolicitud, setCancelingSolicitud] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [enablingNotifications, setEnablingNotifications] = useState(false);

  // Estado para usuarios de la misma vivienda
  const [usuariosVivienda, setUsuariosVivienda] = useState([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);

  // Verificar estado de notificaciones al cargar
  useEffect(() => {
    checkNotificationStatus();
  }, []);

  // Cargar usuarios de la misma vivienda
  useEffect(() => {
    const cargarUsuariosVivienda = async () => {
      if (!user?.vivienda) return;

      setLoadingUsuarios(true);
      const result = await authService.getUsuariosMismaVivienda(user.vivienda);
      if (result.success) {
        setUsuariosVivienda(result.data);
      }
      setLoadingUsuarios(false);
    };

    cargarUsuariosVivienda();
  }, [user?.vivienda]);

  // Mostrar mensaje si viene de una notificación push
  useEffect(() => {
    if (notificationMessage) {
      // Primero refrescar los datos del usuario
      if (refreshUser) {
        refreshUser().then(() => {
          console.log('[PerfilScreen] Usuario refrescado después de notificación');
        }).catch((err) => {
          console.error('[PerfilScreen] Error refrescando usuario:', err);
        });
      }

      setAlertConfig({
        visible: true,
        title: notificationMessage.title,
        message: notificationMessage.text,
        buttons: [{
          text: 'OK',
          onPress: () => {
            clearNotificationMessage();
          }
        }],
      });
    }
  }, [notificationMessage, refreshUser, clearNotificationMessage]);

  const checkNotificationStatus = async () => {
    if (Platform.OS === 'web') {
      // En web, verificar permiso del navegador
      if ('Notification' in window) {
        setNotificationsEnabled(Notification.permission === 'granted');
      }
    }
  };

  const handleEnableNotifications = async () => {
    if (!user) return;

    setEnablingNotifications(true);

    try {
      const result = await notificationService.registerForPushNotifications(user.id);

      if (result.success) {
        setNotificationsEnabled(true);
        setAlertConfig({
          visible: true,
          title: 'Notificaciones Activadas',
          message: 'Recibirás notificaciones sobre tus reservas y cambios importantes.',
          buttons: [{ text: 'OK', onPress: () => {} }],
        });
      } else {
        setAlertConfig({
          visible: true,
          title: 'Error',
          message: result.error || 'No se pudieron activar las notificaciones',
          buttons: [{ text: 'OK', onPress: () => {} }],
        });
      }
    } catch (error) {
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: 'Error al activar notificaciones',
        buttons: [{ text: 'OK', onPress: () => {} }],
      });
    }

    setEnablingNotifications(false);
  };

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
    // Block demo users
    if (user?.esDemo) {
      setAlertConfig({
        visible: true,
        title: 'Demo Account',
        message: 'This is a view-only demo account. You cannot make reservations or modifications.',
        buttons: [{ text: 'OK', onPress: () => {} }],
      });
      return;
    }

    // Solo validar vivienda si es admin (los usuarios normales no pueden cambiarla)
    let vivienda = user?.vivienda;

    if (user?.esAdmin) {
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
      vivienda = combinarVivienda(escalera, piso, puerta);
    }

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

  // Abrir modal para solicitar cambio de vivienda
  const openSolicitudModal = () => {
    setSolicitudModal({
      visible: true,
      escalera: '',
      piso: '',
      puerta: '',
      saving: false,
    });
  };

  // Cerrar modal de solicitud
  const closeSolicitudModal = () => {
    setSolicitudModal({
      visible: false,
      escalera: '',
      piso: '',
      puerta: '',
      saving: false,
    });
  };

  // Enviar solicitud de cambio de vivienda
  const handleEnviarSolicitud = async () => {
    const { escalera: solEscalera, piso: solPiso, puerta: solPuerta } = solicitudModal;

    // Validar componentes
    const validacion = validarViviendaComponentes(solEscalera, solPiso, solPuerta);
    if (!validacion.valido) {
      const errorMsg = Object.values(validacion.errores).join('\n');
      setAlertConfig({
        visible: true,
        title: 'Error de validación',
        message: errorMsg,
        buttons: [{ text: 'OK', onPress: () => {} }],
      });
      return;
    }

    const nuevaVivienda = combinarVivienda(solEscalera, solPiso, solPuerta);

    // Verificar que no sea la misma vivienda actual
    if (nuevaVivienda === user?.vivienda) {
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: 'La vivienda seleccionada es igual a tu vivienda actual',
        buttons: [{ text: 'OK', onPress: () => {} }],
      });
      return;
    }

    setSolicitudModal((prev) => ({ ...prev, saving: true }));

    const result = await authService.solicitarCambioVivienda(user.id, nuevaVivienda);

    if (result.success) {
      closeSolicitudModal();
      // Actualizar el usuario en el contexto
      await updateProfile({ viviendaSolicitada: nuevaVivienda });
      setAlertConfig({
        visible: true,
        title: 'Solicitud Enviada',
        message: `Tu solicitud de cambio a ${formatearVivienda(nuevaVivienda)} ha sido enviada. Un administrador la revisará pronto.`,
        buttons: [{ text: 'OK', onPress: () => {} }],
      });
    } else {
      setSolicitudModal((prev) => ({ ...prev, saving: false }));
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: result.error || 'Error al enviar solicitud',
        buttons: [{ text: 'OK', onPress: () => {} }],
      });
    }
  };

  // Cancelar solicitud pendiente
  const handleCancelarSolicitud = () => {
    setAlertConfig({
      visible: true,
      title: 'Cancelar Solicitud',
      message: '¿Estás seguro de que quieres cancelar tu solicitud de cambio de vivienda?',
      buttons: [
        { text: 'No', style: 'cancel', onPress: () => {} },
        {
          text: 'Sí, Cancelar',
          style: 'destructive',
          onPress: async () => {
            setCancelingSolicitud(true);
            const result = await authService.cancelarSolicitudVivienda(user.id);

            if (result.success) {
              await updateProfile({ viviendaSolicitada: null });
              setAlertConfig({
                visible: true,
                title: 'Solicitud Cancelada',
                message: 'Tu solicitud de cambio de vivienda ha sido cancelada.',
                buttons: [{ text: 'OK', onPress: () => {} }],
              });
            } else {
              setAlertConfig({
                visible: true,
                title: 'Error',
                message: result.error || 'Error al cancelar solicitud',
                buttons: [{ text: 'OK', onPress: () => {} }],
              });
            }
            setCancelingSolicitud(false);
          },
        },
      ],
    });
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

  const [deleting, setDeleting] = useState(false);

  const executeDeleteAccount = async () => {
    console.log('=== INICIANDO ELIMINACIÓN DE CUENTA ===');
    console.log('User ID:', user?.id);
    setDeleting(true);

    try {
      const result = await authService.deleteOwnAccount(user.id);
      console.log('Resultado de eliminación:', result);

      if (result.success) {
        // Forzar logout en el contexto para redirigir a login
        await logout();
      } else {
        setDeleting(false);
        setAlertConfig({
          visible: true,
          title: 'Error',
          message: result.error || 'No se pudo eliminar la cuenta',
          buttons: [{ text: 'OK', onPress: () => {} }],
        });
      }
    } catch (error) {
      console.log('Exception en eliminación:', error);
      setDeleting(false);
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: 'Error inesperado al eliminar la cuenta',
        buttons: [{ text: 'OK', onPress: () => {} }],
      });
    }
  };

  const handleDeleteAccount = () => {
    setAlertConfig({
      visible: true,
      title: 'Eliminar Cuenta',
      message: '¿Estás seguro de que quieres eliminar tu cuenta? Esta acción es irreversible y se eliminarán todos tus datos.',
      buttons: [
        { text: 'Cancelar', style: 'cancel', onPress: () => {} },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            // Segunda confirmación
            setAlertConfig({
              visible: true,
              title: 'Confirmar Eliminación',
              message: '¿Realmente deseas eliminar tu cuenta? Esta acción NO se puede deshacer.',
              buttons: [
                { text: 'Cancelar', style: 'cancel', onPress: () => {} },
                {
                  text: 'Sí, Eliminar',
                  style: 'destructive',
                  onPress: executeDeleteAccount,
                },
              ],
            });
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
            <View style={styles.viviendaLabelRow}>
              <Text style={styles.infoLabel}>Vivienda</Text>
              {!user?.esAdmin && (
                <Text style={styles.viviendaLocked}>🔒</Text>
              )}
            </View>
            {editMode && user?.esAdmin ? (
              <View style={styles.viviendaSelectorContainer}>
                <ApartmentSelector
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

            {/* Solicitud pendiente */}
            {!user?.esAdmin && user?.viviendaSolicitada && (
              <View style={styles.solicitudPendiente}>
                <View style={styles.solicitudInfo}>
                  <Text style={styles.solicitudBadge}>Cambio pendiente</Text>
                  <Text style={styles.solicitudText}>
                    Solicitud: {esViviendaValida(user.viviendaSolicitada)
                      ? formatearVivienda(user.viviendaSolicitada)
                      : user.viviendaSolicitada}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.cancelarSolicitudButton, cancelingSolicitud && styles.buttonDisabled]}
                  onPress={handleCancelarSolicitud}
                  disabled={cancelingSolicitud}
                >
                  {cancelingSolicitud ? (
                    <ActivityIndicator size="small" color={colors.error} />
                  ) : (
                    <Text style={styles.cancelarSolicitudText}>Cancelar</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Botón para solicitar cambio */}
            {!user?.esAdmin && !user?.viviendaSolicitada && !editMode && (
              <TouchableOpacity
                style={styles.solicitarCambioButton}
                onPress={openSolicitudModal}
              >
                <Text style={styles.solicitarCambioText}>Solicitar cambio de vivienda</Text>
              </TouchableOpacity>
            )}
          </View>

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

      {/* Sección Tu Vivienda */}
      {user?.vivienda && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Tu Vivienda ({esViviendaValida(user.vivienda) ? formatearVivienda(user.vivienda) : user.vivienda})
          </Text>
          <View style={styles.infoCard}>
            {loadingUsuarios ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={colors.primary} />
                <Text style={styles.loadingText}>Cargando...</Text>
              </View>
            ) : usuariosVivienda.length === 0 ? (
              <Text style={styles.noUsuariosText}>No hay usuarios registrados en esta vivienda</Text>
            ) : (
              usuariosVivienda.map((usuario, index) => (
                <View key={usuario.id}>
                  {index > 0 && <View style={styles.separator} />}
                  <View style={styles.usuarioViviendaRow}>
                    <View style={styles.usuarioViviendaAvatar}>
                      {usuario.fotoPerfil ? (
                        <Image
                          source={{ uri: usuario.fotoPerfil }}
                          style={styles.usuarioViviendaImage}
                        />
                      ) : (
                        <Text style={styles.usuarioViviendaInitials}>
                          {usuario.nombre
                            ?.split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2) || '?'}
                        </Text>
                      )}
                    </View>
                    <View style={styles.usuarioViviendaInfo}>
                      <Text style={styles.usuarioViviendaNombre}>
                        {usuario.nombre}
                        {usuario.id === user?.id && (
                          <Text style={styles.usuarioViviendaTu}> (Tú)</Text>
                        )}
                      </Text>
                      {usuario.nivelJuego && (
                        <Text style={styles.usuarioViviendaNivel}>
                          {NIVELES_JUEGO.find((n) => n.value === usuario.nivelJuego)?.label || usuario.nivelJuego}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      )}

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

      {/* Botón de Notificaciones */}
      {Platform.OS === 'web' && (
        <TouchableOpacity
          style={[styles.notificationButton, enablingNotifications && styles.buttonDisabled]}
          onPress={handleEnableNotifications}
          disabled={enablingNotifications}
        >
          {enablingNotifications ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.notificationButtonText}>🔔 Activar Notificaciones</Text>
          )}
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
      </TouchableOpacity>

      {/* Zona de Peligro */}
      <View style={styles.dangerSection}>
        <Text style={styles.dangerSectionTitle}>Zona de Peligro</Text>
        <View style={styles.dangerCard}>
          <Text style={styles.dangerText}>
            Eliminar tu cuenta borrará permanentemente todos tus datos y reservas.
          </Text>
          <TouchableOpacity
            style={[styles.deleteAccountButton, deleting && styles.deleteAccountButtonDisabled]}
            onPress={handleDeleteAccount}
            disabled={deleting}
          >
            {deleting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.deleteAccountButtonText}>Eliminar mi cuenta</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.footer}>
        Desarrollado con React Native y Expo
      </Text>

      {/* Modal para solicitar cambio de vivienda */}
      <Modal
        visible={solicitudModal.visible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeSolicitudModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Solicitar Cambio de Vivienda</Text>
            <Text style={styles.modalSubtitle}>
              Selecciona tu nueva vivienda. Un administrador revisará tu solicitud.
            </Text>

            <View style={styles.modalViviendaSelector}>
              <ApartmentSelector
                escalera={solicitudModal.escalera}
                piso={solicitudModal.piso}
                puerta={solicitudModal.puerta}
                onChangeEscalera={(value) =>
                  setSolicitudModal((prev) => ({ ...prev, escalera: value }))
                }
                onChangePiso={(value) =>
                  setSolicitudModal((prev) => ({ ...prev, piso: value }))
                }
                onChangePuerta={(value) =>
                  setSolicitudModal((prev) => ({ ...prev, puerta: value }))
                }
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={closeSolicitudModal}
                disabled={solicitudModal.saving}
              >
                <Text style={styles.modalCancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalSaveButton,
                  solicitudModal.saving && styles.modalButtonDisabled,
                ]}
                onPress={handleEnviarSolicitud}
                disabled={solicitudModal.saving}
              >
                {solicitudModal.saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalSaveButtonText}>Enviar Solicitud</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
  viviendaLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viviendaLocked: {
    fontSize: 14,
  },
  viviendaAviso: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
    fontStyle: 'italic',
  },
  viviendaSelectorContainer: {
    marginTop: 8,
  },
  dangerSection: {
    marginHorizontal: 16,
    marginTop: 24,
  },
  dangerSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error,
    marginBottom: 12,
  },
  dangerCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.error + '40',
  },
  dangerText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  deleteAccountButton: {
    backgroundColor: colors.error,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  deleteAccountButtonDisabled: {
    backgroundColor: colors.error + '80',
  },
  deleteAccountButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  solicitudPendiente: {
    marginTop: 12,
    backgroundColor: colors.accent + '15',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.accent + '40',
  },
  solicitudInfo: {
    marginBottom: 8,
  },
  solicitudBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent,
    marginBottom: 4,
  },
  solicitudText: {
    fontSize: 14,
    color: colors.text,
  },
  cancelarSolicitudButton: {
    backgroundColor: colors.surface,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.error,
    minHeight: 36,
    justifyContent: 'center',
  },
  cancelarSolicitudText: {
    color: colors.error,
    fontSize: 13,
    fontWeight: '500',
  },
  solicitarCambioButton: {
    marginTop: 12,
    backgroundColor: colors.primary + '10',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  solicitarCambioText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalViviendaSelector: {
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalCancelButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  modalSaveButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  modalSaveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  modalButtonDisabled: {
    opacity: 0.6,
  },
  notificationButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginBottom: 0,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  notificationButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Estilos para sección Tu Vivienda
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 10,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  noUsuariosText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    padding: 20,
  },
  usuarioViviendaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  usuarioViviendaAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  usuarioViviendaImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  usuarioViviendaInitials: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  usuarioViviendaInfo: {
    flex: 1,
  },
  usuarioViviendaNombre: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  usuarioViviendaTu: {
    fontSize: 14,
    fontWeight: 'normal',
    color: colors.primary,
  },
  usuarioViviendaNivel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
