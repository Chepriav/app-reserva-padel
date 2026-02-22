# Spanish Identifiers Inventory (Step 1)

Scope: `src/` JS/TS files. Strings are included only for review, not for renaming.

## Candidate Identifiers (non-string tokens)

- `src/constants/colors.js`
  Identifiers: anuncioAviso, anuncioInfo, anuncioMantenimiento, anuncioUrgente, bloqueado, clase, claseBackground, claseBadge, guaranteedReservation, notificacionLeida, pastReservation, provisionalReservation, reservaDesplazable, reservaGarantizada, reservaPasada, reservaProvisional
- `src/constants/config.js`
  Identifiers: CLASE_CONFIG, DURACION_BLOQUE, HORARIOS_CONFIG, LIMITES_RESERVA, MAX_ALUMNOS, MIN_ALUMNOS, NIVELES_JUEGO, PRIORIDAD_LABELS, RESERVATION_LIMITS, VIVIENDA_CONFIG, combinarVivienda, duracionBloque, esViviendaValida, formatearVivienda, horaApertura, horaCierre, horasAnticipacionMinima, horasCancelacionMinima, maxActiveReservations, maxReservasActivas, parseVivienda
- `src/di/container.ts`
  Identifiers: CancelMatchByReservation, CancelReservation, CreateReservation, DisplaceReservation, GetActiveApartmentReservations, GetAllReservations, GetEnrolledMatches, GetReservationStatistics, GetReservationsByApartment, GetReservationsByDate, GetReservationsWithMatch, GetUserReservations, SupabaseReservationRepository, SupabaseUserAdminRepository, ToggleAdminRole, cancelMatchByReservation, cancelReservation, createReservation, displaceReservation, getActiveApartmentReservations, getAllReservations, getEnrolledMatches, getReservationStatistics, getReservationsByApartment, getReservationsByDate, getReservationsWithMatch, getUserReservations, reservationRepository, toggleAdminRole, userAdminRepository
- `src/domain/entities/AvailabilitySlot.ts`
  Identifiers: Reservation, ReservationPriority, existingReservation
- `src/domain/entities/DisplacementNotification.ts`
  Identifiers: reservationDate
- `src/domain/entities/Match.ts`
  Identifiers: reservationId
- `src/domain/entities/Reservation.ts`
  Identifiers: CreateReservationData, Reservation, ReservationPriority, ReservationStatistics, ReservationStatus, cancelledReservations, confirmedReservations, todayReservations, totalReservations, weekReservations
- `src/domain/entities/User.ts`
  Identifiers: isAdmin
- `src/domain/entities/index.ts`
  Identifiers: CreateReservationData, Reservation, ReservationPriority, ReservationStatistics, ReservationStatus
- `src/domain/errors/DomainErrors.ts`
  Identifiers: Reservation, ReservationAlreadyCancelledError, ReservationLimitExceededError, ReservationNotFoundError, ReservationPermissionError, ReservationSlotUnavailableError, ReservationTooEarlyError, ReservationTooFarAheadError, reservationToDisplace
- `src/domain/errors/index.ts`
  Identifiers: ReservationAlreadyCancelledError, ReservationLimitExceededError, ReservationNotFoundError, ReservationPermissionError, ReservationSlotUnavailableError, ReservationTooEarlyError, ReservationTooFarAheadError
- `src/domain/ports/repositories/MatchCancellationPort.ts`
  Identifiers: cancelMatchByReservation, reservationId
- `src/domain/ports/repositories/MatchNotifier.ts`
  Identifiers: notifyMatchCancelledByReservation
- `src/domain/ports/repositories/MatchRepository.ts`
  Identifiers: cancelByReservationId, findByReservationId, findEnrolledByUser, findReservationIdsByCreator, reservationId
- `src/domain/ports/repositories/ReservationRepository.ts`
  Identifiers: CreateReservationData, Reservation, ReservationPriority, ReservationRepository, ReservationStatistics, reservationId
- `src/domain/ports/repositories/UserAdminRepository.ts`
  Identifiers: UserAdminRepository, isAdmin, toggleAdminRole
- `src/domain/ports/repositories/index.ts`
  Identifiers: ReservationRepository, UserAdminRepository
- `src/domain/useCases/ApplyPriorityConversion.ts`
  Identifiers: Reservation, reservations
- `src/domain/useCases/ApproveUser.ts`
  Identifiers: UserAdminRepository
- `src/domain/useCases/CancelMatchByReservation.ts`
  Identifiers: CancelMatchByReservation, CancelMatchByReservationResult, cancelByReservationId, notifyMatchCancelledByReservation, reservationId
- `src/domain/useCases/CancelReservation.ts`
  Identifiers: CancelReservation, ReservationAlreadyCancelledError, ReservationNotFoundError, ReservationPermissionError, ReservationRepository, cancelMatchByReservation, reservation, reservationId, reservationRepository
- `src/domain/useCases/CheckSlotInBreakTime.ts`
  Identifiers: horaFin, horaInicio
- `src/domain/useCases/CreateBlockout.ts`
  Identifiers: CancelReservation, cancelReservation, existingReservation, reservation
- `src/domain/useCases/CreateReservation.ts`
  Identifiers: CreateReservation, CreateReservationData, DetermineReservationPriority, DisplaceReservation, GetActiveApartmentReservations, MAX_ACTIVE_RESERVATIONS, RESERVATION_LIMITS, Reservation, ReservationLimitExceededError, ReservationRepository, ReservationSlotUnavailableError, ReservationTooEarlyError, ReservationTooFarAheadError, displaceReservation, existingReservation, getActiveReservations, reservation, reservationRepository, reservations
- `src/domain/useCases/DeleteUser.ts`
  Identifiers: UserAdminRepository
- `src/domain/useCases/DetermineReservationPriority.ts`
  Identifiers: DetermineReservationPriority, Reservation, ReservationPriority, existingReservations
- `src/domain/useCases/DisplaceReservation.ts`
  Identifiers: DisplaceReservation, Reservation, ReservationRepository, cancelMatchByReservation, reservationDate, reservationRepository, reservationToDisplace
- `src/domain/useCases/GetActiveApartmentReservations.ts`
  Identifiers: GetActiveApartmentReservations, Reservation, ReservationRepository, reservationDate, reservationRepository
- `src/domain/useCases/GetAllApprovedUsers.ts`
  Identifiers: UserAdminRepository
- `src/domain/useCases/GetAllReservations.ts`
  Identifiers: GetAllReservations, Reservation, ReservationRepository, reservationRepository
- `src/domain/useCases/GetAvailability.ts`
  Identifiers: GetActiveApartmentReservations, ReservationRepository, existingReservation, getActiveApartmentReservations, reservationConflict, reservationRepository, reservations, reservationsResult
- `src/domain/useCases/GetConversionInfo.ts`
  Identifiers: ReservationRepository, reservationId, reservationRepository
- `src/domain/useCases/GetEnrolledMatches.ts`
  Identifiers: GetEnrolledMatches, findEnrolledByUser
- `src/domain/useCases/GetPendingUsers.ts`
  Identifiers: UserAdminRepository
- `src/domain/useCases/GetReservationStatistics.ts`
  Identifiers: GetReservationStatistics, ReservationRepository, ReservationStatistics, reservationRepository
- `src/domain/useCases/GetReservationsByApartment.ts`
  Identifiers: GetReservationsByApartment, Reservation, ReservationRepository, reservationRepository
- `src/domain/useCases/GetReservationsByDate.ts`
  Identifiers: GetReservationsByDate, Reservation, ReservationRepository, reservationRepository
- `src/domain/useCases/GetReservationsWithMatch.ts`
  Identifiers: GetReservationsWithMatch, findReservationIdsByCreator
- `src/domain/useCases/GetUserReservations.ts`
  Identifiers: GetUserReservations, Reservation, ReservationRepository, reservationRepository
- `src/domain/useCases/RecalculateApartmentConversions.ts`
  Identifiers: ReservationRepository, reservationRepository
- `src/domain/useCases/RejectUser.ts`
  Identifiers: UserAdminRepository
- `src/domain/useCases/ToggleAdminRole.ts`
  Identifiers: ToggleAdminRole, UserAdminRepository, isAdmin, toggleAdminRole
- `src/domain/useCases/index.ts`
  Identifiers: CancelMatchByReservation, CancelReservation, CreateReservation, DetermineReservationPriority, DisplaceReservation, GetActiveApartmentReservations, GetAllReservations, GetEnrolledMatches, GetReservationStatistics, GetReservationsByApartment, GetReservationsByDate, GetReservationsWithMatch, GetUserReservations, ToggleAdminRole
- `src/infrastructure/supabase/helpers/userCleanupHelper.ts`
  Identifiers: removeAdminContent, reservaIds, reservasData
- `src/infrastructure/supabase/mappers/announcementMapper.ts`
  Identifiers: mensaje
- `src/infrastructure/supabase/mappers/availabilityMapper.ts`
  Identifiers: bloqueado, bloqueoId, existingReservation, horaFin, horaInicio, motivoBloqueo, prioridad, reservaExistente, reservationToLegacy
- `src/infrastructure/supabase/mappers/blockoutMapper.ts`
  Identifiers: fecha, horaFin, horaInicio, hora_fin, hora_inicio, pistaId, pista_id
- `src/infrastructure/supabase/mappers/displacementNotificationMapper.ts`
  Identifiers: desplazadoPorVivienda, desplazado_por_vivienda, fechaReserva, fecha_reserva, horaFin, horaInicio, hora_fin, hora_inicio, pistaNombre, pista_nombre, reservationDate
- `src/infrastructure/supabase/mappers/matchMapper.ts`
  Identifiers: cancelada, con_reserva, creadorNivel, creadorVivienda, creador_nivel, creador_vivienda, esClase, es_clase, fecha, horaFin, horaInicio, hora_fin, hora_inicio, mensaje, nivelJuego, nivelPreferido, nivel_juego, nivel_preferido, niveles, partidaId, partida_id, pistaNombre, pista_nombre, precioAlumno, precioGrupo, precio_alumno, precio_grupo, rechazado, reservaId, reserva_id, reservationId, usuarioFoto, usuarioId, usuarioNombre, usuarioVivienda, usuario_foto, usuario_id, usuario_nombre, usuario_vivienda, with_reservation
- `src/infrastructure/supabase/mappers/reservationMapper.ts`
  Identifiers: CreateReservationData, Reservation, ReservationPriority, ReservationStatus, cancelada, fecha, horaFin, horaInicio, hora_fin, hora_inicio, pistaId, pistaNombre, pista_id, pista_nombre, prioridad, reservation, usuarioId, usuarioNombre, usuario_id, usuario_nombre, vivienda
