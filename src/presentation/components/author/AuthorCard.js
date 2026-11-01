import React from 'react';
import { Animated, Modal, Pressable, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../constants/colors';
import { CONTACT_EMAIL } from '../../../utils/projectContact';
import { useToggleAnimation } from '../Motion';
import { AUTHOR_NAME, Monogram, openContact } from './Monogram';

/** Short "¿Tienes algo en mente?" card about commissions. */
export function AuthorCard({ visible, onClose }) {
  const appear = useToggleAnimation(visible, 200);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} accessibilityLabel="Cerrar">
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
              <TouchableOpacity style={styles.secondaryButton} onPress={onClose}>
                <Text style={styles.secondaryButtonText}>Cerrar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => { onClose(); openContact(); }}
                accessibilityRole="link"
              >
                <Text style={styles.primaryButtonText}>Escríbeme</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
