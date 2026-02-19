import { StyleSheet, Platform } from 'react-native';
import { colors } from '../../constants/colors';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingTop: Platform.OS === 'web' ? 0 : 0,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  reservaCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  reservaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pistaNombre: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  estadoBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  estadoConfirmada: {
    backgroundColor: colors.secondary,
  },
  estadoCancelada: {
    backgroundColor: colors.error,
  },
  estadoCompletada: {
    backgroundColor: colors.disabled,
  },
  estadoText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  reservaInfo: {
    marginBottom: 12,
  },
  fecha: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
  },
  horario: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 8,
  },
  reservadoPor: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  jugadoresContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  jugadoresLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  jugadorNombre: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  cancelarButton: {
    backgroundColor: colors.error,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  cancelarButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  prioridadBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  prioridadGarantizada: {
    backgroundColor: colors.reservaGarantizada,
  },
  prioridadProvisional: {
    backgroundColor: colors.reservaProvisional,
  },
  prioridadText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
  },
  avisoProvisional: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#fffbeb',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.reservaProvisional,
  },
  avisoProvisionalText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
  estadoDisfrutada: {
    backgroundColor: colors.reservaPasada,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
});
