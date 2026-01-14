import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useAuth } from '../context/AuthContext';
import {
  useAdminData,
  useAdminActions,
  useEditApartmentModal,
  useAlert,
} from '../hooks';
import { useUserImport } from '../hooks/useUserImport';
import { colors } from '../constants/colors';
import { CustomAlert } from '../components/CustomAlert';
import {
  EditApartmentModal,
  AdminHeader,
  AdminTabs,
  SolicitudesContent,
  UsuariosContent,
  LoadingContent,
  ScheduleConfigSection,
  ImportUsersModal,
  ImportResultsModal,
} from '../components/admin';

export default function AdminScreen() {
  const { user } = useAuth();
  const [tabActiva, setTabActiva] = useState('solicitudes');

  // Import modals state
  const [showImportModal, setShowImportModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [importResults, setImportResults] = useState(null);

  // Hook de alertas
  const { alertConfig, mostrarAlerta, mostrarConfirmacion, cerrarAlerta } = useAlert();

  // Hook de importación
  const { startImport } = useUserImport();

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
    loadTabData(tabActiva);
  }, [tabActiva, loadTabData]);

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

  // Handler para abrir modal de importación
  const handleOpenImport = useCallback(() => {
    setShowImportModal(true);
  }, []);

  // Handler para importar usuarios
  const handleImportUsers = useCallback(async (userData, onProgress, onUserResult) => {
    await startImport(userData, onProgress, onUserResult);
  }, [startImport]);

  // Handler para completar importación
  const handleImportComplete = useCallback((results) => {
    setShowImportModal(false);
    setImportResults(results);
    setShowResultsModal(true);
  }, []);

  // Handler para cerrar modal de resultados
  const handleCloseResults = useCallback(() => {
    setShowResultsModal(false);
    setImportResults(null);
    // Reload users list
    loadTabData('usuarios');
  }, [loadTabData]);

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
            onImportUsers={handleOpenImport}
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

      {/* Modal importar usuarios */}
      <ImportUsersModal
        visible={showImportModal}
        onClose={() => setShowImportModal(false)}
        onComplete={handleImportComplete}
        onImport={handleImportUsers}
      />

      {/* Modal resultados de importación */}
      <ImportResultsModal
        visible={showResultsModal}
        results={importResults}
        onClose={handleCloseResults}
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
