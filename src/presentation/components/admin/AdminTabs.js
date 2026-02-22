import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { colors } from '../../../constants/colors';

/**
 * Header del panel de administración
 */
export function AdminHeader() {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>Panel de Administración</Text>
    </View>
  );
}

/**
 * Tabs de navegación del panel admin
 */
export function AdminTabs({
  activeTab,
  onTabChange,
  requestsCount,
  usersCount,
}) {
  return (
    <View style={styles.tabsContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'requests' && styles.tabActive]}
        onPress={() => onTabChange('requests')}
      >
        <Text
          style={[
            styles.tabText,
            activeTab === 'requests' && styles.tabTextActive,
          ]}
        >
          Solicitudes ({requestsCount})
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'users' && styles.tabActive]}
        onPress={() => onTabChange('users')}
      >
        <Text
          style={[
            styles.tabText,
            activeTab === 'users' && styles.tabTextActive,
          ]}
        >
          Usuarios ({usersCount})
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'configuration' && styles.tabActive]}
        onPress={() => onTabChange('configuration')}
      >
        <Text
          style={[
            styles.tabText,
            activeTab === 'configuration' && styles.tabTextActive,
          ]}
        >
          Configuración
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.accent,
    padding: 20,
    paddingTop: Platform.OS === 'web' ? 20 : 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.accent,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.accent,
    fontWeight: '600',
  },
});