- `src/infrastructure/supabase/mappers/scheduleConfigMapper.ts`
  Identifiers: duracionBloque, duracion_bloque, findeHoraApertura, findeHoraCierre, findeMotivoPausa, findePausaDiasSemana, findePausaFin, findePausaInicio, finde_hora_apertura, finde_hora_cierre, finde_motivo_pausa, finde_pausa_dias_semana, finde_pausa_fin, finde_pausa_inicio, horaApertura, horaCierre, hora_apertura, hora_cierre, motivoPausa, motivo_pausa, p_duracion_bloque, p_finde_hora_apertura, p_finde_hora_cierre, p_finde_motivo_pausa, p_finde_pausa_dias_semana, p_finde_pausa_fin, p_finde_pausa_inicio, p_hora_apertura, p_hora_cierre, p_motivo_pausa, p_pausa_dias_semana, p_pausa_fin, p_pausa_inicio, p_semana_hora_apertura, p_semana_hora_cierre, p_usar_horarios_diferenciados, pausaDiasSemana, pausaFin, pausaInicio, pausa_dias_semana, pausa_fin, pausa_inicio, semanaHoraApertura, semanaHoraCierre, semana_hora_apertura, semana_hora_cierre, usarHorariosDiferenciados, usar_horarios_diferenciados
- `src/infrastructure/supabase/mappers/userMapper.ts`
  Identifiers: aprobado, esAdmin, es_admin, estadoAprobacion, estado_aprobacion, fotoPerfil, foto_perfil, isAdmin, nivelJuego, nivel_juego, rechazado, vivienda, viviendaSolicitada, vivienda_solicitada
- `src/infrastructure/supabase/mappers/userNotificationMapper.ts`
  Identifiers: bloqueo_cancelacion, clase_aceptada, clase_cancelada, clase_cancelada_reserva, clase_solicitud, class_cancelled_by_reservation, match_cancelled_by_reservation, mensaje, partida_aceptada, partida_cancelada, partida_cancelada_reserva, partida_completa, partida_solicitud, usuarioId, usuario_id
- `src/infrastructure/supabase/repositories/DomainMatchCancellationAdapter.ts`
  Identifiers: CancelMatchByReservation, cancelMatchByReservation, cancelMatchByReservationUseCase, reservationId
- `src/infrastructure/supabase/repositories/ExpoLocalScheduler.ts`
  Identifiers: horaFormateada, partidaId
- `src/infrastructure/supabase/repositories/LegacyDisplacementNotifierAdapter.ts`
  Identifiers: fecha, horaFin, horaInicio, notifyViviendaBlockoutCancellation, notifyViviendaDisplacement, pistaNombre
- `src/infrastructure/supabase/repositories/LegacyMatchCancellationAdapter.ts`
  Identifiers: cancelMatchByReservation, cancelarPartidaPorReserva, partidasService, reservationId
- `src/infrastructure/supabase/repositories/LegacyMatchNotifierAdapter.ts`
  Identifiers: esClase, fecha, horaInicio, notifyMatchCancelledByReservation, notifyPartidaAceptada, notifyPartidaCancelada, notifyPartidaCanceladaPorReserva, notifyPartidaCompleta, notifyPartidaSolicitud, partidaId, pistaNombre, schedulePartidaReminders
- `src/infrastructure/supabase/repositories/ReservationRpcHelper.ts`
  Identifiers: CreateReservationData, Reservation, ReservationRpcHelper, nueva_reserva_id, p_fecha, p_hora_fin, p_hora_inicio, p_nueva_fecha, p_nueva_hora_fin, p_nueva_hora_inicio, p_nueva_pista_id, p_nueva_vivienda, p_nuevo_usuario_id, p_nuevo_usuario_nombre, p_pista_id, p_reserva_a_desplazar_id, p_usuario_id, p_usuario_nombre, p_vivienda, reserva_id
- `src/infrastructure/supabase/repositories/SupabaseAnnouncementRepository.ts`
  Identifiers: anuncioIds, anuncio_id, mensaje, usuario_id
- `src/infrastructure/supabase/repositories/SupabaseBlockoutRepository.ts`
  Identifiers: fecha, hora_fin, hora_inicio, pista_id
- `src/infrastructure/supabase/repositories/SupabaseDisplacementNotificationRepository.ts`
  Identifiers: desplazado_por_vivienda, fecha_reserva, hora_fin, hora_inicio, pista_nombre, reservationDate, usuario_id
- `src/infrastructure/supabase/repositories/SupabaseDisplacementNotifier.ts`
  Identifiers: fecha, horaInicio, pistaNombre
- `src/infrastructure/supabase/repositories/SupabaseMatchNotifier.ts`
  Identifiers: notifyMatchCancelledByReservation
- `src/infrastructure/supabase/repositories/SupabaseMatchRepository.ts`
  Identifiers: cancelByReservationId, enrollments, fecha, findByReservationId, findEnrolledByUser, findReservationIdsByCreator, hora_fin, hora_inicio, mensaje, nivel_juego, nivel_preferido, niveles, partida_id, pista_nombre, precio_alumno, precio_grupo, reserva_id, reservationId, usuario_id, usuario_nombre, usuario_vivienda
- `src/infrastructure/supabase/repositories/SupabasePlayerRepository.ts`
  Identifiers: nivel_juego, p_partida_id, partida_id, usuario_id, usuario_nombre, usuario_vivienda
- `src/infrastructure/supabase/repositories/SupabaseReservationRepository.ts`
  Identifiers: CreateReservationData, Reservation, ReservationNotFoundError, ReservationPriority, ReservationRepository, ReservationRpcHelper, ReservationStatistics, SupabaseReservationRepository, cancelledReservations, confirmedReservations, prioridad, reservationId, todayReservations, totalReservations, weekReservations
- `src/infrastructure/supabase/repositories/SupabaseUserAdminRepository.ts`
  Identifiers: SupabaseUserAdminRepository, UserAdminRepository, es_admin, estado_aprobacion, isAdmin, removeAdminContent, toggleAdminRole, vivienda, vivienda_solicitada
- `src/infrastructure/supabase/repositories/SupabaseUserNotificationRepository.ts`
  Identifiers: mensaje, usuario_id
- `src/infrastructure/supabase/repositories/SupabaseUserRepository.ts`
  Identifiers: removeAdminContent
- `src/presentation/components/ApartmentSelector.js`
  Identifiers: ApartmentSelector, ScrollView, VIVIENDA_CONFIG, ViviendaSelector, selector, selectorContainer, selectorDisabled, selectorLabel, selectorText, selectorsRow
- `src/presentation/components/admin/AdminContent.js`
  Identifiers: SolicitudCard, SolicitudesContent, UsuarioCard, Usuarios, UsuariosContent, onAprobar, onAprobarCambio, onEditVivienda, onRechazar, onRechazarCambio, onToggleAdmin, solicitudesCambio, usuario, usuarios, usuariosHeader, usuariosPendientes, usuariosTitle
- `src/presentation/components/admin/AdminTabs.js`
  Identifiers: AdminHeader, AdminTabs, Solicitudes, Usuarios, contadorSolicitudes, contadorUsuarios
- `src/presentation/components/admin/AnnouncementAdminCard.js`
  Identifiers: AnnouncementAdminCard, AnuncioAdminCard, anuncio, anuncioAviso, anuncioInfo, anuncioMantenimiento, anuncioUrgente, fecha, fechaStr, formatearFecha, mensaje
- `src/presentation/components/admin/ApartmentChangeCard.js`
  Identifiers: Aprobar, Cambio, CambioViviendaCard, Rechazar, botonAprobar, botonAprobarText, botonRechazar, botonRechazarText, botonesContainer, cambioArrow, cambioBadge, cambioNueva, cambioValue, cambioViviendaContainer, formatearVivienda, onAprobar, onRechazar, usuario, vivienda, viviendaSolicitada
- `src/presentation/components/admin/CreateAnnouncementModal.js`
  Identifiers: CrearAnuncioModal, Mensaje, RecipientsSelector, ScrollView, TIPOS_ANUNCIO, anuncioAviso, anuncioInfo, anuncioMantenimiento, anuncioUrgente, loadingUsuarios, mensaje, selectorContainer, setMensaje, setUsuariosSeleccionados, usuarios, usuariosIds, usuariosSeleccionados
- `src/presentation/components/admin/CreateAnnouncementModalStyles.js`
  Identifiers: selectorContainer
- `src/presentation/components/admin/EditApartmentModal.js`
  Identifiers: ApartmentSelector, EditViviendaModal, Usuario, Vivienda, selectorContainer, usuario
- `src/presentation/components/admin/ImportResultsModal.js`
  Identifiers: ScrollView, usuarios
- `src/presentation/components/admin/ImportUsersButton.js`
  Identifiers: Usuarios
- `src/presentation/components/admin/ImportUsersModal.js`
  Identifiers: ScrollView, Usuarios, usuarios
- `src/presentation/components/admin/RecipientsSelector.js`
  Identifiers: RecipientsSelector, SelectorDestinatarios, renderUsuario, showsVerticalScrollIndicator, toggleUsuario, usuarioInfo, usuarioItem, usuarioItemSelected, usuarioNombre, usuarioVivienda, usuarios, usuariosFiltrados, vivienda
- `src/presentation/components/admin/ScheduleConfigSection.js`
  Identifiers: Domingo, Hora, Horario, Lunes, Pausa, Viernes, bloques, calendario, domingos, findeHoraApertura, findeHoraCierre, findePausaFin, findePausaInicio, horaApertura, horaCierre, horario, horarios, pausa, pausaFin, pausaInicio, pistas, reserva, reservable, reservas, semanaHoraApertura, semanaHoraCierre, usarHorariosDiferenciados
- `src/presentation/components/admin/SolicitudCard.js`
  Identifiers: Aprobar, Rechazar, Solicitud, SolicitudCard, Vivienda, botonAprobar, botonAprobarText, botonRechazar, botonRechazarText, botonesContainer, formatearFechaLegible, onAprobar, onRechazar, usuario, vivienda
- `src/presentation/components/admin/UsuarioCard.js`
  Identifiers: Admin, Administrador, Usuario, UsuarioCard, Vivienda, adminBadge, adminToggleContainer, adminToggleLabel, editViviendaButton, editViviendaButtonText, esAdmin, esMiCuenta, onEditVivienda, onToggleAdmin, tuCuenta, usuario, vivienda
- `src/presentation/components/admin/index.js`
  Identifiers: AdminHeader, AdminTabs, AnnouncementAdminCard, RecipientsSelector, SolicitudCard, SolicitudesContent, UsuarioCard, UsuariosContent
- `src/presentation/components/home/BlockoutModal.js`
  Identifiers: Bloquear, Horarios, ModalBloqueo, cantidadHorarios, horario
- `src/presentation/components/home/CourtSelector.js`
  Identifiers: CourtSelector, PistaSelector, Pistas, onPistaSelect, pista, pistaSeleccionada, pistas
- `src/presentation/components/home/DateSelector.js`
  Identifiers: DateSelector, FechaSelector, fechaSeleccionada, onCambiarFecha
- `src/presentation/components/home/FloatingButtons.js`
  Identifiers: Bloquear, BotonReservar, BotonesBloqueo, Desbloquear, Reservar, bloque, cantidadBloquear, cantidadBloques, cantidadDesbloquear, horario, onBloquear, onDesbloquear
- `src/presentation/components/home/HomeHeader.js`
  Identifiers: Bloquear, bloqueado, esAdmin, headerModoBloqueo, modoBloqueo, modoBloqueoContainer, modoBloqueoLabel, onModoBloqueoChange
- `src/presentation/components/home/Legend.js`
  Identifiers: Reservado, guaranteedReservation, reserva
