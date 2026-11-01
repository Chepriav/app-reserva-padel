import React from 'react';
import { Linking, Text, View, StyleSheet } from 'react-native';
import { colors } from '../../../constants/colors';
import { PROJECT_MAILTO } from '../../../utils/projectContact';

// Author credit and contact for commissions (requested by Carlos, Nov 2026)
export const AUTHOR_NAME = 'Carlos Hernández';

export function openContact() {
  Linking.openURL(PROJECT_MAILTO).catch(() => {});
}

/** "CH" tile. `outline` is the light variant for navy headers. */
export function Monogram({ size = 36, outline = false }) {
  return (
    <View
      style={[
        styles.tile,
        outline && styles.tileOutline,
        { width: size, height: size, borderRadius: size * 0.24 },
      ]}
    >
      <Text style={[styles.text, outline && styles.textOutline, { fontSize: size * 0.4 }]}>CH</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  text: {
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  textOutline: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
});
