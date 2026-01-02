import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import { NIVELES_JUEGO } from '../../constants/config';
import { formatearFechaLegible } from '../../utils/dateHelpers';
import ParticipantesList from './ParticipantesList';
import SolicitudesPendientes from './SolicitudesPendientes';

/**
 * Tarjeta que muestra información de una partida o clase
 */
export default function PartidaCard({
  partida,
  usuarioActualId,
  onCancelar,
  onEditar,
  onSolicitarUnirse,
  onCancelarSolicitud,
  onDesapuntarse,
  onAceptarSolicitud,
  onRechazarSolicitud,
  onCerrarClase,
  mostrarAccionesCreador = true,
}) {
  const jugadoresConfirmados = partida.jugadores?.filter(j => j.estado === 'confirmado') || [];
  const jugadoresPendientes = partida.jugadores?.filter(j => j.estado === 'pendiente') || [];
  const jugadoresCount = 1 + jugadoresConfirmados.length;
  const maxParticipantes = partida.maxParticipantes || 4;
  const esCompleta = partida.estado === 'completa' || jugadoresCount >= maxParticipantes;
  const esClase = partida.esClase || false;

  const miSolicitud = partida.jugadores?.find(j => j.usuarioId === usuarioActualId);
  const estaConfirmado = miSolicitud?.estado === 'confirmado';
  const estaPendiente = miSolicitud?.estado === 'pendiente';

  return (
    <View style={[
      styles.card,
      esCompleta && styles.cardCompleta,
      esClase && styles.cardClase,
      esClase && esCompleta && styles.cardClaseCompleta,
    ]}>
      {/* Badge de CLASE */}
      {esClase && (
        <View style={styles.claseBadgeContainer}>
          <Text style={styles.claseBadgeText}>CLASE</Text>
        </View>
      )}

      <Header
        creadorNombre={partida.creadorNombre}
        creadorVivienda={partida.creadorVivienda}
        jugadoresCount={jugadoresCount}
        maxParticipantes={maxParticipantes}
        esCompleta={esCompleta}
        esClase={esClase}
      />

      <FechaInfo partida={partida} />

      {/* Info específica de clase */}
      {esClase && <ClaseInfo partida={partida} />}

      {/* Nivel preferido (solo partidas normales) */}
      {!esClase && partida.nivelPreferido && (
        <NivelPreferido nivel={partida.nivelPreferido} />
      )}

      {partida.mensaje?.trim() && (
        <Mensaje texto={partida.mensaje} />
      )}

      <ParticipantesList
        creador={{ nombre: partida.creadorNombre, vivienda: partida.creadorVivienda, foto: partida.creadorFoto, nivel: partida.creadorNivel }}
        jugadores={jugadoresConfirmados}
        esClase={esClase}
      />

      {partida.esCreador && jugadoresPendientes.length > 0 && (
        <SolicitudesPendientes
          solicitudes={jugadoresPendientes}
          onAceptar={(usuarioId) => onAceptarSolicitud(usuarioId, partida)}
          onRechazar={(usuarioId) => onRechazarSolicitud(usuarioId, partida)}
          esClase={esClase}
        />
      )}

      <Acciones
        partida={partida}
        esCreador={partida.esCreador}
        miSolicitud={miSolicitud}
        estaConfirmado={estaConfirmado}
        estaPendiente={estaPendiente}
        esCompleta={esCompleta}
        esClase={esClase}
        mostrarAccionesCreador={mostrarAccionesCreador}
        onCancelar={() => onCancelar(partida)}
        onEditar={() => onEditar?.(partida)}
        onSolicitarUnirse={() => onSolicitarUnirse(partida)}
        onCancelarSolicitud={() => onCancelarSolicitud(partida)}
        onDesapuntarse={() => onDesapuntarse(partida)}
        onCerrarClase={() => onCerrarClase?.(partida)}
      />
    </View>
  );
}

