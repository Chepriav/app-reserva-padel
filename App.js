import React, { useEffect, useState } from 'react';
import { Linking, Platform, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import { ReservationsProvider } from './src/context/ReservationsContext';
import AppNavigator, { navigationRef } from './src/navigation/AppNavigator';
import { registerServiceWorker, setUpdateCallback, applyUpdate } from './src/services/registerServiceWorker';
import { colors } from './src/constants/colors';
import { authService } from './src/services/authService.supabase';

export default function App() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [pendingRecoveryNavigation, setPendingRecoveryNavigation] = useState(false);

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

      // Check if URL has recovery code parameter
      const hasRecoveryCode = url.includes('?code=') || url.includes('&code=');
      const isResetPath = url.includes('reset-password');

      if (hasRecoveryCode || isResetPath) {
        console.log('[App] Handling recovery URL:', url);

        // Handle password recovery tokens
        const result = await authService.handlePasswordRecoveryUrl(url);

        if (result.handled && !result.error) {
          // Session was set successfully, wait a bit for it to propagate
          await new Promise(resolve => setTimeout(resolve, 200));

          // Navigate to reset password screen
          if (navigationRef.isReady()) {
            navigationRef.navigate('ResetPassword');
          } else {
            setPendingRecoveryNavigation(true);
          }
        } else if (result.error) {
          console.error('[App] Error handling recovery URL:', result.error);
          // Still navigate to reset password screen, it will show appropriate error
          if (navigationRef.isReady()) {
            navigationRef.navigate('ResetPassword');
          } else {
            setPendingRecoveryNavigation(true);
          }
        }
      }
    };

    Linking.getInitialURL().then((url) => {
      handleRecoveryUrl(url);
    });

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
          {/* Banner de actualización */}
          {updateAvailable && (
            <View style={styles.updateBanner}>
              <Text style={styles.updateText}>Nueva versión disponible</Text>
              <TouchableOpacity style={styles.updateButton} onPress={handleUpdate}>
                <Text style={styles.updateButtonText}>Actualizar</Text>
              </TouchableOpacity>
            </View>
          )}
          <AppNavigator onReady={handleNavigationReady} />
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
