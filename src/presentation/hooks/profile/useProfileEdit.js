import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { parseVivienda, combinarVivienda, NIVELES_JUEGO } from '../../../constants/config';
import { validarPerfil, validarViviendaComponentes } from '../../../utils/validators';

let ImageManipulator;
if (Platform.OS !== 'web') {
  ImageManipulator = require('expo-image-manipulator');
}

const isValidImageUrl = (url) => {
  if (!url) return false;
  return url.startsWith('https://res.cloudinary.com/') ||
         (url.startsWith('https://') && !url.includes('undefined'));
};

export function useProfileEdit(user, updateProfile, showAlert) {
  const [editMode, setEditMode] = useState(false);
  const [nombre, setNombre] = useState(user?.nombre || '');
  const [telefono, setTelefono] = useState(user?.telefono || '');
  const viviendaParsed = parseVivienda(user?.vivienda);
  const [escalera, setEscalera] = useState(viviendaParsed?.escalera || '');
  const [piso, setPiso] = useState(viviendaParsed?.piso || '');
  const [puerta, setPuerta] = useState(viviendaParsed?.puerta || '');
  const [nivelJuego, setNivelJuego] = useState(user?.nivelJuego || null);
  const [fotoPerfil, setFotoPerfil] = useState(user?.fotoPerfil || null);
  const [saving, setSaving] = useState(false);
  const [showNivelPicker, setShowNivelPicker] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Sync local state with user data
  useEffect(() => {
    if (user && !editMode) {
      setNombre(user.nombre || '');
      setTelefono(user.telefono || '');
      const parsed = parseVivienda(user.vivienda);
      setEscalera(parsed?.escalera || '');
      setPiso(parsed?.piso || '');
      setPuerta(parsed?.puerta || '');
      setNivelJuego(user.nivelJuego || null);
      const fotoValida = isValidImageUrl(user.fotoPerfil) ? user.fotoPerfil : null;
      setFotoPerfil(fotoValida);
      setImageError(false);
    }
  }, [user, editMode]);

  const cancelEdit = () => {
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

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showAlert('Permiso Requerido', 'Necesitamos acceso a tu galería para cambiar la foto de perfil');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: Platform.OS === 'web',
    });

    if (!result.canceled) {
      let imageUri = result.assets[0].uri;
      if (Platform.OS === 'web') {
        const base64 = result.assets[0].base64;
        const mimeType = result.assets[0].mimeType || 'image/jpeg';
        if (base64) {
          imageUri = `data:${mimeType};base64,${base64}`;
        }
      } else if (ImageManipulator) {
        const manipResult = await ImageManipulator.manipulateAsync(
          imageUri,
          [{ resize: { width: 800, height: 800 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );
        imageUri = manipResult.uri;
      }
      setFotoPerfil(imageUri);
      setImageError(false);
    }
  };

  const handleDeleteImage = () => {
    showAlert(
      'Eliminar Foto',
      '¿Estás seguro de que quieres eliminar tu foto de perfil?',
      [
        { text: 'Cancelar', style: 'cancel', onPress: () => {} },
        { text: 'Eliminar', style: 'destructive', onPress: () => { setFotoPerfil(null); setImageError(false); } },
      ]
    );
  };

  const handleSave = async () => {
    if (user?.esDemo) {
      showAlert('Demo Account', 'This is a view-only demo account. You cannot make reservations or modifications.');
      return;
    }

    let vivienda = user?.vivienda;
    if (user?.esAdmin) {
      const viviendaValidacion = validarViviendaComponentes(escalera, piso, puerta);
      if (!viviendaValidacion.valido) {
        showAlert('Error en vivienda', Object.values(viviendaValidacion.errores).join('\n'));
        return;
      }
      vivienda = combinarVivienda(escalera, piso, puerta);
    }

    const validacion = validarPerfil({ nombre, telefono, vivienda, nivelJuego });
    if (!validacion.valido) {
      showAlert('Errores de validación', Object.values(validacion.errores).join('\n'));
      return;
    }

    setSaving(true);
    const result = await updateProfile({ nombre, telefono, vivienda, nivelJuego, fotoPerfil });
    setSaving(false);

    if (result.success) {
      setEditMode(false);
      setShowNivelPicker(false);
      showAlert('Perfil Actualizado', 'Tus cambios han sido guardados exitosamente');
    } else {
      showAlert('Error', result.error || 'No se pudo actualizar el perfil');
    }
  };

  return {
    editMode, setEditMode,
    nombre, setNombre,
    telefono, setTelefono,
    escalera, setEscalera,
    piso, setPiso,
    puerta, setPuerta,
    nivelJuego, setNivelJuego,
    fotoPerfil, setFotoPerfil,
    saving,
    showNivelPicker, setShowNivelPicker,
    imageError, setImageError,
    cancelEdit,
    handlePickImage,
    handleDeleteImage,
    handleSave,
  };
}
