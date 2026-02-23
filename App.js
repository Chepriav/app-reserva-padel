import React, { useEffect, useState } from 'react';
import { Linking, Platform, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/presentation/context/AuthContext';
import { ReservationsProvider } from './src/presentation/context/ReservationsContext';
import AppNavigator, { navigationRef, setRecoveryFlow } from './src/presentation/navigation/AppNavigator';
import { registerServiceWorker, setUpdateCallback, applyUpdate } from './src/services/registerServiceWorker';
import { colors } from './src/constants/colors';
import { authService } from './src/services/authService.supabase';

// Check for recovery URL immediately on load (before React renders).
// Only treat as recovery if the path explicitly includes 'reset-password'.
// Plain ?code= without that path is an email confirmation link, not a password reset.
const getInitialRecoveryState = () => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const url = window.location.href;
    const hasCode = url.includes('?code=') || url.includes('&code=');
    const isResetPath = url.includes('reset-password');
    const isEmailConfirmedPath = url.includes('/email-confirmed');

    if (isEmailConfirmedPath) {
      // Email confirmation landing — always clear any stuck recovery flag so the
      // app shows the normal Login screen with the confirmation banner instead of
      // accidentally routing to ResetPasswordScreen.
      setRecoveryFlow(false);
      return false;
    }

    if (hasCode && isResetPath) {
      setRecoveryFlow(true);
      return true;
    }
  }
  return false;
};

const initialRecoveryState = getInitialRecoveryState();

export default function App() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [pendingRecoveryNavigation, setPendingRecoveryNavigation] = useState(false);
  const [initialRecoveryFlow, setInitialRecoveryFlow] = useState(initialRecoveryState);
  const [emailConfirmed, setEmailConfirmed] = useState(false);

  useEffect(() => {
    // Registrar Service Worker solo en web
    if (Platform.OS === 'web') {
      // Configurar callback para cuando hay actualización
      setUpdateCallback(() => {
        setUpdateAvailable(true);
      });
      registerServiceWorker();
    }
  }, []);

  useEffect(() => {
    const handleRecoveryUrl = async (url) => {
      if (!url) return;

      const hasCode = url.includes('?code=') || url.includes('&code=');
      const isResetPath = url.includes('reset-password');
      // Supabase can redirect email confirmation either as:
      //   PKCE flow:    ?code=XXXX  (query param)
      //   Implicit flow: #access_token=...&type=signup  (hash fragment)
      //   emailRedirectTo: redirect to /email-confirmed path
      const isSignupHash = url.includes('type=signup');
      const isEmailConfirmedPath = url.includes('/email-confirmed');

      if (hasCode && isResetPath) {
        // Password reset / recovery flow → show ResetPasswordScreen
        setRecoveryFlow(true);
        setInitialRecoveryFlow(true);

        const result = await authService.handlePasswordRecoveryUrl(url);

        // Clean URL after processing
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          const cleanUrl = result.handled && !result.error
            ? window.location.origin + '/reset-password'
            : window.location.origin + '/';
          window.history.replaceState({}, document.title, cleanUrl);
        }
      } else if (hasCode || isSignupHash || isEmailConfirmedPath) {
        // Email confirmation link (registration) — NOT a password reset.
        // Supabase confirms the email server-side before redirecting here,
        // so we always show success. We only sign out any stale session.
        await authService.handleEmailConfirmation();

        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          window.history.replaceState({}, document.title, window.location.origin + '/');
        }

        setEmailConfirmed(true);
        // Auto-hide the confirmation banner after 8 seconds
        setTimeout(() => setEmailConfirmed(false), 8000);
      }
    };

    // For web, check window.location directly
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const currentUrl = window.location.href;
      handleRecoveryUrl(currentUrl);
    } else {
      // For native, use Linking
      Linking.getInitialURL().then((url) => {
        handleRecoveryUrl(url);
      });
    }

    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleRecoveryUrl(url);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handleNavigationReady = () => {
    if (pendingRecoveryNavigation && navigationRef.isReady()) {
      navigationRef.navigate('ResetPassword');
      setPendingRecoveryNavigation(false);
    }
  };

  const handleUpdate = () => {
    applyUpdate();
  };

  return (
    <AuthProvider>
      <ReservationsProvider>
        <View style={styles.container}>
          {/* Banner de email confirmado */}
          {emailConfirmed && (
            <View style={styles.confirmBanner}>
              <Text style={styles.confirmText}>
                ✓ Email confirmado. Tu cuenta está pendiente de aprobación del administrador.
              </Text>
              <TouchableOpacity onPress={() => setEmailConfirmed(false)}>
                <Text style={styles.confirmClose}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          {/* Banner de actualización */}
          {updateAvailable && (
            <View style={styles.updateBanner}>
              <Text style={styles.updateText}>Nueva versión disponible</Text>
              <TouchableOpacity style={styles.updateButton} onPress={handleUpdate}>
                <Text style={styles.updateButtonText}>Actualizar</Text>
              </TouchableOpacity>
            </View>
          )}
          <AppNavigator onReady={handleNavigationReady} initialRecoveryFlow={initialRecoveryFlow} />
        </View>
        <StatusBar style="auto" />
      </ReservationsProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  confirmBanner: {
    backgroundColor: colors.secondary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 1000,
  },
  confirmText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  confirmClose: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    paddingLeft: 12,
  },
  updateBanner: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 1000,
  },
  updateText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  updateButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  updateButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
