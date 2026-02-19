import React from 'react';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import TabNavigator from './TabNavigator';
import { ActivityIndicator, View } from 'react-native';
import { colors } from '../../constants/colors';

const Stack = createStackNavigator();

// Referencia global para navegación desde fuera de componentes (ej: Service Worker)
export const navigationRef = createNavigationContainerRef();

// Flag global para indicar flujo de recovery activo
// Uses localStorage on web for persistence across renders
const RECOVERY_FLAG_KEY = 'padel_recovery_flow';

export function setRecoveryFlow(value) {
  if (typeof window !== 'undefined' && window.localStorage) {
    if (value) {
      window.localStorage.setItem(RECOVERY_FLAG_KEY, 'true');
    } else {
      window.localStorage.removeItem(RECOVERY_FLAG_KEY);
    }
  }
}

export function getRecoveryFlow() {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage.getItem(RECOVERY_FLAG_KEY) === 'true';
  }
  return false;
}

/**
 * Navega a una pantalla específica desde fuera de componentes React
 * Útil para navegación desde notificaciones push
 */
export function navigateFromNotification(screenName) {
  if (navigationRef.isReady()) {
    navigationRef.navigate('Main', { screen: screenName });
  }
}

export default function AppNavigator({ onReady, initialRecoveryFlow = false }) {
  const { isAuthenticated, loading } = useAuth();

  // Check if we should start in recovery flow (check localStorage)
  const startInRecovery = initialRecoveryFlow || getRecoveryFlow();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef} onReady={onReady}>
      <Stack.Navigator
        screenOptions={{
          headerShown: true,
          headerStyle: {
            backgroundColor: colors.primary,
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        {startInRecovery ? (
          // Recovery flow: always show ResetPassword first (regardless of auth state)
          // This handles the case where user clicks reset link and session is being established
          <>
            <Stack.Screen
              name="ResetPassword"
              component={ResetPasswordScreen}
              options={{ title: 'Restablecer contraseña' }}
            />
            <Stack.Screen
              name="Main"
              component={TabNavigator}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false }}
            />
          </>
        ) : isAuthenticated ? (
          // Normal authenticated flow
          <>
            <Stack.Screen
              name="Main"
              component={TabNavigator}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="ResetPassword"
              component={ResetPasswordScreen}
              options={{ title: 'Restablecer contraseña' }}
            />
          </>
        ) : (
          // Not authenticated, not in recovery
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Registro"
              component={RegisterScreen}
              options={{
                title: 'Registro de Vecino',
                cardStyle: { flex: 1 },
              }}
            />
            <Stack.Screen
              name="ResetPassword"
              component={ResetPasswordScreen}
              options={{ title: 'Restablecer contraseña' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
