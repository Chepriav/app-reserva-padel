import React, { useEffect, useRef, useState } from 'react';
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
import { ResetLinkContinue, ResetLinkExpired } from '../components/auth/ResetLinkViews';
import { setRecoveryFlow } from '../navigation/AppNavigator';

export default function ResetPasswordScreen({ navigation }) {
  const { isAuthenticated } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [sessionValid, setSessionValid] = useState(false);
  const finishedRef = useRef(false);
  // token_hash links are single-use, and mail scanners (common on work
  // accounts) open them before the person does. Spend the token only when
  // the person taps "Continuar", so an automatic visit can't burn it.
  const pendingLinkRef = useRef(
    Platform.OS === 'web' && typeof window !== 'undefined' && /[?&]token_hash=/.test(window.location.href)
      ? window.location.href
      : null
  );
  const [awaitingTap, setAwaitingTap] = useState(!!pendingLinkRef.current);
  const [verifying, setVerifying] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    buttons: [],
  });

  useEffect(() => {
    if (awaitingTap || finishedRef.current) return undefined;
    let isMounted = true;
    let authListener = null;
    let timeoutId = null;

    const finishWithResult = (valid) => {
      if (!isMounted || finishedRef.current) return;
      finishedRef.current = true;
      if (!valid) {
        // Invalid or expired link — clear the recovery flag so the next app
        // load goes back to the normal Login screen instead of looping here.
        setRecoveryFlow(false);
      }
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

        // Timeout after 12 seconds - if no session by then, link is invalid.
        // Uses finishedRef (not state) to avoid stale closure: the ref is mutated
        // so the guard inside finishWithResult sees the correct value.
        timeoutId = setTimeout(() => {
          if (isMounted) {
            finishWithResult(false);
          }
        }, 12000);

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
  }, [awaitingTap]);

  const handleContinue = async () => {
    setVerifying(true);
    const result = await authService.handlePasswordRecoveryUrl(pendingLinkRef.current);
    pendingLinkRef.current = null;
    const path = result.error ? '/' : '/reset-password';
    window.history.replaceState({}, document.title, window.location.origin + path);
    if (result.error) {
      finishedRef.current = true;
      setRecoveryFlow(false);
      setSessionValid(false);
      setCheckingSession(false);
    }
    setVerifying(false);
    setAwaitingTap(false);
  };

  const handleUpdatePassword = async () => {
    if (!password || !confirmPassword) {
      setAlertConfig({
        visible: true,
        title: 'Faltan datos',
        message: 'Rellena todos los campos.',
        buttons: [{ text: 'OK', onPress: () => {} }],
      });
      return;
    }

    if (password.length < 6) {
      setAlertConfig({
        visible: true,
        title: 'Contraseña demasiado corta',
        message: 'La contraseña debe tener al menos 6 caracteres',
        buttons: [{ text: 'OK', onPress: () => {} }],
      });
      return;
    }

    if (password !== confirmPassword) {
      setAlertConfig({
        visible: true,
        title: 'Las contraseñas no coinciden',
        message: 'Escribe la misma contraseña en los dos campos.',
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
        title: 'Contraseña actualizada',
        message: 'Ya puedes entrar con tu nueva contraseña.',
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
        title: 'No se pudo cambiar la contraseña',
        message: result.error,
        buttons: [{ text: 'OK', onPress: () => {} }],
      });
    }
  };

  if (awaitingTap) {
    return <ResetLinkContinue verifying={verifying} onContinue={handleContinue} />;
  }

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
      <ResetLinkExpired
        onBack={() => {
          setRecoveryFlow(false);
          navigation.navigate(isAuthenticated ? 'Main' : 'Login');
        }}
      />
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Restablecer contraseña</Text>
          <Text style={styles.subtitle}>Introduce una nueva contraseña</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nueva contraseña</Text>
            <TextInput
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
              placeholder="••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={true}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirmar contraseña</Text>
            <TextInput
              placeholderTextColor={colors.textSecondary}
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
              <Text style={styles.buttonText}>Actualizar contraseña</Text>
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

