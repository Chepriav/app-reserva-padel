import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { styles } from './ResetPasswordScreenStyles';
import { colors } from '../../constants/colors';
import { useAuth } from '../context/AuthContext';
import { authService } from '../../services/authService.supabase';
import { supabase } from '../../services/supabaseConfig';
import { CustomAlert } from '../components/CustomAlert';
import { setRecoveryFlow } from '../navigation/AppNavigator';

export default function ResetPasswordScreen({ navigation }) {
  const { isAuthenticated } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [sessionValid, setSessionValid] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    buttons: [],
  });

  useEffect(() => {
    let isMounted = true;
    let authListener = null;
    let timeoutId = null;

    const finishWithResult = (valid) => {
      if (!isMounted) return;
      setSessionValid(valid);
      setCheckingSession(false);
    };

    const checkSession = async () => {
      try {
        // First check if session already exists
        const { data: { session }, error } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (!error && session) {
          // Session exists, we're good
          finishWithResult(true);
          return;
        }

        // No session yet - wait for auth state change (code exchange in progress)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
          if (!isMounted) return;

          if (event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY') {
            finishWithResult(true);
            if (timeoutId) clearTimeout(timeoutId);
          } else if (event === 'SIGNED_OUT') {
            finishWithResult(false);
          }
        });

        authListener = subscription;

        // Timeout after 5 seconds - if no session by then, link is invalid
        timeoutId = setTimeout(() => {
          if (isMounted && checkingSession) {
            finishWithResult(false);
          }
        }, 5000);

      } catch {
        finishWithResult(false);
      }
    };

    checkSession();

    return () => {
      isMounted = false;
      if (authListener) {
        authListener.unsubscribe();
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  const handleUpdatePassword = async () => {
    if (!password || !confirmPassword) {
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: 'Por favor completa todos los campos',
        buttons: [{ text: 'OK', onPress: () => {} }],
      });
      return;
    }

    if (password.length < 6) {
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: 'La contrasena debe tener al menos 6 caracteres',
        buttons: [{ text: 'OK', onPress: () => {} }],
      });
      return;
    }

    if (password !== confirmPassword) {
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: 'Las contrasenas no coinciden',
        buttons: [{ text: 'OK', onPress: () => {} }],
      });
      return;
    }

    setLoading(true);
    const result = await authService.updatePassword(password);
    setLoading(false);

    if (result.success) {
      // Clear recovery flow flag
      setRecoveryFlow(false);

      setAlertConfig({
        visible: true,
        title: 'Contrasena actualizada',
        message: 'Tu contrasena ha sido actualizada correctamente.',
        buttons: [
          {
            text: 'Continuar',
            onPress: () => {
              setAlertConfig({ ...alertConfig, visible: false });
              // Navigate to home - user is already authenticated
              if (typeof window !== 'undefined') {
                window.location.href = '/';
              } else {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Main' }],
                });
              }
            },
          },
        ],
      });
    } else {
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: result.error,
        buttons: [{ text: 'OK', onPress: () => {} }],
      });
    }
  };

  if (checkingSession) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Comprobando enlace...</Text>
      </View>
    );
  }

  if (!sessionValid) {
    return (
      <View style={styles.invalidContainer}>
        <Text style={styles.invalidTitle}>Enlace no valido</Text>
        <Text style={styles.invalidText}>
          El enlace de recuperacion ha expirado o no es valido. Solicita uno nuevo desde la pantalla de inicio.
        </Text>
        <TouchableOpacity
          style={styles.invalidButton}
          onPress={() => navigation.navigate(isAuthenticated ? 'Main' : 'Login')}
        >
          <Text style={styles.invalidButtonText}>Volver al inicio</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Restablecer Contrasena</Text>
          <Text style={styles.subtitle}>Introduce una nueva contrasena</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nueva contrasena</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={true}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirmar contrasena</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={true}
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleUpdatePassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Actualizar contrasena</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onDismiss={() => setAlertConfig({ ...alertConfig, visible: false })}
      />
    </KeyboardAvoidingView>
  );
}

