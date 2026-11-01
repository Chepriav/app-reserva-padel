import React, { useState } from 'react';
import { Animated, Linking, Modal, Pressable, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import { useToggleAnimation } from './Motion';
import { PROJECT_MAILTO } from '../../utils/projectContact';

// Author credit and contact for commissions (requested by Charly, Nov 2026)
function openContact() {
  Linking.openURL(PROJECT_MAILTO).catch(() => {});
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
        accessibilityLabel="Diseño y desarrollo: Charly. Ver contacto"
      >
        <View style={styles.monogram}>
          <Text style={styles.monogramText}>C</Text>
        </View>
        <View>
          <Text style={styles.kicker}>Diseño y desarrollo</Text>
          <Text style={styles.name}>Charly</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity onPress={openContact} accessibilityRole="link" hitSlop={8}>
        <Text style={styles.link}>¿Tienes un proyecto en mente?</Text>
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
              <Text style={styles.kicker}>Hecho por Charly</Text>
              <Text style={styles.cardTitle}>¿Tienes algo en mente?</Text>
              <Text style={styles.cardText}>
                Apps, webs, juegos, proyectos con inteligencia artificial o ese problema informático que se te
                resiste. Cuéntame qué necesitas y lo vemos.
              </Text>
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
    gap: 10,
    marginHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 32,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  signature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  monogram: {
    width: 30,
    height: 30,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monogramText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  kicker: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.textSecondary,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.2,
  },
  link: {
    fontSize: 13,
    color: colors.secondary,
    textDecorationLine: 'underline',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
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
  cardTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: colors.text,
    marginTop: 6,
  },
  cardText: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
    marginTop: 8,
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