- `src/presentation/components/home/ScheduleGrid.js`
  Identifiers: HorariosContainer, HorariosGridDia, HorariosGridSemana, bloqueado, bloquesABloquear, bloquesADesbloquear, bloquesSeleccionados, esAdmin, esMiVivienda, estaBloqueado, estaSeleccionadoParaBloquear, estaSeleccionadoParaDesbloquear, fecha, fechaSeleccionada, fechas, horaFin, horaInicio, horario, horarios, horariosDia, horariosSemanales, modoBloqueo, onHorarioPress, prioridad, reservaExistente, reservando, userVivienda, vivienda
- `src/presentation/components/home/SelectionInfo.js`
  Identifiers: HorariosHeader, cantidadBloques
- `src/presentation/components/home/TimeSlotChip.js`
  Identifiers: HorarioChip, bloqueado, esMiVivienda, estaBloqueado, estaSeleccionadoParaBloquear, estaSeleccionadoParaDesbloquear, fecha, guaranteedReservation, horaFin, horaInicio, horario, modoBloqueo, mostrarIconoBloqueado, prioridad, provisionalReservation, reservaExistente, userVivienda, vivienda
- `src/presentation/components/home/ViewSelector.js`
  Identifiers: ViewSelector, VistaSelector, viewSelector
- `src/presentation/components/home/index.js`
  Identifiers: BotonReservar, BotonesBloqueo, CourtSelector, DateSelector, FechaSelector, HorarioChip, HorariosContainer, HorariosGridDia, HorariosGridSemana, HorariosHeader, ModalBloqueo, PistaSelector, ViewSelector, VistaSelector
- `src/presentation/components/partidas/AddPlayerModal.js`
  Identifiers: NIVELES_JUEGO, Nivel, PlayerTypeSelector, ScrollView, Vivienda, fotoPerfil, nestedScrollEnabled, nivelJuego, usuario, usuarios, vivienda
- `src/presentation/components/partidas/CreateMatchModal.js`
  Identifiers: CrearPartidaModal, LevelSelector, LevelsMultiSelector, Mensaje, ModeSelector, ParticipantsSelector, ReservationSelector, ScrollView, TypeSelector, futureReservations, nestedScrollEnabled, reservation, reservations, scrollContent, selectedReservation, showsVerticalScrollIndicator
- `src/presentation/components/partidas/MatchCard.js`
  Identifiers: Alumnos, CLASE, Fecha, NIVELES_JUEGO, Nivel, PartidaCard, Vivienda, alumno, creadorNivel, creadorVivienda, esClase, fecha, horaFin, horaInicio, mensaje, nivel, nivelPreferido, niveles, precioAlumno, precioGrupo, usuarioId, vivienda
- `src/presentation/components/partidas/MatchCardStyles.js`
  Identifiers: guaranteedReservation
- `src/presentation/components/partidas/ParticipantsList.js`
  Identifiers: NIVELES_JUEGO, Vivienda, nivel, nivelJuego, usuarioFoto, usuarioNombre, usuarioVivienda, vivienda
- `src/presentation/components/partidas/PendingRequests.js`
  Identifiers: NIVELES_JUEGO, Solicitudes, SolicitudesPendientes, Vivienda, nivelJuego, provisionalReservation, usuarioFoto, usuarioId, usuarioNombre, usuarioVivienda
- `src/presentation/components/partidas/PlayersEditor.js`
  Identifiers: NIVELES_JUEGO, esClase, nivel, usuario, vivienda
- `src/presentation/components/partidas/form/LevelSelector.js`
  Identifiers: LevelSelector, NIVELES_JUEGO, Nivel, NivelSelector
- `src/presentation/components/partidas/form/LevelsMultiSelector.js`
  Identifiers: LevelsMultiSelector, NIVELES_JUEGO, Niveles, NivelesMultiSelector, clase
- `src/presentation/components/partidas/form/ModeSelector.js`
  Identifiers: Clase, ModalidadSelector, ModeSelector, Partida
- `src/presentation/components/partidas/form/ParticipantsSelector.js`
  Identifiers: CLASE_CONFIG, ParticipantesSelector, ParticipantsSelector, alumnos
- `src/presentation/components/partidas/form/PriceInput.js`
  Identifiers: Precio, PrecioInput, alumno, pago, precioAlumno, precioGrupo
- `src/presentation/components/partidas/form/ReservationSelector.js`
  Identifiers: ReservaSelector, ReservationSelector, fecha, horaInicio, noReservations, pistaNombre, reserva, reservas, reservation, reservations
- `src/presentation/components/partidas/form/TypeSelector.js`
  Identifiers: Fecha, TipoSelector, TypeSelector, reserva
- `src/presentation/components/partidas/form/index.js`
  Identifiers: LevelSelector, LevelsMultiSelector, ModalidadSelector, ModeSelector, NivelSelector, NivelesMultiSelector, ParticipantesSelector, ParticipantsSelector, PrecioInput, ReservaSelector, ReservationSelector, TipoSelector, TypeSelector
- `src/presentation/components/profile/ApartmentChangeModal.js`
  Identifiers: ApartmentSelector, Cambio, Solicitud, Vivienda, administrador, selectorContainer, setSolicitudModal, solicitud, solicitudModal, vivienda
- `src/presentation/components/profile/ProfileApartmentUsers.js`
  Identifiers: NIVELES_JUEGO, Vivienda, esViviendaValida, formatearVivienda, fotoPerfil, loadingUsuarios, nivel, nivelJuego, noUsuariosText, usuario, usuarios, usuariosVivienda, vivienda
- `src/presentation/components/profile/ProfileHeader.js`
  Identifiers: Perfil, fotoPerfil
- `src/presentation/components/profile/ProfilePersonalInfo.js`
  Identifiers: Administrador, ApartmentSelector, Cambio, NIVELES_JUEGO, Nivel, Rol, Solicitud, Vivienda, adminBadge, adminText, cambio, cancelarSolicitudButton, cancelarSolicitudText, cancelingSolicitud, esAdmin, esViviendaValida, formatearVivienda, nivel, nivelJuego, nivelOption, nivelOptionSelected, nivelOptionText, nivelOptionTextSelected, nivelPickerContainer, nivelSelector, nivelSelectorArrow, nivelSelectorText, onCancelarSolicitud, onSolicitarCambio, setNivelJuego, setShowNivelPicker, showNivelPicker, solicitarCambioButton, solicitarCambioText, solicitudBadge, solicitudInfo, solicitudPendiente, solicitudText, vivienda, viviendaLabelRow, viviendaLocked, viviendaSelectorContainer, viviendaSolicitada
- `src/presentation/components/tablon/AnnouncementCard.js`
  Identifiers: ahora, anuncio, anuncioAviso, anuncioInfo, anuncioMantenimiento, anuncioUrgente, fecha, fechaStr, formatearFecha, isAdmin, mensaje, notificacionLeida
- `src/presentation/components/tablon/AnnouncementModal.js`
  Identifiers: Entendido, ScrollView, anuncio, anuncioAviso, anuncioInfo, anuncioMantenimiento, anuncioUrgente, fecha, fechaStr, formatearFechaCompleta, isAdmin, mensaje
- `src/presentation/components/tablon/EmptyState.js`
  Identifiers: anuncios, notificaciones
- `src/presentation/components/tablon/NotificationCard.js`
  Identifiers: ahora, anuncioAviso, anuncioInfo, diffHoras, fecha, fechaStr, formatearFechaRelativa, mensaje, notificacion, notificacionLeida, partida_aceptada, partida_cancelada, partida_completa, partida_solicitud, reserva_recordatorio
- `src/presentation/context/AuthContext.js`
  Identifiers: marcarNotificacionesLeidas, notificacionesPendientes, vivienda
- `src/presentation/context/ReservationsContext.js`
  Identifiers: ReservationsContext, ReservationsProvider, cancelReservation, cancelarReserva, crearReserva, createReservation, fecha, futureReservations, getPastReservations, getReservationsByDate, getUpcomingReservations, horaInicio, loadReservations, obtenerDisponibilidad, obtenerPistas, obtenerReservasPorFecha, obtenerReservasPorVivienda, originalReservations, prioridad, reloadReservations, reservasConversion, reservasService, reservationData, reservationDate, reservationId, reservations, reservationsVersion, scheduleReservationReminder, setReservations, setReservationsVersion, useReservations, usuarioId, usuarioNombre, vivienda
- `src/presentation/context/useAuthNotifications.js`
  Identifiers: aprobado, cargarNotificaciones, marcarNotificacionesLeidas, notificacionesPendientes, obtenerNotificacionesPendientes, reservasService, setNotificacionesPendientes
- `src/presentation/hooks/index.js`
  Identifiers: useAdminActions, useAdminData, useAnnouncementsAdmin
- `src/presentation/hooks/profile/useApartmentChange.js`
  Identifiers: cancelarSolicitudVivienda, cancelingSolicitud, closeSolicitudModal, combinarVivienda, formatearVivienda, handleCancelarSolicitud, handleEnviarSolicitud, nuevaVivienda, openSolicitudModal, setCancelingSolicitud, setSolicitudModal, solicitarCambioVivienda, solicitudModal, validarViviendaComponentes, vivienda, viviendaSolicitada
- `src/presentation/hooks/profile/useProfileEdit.js`
  Identifiers: NIVELES_JUEGO, combinarVivienda, esAdmin, fotoPerfil, nivelJuego, parseVivienda, setFotoPerfil, setNivelJuego, setShowNivelPicker, showNivelPicker, validarPerfil, validarViviendaComponentes, vivienda, viviendaParsed, viviendaValidacion
- `src/presentation/hooks/useAddPlayerModal.js`
  Identifiers: nivel, nivelJuego, usuario, vivienda
- `src/presentation/hooks/useAdminActions.js`
  Identifiers: aprobarCambioVivienda, aprobarUsuario, combinarVivienda, esAdmin, formatearVivienda, handleToggleAdmin, notifyViviendaChange, nuevaVivienda, nuevoRol, rechazarCambioVivienda, rechazarUsuario, toggleAdminRole, useAdminActions, usuario, validarViviendaComponentes, vivienda, viviendaSolicitada
- `src/presentation/hooks/useAdminData.js`
  Identifiers: cambiosResult, cargarAnunciosCallback, cargarUsuariosCallback, getSolicitudesCambioVivienda, getTodosUsuarios, getUsuariosPendientes, useAdminData, usuariosResult
- `src/presentation/hooks/useAnnouncements.js`
  Identifiers: crearAnuncio, eliminarAnuncio, marcarAnuncioLeido, mensaje, notifyNuevoAnuncio, obtenerAnunciosParaUsuario, obtenerTodosAnuncios, obtenerUsuariosAprobados, useAnnouncementsAdmin, usuariosIds
- `src/presentation/hooks/useBloqueos.js`
  Identifiers: bloque, bloqueoId, crearBloqueo, eliminarBloqueo, fecha, horaFin, horaInicio, horario, mensaje, motivoBloqueo, reservasService
- `src/presentation/hooks/useBulletinCounter.js`
  Identifiers: contarAnunciosNoLeidos, contarNotificacionesNoLeidas
- `src/presentation/hooks/useCreateMatchModal.js`
  Identifiers: obtenerReservasConPartida, partidasService, reservationsWithMatch, selectedReservation, setReservationsWithMatch
