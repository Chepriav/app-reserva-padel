import React from 'react';
import { View, Text, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '../../../constants/colors';
import { NIVELES_JUEGO, esViviendaValida, formatearVivienda } from '../../../constants/config';

export function ProfileApartmentUsers({ user, usuariosVivienda, loadingUsuarios }) {
  if (!user?.vivienda) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        Tu Vivienda ({esViviendaValida(user.vivienda) ? formatearVivienda(user.vivienda) : user.vivienda})
      </Text>
      <View style={styles.infoCard}>
        {loadingUsuarios ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText}>Cargando...</Text>
          </View>
        ) : usuariosVivienda.length === 0 ? (
          <Text style={styles.noUsuariosText}>No hay usuarios registrados en esta vivienda</Text>
        ) : (
          usuariosVivienda.map((usuario, index) => (
            <View key={usuario.id}>
              {index > 0 && <View style={styles.separator} />}
              <View style={styles.row}>
                <View style={styles.avatar}>
                  {usuario.fotoPerfil ? (
                    <Image source={{ uri: usuario.fotoPerfil }} style={styles.avatarImage} />
                  ) : (
                    <Text style={styles.initials}>
                      {usuario.nombre?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?'}
                    </Text>
                  )}
                </View>
                <View style={styles.info}>
                  <Text style={styles.nombre}>
                    {usuario.nombre}
                    {usuario.id === user?.id && <Text style={styles.tu}> (Tú)</Text>}
                  </Text>
                  {usuario.nivelJuego && (
                    <Text style={styles.nivel}>
                      {NIVELES_JUEGO.find((n) => n.value === usuario.nivelJuego)?.label || usuario.nivelJuego}
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
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 12 },
  infoCard: {
    backgroundColor: colors.surface, borderRadius: 12, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },
  separator: { height: 1, backgroundColor: colors.border },
  loadingContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 20, gap: 10 },
  loadingText: { color: colors.textSecondary, fontSize: 14 },
  noUsuariosText: { color: colors.textSecondary, fontSize: 14, textAlign: 'center', padding: 20 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.secondary, justifyContent: 'center', alignItems: 'center',
  },
  avatarImage: { width: 44, height: 44, borderRadius: 22 },
  initials: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  info: { flex: 1 },
  nombre: { fontSize: 16, fontWeight: '600', color: colors.text },
  tu: { fontSize: 14, fontWeight: 'normal', color: colors.primary },
  nivel: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
});
