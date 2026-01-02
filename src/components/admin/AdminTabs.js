import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { colors } from '../../constants/colors';

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
  tabActiva,
  onTabChange,
  contadorSolicitudes,
  contadorUsuarios,
}) {
  return (
    <View style={styles.tabsContainer}>
      <TouchableOpacity
        style={[styles.tab, tabActiva === 'solicitudes' && styles.tabActive]}
        onPress={() => onTabChange('solicitudes')}
      >
        <Text
          style={[
            styles.tabText,
            tabActiva === 'solicitudes' && styles.tabTextActive,
          ]}
        >
          Solicitudes ({contadorSolicitudes})
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, tabActiva === 'usuarios' && styles.tabActive]}
        onPress={() => onTabChange('usuarios')}
      >
        <Text
          style={[
            styles.tabText,
            tabActiva === 'usuarios' && styles.tabTextActive,
          ]}
        >
          Usuarios ({contadorUsuarios})
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, tabActiva === 'mensajes' && styles.tabActive]}
        onPress={() => onTabChange('mensajes')}
      >
        <Text
          style={[
            styles.tabText,
            tabActiva === 'mensajes' && styles.tabTextActive,
          ]}
        >
          Mensajes
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
