import { StyleSheet, Platform } from 'react-native';
import { colors } from '../../constants/colors';

export const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: colors.background,
    ...(Platform.OS === 'web' && { minHeight: '100%' }),
  },
  scrollView: { flex: 1 },
  scrollContent: {
    padding: 16,
    paddingTop: 20,
    paddingBottom: 100,
    ...(Platform.OS !== 'web' && { flexGrow: 1 }),
  },
  header: { marginBottom: 16, maxWidth: 500, width: '100%', alignSelf: 'center' },
  subtitle: { fontSize: 15, lineHeight: 21, color: colors.textSecondary },
  form: {
    backgroundColor: colors.surface, borderRadius: 14, padding: 20,
    borderWidth: 1, borderColor: colors.border,
    maxWidth: 500, width: '100%', alignSelf: 'center',
  },
  inputContainer: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, backgroundColor: colors.background,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.background,
  },
  passwordInput: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  eyeButton: {
    padding: 12,
  },
  button: { backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 15, alignItems: 'center', marginTop: 4 },
  buttonDisabled: { backgroundColor: colors.disabled },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  backButton: { marginTop: 16, alignItems: 'center', padding: 12 },
  backButtonText: { color: colors.primary, fontSize: 14, fontWeight: '500' },
  infoBox: {
    marginTop: 20, padding: 16, backgroundColor: colors.background,
    borderRadius: 10, borderWidth: 1, borderColor: colors.border,
  },
  infoTitle: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 },
  infoText: { fontSize: 13, color: colors.textSecondary, marginTop: 4, lineHeight: 18 },
});
