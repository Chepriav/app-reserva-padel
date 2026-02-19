import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { CustomAlert } from '../components/CustomAlert';
import { styles } from './LoginScreenStyles';

export default function LoginScreen({ navigation }) {
  const { login, resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Estado para CustomAlert
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    buttons: [],
  });

  const handleLogin = async () => {
    if (!email || !password) {
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: 'Por favor completa todos los campos',
        buttons: [{ text: 'OK', onPress: () => {} }],
      });
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (!result.success) {
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: result.error,
        buttons: [{ text: 'OK', onPress: () => {} }],
      });
    }
  };

  const handleResetPassword = async () => {
    if (!resetEmail) {
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: 'Por favor ingresa tu email',
        buttons: [{ text: 'OK', onPress: () => {} }],
      });
      return;
    }

    setResetLoading(true);
    const result = await resetPassword(resetEmail);
    setResetLoading(false);

    if (result.success) {
      setShowResetModal(false);
      setResetEmail('');
      setAlertConfig({
        visible: true,
        title: 'Correo Enviado',
        message: result.message,
        buttons: [{ text: 'OK', onPress: () => {} }],
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Reserva Pádel</Text>
          <Text style={styles.subtitle}>Urbanización</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
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
            <Text style={styles.label}>Contraseña</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Iniciar Sesión</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.forgotButton}
            onPress={() => {
              setResetEmail(email);
              setShowResetModal(true);
            }}
          >
            <Text style={styles.forgotButtonText}>
              ¿Olvidaste tu contraseña?
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.registroButton}
            onPress={() => navigation.navigate('Registro')}
          >
            <Text style={styles.registroButtonText}>
              ¿No tienes cuenta? Regístrate aquí
            </Text>
          </TouchableOpacity>

          <View style={styles.demoInfo}>
            <Text style={styles.demoTitle}>Usuarios de prueba:</Text>
            <Text style={styles.demoText}>Email: juan@ejemplo.com</Text>
            <Text style={styles.demoText}>Contraseña: 123456</Text>
            <Text style={styles.demoTextSeparator}>ó</Text>
            <Text style={styles.demoText}>Email: maria@ejemplo.com</Text>
            <Text style={styles.demoText}>Contraseña: 123456</Text>
          </View>
        </View>
      </ScrollView>

      {/* Modal de Recuperación de Contraseña */}
      <Modal
        visible={showResetModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowResetModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Recuperar Contraseña</Text>
            <Text style={styles.modalSubtitle}>
              Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="tu@email.com"
              value={resetEmail}
              onChangeText={setResetEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowResetModal(false);
                  setResetEmail('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalSendButton, resetLoading && styles.buttonDisabled]}
                onPress={handleResetPassword}
                disabled={resetLoading}
              >
                {resetLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalSendText}>Enviar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* CustomAlert component */}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onDismiss={() => setAlertConfig({ ...alertConfig, visible: false })}
      />
    </KeyboardAvoidingView>
  );
}

