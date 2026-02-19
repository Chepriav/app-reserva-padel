import { StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 32 },
  title: { fontSize: 28, fontWeight: '700', color: colors.text },
  subtitle: { marginTop: 8, fontSize: 16, color: colors.textSecondary },
  form: {
    backgroundColor: colors.surface, padding: 24, borderRadius: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 2,
  },
  inputContainer: { marginBottom: 16 },
  label: { fontSize: 14, color: colors.textSecondary, marginBottom: 8 },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 12, fontSize: 16,
    color: colors.text, backgroundColor: colors.surface,
  },
  button: { backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { backgroundColor: colors.disabled },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, padding: 24 },
  loadingText: { marginTop: 12, fontSize: 16, color: colors.textSecondary },
  invalidContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, padding: 24 },
  invalidTitle: { fontSize: 22, fontWeight: '600', color: colors.text, marginBottom: 12 },
  invalidText: { fontSize: 16, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  invalidButton: { marginTop: 20, backgroundColor: colors.primary, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10 },
  invalidButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
