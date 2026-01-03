import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { SolicitudCard } from './SolicitudCard';
import { UsuarioCard } from './UsuarioCard';
import { ApartmentChangeCard } from './ApartmentChangeCard';
import { AnnouncementAdminCard } from './AnnouncementAdminCard';

/**
 * Estado vacío genérico
 */
function EmptyState({ icon, text, subtext }) {
  return (
    <View style={styles.emptyState}>
      {icon && <Ionicons name={icon} size={48} color={colors.disabled} />}
      <Text style={styles.emptyText}>{text}</Text>
      {subtext && <Text style={styles.emptySubtext}>{subtext}</Text>}
    </View>
  );
}

/**
 * Sección con título
 */
function Section({ icon, title, children }) {
  return (
    <View style={styles.seccionContainer}>
      <View style={styles.seccionHeader}>
        <Ionicons name={icon} size={18} color={colors.primary} />
        <Text style={styles.seccionTitulo}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

/**
 * Contenido de la tab Solicitudes
 */
export function SolicitudesContent({
  usuariosPendientes,
  solicitudesCambio,
  onAprobar,
  onRechazar,
  onAprobarCambio,
  onRechazarCambio,
}) {
  if (usuariosPendientes.length === 0 && solicitudesCambio.length === 0) {
    return (
      <EmptyState
        text="No hay solicitudes pendientes"
        subtext="Las nuevas solicitudes y cambios de vivienda aparecerán aquí"
      />
    );
  }

  return (
    <>
      {usuariosPendientes.length > 0 && (
        <Section
          icon="person-add-outline"
          title={`Nuevos usuarios (${usuariosPendientes.length})`}
        >
          {usuariosPendientes.map((usuario) => (
            <SolicitudCard
              key={usuario.id}
              usuario={usuario}
              onAprobar={onAprobar}
              onRechazar={onRechazar}
            />
          ))}
        </Section>
      )}

      {solicitudesCambio.length > 0 && (
        <Section
          icon="home-outline"
          title={`Cambios de vivienda (${solicitudesCambio.length})`}
        >
          {solicitudesCambio.map((usuario) => (
            <ApartmentChangeCard
              key={usuario.id}
              usuario={usuario}
              onAprobar={onAprobarCambio}
              onRechazar={onRechazarCambio}
            />
          ))}
        </Section>
      )}
    </>
  );
}

/**
 * Contenido de la tab Usuarios
 */
export function UsuariosContent({
  usuarios,
  currentUserId,
  onToggleAdmin,
  onEditVivienda,
  onDelete,
}) {
  if (usuarios.length === 0) {
    return <EmptyState text="No hay usuarios" />;
  }

  return (
    <>
      {usuarios.map((usuario) => (
        <UsuarioCard
          key={usuario.id}
          usuario={usuario}
          currentUserId={currentUserId}
          onToggleAdmin={onToggleAdmin}
          onEditVivienda={onEditVivienda}
          onDelete={onDelete}
        />
      ))}
    </>
  );
}

/**
 * Contenido de la tab Mensajes
 */
export function MensajesContent({
  anuncios,
  loadingAnuncios,
  onNuevoMensaje,
  onEliminar,
}) {
  return (
    <View style={styles.mensajesContainer}>
      <TouchableOpacity
        style={styles.nuevoMensajeButton}
        onPress={onNuevoMensaje}
      >
        <Ionicons name="add-circle-outline" size={22} color="#fff" />
        <Text style={styles.nuevoMensajeText}>Nuevo mensaje</Text>
      </TouchableOpacity>

      {loadingAnuncios ? (
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={{ marginTop: 30 }}
        />
      ) : anuncios.length > 0 ? (
        anuncios.map((anuncio) => (
          <AnnouncementAdminCard
            key={anuncio.id}
            anuncio={anuncio}
            onEliminar={onEliminar}
          />
        ))
      ) : (
        <EmptyState
          icon="megaphone-outline"
          text="No hay mensajes"
          subtext="Crea tu primer mensaje para los usuarios"
        />
      )}
    </View>
  );
}

/**
 * Loading spinner
 */
export function LoadingContent() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    paddingTop: 40,
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  seccionContainer: {
    marginBottom: 20,
  },
  seccionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  seccionTitulo: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  mensajesContainer: {
    flex: 1,
  },
  nuevoMensajeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    marginBottom: 16,
    gap: 8,
  },
  nuevoMensajeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
