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
} from 'react-native';
import { colors } from '../../../constants/colors';
import { NIVELES_JUEGO } from '../../../constants/config';
import { styles } from './AddPlayerModalStyles';

/**
 * Modal to add a player to the match
 */
export default function AddPlayerModal({
  visible,
  modalState,
  setModalState,
  users,
  loadingUsers,
  currentPlayers,
  onAddCommunity,
  onAddExternal,
  onClose,
}) {
  const { type, search, externalName, externalLevel } = modalState || {};

  const updateState = (updates) => {
    setModalState(prev => ({ ...prev, ...updates }));
  };

  const filteredUsers = getFilteredUsers(users, search, currentPlayers);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>Añadir jugador</Text>

          {/* Type selector */}
          <PlayerTypeSelector
            type={type}
            onChange={(newType) => updateState({ type: newType })}
          />

          {/* Content based on type */}
          {type === 'urbanizacion' ? (
            <SearchUser
              search={search}
              onSearchChange={(text) => updateState({ search: text })}
              users={filteredUsers}
              loading={loadingUsers}
              onSelect={onAddCommunity}
            />
          ) : (
            <ExternalPlayer
              name={externalName}
              level={externalLevel}
              onNameChange={(text) => updateState({ externalName: text })}
              onLevelChange={(level) => updateState({ externalLevel: level })}
              onAdd={onAddExternal}
            />
          )}

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
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
    alreadyAdded: players.some(p => p.tipo === 'urbanizacion' && p.usuario?.id === u.id),
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

// Legacy alias
export { AddPlayerModal as AddJugadorModal };