// Sub-componentes internos
function Header({ creadorNombre, creadorVivienda, jugadoresCount, maxParticipantes, esCompleta, esClase }) {
  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.creadorNombre}>{creadorNombre}</Text>
        <Text style={styles.creadorVivienda}>Vivienda {creadorVivienda}</Text>
      </View>
      <View style={[
        styles.badge,
        esCompleta && styles.badgeCompleta,
        esClase && styles.badgeClase,
        esClase && esCompleta && styles.badgeClaseCompleta,
      ]}>
        <Text style={[
          styles.badgeText,
          esCompleta && styles.badgeTextCompleta,
          esClase && styles.badgeTextClase,
        ]}>
          {jugadoresCount}/{maxParticipantes}
        </Text>
      </View>
    </View>
  );
}

function ClaseInfo({ partida }) {
  const { niveles, precioAlumno, precioGrupo, minParticipantes, maxParticipantes } = partida;

  return (
    <View style={styles.claseInfoContainer}>
      {/* Niveles */}
      {niveles && niveles.length > 0 && (
        <Text style={styles.claseInfoText}>
          Nivel: {niveles.map(n => NIVELES_JUEGO.find(nj => nj.value === n)?.label || n).join(' / ')}
        </Text>
      )}

      {/* Rango de alumnos */}
      <Text style={styles.claseInfoText}>
        Alumnos: {minParticipantes}-{maxParticipantes}
      </Text>

      {/* Precio */}
      {(precioAlumno || precioGrupo) && (
        <View style={styles.clasePrecios}>
          {precioAlumno && (
            <Text style={styles.clasePrecio}>{precioAlumno}€/alumno</Text>
          )}
          {precioGrupo && (
            <Text style={styles.clasePrecio}>{precioGrupo}€/grupo</Text>
          )}
        </View>
      )}
    </View>
  );
}

function FechaInfo({ partida }) {
  if (partida.tipo === 'con_reserva' && partida.fecha) {
    return (
      <View style={styles.fechaContainer}>
        <Text style={styles.fecha}>
          {formatearFechaLegible(partida.fecha)} • {partida.horaInicio?.slice(0, 5)} - {partida.horaFin?.slice(0, 5)}
        </Text>
      </View>
    );
  }

  if (partida.tipo === 'abierta') {
    return (
      <View style={styles.fechaContainer}>
        <Text style={styles.fechaAbierta}>Fecha por acordar</Text>
      </View>
    );
  }

  return null;
}

function NivelPreferido({ nivel }) {
  const nivelLabel = NIVELES_JUEGO.find(n => n.value === nivel)?.label || nivel;
  return <Text style={styles.nivel}>Nivel: {nivelLabel}</Text>;
}

function Mensaje({ texto }) {
  return <Text style={styles.mensaje}>"{texto}"</Text>;
}

