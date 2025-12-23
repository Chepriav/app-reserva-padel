import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from './firebaseConfig';

/**
 * Mensajes de error traducidos al español
 */
const ERROR_MESSAGES = {
  'auth/invalid-credential': 'Email o contraseña incorrectos',
  'auth/user-not-found': 'Usuario no encontrado',
  'auth/wrong-password': 'Contraseña incorrecta',
  'auth/too-many-requests': 'Demasiados intentos fallidos. Intenta más tarde',
  'auth/email-already-in-use': 'Este email ya está registrado',
  'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
  'auth/invalid-email': 'Email no válido',
  default: 'Ha ocurrido un error. Intenta de nuevo',
};

/**
 * Obtiene el mensaje de error traducido según el código de Firebase
 */
const getErrorMessage = (errorCode, defaultMessage) => {
  return ERROR_MESSAGES[errorCode] || defaultMessage || ERROR_MESSAGES.default;
};

/**
 * Verifica el estado de aprobación del usuario
 * @returns {Object} { approved: boolean, error?: string }
 */
const checkApprovalStatus = (estadoAprobacion) => {
  if (estadoAprobacion === true || estadoAprobacion === 'aprobado') {
    return { approved: true };
  }

  if (estadoAprobacion === false || estadoAprobacion === 'rechazado') {
    return {
      approved: false,
      error: 'Tu solicitud de registro fue rechazada. Contacta con el administrador'
    };
  }

  return {
    approved: false,
    error: 'Tu cuenta está pendiente de aprobación por un administrador'
  };
};

/**
 * Sube una imagen a Cloudinary
 * @returns {Promise<string>} URL de la imagen subida
 */
const uploadImageToCloudinary = async (imageUri, userId) => {
  const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary no está configurado');
  }

  const formData = new FormData();

  // En web, convertir blob/data URI a base64
  if (typeof window !== 'undefined' && (imageUri.startsWith('blob:') || imageUri.startsWith('data:'))) {
    let base64Data;

    if (imageUri.startsWith('data:')) {
      base64Data = imageUri;
    } else {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }

    formData.append('file', base64Data);
  } else {
    // Para React Native
    formData.append('file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: `profile_${userId}.jpg`,
    });
  }

  formData.append('upload_preset', uploadPreset);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: 'POST', body: formData }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || 'Error al subir imagen');
  }

  return data.secure_url;
};

/**
 * Verifica si la URI es local (necesita subirse)
 */
const isLocalImageUri = (uri) => {
  return uri && (
    uri.startsWith('file://') ||
    uri.startsWith('blob:') ||
    uri.startsWith('data:')
  );
};

/**
 * Servicio de autenticación con Firebase
 */
