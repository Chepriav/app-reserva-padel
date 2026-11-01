import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { AUTHOR_NAME, Monogram } from './Monogram';
import { AuthorCard } from './AuthorCard';

/**
 * Tiny "CH" mark for the right corner of the navy screen headers.
 * Tapping it opens the contact card; it never pops up by itself.
 */
export function AuthorMark({ style }) {
  const [showCard, setShowCard] = useState(false);

  return (
    <>
      <TouchableOpacity
        style={[styles.touch, style]}
        onPress={() => setShowCard(true)}
        activeOpacity={0.6}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel={`Diseño y desarrollo: ${AUTHOR_NAME}`}
      >
        <Monogram size={24} outline />
      </TouchableOpacity>
      <AuthorCard visible={showCard} onClose={() => setShowCard(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  touch: {
    marginLeft: 12,
  },
});
