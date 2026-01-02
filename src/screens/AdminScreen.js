import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useAuth } from '../context/AuthContext';
import {
  useAnunciosAdmin,
  useAdminData,
  useAdminActions,
  useEditViviendaModal,
  useAlert,
} from '../hooks';
import { colors } from '../constants/colors';
import { CustomAlert } from '../components/CustomAlert';
import {
  CrearAnuncioModal,
  EditViviendaModal,
  AdminHeader,
  AdminTabs,
  SolicitudesContent,
  UsuariosContent,
  MensajesContent,
  LoadingContent,
} from '../components/admin';

export default function AdminScreen() {
  const { user } = useAuth();
  const [tabActiva, setTabActiva] = useState('solicitudes');
  const [crearAnuncioVisible, setCrearAnuncioVisible] = useState(false);

  // Hook de alertas
  const { alertConfig, mostrarAlerta, mostrarConfirmacion, cerrarAlerta } = useAlert();

  // Hook de datos
  const {
    usuariosPendientes,
    todosUsuarios,
    solicitudesCambio,
    loading,
    refreshing,
    cargarDatosTab,
    onRefresh,
    removeUsuarioPendiente,
    removeSolicitudCambio,
    updateUsuario,
    removeUsuario,
  } = useAdminData();

  // Hook de anuncios admin
  const {
    anuncios,
    usuarios: usuariosParaAnuncios,
    loading: loadingAnuncios,
    creating: creatingAnuncio,
    cargarAnuncios,
    cargarUsuarios,
    crearAnuncio,
    eliminarAnuncio,
  } = useAnunciosAdmin(user?.id, user?.nombre, () => {
    setCrearAnuncioVisible(false);
    mostrarAlerta('Mensaje enviado', 'El mensaje ha sido enviado correctamente');
  });

  // Hook de acciones admin
  const {
    handleAprobar,
    handleRechazar,
    handleToggleAdmin,
    handleDeleteUser,
    handleAprobarCambioVivienda,
    handleRechazarCambioVivienda,
    handleSaveVivienda,
  } = useAdminActions({
    currentUserId: user?.id,
    mostrarAlerta,
    mostrarConfirmacion,
    removeUsuarioPendiente,
    removeSolicitudCambio,
    updateUsuario,
    removeUsuario,
  });

  // Hook de modal editar vivienda
  const editViviendaModal = useEditViviendaModal();

  // Cargar datos cuando cambia la tab
  useEffect(() => {
    cargarDatosTab(tabActiva, cargarAnuncios, cargarUsuarios);
  }, [tabActiva, cargarDatosTab, cargarAnuncios, cargarUsuarios]);

  // Handler para guardar vivienda
  const onSaveVivienda = useCallback(async () => {
    const { usuario, escalera, piso, puerta } = editViviendaModal.modalState;
    editViviendaModal.setSaving(true);
    const result = await handleSaveVivienda(usuario, escalera, piso, puerta);
    if (result.success) {
      editViviendaModal.cerrar();
    } else {
      editViviendaModal.setSaving(false);
    }
  }, [editViviendaModal, handleSaveVivienda]);

  // Handler para nuevo mensaje
  const onNuevoMensaje = useCallback(() => {
    cargarUsuarios();
    setCrearAnuncioVisible(true);
  }, [cargarUsuarios]);

  // Handler para crear anuncio
  const onCrearAnuncio = useCallback(async (data) => {
    const result = await crearAnuncio(
      data.titulo,
      data.mensaje,
      data.tipo,
      data.destinatarios,
      data.usuariosIds
    );
    if (!result.success) {
      mostrarAlerta('Error', result.error || 'No se pudo enviar el mensaje');
    }
  }, [crearAnuncio, mostrarAlerta]);

  // Renderizar contenido según tab activa
  const renderContent = () => {
    if (loading) {
      return <LoadingContent />;
    }

    switch (tabActiva) {
      case 'solicitudes':
        return (
          <SolicitudesContent
            usuariosPendientes={usuariosPendientes}
            solicitudesCambio={solicitudesCambio}
            onAprobar={handleAprobar}
            onRechazar={handleRechazar}
            onAprobarCambio={handleAprobarCambioVivienda}
            onRechazarCambio={handleRechazarCambioVivienda}
          />
        );

      case 'usuarios':
        return (
          <UsuariosContent
            usuarios={todosUsuarios}
            currentUserId={user?.id}
            onToggleAdmin={handleToggleAdmin}
            onEditVivienda={editViviendaModal.abrir}
            onDelete={handleDeleteUser}
          />
        );

      case 'mensajes':
        return (
          <MensajesContent
            anuncios={anuncios}
            loadingAnuncios={loadingAnuncios}
            onNuevoMensaje={onNuevoMensaje}
            onEliminar={eliminarAnuncio}
          />
        );

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
        contadorSolicitudes={usuariosPendientes.length + solicitudesCambio.length}
        contadorUsuarios={todosUsuarios.length}
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
      <EditViviendaModal
        visible={editViviendaModal.modalState.visible}
        usuario={editViviendaModal.modalState.usuario}
        escalera={editViviendaModal.modalState.escalera}
        piso={editViviendaModal.modalState.piso}
        puerta={editViviendaModal.modalState.puerta}
        saving={editViviendaModal.modalState.saving}
        onChangeEscalera={editViviendaModal.setEscalera}
        onChangePiso={editViviendaModal.setPiso}
        onChangePuerta={editViviendaModal.setPuerta}
        onSave={onSaveVivienda}
        onClose={editViviendaModal.cerrar}
      />

      {/* Modal crear anuncio */}
      <CrearAnuncioModal
        visible={crearAnuncioVisible}
        onClose={() => setCrearAnuncioVisible(false)}
        onCrear={onCrearAnuncio}
        usuarios={usuariosParaAnuncios}
        loadingUsuarios={false}
        creating={creatingAnuncio}
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
