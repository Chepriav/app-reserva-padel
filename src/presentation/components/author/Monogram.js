import React from 'react';
import { Linking, Text, View, StyleSheet } from 'react-native';
import { colors } from '../../../constants/colors';
import { PROJECT_MAILTO } from '../../../utils/projectContact';

// Author credit and contact for commissions (requested by Carlos, Nov 2026)
export const AUTHOR_NAME = 'Carlos Hernández';

export function openContact() {
  Linking.openURL(PROJECT_MAILTO).catch(() => {});
}

/** "CH" tile used in the Perfil signature and the contact card. */
export function Monogram({ size = 36 }) {
  return (
    <View
      style={[styles.tile, { width: size, height: size, borderRadius: size * 0.24 }]}
    >
      <Text style={[styles.text, { fontSize: size * 0.4 }]}>CH</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
});
