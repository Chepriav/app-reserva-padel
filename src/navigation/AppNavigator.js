import React from 'react';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import TabNavigator from './TabNavigator';
import { ActivityIndicator, View } from 'react-native';
import { colors } from '../constants/colors';

const Stack = createStackNavigator();

// Referencia global para navegación desde fuera de componentes (ej: Service Worker)
export const navigationRef = createNavigationContainerRef();

/**
 * Navega a una pantalla específica desde fuera de componentes React
 * Útil para navegación desde notificaciones push
 */
export function navigateFromNotification(screenName) {
  if (navigationRef.isReady()) {
    navigationRef.navigate('Main', { screen: screenName });
  }
}

export default function AppNavigator() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
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
        {isAuthenticated ? (
          <Stack.Screen
            name="Main"
            component={TabNavigator}
            options={{ headerShown: false }}
          />
        ) : (
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
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
