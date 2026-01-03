import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  ActivityIndicator,
  Image,
  StyleSheet,
} from 'react-native';
import { colors } from '../../constants/colors';
import { NIVELES_JUEGO } from '../../constants/config';

/**
 * Modal to add a player to the match
 */
export default function AddPlayerModal({
  visible,
  modalState,
  setModalState,
  // Support both English and Spanish prop names
  users,
  usuarios = users,
  loadingUsers,
  loadingUsuarios = loadingUsers,
  currentPlayers,
  jugadoresActuales = currentPlayers,
  onAddCommunity,
  onAddUrbanizacion = onAddCommunity,
  onAddExternal,
  onAddExterno = onAddExternal,
  onClose,
  onCerrar = onClose,
}) {
  const { tipo, busqueda, nombreExterno, nivelExterno } = modalState || {};

  const updateState = (updates) => {
    setModalState(prev => ({ ...prev, ...updates }));
  };

  const filteredUsers = getFilteredUsers(usuarios, busqueda, jugadoresActuales);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCerrar}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>Añadir jugador</Text>

          {/* Type selector */}
          <PlayerTypeSelector
            type={tipo}
            onChange={(newType) => updateState({ tipo: newType })}
          />

          {/* Content based on type */}
          {tipo === 'urbanizacion' ? (
            <SearchUser
              search={busqueda}
              onSearchChange={(text) => updateState({ busqueda: text })}
              users={filteredUsers}
              loading={loadingUsuarios}
              onSelect={onAddUrbanizacion}
            />
          ) : (
            <ExternalPlayer
              name={nombreExterno}
              level={nivelExterno}
              onNameChange={(text) => updateState({ nombreExterno: text })}
              onLevelChange={(level) => updateState({ nivelExterno: level })}
              onAdd={onAddExterno}
            />
          )}

          <TouchableOpacity style={styles.closeButton} onPress={onCerrar}>
            <Text style={styles.closeButtonText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function getFilteredUsers(users, search, currentPlayers) {
  if (!users || !Array.isArray(users)) {
    return [];
  }

  const term = (search || '').toLowerCase().trim();
  let filtered = users;

  if (term) {
    filtered = users.filter(u =>
      u.nombre?.toLowerCase().includes(term) ||
      u.vivienda?.toLowerCase().includes(term)
    );
  }

  const players = currentPlayers || [];

  // Mark already added
  return filtered.slice(0, 20).map(u => ({
    ...u,
    alreadyAdded: players.some(j => j.tipo === 'urbanizacion' && j.usuario?.id === u.id),
  }));
}

function PlayerTypeSelector({ type, onChange }) {
  return (
    <View style={styles.typeButtons}>
      <TouchableOpacity
        style={[styles.typeButton, type === 'urbanizacion' && styles.typeButtonActive]}
        onPress={() => onChange('urbanizacion')}
      >
        <Text style={[styles.typeButtonText, type === 'urbanizacion' && styles.typeButtonTextActive]}>
          De la urbanización
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.typeButton, type === 'externo' && styles.typeButtonActive]}
        onPress={() => onChange('externo')}
      >
        <Text style={[styles.typeButtonText, type === 'externo' && styles.typeButtonTextActive]}>
          Externo
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function SearchUser({ search, onSearchChange, users, loading, onSelect }) {
  return (
    <View style={styles.searchContainer}>
      <TextInput
        style={styles.searchInput}
        placeholder="Buscar por nombre o vivienda..."
        placeholderTextColor={colors.textSecondary}
        value={search}
        onChangeText={onSearchChange}
        autoCapitalize="none"
      />

      <ScrollView style={styles.usersList} nestedScrollEnabled>
        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : users.length === 0 ? (
          <Text style={styles.noResults}>No se encontraron usuarios</Text>
        ) : (
          users.map((user) => (
            <UserOption
              key={user.id}
              user={user}
              onSelect={() => onSelect(user)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

function UserOption({ user, onSelect }) {
  const levelLabel = user.nivelJuego
    ? NIVELES_JUEGO.find(n => n.value === user.nivelJuego)?.label || user.nivelJuego
    : null;

  return (
    <TouchableOpacity
      style={[styles.userOption, user.alreadyAdded && styles.userOptionDisabled]}
      onPress={onSelect}
      disabled={user.alreadyAdded}
    >
      <View style={styles.userAvatar}>
        {user.fotoPerfil ? (
          <Image source={{ uri: user.fotoPerfil }} style={styles.userAvatarImage} />
        ) : (
          <Text style={styles.userAvatarText}>
            {user.nombre?.charAt(0)?.toUpperCase() || '?'}
          </Text>
        )}
      </View>
      <View style={styles.userInfo}>
        <Text style={[styles.userName, user.alreadyAdded && styles.userNameDisabled]}>
          {user.nombre}
          {user.alreadyAdded && ' (añadido)'}
        </Text>
        <Text style={styles.userApartment}>
          Vivienda {user.vivienda}
          {levelLabel && ` • ${levelLabel}`}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function ExternalPlayer({ name, level, onNameChange, onLevelChange, onAdd }) {
  return (
    <View style={styles.externalContainer}>
      <Text style={styles.label}>Nombre del jugador</Text>
      <TextInput
        style={styles.externalInput}
        placeholder="Nombre del jugador externo"
        placeholderTextColor={colors.textSecondary}
        value={name}
        onChangeText={onNameChange}
      />

      <Text style={styles.label}>Nivel de juego (opcional)</Text>
      <View style={styles.levelsContainer}>
        <TouchableOpacity
          style={[styles.levelOption, !level && styles.levelOptionSelected]}
          onPress={() => onLevelChange(null)}
        >
          <Text style={[styles.levelOptionText, !level && styles.levelOptionTextSelected]}>
            No sé
          </Text>
        </TouchableOpacity>
        {NIVELES_JUEGO.map((n) => (
          <TouchableOpacity
            key={n.value}
            style={[styles.levelOption, level === n.value && styles.levelOptionSelected]}
            onPress={() => onLevelChange(n.value)}
          >
            <Text style={[styles.levelOptionText, level === n.value && styles.levelOptionTextSelected]}>
              {n.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.addExternalButton} onPress={onAdd}>
        <Text style={styles.addExternalButtonText}>Añadir jugador externo</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 9999,
    elevation: 9999,
  },
  content: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    zIndex: 10000,
    elevation: 10000,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeButtonText: {
    fontSize: 14,
    color: colors.text,
  },
  typeButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  searchContainer: {
    flex: 1,
  },
  searchInput: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  usersList: {
    maxHeight: 300,
  },
  loading: {
    padding: 40,
    alignItems: 'center',
  },
  noResults: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    padding: 20,
  },
  userOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  userOptionDisabled: {
    opacity: 0.5,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
  },
  userNameDisabled: {
    color: colors.textSecondary,
  },
  userApartment: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  externalContainer: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
    marginTop: 12,
  },
  externalInput: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  levelsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  levelOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  levelOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  levelOptionText: {
    fontSize: 13,
    color: colors.text,
  },
  levelOptionTextSelected: {
    color: '#fff',
    fontWeight: '500',
  },
  addExternalButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  addExternalButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  closeButton: {
    marginTop: 16,
    padding: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '500',
  },
});

// Legacy alias
export { AddPlayerModal as AddJugadorModal };
