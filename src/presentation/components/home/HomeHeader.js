import React from 'react';
import { View, Text, StyleSheet, Switch, Platform } from 'react-native';
import { colors } from '../../../constants/colors';

/**
 * Cabecera de HomeScreen con saludo y switch de modo bloqueo
 */
export function HomeHeader({ userName, isAdmin, blockoutMode, onModoBlockoutChange }) {
  return (
    <View style={[styles.header, blockoutMode && styles.headerModoBlockout]}>
      <View style={styles.headerContent}>
        {/* flex: 1 keeps the admin switch visible with long names */}
        <View style={styles.headerText}>
          <Text style={styles.greeting} numberOfLines={1}>Hola, {userName?.trim().split(/\s+/)[0]}</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {blockoutMode ? 'Modo bloqueo activo' : 'Selecciona pista y horario'}
          </Text>
        </View>
        {isAdmin && (
          <View style={styles.modoBlockoutContainer}>
            <Text style={styles.modoBlockoutLabel}>Bloqueo</Text>
            <Switch
              value={blockoutMode}
              onValueChange={onModoBlockoutChange}
              trackColor={{ false: '#767577', true: 'rgba(255, 255, 255, 0.55)' }}
              thumbColor="#fff"
              activeThumbColor="#fff"
              accessibilityLabel="Modo bloqueo"
            />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'web' ? 12 : 40,
  },
  headerModoBlockout: {
    backgroundColor: colors.blocked,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    minWidth: 0,
    marginRight: 12,
  },
  greeting: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.85,
    marginTop: 2,
  },
  modoBlockoutContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modoBlockoutLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
