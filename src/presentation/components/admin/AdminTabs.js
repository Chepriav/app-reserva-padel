import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { colors } from '../../../constants/colors';

/**
 * Header del panel de administración
 */
export function AdminHeader({ onShowLog, isLogView = false }) {
  return (
    <View style={styles.header}>
      {isLogView && (
        <TouchableOpacity style={styles.backBtn} onPress={onShowLog}>
          <Text style={styles.logBtnText}>← Volver</Text>
        </TouchableOpacity>
      )}
      <Text style={[styles.title, isLogView && styles.titleLog]}>
        {isLogView ? 'Registros' : 'Panel de Administración'}
      </Text>
      {!isLogView && onShowLog && (
        <TouchableOpacity style={styles.logBtn} onPress={onShowLog}>
          <Text style={styles.logBtnText}>Registros</Text>
        </TouchableOpacity>
      )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  titleLog: {
    fontSize: 20,
  },
  backBtn: {
    marginRight: 12,
  },
  logBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  logBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
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