- `src/presentation/hooks/useEditApartmentModal.js`
  Identifiers: parseVivienda, usuario, vivienda
- `src/presentation/hooks/useHomeActions.js`
  Identifiers: bloqueTerminado, bloqueado, bloqueosHook, bloquesDesplazables, bloquesSeleccionados, cambiarFecha, confirmarReserva, crearReserva, datosReserva, diasHastaLunes, diasHastaLunesHoy, duracionMinutos, esAdmin, esFechaValida, esMiVivienda, estaBloqueado, fecha, fechaSeleccionada, formatearFechaLegible, getDatosReserva, handleHorarioPress, horaFin, horaInicio, horario, horasDesplazadas, lunesDeEstaSemanaMundial, lunesSeleccionado, lunesSiguienteSemana, maxFecha, mensaje, mensajeExito, nuevaFecha, nuevaFechaObj, nuevaFechaStr, pistaId, pistaSeleccionada, prioridad, puedeReservar, recargarHorarios, reservaExistente, reservando, reservas, setFechaSeleccionada, setReservando, toggleBloqueSeleccionado, vivienda, viviendaDesplazada, viviendasDesplazadas
- `src/presentation/hooks/useMatchHandlers.js`
  Identifiers: creadorVivienda, currentReservation, esClase, fecha, futureReservations, getFutureReservations, horaFin, horaInicio, isCurrentReservation, mensaje, nivel, nivelJuego, nivelPreferido, niveles, pistaNombre, precioAlumno, precioGrupo, reservaId, reservationDate, reservations, reservationsWithMatch, selectedReservation, usuario, usuarioId, usuarioNombre, usuarioVivienda, vivienda
- `src/presentation/hooks/useMatches.js`
  Identifiers: obtenerMisPartidas, obtenerPartidasActivas, obtenerPartidasApuntado, partidasService
- `src/presentation/hooks/useMatchesActions.js`
  Identifiers: aceptarSolicitud, anadirJugadorAPartida, cancelarPartida, cancelarSolicitud, cerrarClase, crearPartida, desapuntarsePartida, editarPartida, partidasService, rechazarSolicitud
- `src/presentation/hooks/useNotifications.js`
  Identifiers: eliminarNotificacion, marcarNotificacionLeida, obtenerNotificaciones
- `src/presentation/hooks/useScheduleConfig.js`
  Identifiers: duracionBloque, findeHoraApertura, findeHoraCierre, findeMotivoPausa, findePausaDiasSemana, findePausaFin, findePausaInicio, horaApertura, horaCierre, motivoPausa, pausaDiasSemana, pausaFin, pausaInicio, semanaHoraApertura, semanaHoraCierre, usarHorariosDiferenciados
- `src/presentation/hooks/useSchedules.js`
  Identifiers: diasHastaLunes, esFechaValida, fecha, fechaActual, fechaStr, horariosTemp, lunes, reservasVersion
- `src/presentation/hooks/useSlotSelection.js`
  Identifiers: bloquesDesplazables, bloquesOrdenados, duracionMinutos, fecha, fechaReserva, getReservationData, horaFin, horaInicio, horario, nuevoBloque, primeraFecha, prioridad, reservaExistente, vivienda, viviendaDesplazada
- `src/presentation/hooks/useTablon.js`
  Identifiers: useAnnouncementsAdmin
- `src/presentation/hooks/useUserImport.js`
  Identifiers: AbortController, abortControllerRef
- `src/presentation/hooks/useUsuarios.js`
  Identifiers: getTodosUsuarios
- `src/presentation/navigation/TabNavigator.js`
  Identifiers: AdminScreen, ReservationsScreen, admin, esAdmin, partidas
- `src/presentation/screens/AdminScreen.js`
  Identifiers: AdminHeader, AdminScreen, AdminTabs, RefreshControl, ScrollView, SolicitudesContent, UsuariosContent, contadorSolicitudes, contadorUsuarios, handleToggleAdmin, onAprobar, onAprobarCambio, onEditVivienda, onRechazar, onRechazarCambio, onSaveVivienda, onToggleAdmin, refreshControl, solicitudesCambio, useAdminActions, useAdminData, usuario, usuarios, usuariosPendientes
- `src/presentation/screens/BulletinScreen.js`
  Identifiers: Anuncios, Notificaciones, RefreshControl, adminAnnouncementsHook, anuncio, esAdmin, isAdmin, mensaje, notificacion, refreshControl, renderAnuncio, renderNotificacion, setUsuarios, useAnnouncementsAdmin, usuarios
- `src/presentation/screens/HomeScreen.js`
  Identifiers: BotonReservar, BotonesBloqueo, FechaSelector, HorariosContainer, HorariosHeader, ModalBloqueo, PistaSelector, ScrollView, VistaSelector, bloqueosHook, bloquesABloquear, bloquesADesbloquear, bloquesSeleccionados, cambiarFecha, cantidadBloquear, cantidadBloques, cantidadDesbloquear, cantidadHorarios, confirmarReserva, crearReserva, createReservation, esAdmin, fechaSeleccionada, formatearFechaLegible, getDatosReserva, getReservationData, handleHorarioPress, horarios, horariosSemanales, loadingHorarios, marcarNotificacionesLeidas, modoBloqueo, notificacionMostrada, notificacionesPendientes, obtenerDisponibilidad, obtenerFechaHoy, onBloquear, onCambiarFecha, onDesbloquear, onHorarioPress, onModoBloqueoChange, onPistaSelect, pistaSeleccionada, pistas, recargarHorarios, reservando, reservas, reservasVersion, reservations, reservationsVersion, scrollContainer, scrollContent, scrollTo, scrollViewRef, setFechaSeleccionada, setNotificacionMostrada, setPistaSeleccionada, toggleBloqueSeleccionado, useReservations, userVivienda, vivienda
- `src/presentation/screens/HomeScreenStyles.js`
  Identifiers: scrollContainer, scrollContent
- `src/presentation/screens/LoginScreen.js`
  Identifiers: Reserva, ScrollView, Usuarios, cuenta, scrollContent
- `src/presentation/screens/LoginScreenStyles.js`
  Identifiers: scrollContent
- `src/presentation/screens/MatchesScreen.js`
  Identifiers: RefreshControl, ScrollView, botonCrear, botonCrearText, futureReservations, getFutureReservations, partidas, refreshControl, reservations, useReservations, usuario
- `src/presentation/screens/ProfileScreen.js`
  Identifiers: Cambios, Desarrollado, Notificaciones, PerfilScreen, ScrollView, cancelingSolicitud, closeSolicitudModal, cuenta, fotoPerfil, getUsuariosMismaVivienda, handleCancelarSolicitud, handleEnviarSolicitud, loadingUsuarios, nivelJuego, onCancelarSolicitud, onSolicitarCambio, openSolicitudModal, reservas, setLoadingUsuarios, setNivelJuego, setShowNivelPicker, setSolicitudModal, setUsuariosVivienda, showNivelPicker, solicitudModal, usuariosVivienda, vivienda
- `src/presentation/screens/RegisterScreen.js`
  Identifiers: ApartmentSelector, ScrollView, Vivienda, administrador, aprobada, campos, combinarVivienda, cuenta, scrollContent, scrollView, showsVerticalScrollIndicator, solicitud, validarViviendaComponentes, vivienda, viviendaValidacion
- `src/presentation/screens/RegisterScreenStyles.js`
  Identifiers: scrollContent, scrollView
- `src/presentation/screens/ReservationsScreen.js`
  Identifiers: Reserva, Reservado, ReservasScreen, ScrollView, cancelReservation, cancelarReserva, esDeOtroUsuario, estadoCancelada, fecha, formatearFechaLegible, formatearHora, getPastReservations, getReservasPasadas, getReservasProximas, getUpcomingReservations, horaFin, horaInicio, horario, horas, horasHasta, horasRestantes, pistaNombre, prioridad, prioridadBadge, prioridadGarantizada, prioridadProvisional, prioridadText, reloadReservations, renderReserva, reserva, reservaCard, reservaHeader, reservaInfo, reservadoPor, reservas, reservasPasadas, reservasProximas, useReservations, usuarioId, usuarioNombre, vivienda
- `src/presentation/screens/ReservationsScreenStyles.js`
  Identifiers: estadoCancelada, fecha, horario, pistaNombre, prioridadBadge, prioridadGarantizada, prioridadProvisional, prioridadText, reservaCard, reservaGarantizada, reservaHeader, reservaInfo, reservaPasada, reservaProvisional, reservadoPor
- `src/presentation/screens/ResetPasswordScreen.js`
  Identifiers: ScrollView, pantalla, scrollContent
- `src/presentation/screens/ResetPasswordScreenStyles.js`
  Identifiers: scrollContent
- `src/services/authService.supabase.js`
  Identifiers: aprobarCambioVivienda, aprobarUsuario, cancelarSolicitudVivienda, esAdmin, estadoAprobacion, fotoPerfil, getSolicitudesCambioVivienda, getTodosUsuarios, getUsuariosMismaVivienda, getUsuariosPendientes, nivelJuego, nuevaVivienda, rechazarCambioVivienda, rechazarUsuario, solicitarCambioVivienda, toggleAdminRole, userAdminRepository, vivienda
- `src/services/bulletinService.js`
  Identifiers: anuncioId, contarAnunciosNoLeidos, contarNotificacionesNoLeidas, crearAnuncio, crearNotificacion, eliminarAnuncio, eliminarNotificacion, marcarAnuncioLeido, marcarNotificacionLeida, mensaje, notificacionId, obtenerAnunciosParaUsuario, obtenerNotificaciones, obtenerTodosAnuncios, obtenerUsuariosAprobados, usuarioId, usuariosIds, vivienda
- `src/services/csvImportService.js`
  Identifiers: vivienda
- `src/services/matchesService.js`
  Identifiers: aceptarSolicitud, anadirJugadorAPartida, cancelMatchByReservation, cancelMatchByReservationUC, cancelarPartida, cancelarPartidaPorReserva, cancelarSolicitud, cerrarClase, creadorVivienda, crearPartida, desapuntarsePartida, editarPartida, eliminarPartida, esClase, fecha, foto_perfil, getEnrolledMatches, getEnrolledMatchesUC, getReservationsWithMatch, getReservationsWithMatchUC, hadPartida, horaFin, horaInicio, mensaje, nivel, nivelJuego, nivelPreferido, nivel_juego, niveles, obtenerDatosUsuarios, obtenerFotoUsuario, obtenerMisPartidas, obtenerPartidasActivas, obtenerPartidasApuntado, obtenerReservasConPartida, partidaData, partidaId, partidasService, pistaNombre, precioAlumno, precioGrupo, rechazarSolicitud, reservaId, reservationId, usuario, usuarioId, usuarioNombre, usuarioVivienda, vivienda
- `src/services/notificationService.js`
  Identifiers: anuncioId, aprobado, fechaNotificacion, fechaReserva, mensaje, minutosAntes, notifyNuevoAnuncio, notifyViviendaChange, reserva, reservaId, scheduleReservationReminder, usuariosIds, viviendaNueva
- `src/services/registerServiceWorker.js`
  Identifiers: controller
