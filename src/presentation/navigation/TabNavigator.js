import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform, View, Text, StyleSheet } from 'react-native';
import HomeScreen from '../screens/HomeScreen';
import ReservationsScreen from '../screens/ReservationsScreen';
import MatchesScreen from '../screens/MatchesScreen';
import BulletinScreen from '../screens/BulletinScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AdminScreen from '../screens/AdminScreen';
import { colors } from '../../constants/colors';
import { useAuth } from '../context/AuthContext';
import { useBulletinCounter } from '../hooks';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  const { user } = useAuth();
  const esAdmin = user?.esAdmin;
  const { totalCount } = useBulletinCounter(user?.id);

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
        component={ReservationsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="calendar" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Partidas"
        component={MatchesScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="partidas" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Tablón"
        component={BulletinScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="tablon" color={color} size={size} badge={totalCount} />
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
        component={ProfileScreen}
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
