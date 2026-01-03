import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import { NIVELES_JUEGO } from '../../constants/config';
import { formatReadableDate } from '../../utils/dateHelpers';
import ParticipantsList from './ParticipantsList';
import PendingRequests from './PendingRequests';

/**
 * Card displaying match or class information
 */
export default function MatchCard({
  // Support both English and Spanish prop names
  match,
  partida = match,
  currentUserId,
  usuarioActualId = currentUserId,
  onCancel,
  onCancelar = onCancel,
  onEdit,
  onEditar = onEdit,
  onRequestJoin,
  onSolicitarUnirse = onRequestJoin,
  onCancelRequest,
  onCancelarSolicitud = onCancelRequest,
  onLeave,
  onDesapuntarse = onLeave,
  onAcceptRequest,
  onAceptarSolicitud = onAcceptRequest,
  onRejectRequest,
  onRechazarSolicitud = onRejectRequest,
  onCloseClass,
  onCerrarClase = onCloseClass,
  showCreatorActions = true,
}) {
  const confirmedPlayers = partida?.jugadores?.filter(j => j.estado === 'confirmado') || [];
  const pendingPlayers = partida?.jugadores?.filter(j => j.estado === 'pendiente') || [];
  const playersCount = 1 + confirmedPlayers.length;
  const maxParticipants = partida?.maxParticipantes || 4;
  const isComplete = partida?.estado === 'completa' || playersCount >= maxParticipants;
  const isClass = partida?.esClase || false;

  const myRequest = partida?.jugadores?.find(j => j.usuarioId === usuarioActualId);
  const isConfirmed = myRequest?.estado === 'confirmado';
  const isPending = myRequest?.estado === 'pendiente';

  return (
    <View style={[
      styles.card,
      isComplete && styles.cardComplete,
      isClass && styles.cardClass,
      isClass && isComplete && styles.cardClassComplete,
    ]}>
      {/* CLASS Badge */}
      {isClass && (
        <View style={styles.classBadgeContainer}>
          <Text style={styles.classBadgeText}>CLASE</Text>
        </View>
      )}

      <Header
        creatorName={partida?.creadorNombre}
        creatorApartment={partida?.creadorVivienda}
        playersCount={playersCount}
        maxParticipants={maxParticipants}
        isComplete={isComplete}
        isClass={isClass}
      />

      <DateInfo match={partida} />

      {/* Class-specific info */}
      {isClass && <ClassInfo match={partida} />}

      {/* Preferred level (only for regular matches) */}
      {!isClass && partida?.nivelPreferido && (
        <PreferredLevel level={partida.nivelPreferido} />
      )}

      {partida?.mensaje?.trim() && (
        <Message text={partida.mensaje} />
      )}

      <ParticipantsList
        creator={{ nombre: partida?.creadorNombre, vivienda: partida?.creadorVivienda, foto: partida?.creadorFoto, nivel: partida?.creadorNivel }}
        players={confirmedPlayers}
        isClass={isClass}
      />

      {partida?.esCreador && pendingPlayers.length > 0 && (
        <PendingRequests
          requests={pendingPlayers}
          onAccept={(userId) => onAceptarSolicitud(userId, partida)}
          onReject={(userId) => onRechazarSolicitud(userId, partida)}
          isClass={isClass}
        />
      )}

      <Actions
        match={partida}
        isCreator={partida?.esCreador}
        myRequest={myRequest}
        isConfirmed={isConfirmed}
        isPending={isPending}
        isComplete={isComplete}
        isClass={isClass}
        showCreatorActions={showCreatorActions}
        onCancel={() => onCancelar(partida)}
        onEdit={() => onEditar?.(partida)}
        onRequestJoin={() => onSolicitarUnirse(partida)}
        onCancelRequest={() => onCancelarSolicitud(partida)}
        onLeave={() => onDesapuntarse(partida)}
        onCloseClass={() => onCerrarClase?.(partida)}
      />
    </View>
  );
}

// Internal sub-components
function Header({ creatorName, creatorApartment, playersCount, maxParticipants, isComplete, isClass }) {
  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.creatorName}>{creatorName}</Text>
        <Text style={styles.creatorApartment}>Vivienda {creatorApartment}</Text>
      </View>
      <View style={[
        styles.badge,
        isComplete && styles.badgeComplete,
        isClass && styles.badgeClass,
        isClass && isComplete && styles.badgeClassComplete,
      ]}>
        <Text style={[
          styles.badgeText,
          isComplete && styles.badgeTextComplete,
          isClass && styles.badgeTextClass,
        ]}>
          {playersCount}/{maxParticipants}
        </Text>
      </View>
    </View>
  );
}

function ClassInfo({ match }) {
  const { niveles, precioAlumno, precioGrupo, minParticipantes, maxParticipantes } = match;

  return (
    <View style={styles.classInfoContainer}>
      {/* Levels */}
      {niveles && niveles.length > 0 && (
        <Text style={styles.classInfoText}>
          Nivel: {niveles.map(n => NIVELES_JUEGO.find(nj => nj.value === n)?.label || n).join(' / ')}
        </Text>
      )}

      {/* Student range */}
      <Text style={styles.classInfoText}>
        Alumnos: {minParticipantes}-{maxParticipantes}
      </Text>

      {/* Price */}
      {(precioAlumno || precioGrupo) && (
        <View style={styles.classPrices}>
          {precioAlumno && (
            <Text style={styles.classPrice}>{precioAlumno}€/alumno</Text>
          )}
          {precioGrupo && (
            <Text style={styles.classPrice}>{precioGrupo}€/grupo</Text>
          )}
        </View>
      )}
    </View>
  );
}

