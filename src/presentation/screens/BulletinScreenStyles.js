import { StyleSheet, Platform } from 'react-native';
import { colors } from '../../constants/colors';

export const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.primary },
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16, backgroundColor: colors.primary,
  },
  title: { fontSize: 24, fontWeight: '700', color: '#fff' },
  marcarTodasButton: {
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 15,
  },
  marcarTodasText: { fontSize: 13, color: '#fff', fontWeight: '500' },
  tabs: {
    flexDirection: 'row', backgroundColor: colors.primary,
    paddingHorizontal: 16, paddingBottom: 12, gap: 8,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)', gap: 6,
  },
  tabActivo: { backgroundColor: '#fff' },
  tabText: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
  tabTextActivo: { color: colors.primary },
  badge: {
    minWidth: 20, height: 20, borderRadius: 10, backgroundColor: colors.badgeRojo,
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6,
  },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  listContent: { flexGrow: 1, paddingVertical: 10 },
  floatingButton: {
    position: 'absolute',
    bottom: Platform.OS === 'web' ? 20 : 30,
    left: 20, right: 20,
    backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 4, zIndex: 1000,
  },
  floatingButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
