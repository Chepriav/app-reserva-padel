import { StyleSheet, Platform } from 'react-native';
import { colors } from '../../constants/colors';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  header: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 36, fontWeight: 'bold', color: colors.primary, marginBottom: 8 },
  subtitle: { fontSize: 20, color: colors.textSecondary },
  form: {
    backgroundColor: colors.surface, borderRadius: 12, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
    maxWidth: 400, width: '100%', alignSelf: 'center',
  },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 8,
    padding: 12, fontSize: 16, backgroundColor: colors.surface,
  },
  passwordContainer: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1,
    borderColor: colors.border, borderRadius: 8, backgroundColor: colors.surface,
  },
  passwordInput: { flex: 1, padding: 12, fontSize: 16 },
  eyeButton: { padding: 12 },
  eyeIcon: { fontSize: 18 },
  button: {
    backgroundColor: colors.primary, borderRadius: 8,
    padding: 16, alignItems: 'center', marginTop: 8,
  },
  buttonDisabled: { backgroundColor: colors.disabled },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  registroButton: { marginTop: 16, padding: 12, alignItems: 'center' },
  registroButtonText: { color: colors.primary, fontSize: 14, fontWeight: '500' },
  demoInfo: {
    marginTop: 24, padding: 16, backgroundColor: colors.background,
    borderRadius: 8, borderWidth: 1, borderColor: colors.border,
  },
  demoTitle: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 },
  demoText: {
    fontSize: 13, color: colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  demoTextSeparator: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginVertical: 4 },
  forgotButton: { marginTop: 12, alignItems: 'center' },
  forgotButtonText: { color: colors.textSecondary, fontSize: 14 },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center', alignItems: 'center', padding: 20,
  },
  modalContent: {
    backgroundColor: colors.surface, borderRadius: 16, padding: 24,
    width: '100%', maxWidth: 400,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 8,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginBottom: 8, textAlign: 'center' },
  modalSubtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: 20, textAlign: 'center', lineHeight: 20 },
  modalInput: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 8,
    padding: 12, fontSize: 16, backgroundColor: colors.background, marginBottom: 20,
  },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  modalCancelButton: {
    flex: 1, padding: 14, alignItems: 'center', marginRight: 8,
    borderRadius: 8, borderWidth: 1, borderColor: colors.border,
  },
  modalCancelText: { color: colors.textSecondary, fontSize: 16, fontWeight: '500' },
  modalSendButton: {
    flex: 1, backgroundColor: colors.primary, padding: 14,
    alignItems: 'center', marginLeft: 8, borderRadius: 8,
  },
  modalSendText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
