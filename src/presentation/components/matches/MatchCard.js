import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SKILL_LEVELS } from '../../../constants/config';
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
  const confirmedPlayers = match?.players?.filter(p => p.status === 'confirmed') || [];
  const pendingPlayers = match?.players?.filter(p => p.status === 'pending') || [];
  const playersCount = 1 + confirmedPlayers.length;
  const maxParticipants = match?.maxParticipants || 4;
  const isComplete = match?.status === 'full' || playersCount >= maxParticipants;
  const isClass = match?.isLesson || false;

  const myRequest = match?.players?.find(p => p.userId === currentUserId);
  const isConfirmed = myRequest?.status === 'confirmed';
  const isPending = myRequest?.status === 'pending';

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
          <Text style={styles.classBadgeText}>Clase</Text>
        </View>
      )}

      <Header
        creatorName={match?.creatorName}
        creatorApartment={match?.creatorApartment}
        playersCount={playersCount}
        maxParticipants={maxParticipants}
        isComplete={isComplete}
        isClass={isClass}
      />

      <DateInfo match={match} />

      {/* Class-specific info */}
      {isClass && <ClassInfo match={match} />}

      {/* Preferred level (only for regular matches) */}
      {!isClass && match?.preferredLevel && (
        <PreferredLevel level={match.preferredLevel} />
      )}

      {match?.message?.trim() && (
        <Message text={match.message} />
      )}

      <ParticipantsList
        creator={{ name: match?.creatorName, apartment: match?.creatorApartment, photo: match?.creatorPhoto, level: match?.creatorLevel }}
        players={confirmedPlayers}
        isClass={isClass}
      />

      {match?.isCreator && pendingPlayers.length > 0 && (
        <PendingRequests
          requests={pendingPlayers}
          onAccept={(userId) => onAcceptRequest(userId, match)}
          onReject={(userId) => onRejectRequest(userId, match)}
          isClass={isClass}
        />
      )}

      <Actions
        match={match}
        isCreator={match?.isCreator}
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
  const { levels, studentPrice, groupPrice, minParticipants, maxParticipants } = match;

  return (
    <View style={styles.classInfoContainer}>
      {/* Levels */}
      {levels && levels.length > 0 && (
        <Text style={styles.classInfoText}>
          Nivel: {levels.map(n => SKILL_LEVELS.find(nj => nj.value === n)?.label || n).join(' / ')}
        </Text>
      )}

      {/* Student range */}
      <Text style={styles.classInfoText}>
        Alumnos: {minParticipants}-{maxParticipants}
      </Text>

      {/* Price */}
      {(studentPrice || groupPrice) && (
        <View style={styles.classPrices}>
          {studentPrice && (
            <Text style={styles.classPrice}>{studentPrice}€/alumno</Text>
          )}
          {groupPrice && (
            <Text style={styles.classPrice}>{groupPrice}€/grupo</Text>
          )}
        </View>
      )}
    </View>
  );
}

function DateInfo({ match }) {
  if (match.type === 'con_reserva' && match.date) {
    return (
      <View style={styles.dateContainer}>
        <Text style={styles.date}>
          {formatReadableDate(match.date)} • {match.startTime?.slice(0, 5)} - {match.endTime?.slice(0, 5)}
        </Text>
      </View>
    );
  }

  if (match.type === 'abierta') {
    return (
      <View style={styles.dateContainer}>
        <Text style={styles.openDate}>Fecha a acordar</Text>
      </View>
    );
  }

  return null;
}

function PreferredLevel({ level }) {
  const levelLabel = SKILL_LEVELS.find(n => n.value === level)?.label || level;
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
            {match.isCreator === false ? 'Esperando aprobación' : 'Solicitud enviada'}
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
