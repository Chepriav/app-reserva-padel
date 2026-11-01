import React, { useState } from 'react';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../constants/colors';
import { AUTHOR_NAME, Monogram, openContact } from './Monogram';
import { AuthorCard } from './AuthorCard';

/**
 * Quiet footer at the end of Perfil. Tapping the signature opens the
 * contact card; the link below goes straight to email.
 */
export function AuthorSignature() {
  const [showCard, setShowCard] = useState(false);

  return (
    <View style={styles.footer}>
      <TouchableOpacity
        style={styles.signature}
        onPress={() => setShowCard(true)}
        activeOpacity={0.6}
        accessibilityRole="button"
        accessibilityLabel={`Diseño y desarrollo: ${AUTHOR_NAME}. Ver contacto`}
      >
        <Monogram />
        <View>
          <Text style={styles.kicker}>Diseño y desarrollo</Text>
          <Text style={styles.name}>{AUTHOR_NAME}</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.linkRow} onPress={openContact} accessibilityRole="link" hitSlop={8}>
        <Text style={styles.link}>¿Tienes un proyecto en mente?</Text>
        <Ionicons name="arrow-forward" size={14} color={colors.secondary} />
      </TouchableOpacity>

      <AuthorCard visible={showCard} onClose={() => setShowCard(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 36,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  signature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  kicker: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.textSecondary,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    letterSpacing: -0.2,
    marginTop: 1,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  link: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.secondary,
  },
});
