import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { styles } from '../../screens/ResetPasswordScreenStyles';

/** Shown before spending a single-use reset link: needs an explicit tap. */
export function ResetLinkContinue({ verifying, onContinue }) {
  return (
    <View style={styles.invalidContainer}>
      <Text style={styles.invalidTitle}>Restablecer contraseña</Text>
      <Text style={styles.invalidText}>Pulsa continuar para elegir tu nueva contraseña.</Text>
      <TouchableOpacity
        style={[styles.invalidButton, verifying && styles.buttonDisabled]}
        onPress={onContinue}
        disabled={verifying}
        accessibilityRole="button"
      >
        {verifying
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.invalidButtonText}>Continuar</Text>}
      </TouchableOpacity>
    </View>
  );
}

/** Shown when the reset link was already used or has expired. */
export function ResetLinkExpired({ onBack }) {
  return (
    <View style={styles.invalidContainer}>
      <Text style={styles.invalidTitle}>Enlace caducado</Text>
      <Text style={styles.invalidText}>
        Este enlace ya se ha usado o ha caducado. Pide uno nuevo en «¿Olvidaste tu contraseña?» y abre solo el último correo que te llegue.
      </Text>
      <TouchableOpacity style={styles.invalidButton} onPress={onBack} accessibilityRole="button">
        <Text style={styles.invalidButtonText}>Volver al inicio</Text>
      </TouchableOpacity>
    </View>
  );
}
