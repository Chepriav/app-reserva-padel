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
 * Modal para añadir un jugador a la partida
 */
export default function AddJugadorModal({
  visible,
  modalState,
  setModalState,
  usuarios,
  loadingUsuarios,
  jugadoresActuales,
  onAddUrbanizacion,
  onAddExterno,
  onCerrar,
}) {
  const { tipo, busqueda, nombreExterno, nivelExterno } = modalState;

  const updateState = (updates) => {
    setModalState(prev => ({ ...prev, ...updates }));
  };

  const usuariosFiltrados = getUsuariosFiltrados(usuarios, busqueda, jugadoresActuales);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCerrar}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.titulo}>Añadir jugador</Text>

          {/* Selector de tipo */}
          <TipoJugadorSelector
            tipo={tipo}
            onChange={(nuevoTipo) => updateState({ tipo: nuevoTipo })}
          />

          {/* Contenido según tipo */}
          {tipo === 'urbanizacion' ? (
            <BuscarUsuario
              busqueda={busqueda}
              onBusquedaChange={(text) => updateState({ busqueda: text })}
              usuarios={usuariosFiltrados}
              loading={loadingUsuarios}
              onSelect={onAddUrbanizacion}
            />
          ) : (
            <JugadorExterno
              nombre={nombreExterno}
              nivel={nivelExterno}
              onNombreChange={(text) => updateState({ nombreExterno: text })}
              onNivelChange={(nivel) => updateState({ nivelExterno: nivel })}
              onAdd={onAddExterno}
            />
          )}

          <TouchableOpacity style={styles.cerrarButton} onPress={onCerrar}>
            <Text style={styles.cerrarButtonText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function getUsuariosFiltrados(usuarios, busqueda, jugadoresActuales) {
  const termino = busqueda.toLowerCase().trim();
  let filtrados = usuarios;

  if (termino) {
    filtrados = usuarios.filter(u =>
      u.nombre.toLowerCase().includes(termino) ||
      u.vivienda?.toLowerCase().includes(termino)
    );
  }

  // Marcar los ya añadidos
  return filtrados.slice(0, 20).map(u => ({
    ...u,
    yaAnadido: jugadoresActuales.some(j => j.tipo === 'urbanizacion' && j.usuario?.id === u.id),
  }));
}

function TipoJugadorSelector({ tipo, onChange }) {
  return (
    <View style={styles.tipoButtons}>
      <TouchableOpacity
        style={[styles.tipoButton, tipo === 'urbanizacion' && styles.tipoButtonActivo]}
        onPress={() => onChange('urbanizacion')}
      >
        <Text style={[styles.tipoButtonText, tipo === 'urbanizacion' && styles.tipoButtonTextActivo]}>
          De la urbanización
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tipoButton, tipo === 'externo' && styles.tipoButtonActivo]}
        onPress={() => onChange('externo')}
      >
        <Text style={[styles.tipoButtonText, tipo === 'externo' && styles.tipoButtonTextActivo]}>
          Externo
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function BuscarUsuario({ busqueda, onBusquedaChange, usuarios, loading, onSelect }) {
  return (
    <View style={styles.busquedaContainer}>
      <TextInput
        style={styles.busquedaInput}
        placeholder="Buscar por nombre o vivienda..."
        placeholderTextColor={colors.textSecondary}
        value={busqueda}
        onChangeText={onBusquedaChange}
        autoCapitalize="none"
      />

      <ScrollView style={styles.usuariosLista} nestedScrollEnabled>
        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : usuarios.length === 0 ? (
          <Text style={styles.noResultados}>No se encontraron usuarios</Text>
        ) : (
          usuarios.map((usuario) => (
            <UsuarioOption
              key={usuario.id}
              usuario={usuario}
              onSelect={() => onSelect(usuario)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

function UsuarioOption({ usuario, onSelect }) {
  const nivelLabel = usuario.nivelJuego
    ? NIVELES_JUEGO.find(n => n.value === usuario.nivelJuego)?.label || usuario.nivelJuego
    : null;

  return (
    <TouchableOpacity
      style={[styles.usuarioOption, usuario.yaAnadido && styles.usuarioOptionDisabled]}
      onPress={onSelect}
      disabled={usuario.yaAnadido}
    >
      <View style={styles.usuarioAvatar}>
        {usuario.fotoPerfil ? (
          <Image source={{ uri: usuario.fotoPerfil }} style={styles.usuarioAvatarImage} />
        ) : (
          <Text style={styles.usuarioAvatarText}>
            {usuario.nombre?.charAt(0)?.toUpperCase() || '?'}
          </Text>
        )}
      </View>
      <View style={styles.usuarioInfo}>
        <Text style={[styles.usuarioNombre, usuario.yaAnadido && styles.usuarioNombreDisabled]}>
          {usuario.nombre}
          {usuario.yaAnadido && ' (añadido)'}
        </Text>
        <Text style={styles.usuarioVivienda}>
          Vivienda {usuario.vivienda}
          {nivelLabel && ` • ${nivelLabel}`}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function JugadorExterno({ nombre, nivel, onNombreChange, onNivelChange, onAdd }) {
  return (
    <View style={styles.externoContainer}>
      <Text style={styles.label}>Nombre del jugador</Text>
      <TextInput
        style={styles.externoInput}
        placeholder="Nombre del jugador externo"
        placeholderTextColor={colors.textSecondary}
        value={nombre}
        onChangeText={onNombreChange}
      />

      <Text style={styles.label}>Nivel de juego (opcional)</Text>
      <View style={styles.nivelesContainer}>
        <TouchableOpacity
          style={[styles.nivelOption, !nivel && styles.nivelOptionSelected]}
          onPress={() => onNivelChange(null)}
        >
          <Text style={[styles.nivelOptionText, !nivel && styles.nivelOptionTextSelected]}>
            No sé
          </Text>
        </TouchableOpacity>
        {NIVELES_JUEGO.map((n) => (
          <TouchableOpacity
            key={n.value}
            style={[styles.nivelOption, nivel === n.value && styles.nivelOptionSelected]}
            onPress={() => onNivelChange(n.value)}
          >
            <Text style={[styles.nivelOptionText, nivel === n.value && styles.nivelOptionTextSelected]}>
              {n.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.addExternoButton} onPress={onAdd}>
        <Text style={styles.addExternoButtonText}>Añadir jugador externo</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  titulo: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  tipoButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tipoButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  tipoButtonActivo: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tipoButtonText: {
    fontSize: 14,
    color: colors.text,
  },
  tipoButtonTextActivo: {
    color: '#fff',
    fontWeight: '600',
  },
  busquedaContainer: {
    flex: 1,
  },
  busquedaInput: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  usuariosLista: {
    maxHeight: 300,
  },
  loading: {
    padding: 40,
    alignItems: 'center',
  },
  noResultados: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    padding: 20,
  },
  usuarioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  usuarioOptionDisabled: {
    opacity: 0.5,
  },
  usuarioAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  usuarioAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  usuarioAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  usuarioInfo: {
    flex: 1,
  },
  usuarioNombre: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
  },
  usuarioNombreDisabled: {
    color: colors.textSecondary,
  },
  usuarioVivienda: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  externoContainer: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
    marginTop: 12,
  },
  externoInput: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  nivelesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  nivelOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  nivelOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  nivelOptionText: {
    fontSize: 13,
    color: colors.text,
  },
  nivelOptionTextSelected: {
    color: '#fff',
    fontWeight: '500',
  },
  addExternoButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  addExternoButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  cerrarButton: {
    marginTop: 16,
    padding: 12,
    alignItems: 'center',
  },
  cerrarButtonText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '500',
  },
});
