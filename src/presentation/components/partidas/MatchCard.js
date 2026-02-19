import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { NIVELES_JUEGO } from '../../../constants/config';
import { formatReadableDate } from '../../../utils/dateHelpers';
import { styles } from './MatchCardStyles';
import ParticipantsList from './ParticipantsList';
import PendingRequests from './PendingRequests';

/**
 * Card displaying match or class information
 */
export default function MatchCard({
  match,
  currentUserId,
  onCancel,
  onEdit,
  onRequestJoin,
  onCancelRequest,
  onLeave,
  onAcceptRequest,
  onRejectRequest,
  onCloseClass,
  showCreatorActions = true,
}) {
  const confirmedPlayers = match?.jugadores?.filter(p => p.estado === 'confirmado') || [];
  const pendingPlayers = match?.jugadores?.filter(p => p.estado === 'pendiente') || [];
  const playersCount = 1 + confirmedPlayers.length;
  const maxParticipants = match?.maxParticipantes || 4;
  const isComplete = match?.estado === 'completa' || playersCount >= maxParticipants;
  const isClass = match?.esClase || false;

  const myRequest = match?.jugadores?.find(p => p.usuarioId === currentUserId);
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
        creatorName={match?.creadorNombre}
        creatorApartment={match?.creadorVivienda}
        playersCount={playersCount}
        maxParticipants={maxParticipants}
        isComplete={isComplete}
        isClass={isClass}
      />

      <DateInfo match={match} />

      {/* Class-specific info */}
      {isClass && <ClassInfo match={match} />}

      {/* Preferred level (only for regular matches) */}
      {!isClass && match?.nivelPreferido && (
        <PreferredLevel level={match.nivelPreferido} />
      )}

      {match?.mensaje?.trim() && (
        <Message text={match.mensaje} />
      )}

      <ParticipantsList
        creator={{ nombre: match?.creadorNombre, vivienda: match?.creadorVivienda, foto: match?.creadorFoto, nivel: match?.creadorNivel }}
        players={confirmedPlayers}
        isClass={isClass}
      />

      {match?.esCreador && pendingPlayers.length > 0 && (
        <PendingRequests
          requests={pendingPlayers}
          onAccept={(userId) => onAcceptRequest(userId, match)}
          onReject={(userId) => onRejectRequest(userId, match)}
          isClass={isClass}
        />
      )}

      <Actions
        match={match}
        isCreator={match?.esCreador}
        myRequest={myRequest}
        isConfirmed={isConfirmed}
        isPending={isPending}
        isComplete={isComplete}
        isClass={isClass}
        showCreatorActions={showCreatorActions}
        onCancel={() => onCancel(match)}
        onEdit={() => onEdit?.(match)}
        onRequestJoin={() => onRequestJoin(match)}
        onCancelRequest={() => onCancelRequest(match)}
        onLeave={() => onLeave(match)}
        onCloseClass={() => onCloseClass?.(match)}
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

// Legacy alias
export { MatchCard as PartidaCard };
