import { StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  header: { alignItems: 'center', marginBottom: 28 },
  logo: { width: 88, height: 88, borderRadius: 44, marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '700', color: colors.primary, letterSpacing: -0.4 },
  subtitle: { fontSize: 15, color: colors.textSecondary, marginTop: 6, textAlign: 'center' },
  form: {
    backgroundColor: colors.surface, borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: colors.border,
    maxWidth: 400, width: '100%', alignSelf: 'center',
  },
  inputContainer: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, backgroundColor: colors.background,
  },
  passwordContainer: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1,
    borderColor: colors.border, borderRadius: 10, backgroundColor: colors.background,
  },
  passwordInput: { flex: 1, minWidth: 0, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  eyeButton: { padding: 12 },
  button: {
    backgroundColor: colors.primary, borderRadius: 10,
    paddingVertical: 15, alignItems: 'center', marginTop: 4,
  },
  buttonDisabled: { backgroundColor: colors.disabled },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  registroButton: { marginTop: 16, padding: 12, alignItems: 'center' },
  registroButtonText: { color: colors.primary, fontSize: 14, fontWeight: '500' },
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
