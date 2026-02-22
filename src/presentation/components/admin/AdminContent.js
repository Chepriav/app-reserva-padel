import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../constants/colors';
import { RequestCard } from './RequestCard';
import { UserCard } from './UserCard';
import { ApartmentChangeCard } from './ApartmentChangeCard';
import { ImportUsersButton } from './ImportUsersButton';

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
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon} size={18} color={colors.primary} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

/**
 * Contenido de la tab Solicitudes
 */
export function RequestsContent({
  usersPending,
  requestsChange,
  onApprove,
  onReject,
  onApproveChange,
  onRejectChange,
}) {
  if (usersPending.length === 0 && requestsChange.length === 0) {
    return (
      <EmptyState
        text="No hay solicitudes pendientes"
        subtext="Las nuevas solicitudes y cambios de vivienda aparecerán aquí"
      />
    );
  }

  return (
    <>
      {usersPending.length > 0 && (
        <Section
          icon="person-add-outline"
          title={`Nuevos usuarios (${usersPending.length})`}
        >
          {usersPending.map((user) => (
            <RequestCard
              key={user.id}
              user={user}
              onApprove={onApprove}
              onReject={onReject}
            />
          ))}
        </Section>
      )}

      {requestsChange.length > 0 && (
        <Section
          icon="home-outline"
          title={`Cambios de vivienda (${requestsChange.length})`}
        >
          {requestsChange.map((user) => (
            <ApartmentChangeCard
              key={user.id}
              user={user}
              onApprove={onApproveChange}
              onReject={onRejectChange}
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
export function UsersContent({
  users,
  currentUserId,
  onToggleAdmin,
  onEditApartment,
  onDelete,
  onImportUsers,
}) {
  return (
    <>
      {/* Header with import button */}
      <View style={styles.usersHeader}>
        <Text style={styles.usersTitle}>Usuarios registrados</Text>
        <ImportUsersButton onPress={onImportUsers} />
      </View>

      {/* User list */}
      {users.length === 0 ? (
        <EmptyState text="No hay usuarios" />
      ) : (
        users.map((user) => (
          <UserCard
            key={user.id}
            user={user}
            currentUserId={currentUserId}
            onToggleAdmin={onToggleAdmin}
            onEditApartment={onEditApartment}
            onDelete={onDelete}
          />
        ))
      )}
    </>
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
  sectionContainer: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  usersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  usersTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
});
