import React, { useEffect, useState } from 'react';
import { Platform, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import { ReservationsProvider } from './src/context/ReservationsContext';
import AppNavigator from './src/navigation/AppNavigator';
import { registerServiceWorker, setUpdateCallback, applyUpdate } from './src/services/registerServiceWorker';
import { colors } from './src/constants/colors';

export default function App() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

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
          <AppNavigator />
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
