import { StyleSheet, Platform } from 'react-native';
import { colors } from '../../constants/colors';

export const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: colors.background,
    ...(Platform.OS === 'web' && { minHeight: '100%' }),
  },
  scrollView: { flex: 1 },
  scrollContent: {
    padding: 20,
    paddingTop: Platform.OS === 'web' ? 40 : 20,
    paddingBottom: 100,
    ...(Platform.OS !== 'web' && { flexGrow: 1 }),
  },
  header: { marginBottom: 30 },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.primary, marginBottom: 8 },
  subtitle: { fontSize: 16, color: colors.textSecondary },
  form: {
    backgroundColor: colors.surface, borderRadius: 12, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
    maxWidth: 500, width: '100%', alignSelf: 'center',
  },
  inputContainer: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 8,
    padding: 12, fontSize: 16, backgroundColor: colors.surface,
  },
  button: { backgroundColor: colors.primary, borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { backgroundColor: colors.disabled },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  backButton: { marginTop: 16, alignItems: 'center', padding: 12 },
  backButtonText: { color: colors.primary, fontSize: 14, fontWeight: '500' },
  infoBox: {
    marginTop: 20, padding: 16, backgroundColor: colors.background,
    borderRadius: 8, borderWidth: 1, borderColor: colors.border,
  },
  infoTitle: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 },
  infoText: { fontSize: 13, color: colors.textSecondary, marginTop: 4, lineHeight: 18 },
});
