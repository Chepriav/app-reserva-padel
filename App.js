import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import { ReservasProvider } from './src/context/ReservasContext';
import AppNavigator from './src/navigation/AppNavigator';
import { registerServiceWorker } from './src/services/registerServiceWorker';

export default function App() {
  useEffect(() => {
    // Registrar Service Worker solo en web
    if (Platform.OS === 'web') {
      registerServiceWorker();
    }
  }, []);

  return (
    <AuthProvider>
      <ReservasProvider>
        <AppNavigator />
        <StatusBar style="auto" />
      </ReservasProvider>
    </AuthProvider>
  );
}