- `src/services/reservationsService.supabase.js`
  Identifiers: RESERVATION_ALREADY_CANCELLED, RESERVATION_LIMIT_EXCEEDED, RESERVATION_NOT_FOUND, RESERVATION_PERMISSION_ERROR, RESERVATION_SLOT_UNAVAILABLE, RESERVATION_TOO_EARLY, RESERVATION_TOO_FAR_AHEAD, bloqueoId, cancelReservation, cancelarReserva, cancelledReservations, confirmedReservations, crearBloqueo, crearReserva, crearReservaConRPC, createReservation, createReservationWithRPC, desplazarReserva, desplazarReservaYCrear, displaceAndCreateReservation, displaceReservation, domainReservation, eliminarBloqueo, fecha, getActiveApartmentReservations, getAllReservations, getPriorityForNewReservation, getReservationStatistics, getReservationsByApartment, getReservationsByDate, getUserReservations, horaFin, horaInicio, marcarNotificacionesLeidas, nuevaReservaData, obtenerBloqueos, obtenerDisponibilidad, obtenerNotificacionesPendientes, obtenerPistas, obtenerPrioridadParaNuevaReserva, obtenerReservasActivasVivienda, obtenerReservasPorFecha, obtenerReservasPorVivienda, obtenerReservasUsuario, obtenerTodasReservas, pistaId, pistaNombre, prioridad, recalcularConversionesVivienda, reservaADesplazar, reservaData, reservaId, reservasCanceladas, reservasConfirmadas, reservasHoy, reservasSemana, reservasService, reservationToDisplace, reservationToLegacy, reservationsService, todayReservations, totalReservas, totalReservations, usuarioId, usuarioNombre, vivienda, viviendaDesplazadora, viviendaUsuario, weekReservations
- `src/utils/dateHelpers.js`
  Identifiers: bloqueTerminado, duracionBloque, esFechaValida, findeHoraApertura, findeHoraCierre, findePausaDiasSemana, findePausaFin, findePausaInicio, formatearFecha, formatearFechaLegible, formatearHora, generarHorariosDisponibles, horaApertura, horaCierre, horaFin, horaInicio, horasHasta, obtenerFechaHoy, pausaDiasSemana, pausaFin, pausaInicio, semanaHoraApertura, semanaHoraCierre, usarHorariosDiferenciados
- `src/utils/validators.js`
  Identifiers: LIMITES_RESERVA, RESERVATION_LIMITS, VIVIENDA_CONFIG, apartmentActiveReservations, canCancelReservation, canMakeReservation, currentReservations, esViviendaValida, fecha, horaInicio, horasHasta, maxActiveReservations, newReservation, nivelJuego, puedeReservar, reservation, reservationDate, validarPerfil, validarViviendaComponentes, vivienda

## Potential DB Field/Query Strings (review-only)

- `src/infrastructure/supabase/helpers/userCleanupHelper.ts`
  Strings: anuncios_admin, anuncios_destinatarios, bloqueos_horarios, partidas, partidas_jugadores, reservas, usuario_id
- `src/infrastructure/supabase/repositories/ReservationRpcHelper.ts`
  Strings: criar_reserva_con_prioridad, desplazar_reserva_y_crear_nueva, recalculate_vivienda_conversions, reservas
- `src/infrastructure/supabase/repositories/SupabaseAnnouncementRepository.ts`
  Strings: anuncio_id, leido, anuncios_admin, anuncios_destinatarios, usuario_id
- `src/infrastructure/supabase/repositories/SupabaseBlockoutRepository.ts`
  Strings: bloqueos_horarios, fecha, pista_id
- `src/infrastructure/supabase/repositories/SupabaseCourtRepository.ts`
  Strings: pistas
- `src/infrastructure/supabase/repositories/SupabaseDisplacementNotificationRepository.ts`
  Strings: notificaciones_desplazamiento, usuario_id
- `src/infrastructure/supabase/repositories/SupabaseMatchRepository.ts`
  Strings: partida_id, partidas, partidas_jugadores, reserva_id, usuario_id
- `src/infrastructure/supabase/repositories/SupabasePlayerRepository.ts`
  Strings: actualizar_estado_partida_tras_salida, partida_id, partidas, partidas_jugadores, usuario_id
- `src/infrastructure/supabase/repositories/SupabaseReservationRepository.ts`
  Strings: fecha, id, prioridad, conversion_timestamp, conversion_rule, converted_at, pista_id, pistas, reservas, usuario_id, vivienda
- `src/infrastructure/supabase/repositories/SupabaseUserAdminRepository.ts`
  Strings: estado_aprobacion, vivienda_solicitada
- `src/infrastructure/supabase/repositories/SupabaseUserNotificationRepository.ts`
  Strings: notificaciones_usuario, usuario_id
- `src/infrastructure/supabase/repositories/SupabaseUserRepository.ts`
  Strings: estado_aprobacion, id, nombre, email, foto_perfil, nivel_juego, vivienda
- `src/services/matchesService.js`
  Strings: foto_perfil, id, foto_perfil, nivel_juego

## Spanish User-Facing Strings (review-only sample)

- `src/di/container.ts`
  Examples: '@infrastructure/supabase/repositories/SupabaseUserAdminRepository', '@domain/useCases/ToggleAdminRole', '@infrastructure/supabase/repositories/SupabaseReservationRepository', '@domain/useCases/GetReservationsByApartment', '@domain/useCases/GetReservationsByDate', '@domain/useCases/GetUserReservations', '@domain/useCases/GetAllReservations', '@domain/useCases/GetReservationStatistics', '@domain/useCases/GetActiveApartmentReservations', '@domain/useCases/CreateReservation', '@domain/useCases/DisplaceReservation', '@domain/useCases/CancelReservation', '@domain/useCases/GetEnrolledMatches', '@domain/useCases/GetReservationsWithMatch', '@domain/useCases/CancelMatchByReservation', 's direct apartment operations
export { userAdminRepository };

// ---- Phase 6: Push Notifications (wired early — us...
- `src/domain/entities/AvailabilitySlot.ts`
  Examples: './Reservation'
- `src/domain/entities/Match.ts`
  Examples: 'with_reservation'
- `src/domain/entities/ScheduleConfig.ts`
  Examples: 'Hora de comida'
- `src/domain/entities/UserNotification.ts`
  Examples: 'match_cancelled_by_reservation', 'class_cancelled_by_reservation'
- `src/domain/entities/index.ts`
  Examples: './Reservation'
- `src/domain/errors/DomainErrors.ts`
  Examples: 'RESERVATION_NOT_FOUND', 'Reservation not found', 'RESERVATION_ALREADY_CANCELLED', 'Reservation is already cancelled', 'RESERVATION_PERMISSION_ERROR', 'RESERVATION_LIMIT_EXCEEDED', 'RESERVATION_SLOT_UNAVAILABLE', 'RESERVATION_TOO_EARLY', 'RESERVATION_TOO_FAR_AHEAD', '@domain/entities/Reservation'
- `src/domain/ports/repositories/ReservationRepository.ts`
  Examples: '@domain/entities/Reservation', '@domain/entities/Reservation'
- `src/domain/ports/repositories/index.ts`
  Examples: './UserAdminRepository', './ReservationRepository'
- `src/domain/useCases/ApplyPriorityConversion.ts`
  Examples: '@domain/entities/Reservation'
- `src/domain/useCases/ApproveUser.ts`
  Examples: '@domain/ports/repositories/UserAdminRepository'
- `src/domain/useCases/CancelMatchByReservation.ts`
  Examples: 'reserva_cancelada', 'reserva_desplazada', 'reserva_cancelada'
- `src/domain/useCases/CancelReservation.ts`
  Examples: '@domain/ports/repositories/ReservationRepository', 'Can only cancel reservations from your own apartment', 'Can only cancel your own reservations'
- `src/domain/useCases/CreateBlockout.ts`
  Examples: './CancelReservation', 'existingReservation'
- `src/domain/useCases/CreateReservation.ts`
  Examples: '@domain/ports/repositories/ReservationRepository', '@domain/entities/Reservation', './GetActiveApartmentReservations', './DetermineReservationPriority', './DisplaceReservation', 'Apartment is required to create reservations', `Reservations must be made at least ${RESERVATION_LIMITS.MIN_HOURS_ADVANCE} hours in advance`, `Cannot book more than ${RESERVATION_LIMITS.MAX_DAYS_ADVANCE} days in advance`, `Slot ${slot.startTime} is unavailable (guaranteed reservation)`, 'Your apartment already has a reservation at this time', `Apartment already has ${RESERVATION_LIMITS.MAX_ACTIVE_RESERVATIONS} active reservation(s)`, 'Your apartment already has a reservation at this time'
- `src/domain/useCases/DeleteUser.ts`
  Examples: '@domain/ports/repositories/UserAdminRepository'
- `src/domain/useCases/DetermineReservationPriority.ts`
  Examples: '@domain/entities/Reservation', 's existing active (confirmed) reservations.
 *
 * Rules:
 * - 0 active reservations → ', '
 * - 1 active reservation → ', '
 * - 2+ active reservations → null (limit exceeded, should not be created)
 */
export class DetermineReservationPri...
- `src/domain/useCases/DisplaceReservation.ts`
  Examples: '@domain/ports/repositories/ReservationRepository', '@domain/entities/Reservation', 'Could not cancel displaced reservation'
- `src/domain/useCases/GetActiveApartmentReservations.ts`
  Examples: '@domain/ports/repositories/ReservationRepository', '@domain/entities/Reservation'
- `src/domain/useCases/GetAllApprovedUsers.ts`
  Examples: '@domain/ports/repositories/UserAdminRepository'
- `src/domain/useCases/GetAllReservations.ts`
  Examples: '@domain/ports/repositories/ReservationRepository', '@domain/entities/Reservation'
- `src/domain/useCases/GetAvailability.ts`
  Examples: '@domain/ports/repositories/ReservationRepository', './GetActiveApartmentReservations', 'Bloqueado por administración'
- `src/domain/useCases/GetConversionInfo.ts`
  Examples: '@domain/ports/repositories/ReservationRepository', '@domain/entities/Reservation'
- `src/domain/useCases/GetPendingUsers.ts`
  Examples: '@domain/ports/repositories/UserAdminRepository'
- `src/domain/useCases/GetReservationStatistics.ts`
  Examples: '@domain/ports/repositories/ReservationRepository', '@domain/entities/Reservation'
- `src/domain/useCases/GetReservationsByApartment.ts`
  Examples: '@domain/ports/repositories/ReservationRepository', '@domain/entities/Reservation'
- `src/domain/useCases/GetReservationsByDate.ts`
  Examples: '@domain/ports/repositories/ReservationRepository', '@domain/entities/Reservation'
- `src/domain/useCases/GetUserReservations.ts`
  Examples: '@domain/ports/repositories/ReservationRepository', '@domain/entities/Reservation'
- `src/domain/useCases/LoginUser.ts`
  Examples: 'Account is pending admin approval'
- `src/domain/useCases/RecalculateApartmentConversions.ts`
  Examples: '@domain/ports/repositories/ReservationRepository'
- `src/domain/useCases/RejectUser.ts`
  Examples: '@domain/ports/repositories/UserAdminRepository'
