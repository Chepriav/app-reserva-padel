import { StyleSheet, Platform } from 'react-native';
import { colors } from '../../constants/colors';

export const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.primary },
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: colors.primary,
  },
  title: { fontSize: 20, fontWeight: '700', color: '#fff' },
  markTodasButton: {
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 15,
  },
  markTodasText: { fontSize: 13, color: '#fff', fontWeight: '500' },
  tabContent: { flex: 1 },
  listContent: { flexGrow: 1, paddingVertical: 10 },
  skeletonWrap: { paddingHorizontal: 12 },
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
