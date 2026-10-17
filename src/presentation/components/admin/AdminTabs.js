import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { colors } from '../../../constants/colors';
import { TabBar } from '../TabBar';

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
        {isLogView ? 'Registros' : 'Administración'}
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
    <TabBar
      tabs={[
        { key: 'requests', label: 'Solicitudes', alert: requestsCount },
        { key: 'users', label: 'Usuarios', count: usersCount },
        { key: 'configuration', label: 'Ajustes' },
      ]}
      activeKey={activeTab}
      onChange={onTabChange}
    />
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: Platform.OS === 'web' ? 14 : 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  titleLog: {},
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
});
