import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useAuth } from '../context/AuthContext';
import {
  useAnnouncementsAdmin,
  useAdminData,
  useAdminActions,
  useEditApartmentModal,
  useAlert,
} from '../hooks';
import { colors } from '../constants/colors';
import { CustomAlert } from '../components/CustomAlert';
import {
  CreateAnnouncementModal,
  EditApartmentModal,
  AdminHeader,
  AdminTabs,
  SolicitudesContent,
  UsuariosContent,
  MensajesContent,
  LoadingContent,
  ScheduleConfigSection,
} from '../components/admin';

export default function AdminScreen() {
  const { user } = useAuth();
  const [tabActiva, setTabActiva] = useState('solicitudes');
  const [crearAnuncioVisible, setCrearAnuncioVisible] = useState(false);

  // Hook de alertas
  const { alertConfig, mostrarAlerta, mostrarConfirmacion, cerrarAlerta } = useAlert();

  // Hook de datos
  const {
    pendingUsers,
    allUsers,
    changeRequests,
    loading,
    refreshing,
    loadTabData,
    onRefresh,
    removePendingUser,
    removeChangeRequest,
    updateUser,
    removeUser,
  } = useAdminData();

  // Hook de anuncios admin
  const {
    announcements,
    users: usersForAnnouncements,
    loading: loadingAnnouncements,
    creating: creatingAnnouncement,
    loadAnnouncements,
    loadUsers,
    createAnnouncement,
    deleteAnnouncement,
  } = useAnnouncementsAdmin(user?.id, user?.nombre, () => {
    setCrearAnuncioVisible(false);
    mostrarAlerta('Mensaje enviado', 'El mensaje ha sido enviado correctamente');
  });

  // Hook de acciones admin
  const {
    handleApprove,
    handleReject,
    handleToggleAdmin,
    handleDeleteUser,
    handleApproveApartmentChange,
    handleRejectApartmentChange,
    handleSaveApartment,
  } = useAdminActions({
    currentUserId: user?.id,
    mostrarAlerta,
    mostrarConfirmacion,
    removePendingUser,
    removeChangeRequest,
    updateUser,
    removeUser,
  });

  // Hook de modal editar vivienda
  const editApartmentModal = useEditApartmentModal();

  // Cargar datos cuando cambia la tab
  useEffect(() => {
    loadTabData(tabActiva, loadAnnouncements, loadUsers);
  }, [tabActiva, loadTabData, loadAnnouncements, loadUsers]);

  // Handler para guardar vivienda
  const onSaveVivienda = useCallback(async () => {
    const { usuario, staircase, floor, door } = editApartmentModal.modalState;
    editApartmentModal.setSaving(true);
    const result = await handleSaveApartment(usuario, staircase, floor, door);
    if (result.success) {
      editApartmentModal.close();
    } else {
      editApartmentModal.setSaving(false);
    }
  }, [editApartmentModal, handleSaveApartment]);

  // Handler para nuevo mensaje
  const onNuevoMensaje = useCallback(() => {
    loadUsers();
    setCrearAnuncioVisible(true);
  }, [loadUsers]);

  // Handler para crear anuncio
  const onCrearAnuncio = useCallback(async (data) => {
    const result = await createAnnouncement(
      data.titulo,
      data.mensaje,
      data.tipo,
      data.destinatarios,
      data.usuariosIds
    );
    if (!result.success) {
      mostrarAlerta('Error', result.error || 'No se pudo enviar el mensaje');
    }
  }, [createAnnouncement, mostrarAlerta]);

  // Handler para eliminar anuncio con confirmación
  const handleDeleteAnnouncement = useCallback((announcementId) => {
    mostrarConfirmacion(
      'Eliminar mensaje',
      '¿Estás seguro de que quieres eliminar este mensaje?',
      async () => {
        const result = await deleteAnnouncement(announcementId);
        if (result.success) {
          mostrarAlerta('Mensaje eliminado', 'El mensaje ha sido eliminado correctamente');
        } else {
          mostrarAlerta('Error', result.error || 'No se pudo eliminar el mensaje');
        }
      }
    );
  }, [deleteAnnouncement, mostrarConfirmacion, mostrarAlerta]);

  // Renderizar contenido según tab activa
  const renderContent = () => {
    if (loading) {
      return <LoadingContent />;
    }

    switch (tabActiva) {
      case 'solicitudes':
        return (
          <SolicitudesContent
            usuariosPendientes={pendingUsers}
            solicitudesCambio={changeRequests}
            onAprobar={handleApprove}
            onRechazar={handleReject}
            onAprobarCambio={handleApproveApartmentChange}
            onRechazarCambio={handleRejectApartmentChange}
          />
        );

      case 'usuarios':
        return (
          <UsuariosContent
            usuarios={allUsers}
            currentUserId={user?.id}
            onToggleAdmin={handleToggleAdmin}
            onEditVivienda={editApartmentModal.open}
            onDelete={handleDeleteUser}
          />
        );

      case 'mensajes':
        return (
          <MensajesContent
            anuncios={announcements}
            loadingAnuncios={loadingAnnouncements}
            onNuevoMensaje={onNuevoMensaje}
            onEliminar={handleDeleteAnnouncement}
          />
        );

      case 'configuracion':
        return <ScheduleConfigSection userId={user?.id} />;

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <AdminHeader />

      <AdminTabs
        tabActiva={tabActiva}
        onTabChange={setTabActiva}
        contadorSolicitudes={pendingUsers.length + changeRequests.length}
        contadorUsuarios={allUsers.length}
      />

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderContent()}
      </ScrollView>

      {/* Modal editar vivienda */}
      <EditApartmentModal
        visible={editApartmentModal.modalState.visible}
        usuario={editApartmentModal.modalState.usuario}
        escalera={editApartmentModal.modalState.staircase}
        piso={editApartmentModal.modalState.floor}
        puerta={editApartmentModal.modalState.door}
        saving={editApartmentModal.modalState.saving}
        onChangeEscalera={editApartmentModal.setStaircase}
        onChangePiso={editApartmentModal.setFloor}
        onChangePuerta={editApartmentModal.setDoor}
        onSave={onSaveVivienda}
        onClose={editApartmentModal.close}
      />

      {/* Modal crear anuncio */}
      <CreateAnnouncementModal
        visible={crearAnuncioVisible}
        onClose={() => setCrearAnuncioVisible(false)}
        onCrear={onCrearAnuncio}
        usuarios={usersForAnnouncements}
        loadingUsuarios={false}
        creating={creatingAnnouncement}
      />

      {/* Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onDismiss={cerrarAlerta}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: 16,
  },
});
