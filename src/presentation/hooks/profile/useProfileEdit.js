import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { parseApartment, combineApartment, SKILL_LEVELS } from '../../../constants/config';
import { validateProfile, validateApartmentComponentes } from '../../../utils/validators';

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
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const apartmentParsed = parseApartment(user?.apartment);
  const [staircase, setStaircase] = useState(apartmentParsed?.stair || '');
  const [floor, setFloor] = useState(apartmentParsed?.floor || '');
  const [door, setDoor] = useState(apartmentParsed?.door || '');
  const [skillLevel, setSkillLevel] = useState(user?.skillLevel || null);
  const [profilePhoto, setProfilePhoto] = useState(user?.profilePhoto || null);
  const [saving, setSaving] = useState(false);
  const [showLevelPicker, setShowLevelPicker] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Sync local state with user data
  useEffect(() => {
    if (user && !editMode) {
      setName(user.name || '');
      setPhone(user.phone || '');
      const parsed = parseApartment(user.apartment);
      setStaircase(parsed?.stair || '');
      setFloor(parsed?.floor || '');
      setDoor(parsed?.door || '');
      setSkillLevel(user.skillLevel || null);
      const validPhoto = isValidImageUrl(user.profilePhoto) ? user.profilePhoto : null;
      setProfilePhoto(validPhoto);
      setImageError(false);
    }
  }, [user, editMode]);

  const cancelEdit = () => {
    setName(user?.name || '');
    setPhone(user?.phone || '');
    const parsed = parseApartment(user?.apartment);
    setStaircase(parsed?.stair || '');
    setFloor(parsed?.floor || '');
    setDoor(parsed?.door || '');
    setSkillLevel(user?.skillLevel || null);
    setProfilePhoto(user?.profilePhoto || null);
    setEditMode(false);
    setShowLevelPicker(false);
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
      setProfilePhoto(imageUri);
      setImageError(false);
    }
  };

  const handleDeleteImage = () => {
    showAlert(
      'Eliminar Foto',
      '¿Estás seguro de que quieres eliminar tu foto de perfil?',
      [
        { text: 'Cancelar', style: 'cancel', onPress: () => {} },
        { text: 'Eliminar', style: 'destructive', onPress: () => { setProfilePhoto(null); setImageError(false); } },
      ]
    );
  };

  const handleSave = async () => {
    if (user?.isDemo) {
      showAlert('Cuenta demo', 'Esta cuenta es solo de visualización. No puedes hacer reservas ni modificaciones.');
      return;
    }

    let apartment = user?.apartment;
    if (user?.isAdmin) {
      const apartmentValidation = validateApartmentComponentes(staircase, floor, door);
      if (!apartmentValidation.valido) {
        showAlert('Error en vivienda', Object.values(apartmentValidation.errores).join('\n'));
        return;
      }
      apartment = combineApartment(staircase, floor, door);
    }

    const validation = validateProfile({ name, phone, apartment, skillLevel });
    if (!validation.valido) {
      showAlert('Errores de validación', Object.values(validation.errores).join('\n'));
      return;
    }

    setSaving(true);
    const result = await updateProfile({ name, phone, apartment, skillLevel, profilePhoto });
    setSaving(false);

    if (result.success) {
      setEditMode(false);
      setShowLevelPicker(false);
      showAlert('Perfil Actualizado', 'Tus cambios han sido guardados exitosamente');
    } else {
      showAlert('Error', result.error || 'No se pudo actualizar el perfil');
    }
  };

  return {
    editMode, setEditMode,
    name, setName,
    phone, setPhone,
    staircase, setStaircase,
    floor, setFloor,
    door, setDoor,
    skillLevel, setSkillLevel,
    profilePhoto, setProfilePhoto,
    saving,
    showLevelPicker, setShowLevelPicker,
    imageError, setImageError,
    cancelEdit,
    handlePickImage,
    handleDeleteImage,
    handleSave,
  };
}