export const authService = {
  /**
   * Inicia sesión con email y contraseña
   */
  async login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));

      if (!userDoc.exists()) {
        await signOut(auth);
        return { success: false, error: 'Usuario no encontrado en la base de datos' };
      }

      const userData = userDoc.data();
      const approvalCheck = checkApprovalStatus(userData.estadoAprobacion);

      if (!approvalCheck.approved) {
        await signOut(auth);
        return { success: false, error: approvalCheck.error };
      }

      return {
        success: true,
        data: {
          id: userCredential.user.uid,
          email: userCredential.user.email,
          ...userData,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error.code, 'Error al iniciar sesión'),
      };
    }
  },

  /**
   * Cierra la sesión del usuario
   */
  async logout() {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Error al cerrar sesión' };
    }
  },

  /**
   * Obtiene el usuario actualmente autenticado
   */
  async getCurrentUser() {
    try {
      const user = auth.currentUser;

      if (!user) {
        return { success: true, data: null };
      }

      const userDoc = await getDoc(doc(db, 'users', user.uid));

      if (!userDoc.exists()) {
        return { success: true, data: null };
      }

      return {
        success: true,
        data: {
          id: user.uid,
          email: user.email,
          ...userDoc.data(),
        },
      };
    } catch (error) {
      return { success: false, error: 'Error al obtener usuario' };
    }
  },

  /**
   * Registra un nuevo usuario (quedará pendiente de aprobación)
   */
  async register(userData) {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );

      const userDocData = {
        nombre: userData.nombre,
        email: userData.email,
        telefono: userData.telefono,
        vivienda: userData.vivienda,
        esAdmin: false,
        estadoAprobacion: 'pendiente',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'users', userCredential.user.uid), userDocData);
      await signOut(auth);

      return {
        success: true,
        data: { id: userCredential.user.uid, ...userDocData },
        message: 'Registro exitoso. Tu cuenta está pendiente de aprobación por un administrador',
      };
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error.code, 'Error al registrarse'),
      };
    }
  },

  /**
   * Obtiene usuarios pendientes de aprobación (solo admin)
   */
  async getUsuariosPendientes() {
    try {
      const q = query(
        collection(db, 'users'),
        where('estadoAprobacion', '==', 'pendiente')
      );

      const querySnapshot = await getDocs(q);
      const usuarios = [];

      querySnapshot.forEach((docSnapshot) => {
        usuarios.push({ id: docSnapshot.id, ...docSnapshot.data() });
      });

      return { success: true, data: usuarios };
    } catch (error) {
      return {
        success: false,
        error: 'Error al obtener usuarios pendientes',
      };
    }
  },

  /**
   * Aprueba un usuario pendiente (solo admin)
   */
  async aprobarUsuario(userId) {
    try {
      await updateDoc(doc(db, 'users', userId), {
        estadoAprobacion: 'aprobado',
        updatedAt: serverTimestamp(),
      });

      return { success: true, data: { id: userId } };
    } catch (error) {
      return { success: false, error: 'Error al aprobar usuario' };
    }
  },

  /**
   * Rechaza un usuario pendiente (solo admin)
   */
  async rechazarUsuario(userId) {
    try {
      await updateDoc(doc(db, 'users', userId), {
        estadoAprobacion: 'rechazado',
        updatedAt: serverTimestamp(),
      });

      return { success: true, data: { id: userId } };
    } catch (error) {
      return { success: false, error: 'Error al rechazar usuario' };
    }
  },

  /**
   * Actualiza el perfil del usuario
   */
  async updateProfile(userId, updates) {
    try {
      // Filtrar campos protegidos
      const { esAdmin, estadoAprobacion, ...safeUpdates } = updates;

      // Subir foto si es URI local
      if (isLocalImageUri(safeUpdates.fotoPerfil)) {
        try {
          safeUpdates.fotoPerfil = await uploadImageToCloudinary(safeUpdates.fotoPerfil, userId);
        } catch (uploadError) {
          return {
            success: false,
            error: uploadError.message || 'Error al subir la foto de perfil',
          };
        }
      }

      await updateDoc(doc(db, 'users', userId), {
        ...safeUpdates,
        updatedAt: serverTimestamp(),
      });

      const userDoc = await getDoc(doc(db, 'users', userId));

      return {
        success: true,
        data: { id: userId, ...userDoc.data() },
      };
    } catch (error) {
      return { success: false, error: 'Error al actualizar perfil' };
    }
  },

  /**
   * Verifica si hay un usuario autenticado
   */
  isAuthenticated() {
    return auth.currentUser !== null;
  },

  /**
   * Envía email para recuperar contraseña
   */
  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      return {
        success: true,
        message: 'Se ha enviado un correo para restablecer tu contraseña',
      };
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error.code, 'Error al enviar el correo de recuperación'),
      };
    }
  },

  /**
   * Suscribe a cambios de autenticación
   * @returns {Function} Función para cancelar la suscripción
   */
  onAuthChange(callback) {
    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        callback(null);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          callback({
            id: user.uid,
            email: user.email,
            ...userDoc.data(),
          });
        } else {
          callback(null);
        }
      } catch (error) {
        callback(null);
      }
    });
  },
};
