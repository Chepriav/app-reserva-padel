import React, { useState } from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../../constants/colors';
import { AUTHOR_NAME } from './Monogram';
import { AuthorCard } from './AuthorCard';

/**
 * One-line credit just above the bottom tab bar, on every main screen.
 * Tapping it opens the contact card; it never pops up by itself.
 */
export function AuthorStrip() {
  const [showCard, setShowCard] = useState(false);

  return (
    <>
      <TouchableOpacity
        style={styles.strip}
        onPress={() => setShowCard(true)}
        activeOpacity={0.6}
        accessibilityRole="button"
        accessibilityLabel={`Diseño y desarrollo: ${AUTHOR_NAME}. Ver contacto`}
      >
        <Text style={styles.text} numberOfLines={1}>Diseño y desarrollo · {AUTHOR_NAME}</Text>
      </TouchableOpacity>
      <AuthorCard visible={showCard} onClose={() => setShowCard(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  strip: {
    paddingVertical: 4,
    alignItems: 'center',
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  text: {
    fontSize: 10,
    letterSpacing: 0.3,
    color: colors.textSecondary,
  },
});