- `src/domain/useCases/ToggleAdminRole.ts`
  Examples: '@domain/ports/repositories/UserAdminRepository'
- `src/domain/useCases/index.ts`
  Examples: './ToggleAdminRole', './DetermineReservationPriority', './GetReservationsByApartment', './GetReservationsByDate', './GetUserReservations', './GetAllReservations', './GetReservationStatistics', './GetActiveApartmentReservations', './CreateReservation', './DisplaceReservation', './CancelReservation', './GetEnrolledMatches', './GetReservationsWithMatch', './CancelMatchByReservation'
- `src/infrastructure/supabase/helpers/userCleanupHelper.ts`
  Examples: 'reservas', 'usuario_id', 'partidas', 'reserva_id', 'partidas', 'partidas_jugadores', 'usuario_id', 'reservas', 'usuario_id', ', userId);

  // Delete admin announcements created by user
  if (removeAdminContent) {
    await supabase.from('
- `src/infrastructure/supabase/mappers/availabilityMapper.ts`
  Examples: './reservationMapper', './reservationMapper'
- `src/infrastructure/supabase/mappers/matchMapper.ts`
  Examples: 'cancelada', 'with_reservation', 'con_reserva', 'rechazado'
- `src/infrastructure/supabase/mappers/reservationMapper.ts`
  Examples: '@domain/entities/Reservation', 'cancelada'
- `src/infrastructure/supabase/mappers/userMapper.ts`
  Examples: 'aprobado', 'rechazado'
- `src/infrastructure/supabase/mappers/userNotificationMapper.ts`
  Examples: 'match_cancelled_by_reservation', 'class_cancelled_by_reservation', 'bloqueo_cancelacion', 'partida_solicitud', 'clase_solicitud', 'partida_aceptada', 'clase_aceptada', 'partida_completa', 'partida_cancelada', 'clase_cancelada', 'partida_cancelada_reserva', 'clase_cancelada_reserva'
- `src/infrastructure/supabase/repositories/DomainMatchCancellationAdapter.ts`
  Examples: '@domain/useCases/CancelMatchByReservation', 'reserva_cancelada'
- `src/infrastructure/supabase/repositories/ExpoLocalScheduler.ts`
  Examples: `Tienes partida a las ${horaFormateada}${courtText}`, 'partida_match_day', `Tienes partida a las ${horaFormateada}${courtText}`, 'partida_match_day', '⏰ ¡Tu partida empieza en 10 minutos!', `A las ${horaFormateada}${courtText}`, 'partida_10_min', '⏰ ¡Tu partida empieza en 10 minutos!', `A las ${horaFormateada}${courtText}`, 'partida_10_min'
- `src/infrastructure/supabase/repositories/LegacyMatchCancellationAdapter.ts`
  Examples: 'reserva_cancelada'
- `src/infrastructure/supabase/repositories/ReservationRpcHelper.ts`
  Examples: '@domain/entities/Reservation', '../mappers/reservationMapper', 'criar_reserva_con_prioridad', 'reservas', 'desplazar_reserva_y_crear_nueva', 'reservas', 'recalculate_vivienda_conversions'
- `src/infrastructure/supabase/repositories/ScheduleConfigRepository.ts`
  Examples: 'usar_horarios_diferenciados', 'semana_hora_apertura', 'semana_hora_cierre', 'finde_hora_apertura', 'finde_hora_cierre', 'finde_pausa_inicio', 'finde_pausa_fin', 'finde_pausa_dias_semana', 'hora_apertura', 'hora_cierre', 'duracion_bloque', 'pausa_inicio', 'pausa_fin', 'motivo_pausa', 'pausa_dias_semana', 'usar_horarios_diferenciados', 'semana_hora_apertura', 'semana_hora_cierre', 'finde_hora_apertura', 'finde_hora_cierre'
- `src/infrastructure/supabase/repositories/SupabaseAnnouncementRepository.ts`
  Examples: ', allResult.error));
      }

      const readMap = new Map<string, boolean>();
      if (recipientsResult.data) {
 ..., ', anuncioIds)
          .gt(', ')
        .insert({
          creador_id: data.creatorId,
          creador_nombre: data.creatorName,
          titu..., ' && userIds.length > 0) {
        const recipientRows = userIds.map((userId) => ({
          anuncio_id: (row as Rec..., ')
        .upsert(
          {
            anuncio_id: announcementId,
            usuario_id: userId,
            l...
- `src/infrastructure/supabase/repositories/SupabaseBlockoutRepository.ts`
  Examples: 'bloqueos_horarios', 'pista_id', 'fecha', 'bloqueos_horarios', 'bloqueos_horarios', 'bloqueos_horarios'
- `src/infrastructure/supabase/repositories/SupabaseCourtRepository.ts`
  Examples: 'pistas', 'pistas'
- `src/infrastructure/supabase/repositories/SupabaseDisplacementNotificationRepository.ts`
  Examples: 'notificaciones_desplazamiento', 'usuario_id', 'notificaciones_desplazamiento', 'notificaciones_desplazamiento', 'notificaciones_desplazamiento', 'usuario_id', 'notificaciones_desplazamiento'
- `src/infrastructure/supabase/repositories/SupabaseDisplacementNotifier.ts`
  Examples: 'Reserva desplazada', `La reserva del ${date} a las ${startTime} en ${courtName} ha sido desplazada.`, 'Reserva cancelada por bloqueo', `Tu reserva del ${date} a las ${startTime} en ${courtName} ha sido cancelada por el administrador.`
- `src/infrastructure/supabase/repositories/SupabaseMatchNotifier.ts`
  Examples: 'clase', 'partida', 'Nueva solicitud de clase', 'Nueva solicitud de partida', 'Solicitud aceptada', `${creatorName} te ha confirmado en su clase.`, `${creatorName} te ha aceptado en su partida.`, '🎾 ¡Partida completa!', `La clase de ${creatorName} está confirmada. ¡Nos vemos en la pista!`, `La partida de ${creatorName} ya tiene 4 jugadores. ¡A jugar!`, 'clase', 'partida', 'Clase cancelada', 'Partida cancelada', `La ${tipo} de ${creatorName} ha sido cancelada.`, 'clase', 'partida', `${emoji} ${tipo.charAt(0).toUpperCase() + tipo.slice(1)} cancelada`, 'reserva_desplazada', `La reserva de la ${tipo} de ${creatorName} ha sido desplazada por otra vivienda.`
- `src/infrastructure/supabase/repositories/SupabaseMatchRepository.ts`
  Examples: 'partidas', 'partidas_jugadores', 'partida_id', 'partidas_jugadores', 'partida_id', 'partidas', 'cancelada', 'partidas', 'cancelada', 'partidas_jugadores', 'partida_id', 'usuario_id', 'Error fetching enrollments', 'partidas', 'cancelada', 'Error fetching enrolled matches', 'partidas', 'reserva_id', 'cancelada', 'Error fetching match by reservation'
- `src/infrastructure/supabase/repositories/SupabasePlayerRepository.ts`
  Examples: 'partidas_jugadores', 'partida_id', 'partidas_jugadores', 'partida_id', 'usuario_id', 'partidas_jugadores', 'partidas_jugadores', 'partidas_jugadores', 'actualizar_estado_partida_tras_salida', 'partidas', 'cancelada', 'partidas_jugadores', 'partida_id', 'partidas'
- `src/infrastructure/supabase/repositories/SupabaseReservationRepository.ts`
  Examples: '@domain/ports/repositories/ReservationRepository', '@domain/entities/Reservation', '../mappers/reservationMapper', './ReservationRpcHelper', 'reservas', 'Error fetching reservation', 'Unexpected error fetching reservation', 'reservas', 'vivienda', 'fecha', 'hora_inicio', 'vivienda', 'Error fetching apartment reservations', 'reservas', 'usuario_id', 'fecha', 'hora_inicio', 'Error fetching user reservations', 'Unexpected error fetching user reservations', 'reservas'
- `src/infrastructure/supabase/repositories/SupabaseUserAdminRepository.ts`
  Examples: '@domain/ports/repositories/UserAdminRepository', 'estado_aprobacion', 'estado_aprobacion', 'aprobado', 'vivienda_solicitada', 'Error toggling admin role', 'Error toggling admin role', 'vivienda_solicitada'
- `src/infrastructure/supabase/repositories/SupabaseUserNotificationRepository.ts`
  Examples: 'notificaciones_usuario', 'usuario_id', 'notificaciones_usuario', 'notificaciones_usuario', 'notificaciones_usuario', 'usuario_id', 'notificaciones_usuario'
- `src/infrastructure/supabase/repositories/SupabaseUserRepository.ts`
  Examples: 'id, nombre, email, foto_perfil, nivel_juego', 'vivienda', 'estado_aprobacion', 'aprobado', ', err));
    }
  }

  async deleteWithRelations(userId: string): Promise<Result<void>> {
    try {
      await clean...
- `src/presentation/components/admin/AdminContent.js`
  Examples: './SolicitudCard', './UsuarioCard', "No hay solicitudes pendientes", "Las nuevas solicitudes y cambios de vivienda aparecerán aquí", `Nuevos usuarios (${usuariosPendientes.length})`, `Cambios de vivienda (${solicitudesCambio.length})`, "No hay usuarios"
- `src/presentation/components/admin/AdminTabs.js`
  Examples: 'solicitudes', 'solicitudes', 'solicitudes', 'usuarios', 'usuarios', 'usuarios'
- `src/presentation/components/admin/CreateAnnouncementModal.js`
  Examples: './RecipientsSelector', 'Información', "Escribe el título...", "Escribe el mensaje..."
- `src/presentation/components/admin/EditApartmentModal.js`
  Examples: '../ApartmentSelector'
- `src/presentation/components/admin/ImportResultsModal.js`
  Examples: 'Usuario creado', 'Usuarios creados'
- `src/presentation/components/admin/ImportUsersModal.js`
  Examples: 'ejemplo-usuarios.csv'
- `src/presentation/components/admin/RecipientsSelector.js`
  Examples: "Buscar por nombre, vivienda..."
- `src/presentation/components/admin/index.js`
  Examples: './RecipientsSelector', './AnnouncementAdminCard', './SolicitudCard', './UsuarioCard', './AdminTabs', './AdminContent'
- `src/presentation/components/home/BlockoutModal.js`
  Examples: "Motivo del bloqueo (opcional)"
- `src/presentation/components/home/HomeHeader.js`
  Examples: '🔒 Modo Bloqueo activo', 'Selecciona pista y horario'
- `src/presentation/components/home/SelectionInfo.js`
  Examples: 'Horarios Disponibles', 'Horarios de la Semana', `${cantidadBloques} bloque${cantidadBloques > 1 ? 's' : ''} seleccionado${cantidadBloques > 1 ? 's' : ''} (${cantidad..., 'Selecciona horarios para reservar'
- `src/presentation/components/home/index.js`
  Examples: './ViewSelector', './DateSelector', './CourtSelector'
- `src/presentation/components/partidas/AddPlayerModal.js`
  Examples: 'urbanizacion', 'urbanizacion', 'urbanizacion', 'urbanizacion', 'urbanizacion', "Buscar por nombre o vivienda...", ' (añadido)'
- `src/presentation/components/partidas/CreateMatchModal.js`
  Examples: 'Editar clase', 'Editar partida', 'Organizar clase', 'con_reserva', 'Ej: Clase para mejorar el revés...'
- `src/presentation/components/partidas/MatchCard.js`
  Examples: 'con_reserva', 'Esperando aprobación', 'Solicitud enviada'
- `src/presentation/components/partidas/PlayersEditor.js`
  Examples: 'Alumnos', `${currentUser?.nombre} (Tú)`, 'alumno', `Vivienda ${apartment}`
- `src/presentation/components/partidas/form/TypeSelector.js`
  Examples: 'Tipo de clase', 'Tipo de partida', 'con_reserva', 'con_reserva', 'con_reserva'
- `src/presentation/components/partidas/form/index.js`
  Examples: './ModeSelector', './TypeSelector', './ReservationSelector', './LevelSelector', './ParticipantsSelector', './LevelsMultiSelector'
- `src/presentation/components/profile/ApartmentChangeModal.js`
  Examples: '../ApartmentSelector'
- `src/presentation/components/profile/ProfileHeader.js`
  Examples: 'Añadir Foto'
- `src/presentation/components/profile/ProfilePersonalInfo.js`
  Examples: '../ApartmentSelector'
- `src/presentation/components/tablon/AnnouncementCard.js`
  Examples: 'Información', `Hace ${diffDias} días`
- `src/presentation/components/tablon/AnnouncementModal.js`
  Examples: 'Información'
- `src/presentation/components/tablon/EmptyState.js`
  Examples: 'notificaciones', 'Sin notificaciones', 'No tienes notificaciones nuevas', 'Sin anuncios', 'No hay anuncios publicados'
- `src/presentation/components/tablon/NotificationCard.js`
  Examples: 'Ahora', `Hace ${diffHoras}h`
- `src/presentation/context/AuthContext.js`
  Examples: '[Auth] App volvió a primer plano, verificando sesión...', '[Auth] Sesión expirada o inválida', ', result.data.vivienda);
        setUser(result.data);
        return { success: true };
      }
      return { succ..., ', error);
      return { success: false };
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,...
- `src/presentation/context/ReservationsContext.js`
  Examples: '../../services/reservationsService.supabase', 'Error al cargar reservas:', 's no future guaranteed but there are provisionals,
    // the oldest provisional is converted to guaranteed
    if (..., ' + a.horaInicio);
        const dateB = new Date(b.fecha + ', ' + b.horaInicio);
        return dateA - dateB;
      });

      // The first provisional is converted to guaranteed..., ' };
        }
        return r;
      });
    }

    return originalReservations;
  };

  const loadCourts = async (..., ', error);
    }
  };

  const getAvailability = async (courtId, date) => {
    try {
      const response = await re..., ' };
    }
  };

  const createReservation = async (reservationData) => {
    try {
      const response = await rese..., ' };
    }
  };

  const cancelReservation = async (reservationId) => {
    try {
      // Pass apartment to validate..., ' } : r))
        );
        // Increment version so HomeScreen reloads
        setReservationsVersion((v) => v + 1);..., ' };
    }
  };

  const getReservationsByDate = async (date) => {
    try {
      const response = await reservasSer..., ' };
    }
  };

  // Filter reservations with automatic P→G conversion in real time
  const getUpcomingReservations ..., ' &&
        new Date(r.fecha + ', ' + r.horaInicio) > now
    );

    // If there', 's always guaranteed
    if (upcoming.length === 1) {
      return upcoming.map(r => ({ ...r, prioridad: ', 'cancelada', 'useReservations debe usarse dentro de ReservationsProvider'
- `src/presentation/context/useAuthNotifications.js`
  Examples: '../../services/reservationsService.supabase', 'vivienda_change', 'Cambio de vivienda aprobado', 'Tu solicitud de cambio de vivienda ha sido aprobada.', 'Cambio de vivienda rechazado', 'Tu solicitud de cambio de vivienda ha sido rechazada.', 'Perfil', 'reservation_reminder', 'Tienes una reserva próximamente.', 'Mis Reservas', 'reservation_displacement', 'Reserva desplazada', 'Una de tus reservas ha sido desplazada por otra vivienda.', 'Mis Reservas', 'reservation_converted', 'Reserva confirmada', 'Tu reserva provisional ha pasado a ser garantizada.', 'Mis Reservas', 'partida_solicitud', 'Nueva solicitud'
- `src/presentation/hooks/index.js`
  Examples: './useUsuarios', './useBloqueos', './useAdminData', './useAdminActions'
- `src/presentation/hooks/profile/useApartmentChange.js`
  Examples: 'Error de validación', 'La vivienda seleccionada es igual a tu vivienda actual', 'Solicitud Enviada', `Tu solicitud de cambio a ${formatearVivienda(nuevaVivienda)} ha sido enviada. Un administrador la revisará pronto.`, 'Error al enviar solicitud', 'Cancelar Solicitud', '¿Estás seguro de que quieres cancelar tu solicitud de cambio de vivienda?', 'Sí, Cancelar', 'Solicitud Cancelada', 'Tu solicitud de cambio de vivienda ha sido cancelada.', 'Error al cancelar solicitud'
- `src/presentation/hooks/profile/useProfileActions.js`
  Examples: 'No se pudo eliminar la cuenta', 'Error inesperado al eliminar la cuenta', 'Eliminar Cuenta', '¿Estás seguro de que quieres eliminar tu cuenta? Esta acción es irreversible y se eliminarán todos tus datos.', 'Confirmar Eliminación', '¿Realmente deseas eliminar tu cuenta? Esta acción NO se puede deshacer.', 'Sí, Eliminar', 'Cerrar Sesión', '¿Estás seguro de que quieres cerrar sesión?', 'Cerrar Sesión', 'No se pudo cerrar sesión'
- `src/presentation/hooks/profile/useProfileEdit.js`
  Examples: 'Necesitamos acceso a tu galería para cambiar la foto de perfil', '¿Estás seguro de que quieres eliminar tu foto de perfil?', 'This is a view-only demo account. You cannot make reservations or modifications.', 'Error en vivienda', 'Errores de validación', 'Perfil Actualizado', 'Tus cambios han sido guardados exitosamente', 'No se pudo actualizar el perfil'
- `src/presentation/hooks/profile/useProfileNotifications.js`
  Examples: 'Notificaciones Activadas', 'Recibirás notificaciones sobre tus reservas y cambios importantes.', 'No se pudieron activar las notificaciones', 'Error al activar notificaciones'
- `src/presentation/hooks/useAddPlayerModal.js`
  Examples: 'urbanizacion', 'La partida ya está completa'
- `src/presentation/hooks/useAdminActions.js`
  Examples: 'Aprobar Usuario', `¿Aprobar el registro de ${usuario.nombre}?\n\nVivienda: ${usuario.vivienda}\nEmail: ${usuario.email}`, 'Rechazar Usuario', `¿Rechazar el registro de ${usuario.nombre}?\n\nVivienda: ${usuario.vivienda}\nEmail: ${usuario.email}`, 'Rechazar', 'dar permisos de administrador a', 'quitar permisos de administrador a', 't allow removing admin from oneself
    if (usuario.id === currentUserId && !nuevoRol) {
      mostrarAlerta(', 'No puedes quitar los permisos de administrador a un manager', 'Hacer Administrador', 'Quitar Administrador', `¿Deseas ${accion} ${usuario.nombre}?`, 't allow deleting oneself
    if (usuario.id === currentUserId) {
      mostrarAlerta(', 'Eliminar Usuario', `¿Estás seguro de eliminar a ${usuario.nombre}?\n\nEsta acción no se puede deshacer.`, 'Aprobar Cambio de Vivienda', `¿Aprobar el cambio de vivienda de ${usuario.nombre}?\n\nActual: ${formatearVivienda(usuario.vivienda)}\nNueva: ${for..., 'Cambio Aprobado', `La vivienda de ${usuario.nombre} ha sido cambiada a ${formatearVivienda(usuario.viviendaSolicitada)}`, 'Rechazar Cambio de Vivienda'
- `src/presentation/hooks/useAdminData.js`
  Examples: 'solicitudes', 'usuarios', 'mensajes'
- `src/presentation/hooks/useAnnouncements.js`
  Examples: 'Admin'
- `src/presentation/hooks/useBloqueos.js`
  Examples: '../../services/reservationsService.supabase', 'Bloqueado por administración', `${bloque.horaInicio}: ${result.error}`, `Se han bloqueado ${exitosos} horario${exitosos > 1 ? 's' : ''}.`, `Se bloquearon ${exitosos} de ${slotsToBlock.length} horarios.${errores.length > 0 ? '\n\nErrores:\n' + errores.join(..., 'Horarios bloqueados', 'No se pudo bloquear ningún horario.\n\n', `${bloque.horaInicio}: ${result.error}`, `Se han desbloqueado ${exitosos} horario${exitosos > 1 ? 's' : ''}.`, `Se desbloquearon ${exitosos} de ${slotsToUnblock.length} horarios.${errores.length > 0 ? '\n\nErrores:\n' + errores...., 'Horarios desbloqueados', 'No se pudo desbloquear ningún horario.\n\n', '🔒 Horario Bloqueado', 'Bloqueado por administración'
- `src/presentation/hooks/useHomeActions.js`
  Examples: 'Límite alcanzado', 'Fecha no válida', 'Solo puedes reservar hasta 7 días de anticipación', 'Selecciona horarios', 'Debes seleccionar al menos un bloque de 30 minutos', 'Debes iniciar sesión para hacer una reserva', 'Selecciona una pista primero', 'This is a view-only demo account. You cannot make reservations or modifications.', 'No se puede reservar', '30 minutos', '1 hora', '1.5 horas', 'Confirmar Reserva', `¿Reservar ${pistaSeleccionada.nombre} el ${formatearFechaLegible(fecha)} de ${horaInicio} a ${horaFin}?\n\nDuración:..., 'Desplazar y Reservar', `¿Reservar ${pistaSeleccionada.nombre} el ${formatearFechaLegible(fecha)} de ${horaInicio} a ${horaFin}?\n\n`, `⚠️ ATENCIÓN: Se cancelarán las reservas provisionales de:\n`, `• Vivienda(s): ${viviendasDesplazadas.join(', ')}\n`, `• Horario(s): ${horasDesplazadas}\n\n`, `Tu reserva será GARANTIZADA.`
- `src/presentation/hooks/useMatchHandlers.js`
  Examples: 'urbanizacion', 'This is a view-only demo account. You cannot make reservations or modifications.', 'urbanizacion', 'con_reserva', 'con_reserva', `Selecciona una reserva para vincular la ${isClass ? 'clase' : 'partida'}`, 'Clase actualizada', 'Partida actualizada', 'Los cambios se han guardado correctamente', 'con_reserva', 'Clase completa', 'Clase creada', `Clase creada con ${total} alumnos. ¡Lista!`, 'Tu clase ha sido publicada.', 'Partida completa', 'Partida creada', 'Partida creada con 4 jugadores. ¡A jugar!', 'Tu solicitud de partida ha sido publicada.', 'Partida completa', 'Ya tienes 3 jugadores añadidos (4 con el creador)'
- `src/presentation/hooks/useMatchSimpleActions.js`
  Examples: 'Cancelar partida', '¿Seguro que quieres cancelar esta partida?', 'Sí, cancelar', 'This is a view-only demo account. You cannot make reservations or modifications.', `¿Quieres enviar una solicitud para unirte a la partida de ${match.creadorNombre}?`, 'Enviar solicitud', 'Solicitud enviada', 'Tu solicitud ha sido enviada. El creador debe aceptarla.', 'Cancelar solicitud', '¿Seguro que quieres cancelar tu solicitud?', 'Sí, cancelar', '¿Seguro que quieres desapuntarte de esta partida?', 'Solicitud aceptada', 'El jugador ha sido añadido a la partida', '¿Seguro que quieres cerrar las inscripciones de esta clase? Ya no podrán unirse más alumnos.', 'Cerrar clase', 'Clase cerrada'
- `src/presentation/hooks/useScheduleConfig.js`
  Examples: 'Hora de comida', 'Hora de comida', 'Hora de comida', 'Debes especificar horarios de lunes a viernes', 'Debes especificar horarios de fin de semana', 'Debes especificar hora de apertura y cierre', 'Debes especificar hora de inicio y fin de la pausa', 'Debes especificar hora de inicio y fin de la pausa de fin de semana', 'Éxito', 'Configuración guardada correctamente', 'Error al guardar configuración'
- `src/presentation/hooks/useSchedules.js`
  Examples: 'Error al cargar horarios', 'No se pudieron cargar los horarios.', 'Error de conexión', 'No se pudieron cargar los horarios. Verifica tu conexión a internet.', 'No se pudieron cargar los horarios de la semana'
- `src/presentation/hooks/useSlotSelection.js`
  Examples: 'Máximo 3 bloques', 'Solo puedes seleccionar hasta 3 bloques consecutivos (1.5 horas)', 'Bloques no consecutivos', 'Los bloques deben ser consecutivos y del mismo día'
- `src/presentation/hooks/useUserImport.js`
  Examples: 'Error al importar usuarios'
- `src/presentation/navigation/AppNavigator.js`
  Examples: 'Restablecer contraseña', 'Restablecer contraseña', 'Restablecer contraseña'
- `src/presentation/navigation/TabNavigator.js`
  Examples: '../screens/ReservationsScreen', '../screens/AdminScreen', "Mis Reservas", "Partidas", "partidas", "Tablón", "Admin", "admin", "Perfil"
- `src/presentation/screens/AdminScreen.js`
  Examples: '../components/admin', 'solicitudes', 'usuarios', 'solicitudes', 'usuarios'
- `src/presentation/screens/BulletinScreen.js`
  Examples: '../components/admin', 'anuncios', 'notificaciones', 'Éxito', 'Mensaje creado correctamente', 'No se pudo crear el mensaje', '¿Estás seguro de eliminar este mensaje?', 'Éxito', 'Mensaje eliminado correctamente', 'No se pudo eliminar el mensaje', 'No se pudo eliminar la notificación', 'Marcar todas como leídas', '¿Marcar todas las notificaciones como leídas?', 'No se pudieron marcar las notificaciones', 'notificaciones', 'anuncios', 'anuncios', 'anuncios', 'notificaciones', 'notificaciones'
- `src/presentation/screens/HomeScreen.js`
  Examples: '../context/ReservationsContext', 'Reserva Desplazada', `Tu reserva provisional del ${formatearFechaLegible(notif.fechaReserva)} a las ${notif.horaInicio} en ${notif.pistaNo..., 'Entendido'
- `src/presentation/screens/LoginScreen.js`
  Examples: 'Por favor completa todos los campos', 'Correo Enviado'
- `src/presentation/screens/MatchesScreen.js`
  Examples: '../context/ReservationsContext', '../components/partidas', 'urbanizacion', 'Ya añadido', 'Este jugador ya está en la partida', 'mis_partidas', 'mis_partidas', 'mis_partidas', 'No hay partidas buscando jugadores', 'No tienes partidas activas'
- `src/presentation/screens/RegisterScreen.js`
  Examples: '../components/ApartmentSelector', 'Las contraseñas no coinciden', 'Error en vivienda', 'Errores de validación', 'Tu cuenta está pendiente de aprobación por un administrador. Te notificaremos cuando sea aprobada.', "Juan Pérez", "Mínimo 6 caracteres", "Repite tu contraseña"
- `src/presentation/screens/ReservationsScreen.js`
  Examples: '../context/ReservationsContext', './ReservationsScreenStyles', 'This is a view-only demo account. You cannot make reservations or modifications.', 'Cancelar Reserva', `¿Estás seguro de cancelar tu reserva del ${formatearFechaLegible(
        reserva.fecha
      )} a las ${formatearHo..., 'Sí, cancelar', 'Cancelada', 'Tu reserva ha sido cancelada', 'cancelada', 'cancelada', 'Cancelada'
- `src/presentation/screens/ResetPasswordScreen.js`
  Examples: ', onPress: () => {} }],
      });
    }
  };

  if (checkingSession) {
    return (
      <View style={styles.loadin...
- `src/services/authService.supabase.js`
  Examples: 'Email o contraseña incorrectos', 'Este email ya está registrado', 'La contraseña debe tener al menos 6 caracteres', 'Email no válido', 'Demasiados intentos. Intenta más tarde', 'Tu solicitud de registro fue rechazada. Contacta con el administrador', 'Account is pending admin approval', 'Tu cuenta está pendiente de aprobación por un administrador', 'Error al obtener usuario', 'Registro exitoso. Tu cuenta está pendiente de aprobación por un administrador', 'Error al obtener usuarios pendientes', 'Error al obtener usuarios', 'Error al cambiar rol de usuario', 'Error al eliminar usuario', 'Error al eliminar la cuenta', 'Error al aprobar usuario', 'Error al rechazar usuario', 'Error al actualizar perfil', 'Error al enviar el correo de recuperación', 'Se ha enviado un correo para restablecer tu contraseña'
- `src/services/csvImportService.js`
  Examples: 'El archivo es demasiado grande. Máximo permitido: 10MB', 'El archivo debe ser un CSV válido', 'El archivo CSV está vacío', `Línea ${lineNumber}: El nombre es obligatorio`, `Línea ${lineNumber}: El nombre es demasiado corto (mínimo 2 caracteres)`, `Línea ${lineNumber}: El nombre es demasiado largo (máximo 100 caracteres)`, `Línea ${lineNumber}: El email es obligatorio`, `Línea ${lineNumber}: Email inválido (${email})`, `Línea ${lineNumber}: Email demasiado largo (máximo 255 caracteres)`, `Línea ${lineNumber}: El código de vivienda es obligatorio`, `Línea ${lineNumber}: Código de vivienda inválido (${codigo}). `, `Línea ${lineNumber}: ${errorMessages}`, `nombre,codigo,email
Juan Pérez,1-3-B,juan.perez@example.com
María González,2-4-C,maria.gonzalez@example.com
Pedro Ló..., 'Línea,Nombre,Código,Email,Error\n'
- `src/services/matchesService.js`
  Examples: 'Partida no encontrada', 'Solo el creador puede realizar esta acción', 'La partida ya está cancelada', 'Ya tienes una solicitud o estás apuntado a esta partida', 'La partida ya está completa', 'Error de conexión. Inténtalo de nuevo.', 'id, foto_perfil, nivel_juego', 'foto_perfil', 'id, foto_perfil, nivel_juego', 'urbanizacion', 'urbanizacion', 'con_reserva', 'with_reservation', 'with_reservation', 'reserva_cancelada'
- `src/services/notificationService.js`
  Examples: 'Push notifications requieren dispositivo físico', 'Permisos de notificación denegados', 'Error al registrar notificaciones', `${reserva.fecha}T${reserva.horaInicio}`, 'Recordatorio de Reserva', `Tu reserva en ${reserva.pistaNombre} es en ${minutosAntes} minutos (${reserva.horaInicio})`, 'reservation_reminder', `${reserva.fecha}T${reserva.horaInicio}`, 'Recordatorio de Reserva', `Tu reserva en ${reserva.pistaNombre} es en ${minutosAntes} minutos (${reserva.horaInicio})`, 'reservation_reminder', 'Error cancelando notificación:', 'Error cancelando notificaciones:', 'Cambio de vivienda aprobado', 'Cambio de vivienda rechazado', `Tu solicitud de cambio a ${viviendaNueva} ha sido aprobada.`, 'Tu solicitud de cambio de vivienda ha sido rechazada.', 'vivienda_change', '[Notificaciones] Error obteniendo usuarios:', 'Error al obtener usuarios'
- `src/services/registerServiceWorker.js`
  Examples: 'controllerchange', '[SW] Controller changed, reloading...', '[SW] Nueva versión encontrada, instalando...', '[SW] Nueva versión lista para activar'
- `src/services/reservationsService.supabase.js`
  Examples: '../infrastructure/supabase/mappers/reservationMapper', 'Tu vivienda ya tiene el máximo de reservas activas', 'El horario seleccionado no está disponible', 'No se puede reservar con tan poca anticipación', 'No se puede reservar con tanta anticipación', 'Reserva no encontrada', 'Esta reserva ya fue cancelada', 'No tienes permisos para esta operación', 'Pista no encontrada', 'Este horario ya está bloqueado', 'Bloqueo no encontrado', 'Error al obtener tus reservas', 'Error al obtener reservas de la vivienda', 'Error al obtener disponibilidad', 'Error al verificar disponibilidad', '../infrastructure/supabase/mappers/reservationMapper', 'Error al desplazar la reserva', 'Este horario tiene una reserva provisional que será desplazada', 'Error al obtener reservas', 'Error al obtener estadísticas'
- `src/services/scheduleConfigService.js`
  Examples: 'Error al obtener configuración de horarios', 'Error al actualizar configuración'
- `src/services/userImportService.js`
  Examples: 'No hay sesión activa'
- `src/services/webPushService.js`
  Examples: 'El Service Worker no respondió. Recarga la app e intenta de nuevo.', 'Error al suscribir a notificaciones', 'Error guardando suscripción:', 'Error al guardar suscripción', 'Error guardando suscripción:', 'Error al guardar suscripción', 'Error cancelando suscripción:'
- `src/utils/dateHelpers.js`
  Examples: "Lunes 25 de Diciembre", 'Fecha no disponible', 'Fecha inválida', 'Fecha inválida', ').map(Number);
    return h * 60 + m;
  };

  const slotStartMin = timeToMinutes(slotStart);
  const slotEndMin = ti...
- `src/utils/validators.js`
  Examples: 'Escalera no válida', 'Piso no válido', 'Puerta no válida', 'No puedes reservar en horarios pasados', 's active reservations limit (only future ones)
  const now = new Date();
  const apartmentActiveReservations = curre..., ';
    const reservationDate = new Date(r.fecha + ', ' + r.horaInicio);
    const isFuture = reservationDate > now;
    return sameApartment && isConfirmed && isFuture;
 ..., 'Tu vivienda ya tiene una reserva a esta hora', 'Email no válido', 'Teléfono no válido', 'Debes seleccionar tu vivienda completa', 'La contraseña debe tener al menos 6 caracteres', 'Teléfono no válido', 'Debes seleccionar tu vivienda completa', 'Nivel de juego no válido'