function Acciones({
  partida,
  esCreador,
  miSolicitud,
  estaConfirmado,
  estaPendiente,
  esCompleta,
  esClase,
  mostrarAccionesCreador,
  onCancelar,
  onEditar,
  onSolicitarUnirse,
  onCancelarSolicitud,
  onDesapuntarse,
  onCerrarClase,
}) {
  return (
    <View style={styles.acciones}>
      {/* Creador puede editar (clases siempre pueden editarse para quitar jugadores) */}
      {esCreador && mostrarAccionesCreador && (!esCompleta || esClase) && (
        <TouchableOpacity style={[styles.botonEditar, esClase && styles.botonEditarClase]} onPress={onEditar}>
          <Text style={[styles.botonEditarText, esClase && styles.botonEditarTextClase]}>Editar</Text>
        </TouchableOpacity>
      )}

      {/* Creador de clase puede cerrar inscripciones manualmente */}
      {esCreador && esClase && !esCompleta && mostrarAccionesCreador && (
        <TouchableOpacity style={styles.botonCerrarClase} onPress={onCerrarClase}>
          <Text style={styles.botonCerrarClaseText}>Cerrar</Text>
        </TouchableOpacity>
      )}

      {/* Creador puede cancelar */}
      {esCreador && mostrarAccionesCreador && (
        <TouchableOpacity style={styles.botonCancelar} onPress={onCancelar}>
          <Text style={styles.botonCancelarText}>Cancelar</Text>
        </TouchableOpacity>
      )}

      {/* Usuario puede solicitar unirse si no es creador y no tiene solicitud */}
      {!esCreador && !miSolicitud && !esCompleta && (
        <TouchableOpacity style={[styles.botonPrimario, esClase && styles.botonPrimarioClase]} onPress={onSolicitarUnirse}>
          <Text style={styles.botonPrimarioText}>{esClase ? 'Solicitar plaza' : 'Solicitar unirse'}</Text>
        </TouchableOpacity>
      )}

      {/* Usuario con solicitud pendiente */}
      {!esCreador && estaPendiente && (
        <View style={styles.solicitudPendiente}>
          <Text style={styles.solicitudPendienteText}>
            {partida.esCreador === false ? 'Esperando aprobación' : 'Solicitud enviada'}
          </Text>
          <TouchableOpacity style={styles.botonSecundario} onPress={onCancelarSolicitud}>
            <Text style={styles.botonSecundarioText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Usuario confirmado puede desapuntarse */}
      {!esCreador && estaConfirmado && (
        <TouchableOpacity style={styles.botonCancelar} onPress={onDesapuntarse}>
          <Text style={styles.botonCancelarText}>Desapuntarme</Text>
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
  cardCompleta: {
    borderColor: colors.reservaGarantizada,
  },
  cardClase: {
    backgroundColor: colors.claseBackground,
    borderColor: colors.clase,
  },
  cardClaseCompleta: {
    borderColor: colors.clase,
  },
  // Badge CLASE en esquina
  claseBadgeContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.clase,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 10,
  },
  claseBadgeText: {
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
  creadorNombre: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  creadorVivienda: {
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
  badgeCompleta: {
    backgroundColor: colors.reservaGarantizada + '20',
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  badgeTextCompleta: {
    color: colors.reservaGarantizada,
  },
  badgeClase: {
    backgroundColor: colors.clase + '20',
  },
  badgeClaseCompleta: {
    backgroundColor: colors.clase + '30',
  },
  badgeTextClase: {
    color: colors.clase,
  },
  // Info de clase
  claseInfoContainer: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.clase + '30',
  },
  claseInfoText: {
    fontSize: 13,
    color: colors.text,
    marginBottom: 4,
  },
  clasePrecios: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  clasePrecio: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.clase,
  },
  fechaContainer: {
    marginBottom: 8,
  },
  fecha: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  fechaAbierta: {
    fontSize: 14,
    color: colors.accent,
    fontStyle: 'italic',
  },
  nivel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  mensaje: {
    fontSize: 14,
    color: colors.text,
    fontStyle: 'italic',
    marginBottom: 12,
    backgroundColor: colors.background,
    padding: 10,
    borderRadius: 8,
  },
  acciones: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  botonPrimario: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  botonPrimarioText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  botonEditar: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  botonEditarText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  botonEditarClase: {
    borderColor: colors.clase,
  },
  botonEditarTextClase: {
    color: colors.clase,
  },
  botonPrimarioClase: {
    backgroundColor: colors.clase,
  },
  botonCerrarClase: {
    backgroundColor: colors.clase,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  botonCerrarClaseText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  botonCancelar: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.error,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  botonCancelarText: {
    color: colors.error,
    fontWeight: '600',
    fontSize: 14,
  },
  botonSecundario: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.textSecondary,
  },
  botonSecundarioText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  solicitudPendiente: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  solicitudPendienteText: {
    fontSize: 14,
    color: colors.accent,
    fontStyle: 'italic',
  },
});
