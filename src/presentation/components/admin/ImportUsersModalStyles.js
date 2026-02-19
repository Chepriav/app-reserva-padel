import { StyleSheet, Platform } from 'react-native';
import { colors } from '../../../constants/colors';

export const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    maxWidth: 600,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 20,
  },
  phaseContainer: {
    alignItems: 'center',
    gap: 16,
  },
  phaseTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  phaseDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  fileInputContainer: {
    width: '100%',
    marginTop: 8,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  selectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  exampleBox: {
    width: '100%',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  exampleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  exampleCode: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 4,
  },
  exampleCodeText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
    color: colors.text,
  },
  downloadLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  downloadLinkText: {
    fontSize: 14,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  summaryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.successLight || '#e8f5e9',
    padding: 16,
    borderRadius: 8,
    width: '100%',
  },
  summaryBoxError: {
    backgroundColor: colors.warningLight || '#fff3e0',
  },
  summaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  errorDetailsBox: {
    width: '100%',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 8,
    maxHeight: 200,
  },
  errorDetailsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  errorList: {
    maxHeight: 150,
  },
  errorItem: {
    marginBottom: 8,
  },
  errorItemText: {
    fontSize: 13,
    color: colors.error,
  },
  errorMore: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  progressContainer: {
    width: '100%',
    gap: 8,
  },
  progressBarBackground: {
    width: '100%',
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  progressText: {
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
    fontWeight: '600',
  },
  currentUserText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  counterRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  counterBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  counterText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
});
