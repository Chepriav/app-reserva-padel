import React from 'react';
import { View, Text, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '../../../constants/colors';
import { getSkillLevelLabel, isApartmentValid, formatApartment } from '../../../constants/config';

export function ProfileApartmentUsers({ user, apartmentUsers, loadingUsers }) {
  if (!user?.apartment) return null;
  const currentUserId = user?.id;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        Tu vivienda · {isApartmentValid(user.apartment) ? formatApartment(user.apartment) : user.apartment}
      </Text>
      <View style={styles.infoCard}>
        {loadingUsers ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText}>Cargando...</Text>
          </View>
        ) : apartmentUsers.length === 0 ? (
          <Text style={styles.noUsersText}>No hay usuarios registrados en esta vivienda</Text>
        ) : (
          apartmentUsers.map((apartmentUser, index) => (
            <View key={apartmentUser.id}>
              {index > 0 && <View style={styles.separator} />}
              <View style={styles.row}>
                <View style={styles.avatar}>
                  {apartmentUser.profilePhoto ? (
                    <Image source={{ uri: apartmentUser.profilePhoto }} style={styles.avatarImage} />
                  ) : (
                    <Text style={styles.initials}>
                      {apartmentUser.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?'}
                    </Text>
                  )}
                </View>
                <View style={styles.info}>
                  <Text style={styles.name}>
                    {apartmentUser.name}
                    {apartmentUser.id === currentUserId && <Text style={styles.your}> (Tú)</Text>}
                  </Text>
                  {apartmentUser.skillLevel && (
                    <Text style={styles.level}>
                      {getSkillLevelLabel(apartmentUser.skillLevel)}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: 16, paddingTop: 20 },
  sectionTitle: {
    fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginBottom: 8, marginLeft: 4,
    textTransform: 'uppercase', letterSpacing: 0.6,
  },
  infoCard: {
    backgroundColor: colors.surface, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 4,
    borderWidth: 1, borderColor: colors.border,
  },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  loadingContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 20, gap: 10 },
  loadingText: { color: colors.textSecondary, fontSize: 14 },
  noUsersText: { color: colors.textSecondary, fontSize: 14, textAlign: 'center', padding: 20 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.secondary, justifyContent: 'center', alignItems: 'center',
  },
  avatarImage: { width: 44, height: 44, borderRadius: 22 },
  initials: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', color: colors.text },
  your: { fontSize: 14, fontWeight: 'normal', color: colors.primary },
  level: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
});
