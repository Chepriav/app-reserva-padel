import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '../../services/authService.supabase';
import { colors } from '../../constants/colors';
import { styles } from './RegisterScreenStyles';
import { validateRegistro as validateRegistration, validateApartmentComponentes as validateApartmentComponents } from '../../utils/validators';
import { combineApartment } from '../../constants/config';
import { CustomAlert } from '../components/CustomAlert';
import { ApartmentSelector } from '../components/ApartmentSelector';

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [staircase, setStaircase] = useState('');
  const [floor, setFloor] = useState('');
  const [door, setDoor] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Estado para CustomAlert
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    buttons: [],
  });

  const handleRegister = async () => {
    // Validar que las contraseñas coincidan
    if (password !== confirmPassword) {
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: 'Las contraseñas no coinciden',
        buttons: [{ text: 'OK', onPress: () => {} }],
      });
      return;
    }

    // Validar vivienda
    const apartmentValidation = validateApartmentComponents(staircase, floor, door);
    if (!apartmentValidation.valido) {
      const errors = Object.values(apartmentValidation.errores).join('\n');
      setAlertConfig({
        visible: true,
        title: 'Error en vivienda',
        message: errors,
        buttons: [{ text: 'OK', onPress: () => {} }],
      });
      return;
    }

    // Combinar vivienda
    const apartment = combineApartment(staircase, floor, door);

    // Validar datos
    const validation = validateRegistration({
      name,
      email,
      phone,
      apartment,
      password,
    });

    if (!validation.valido) {
      const errors = Object.values(validation.errores).join('\n');
      setAlertConfig({
        visible: true,
        title: 'Errores de validación',
        message: errors,
        buttons: [{ text: 'OK', onPress: () => {} }],
      });
      return;
    }

    setLoading(true);
    const result = await authService.register({
      name,
      email,
      phone,
      apartment,
      password,
    });
    setLoading(false);

    if (result.success) {
      setAlertConfig({
        visible: true,
        title: 'Registro Exitoso',
        message: result.message || 'Tu cuenta está pendiente de aprobación por un administrador. Te notificaremos cuando sea aprobada.',
        buttons: [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ],
      });
    } else {
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: result.error,
        buttons: [{ text: 'OK', onPress: () => {} }],
      });
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Registro de vecino</Text>
          <Text style={styles.subtitle}>
            Completa tus datos para solicitar acceso
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nombre completo *</Text>
            <TextInput
              style={styles.input}
              placeholder="Juan Pérez"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={styles.input}
              placeholder="tu@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Teléfono *</Text>
            <TextInput
              style={styles.input}
              placeholder="666777888"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Vivienda *</Text>
            <ApartmentSelector
              staircase={staircase}
              floor={floor}
              door={door}
              onChangeStaircase={setStaircase}
              onChangeFloor={setFloor}
              onChangeDoor={setDoor}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Contraseña *</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirmar Contraseña *</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Repite tu contraseña"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity style={styles.eyeButton} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Solicitar registro</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>
              Ya tengo cuenta - Iniciar sesión
            </Text>
          </TouchableOpacity>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>ℹ️ Información importante:</Text>
            <Text style={styles.infoText}>
              • Todos los campos marcados con * son obligatorios
            </Text>
            <Text style={styles.infoText}>
              • Tu solicitud será revisada por un administrador
            </Text>
            <Text style={styles.infoText}>
              • Recibirás una notificación cuando sea aprobada
            </Text>
            <Text style={styles.infoText}>
              • Solo vecinos de la urbanización pueden registrarse
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* CustomAlert component */}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onDismiss={() => setAlertConfig({ ...alertConfig, visible: false })}
      />
    </View>
  );
}
