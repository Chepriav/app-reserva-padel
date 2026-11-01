import React, { useState } from 'react';
import { Animated, Linking, Modal, Pressable, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import { useToggleAnimation } from './Motion';
import { Ionicons } from '@expo/vector-icons';
import { CONTACT_EMAIL, PROJECT_MAILTO } from '../../utils/projectContact';

// Author credit and contact for commissions (requested by Carlos, Nov 2026)
const AUTHOR_NAME = 'Carlos Hernández';

function openContact() {
  Linking.openURL(PROJECT_MAILTO).catch(() => {});
}

function Monogram({ size = 36 }) {
  return (
    <View style={[styles.monogram, { width: size, height: size, borderRadius: size * 0.24 }]}>
      <Text style={[styles.monogramText, { fontSize: size * 0.4 }]}>CH</Text>
    </View>
  );
}

/**
 * Quiet footer at the end of Perfil. Tapping the signature opens a short
 * card about commissions; the link below goes straight to email.
 */
export function AuthorSignature() {
  const [showCard, setShowCard] = useState(false);
  const appear = useToggleAnimation(showCard, 200);

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

      <Modal visible={showCard} transparent animationType="fade" onRequestClose={() => setShowCard(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowCard(false)} accessibilityLabel="Cerrar">
          <Animated.View
            style={[
              styles.card,
              {
                opacity: appear,
                transform: [{ translateY: appear.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
              },
            ]}
          >
            {/* Stop taps inside the card from closing it */}
            <Pressable>
              <View style={styles.cardHeader}>
                <Monogram size={44} />
                <View style={styles.cardHeaderText}>
                  <Text style={styles.cardName}>{AUTHOR_NAME}</Text>
                  <Text style={styles.cardRole}>Diseño y desarrollo</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <Text style={styles.cardTitle}>¿Tienes algo en mente?</Text>
              <Text style={styles.cardText}>
                Apps, webs, juegos, proyectos con inteligencia artificial o ese problema informático que se te
                resiste. Cuéntame qué necesitas y lo vemos.
              </Text>

              <View style={styles.emailRow}>
                <Ionicons name="mail-outline" size={15} color={colors.textSecondary} />
                <Text style={styles.emailText} selectable>{CONTACT_EMAIL}</Text>
              </View>

              <View style={styles.cardActions}>
                <TouchableOpacity style={styles.secondaryButton} onPress={() => setShowCard(false)}>
                  <Text style={styles.secondaryButtonText}>Cerrar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => { setShowCard(false); openContact(); }}
                  accessibilityRole="link"
                >
                  <Text style={styles.primaryButtonText}>Escríbeme</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
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
  monogram: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monogramText: {
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
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
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 22,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardHeaderText: {
    flexShrink: 1,
  },
  cardName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.2,
  },
  cardRole: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 1,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: 18,
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: colors.text,
  },
  cardText: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
    marginTop: 8,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  emailText: {
    fontSize: 14,
    color: colors.text,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
