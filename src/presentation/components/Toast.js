import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, StyleSheet, Platform, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';

// Tiny global emitter so any hook/screen can call showToast() without context
let listener = null;

const ICONS = {
  success: { name: 'checkmark-circle', color: '#68d391' },
  error: { name: 'alert-circle', color: '#fc8181' },
  info: { name: 'information-circle', color: '#90cdf4' },
};

/**
 * Brief, non-blocking confirmation at the bottom of the screen.
 * Use for successes ("Reserva cancelada"); keep dialogs for errors and
 * for confirmations that need a decision.
 */
export function showToast(message, type = 'success') {
  listener?.({ message, type, id: Date.now() });
}

/** Mount once near the app root. */
export function ToastHost() {
  const [toast, setToast] = useState(null);
  const anim = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef(null);

  useEffect(() => {
    listener = (next) => {
      clearTimeout(hideTimer.current);
      setToast(next);
      anim.setValue(0);
      Animated.timing(anim, { toValue: 1, duration: 180, useNativeDriver: Platform.OS !== 'web' }).start();
      const duration = Math.min(5000, 2200 + next.message.length * 25);
      hideTimer.current = setTimeout(() => {
        Animated.timing(anim, { toValue: 0, duration: 180, useNativeDriver: Platform.OS !== 'web' })
          .start(() => setToast(null));
      }, duration);
    };
    return () => {
      listener = null;
      clearTimeout(hideTimer.current);
    };
  }, [anim]);

  if (!toast) return null;
  const icon = ICONS[toast.type] ?? ICONS.success;

  return (
    <View pointerEvents="none" style={styles.wrapper}>
      <Animated.View
        accessibilityLiveRegion="polite"
        accessibilityRole="alert"
        style={[
          styles.toast,
          {
            opacity: anim,
            transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
          },
        ]}
      >
        <Ionicons name={icon.name} size={20} color={icon.color} />
        <Text style={styles.text}>{toast.message}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    // Above the bottom tab bar
    bottom: Platform.OS === 'web' ? 96 : 110,
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 2000,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    maxWidth: 520,
    backgroundColor: colors.text,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 6px 24px rgba(15, 23, 42, 0.25)' }
      : { elevation: 6 }),
  },
  text: {
    flexShrink: 1,
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
  },
});
