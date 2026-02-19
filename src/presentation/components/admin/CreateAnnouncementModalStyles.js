import { StyleSheet, Platform } from 'react-native';
import { colors } from '../../../constants/colors';

export const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  container: {
    backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.2, shadowRadius: 8 },
      android: { elevation: 8 },
    }),
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  body: { padding: 16 },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8, marginTop: 16 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.text, backgroundColor: colors.background },
  textArea: { minHeight: 100, paddingTop: 12 },
  tiposContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tipoButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.border, gap: 6 },
  tipoLabel: { fontSize: 13, color: colors.textSecondary },
  destinatariosOptions: { gap: 8 },
  optionButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10 },
  optionButtonSelected: {},
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.border, justifyContent: 'center', alignItems: 'center' },
  radioSelected: { borderColor: colors.primary },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  optionLabel: { fontSize: 15, color: colors.text },
  selectorContainer: { marginTop: 12, marginBottom: 20 },
  footer: { flexDirection: 'row', gap: 12, padding: 16, borderTopWidth: 1, borderTopColor: colors.border },
  cancelButton: { flex: 1, paddingVertical: 14, borderRadius: 10, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  cancelButtonText: { fontSize: 15, fontWeight: '600', color: colors.textSecondary },
  submitButton: { flex: 2, paddingVertical: 14, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center' },
  submitButtonDisabled: { backgroundColor: colors.disabled },
  submitButtonText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});