function DateInfo({ match }) {
  if (match.tipo === 'con_reserva' && match.fecha) {
    return (
      <View style={styles.dateContainer}>
        <Text style={styles.date}>
          {formatReadableDate(match.fecha)} • {match.horaInicio?.slice(0, 5)} - {match.horaFin?.slice(0, 5)}
        </Text>
      </View>
    );
  }

  if (match.tipo === 'abierta') {
    return (
      <View style={styles.dateContainer}>
        <Text style={styles.openDate}>Fecha por acordar</Text>
      </View>
    );
  }

  return null;
}

function PreferredLevel({ level }) {
  const levelLabel = NIVELES_JUEGO.find(n => n.value === level)?.label || level;
  return <Text style={styles.level}>Nivel: {levelLabel}</Text>;
}

function Message({ text }) {
  return <Text style={styles.message}>"{text}"</Text>;
}

function Actions({
  match,
  isCreator,
  myRequest,
  isConfirmed,
  isPending,
  isComplete,
  isClass,
  showCreatorActions,
  onCancel,
  onEdit,
  onRequestJoin,
  onCancelRequest,
  onLeave,
  onCloseClass,
}) {
  return (
    <View style={styles.actions}>
      {/* Creator can edit (classes can always be edited to remove players) */}
      {isCreator && showCreatorActions && (!isComplete || isClass) && (
        <TouchableOpacity style={[styles.editButton, isClass && styles.editButtonClass]} onPress={onEdit}>
          <Text style={[styles.editButtonText, isClass && styles.editButtonTextClass]}>Editar</Text>
        </TouchableOpacity>
      )}

      {/* Class creator can manually close registrations */}
      {isCreator && isClass && !isComplete && showCreatorActions && (
        <TouchableOpacity style={styles.closeClassButton} onPress={onCloseClass}>
          <Text style={styles.closeClassButtonText}>Cerrar</Text>
        </TouchableOpacity>
      )}

      {/* Creator can cancel */}
      {isCreator && showCreatorActions && (
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
      )}

      {/* User can request to join if not creator and has no request */}
      {!isCreator && !myRequest && !isComplete && (
        <TouchableOpacity style={[styles.primaryButton, isClass && styles.primaryButtonClass]} onPress={onRequestJoin}>
          <Text style={styles.primaryButtonText}>{isClass ? 'Solicitar plaza' : 'Solicitar unirse'}</Text>
        </TouchableOpacity>
      )}

      {/* User with pending request */}
      {!isCreator && isPending && (
        <View style={styles.pendingRequest}>
          <Text style={styles.pendingRequestText}>
            {match.esCreador === false ? 'Esperando aprobación' : 'Solicitud enviada'}
          </Text>
          <TouchableOpacity style={styles.secondaryButton} onPress={onCancelRequest}>
            <Text style={styles.secondaryButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Confirmed user can leave */}
      {!isCreator && isConfirmed && (
        <TouchableOpacity style={styles.cancelButton} onPress={onLeave}>
          <Text style={styles.cancelButtonText}>Desapuntarme</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardComplete: {
    borderColor: colors.guaranteedReservation,
  },
  cardClass: {
    backgroundColor: colors.classBackground,
    borderColor: colors.classColor,
  },
  cardClassComplete: {
    borderColor: colors.classColor,
  },
  // CLASS badge in corner
  classBadgeContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.classColor,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 10,
  },
  classBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  creatorName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  creatorApartment: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  badge: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeComplete: {
    backgroundColor: colors.guaranteedReservation + '20',
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  badgeTextComplete: {
    color: colors.guaranteedReservation,
  },
  badgeClass: {
    backgroundColor: colors.classColor + '20',
  },
  badgeClassComplete: {
    backgroundColor: colors.classColor + '30',
  },
  badgeTextClass: {
    color: colors.classColor,
  },
  // Class info
  classInfoContainer: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.classColor + '30',
  },
  classInfoText: {
    fontSize: 13,
    color: colors.text,
    marginBottom: 4,
  },
  classPrices: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  classPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.classColor,
  },
  dateContainer: {
    marginBottom: 8,
  },
  date: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  openDate: {
    fontSize: 14,
    color: colors.accent,
    fontStyle: 'italic',
  },
  level: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: colors.text,
    fontStyle: 'italic',
    marginBottom: 12,
    backgroundColor: colors.background,
    padding: 10,
    borderRadius: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  editButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editButtonText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  editButtonClass: {
    borderColor: colors.classColor,
  },
  editButtonTextClass: {
    color: colors.classColor,
  },
  primaryButtonClass: {
    backgroundColor: colors.classColor,
  },
  closeClassButton: {
    backgroundColor: colors.classColor,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  closeClassButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  cancelButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.error,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: colors.error,
    fontWeight: '600',
    fontSize: 14,
  },
  secondaryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.textSecondary,
  },
  secondaryButtonText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  pendingRequest: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pendingRequestText: {
    fontSize: 14,
    color: colors.accent,
    fontStyle: 'italic',
  },
});

// Legacy alias
export { MatchCard as PartidaCard };
