import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform, View, Text, StyleSheet } from 'react-native';
import HomeScreen from '../screens/HomeScreen';
import ReservasScreen from '../screens/ReservasScreen';
import PartidasScreen from '../screens/PartidasScreen';
import TablonScreen from '../screens/TablonScreen';
import PerfilScreen from '../screens/PerfilScreen';
import AdminScreen from '../screens/AdminScreen';
import { colors } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import { useContadorTablon } from '../hooks';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  const { user } = useAuth();
  const esAdmin = user?.esAdmin;
  const { contadorTotal } = useContadorTablon(user?.id);

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: Platform.OS === 'ios' ? 90 : 60,
          paddingBottom: Platform.OS === 'ios' ? 30 : 10,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tab.Screen
        name="Inicio"
        component={HomeScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="home" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Mis Reservas"
        component={ReservasScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="calendar" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Partidas"
        component={PartidasScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="partidas" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Tablón"
        component={TablonScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="tablon" color={color} size={size} badge={contadorTotal} />
          ),
        }}
      />
      {esAdmin && (
        <Tab.Screen
          name="Admin"
          component={AdminScreen}
          options={{
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <TabIcon name="admin" color={color} size={size} />
            ),
          }}
        />
      )}
      <Tab.Screen
        name="Perfil"
        component={PerfilScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="user" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Componente simple de icono con soporte para badge
const TabIcon = ({ name, color, size, badge }) => {
  const icons = {
    home: '🏠',
    calendar: '📅',
    partidas: '🎾',
    tablon: '📢',
    admin: '⚙️',
    user: '👤',
  };

  return (
    <View style={styles.iconContainer}>
      <Text style={{ fontSize: size || 24, color }}>
        {icons[name] || '•'}
      </Text>
      {badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {badge > 99 ? '99+' : badge}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: colors.badgeRojo,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
});
