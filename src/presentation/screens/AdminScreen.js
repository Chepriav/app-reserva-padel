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
import { useReservationsLog } from '../hooks/useReservationsLog';
import { colors } from '../../constants/colors';
import { CustomAlert } from '../components/CustomAlert';
import {
  EditApartmentModal,
  AdminHeader,
  AdminTabs,
  RequestsContent,
  UsersContent,
  LoadingContent,
  ScheduleConfigSection,
  ImportUsersModal,
  ImportResultsModal,
  LogContent,
} from '../components/admin';

export default function AdminScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('requests');
  const [showLog, setShowLog] = useState(false);

  // Hook de registros (lazy: solo carga cuando se abre la vista)
  const {
    reservations: logReservations,
    loading: logLoading,
    filterApartment,
    filterStatus,
    setFilterApartment,
    setFilterStatus,
    total: logTotal,
  } = useReservationsLog(showLog);

  // Import modals state
  const [showImportModal, setShowImportModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [importResults, setImportResults] = useState(null);

  // Hook de alertas
  const { alertConfig, showAlert, showConfirmation, closeAlert } = useAlert();

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
    showAlert,
    showConfirmation,
    removePendingUser,
    removeChangeRequest,
    updateUser,
    removeUser,
  });

  // Hook de modal editar vivienda
  const editApartmentModal = useEditApartmentModal();

  // Cargar datos cuando cambia la tab
  useEffect(() => {
    loadTabData(activeTab);
  }, [activeTab, loadTabData]);

  // Handler para guardar vivienda
  const onSaveApartment = useCallback(async () => {
    const { user, staircase, floor, door } = editApartmentModal.modalState;
    editApartmentModal.setSaving(true);
    const result = await handleSaveApartment(user, staircase, floor, door);
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
    loadTabData('users');
  }, [loadTabData]);

  // Renderizar contenido según tab activa
  const renderContent = () => {
    if (loading) {
      return <LoadingContent />;
    }

    switch (activeTab) {
      case 'requests':
        return (
          <RequestsContent
            usersPending={pendingUsers}
            requestsChange={changeRequests}
            onApprove={handleApprove}
            onReject={handleReject}
            onApproveChange={handleApproveApartmentChange}
            onRejectChange={handleRejectApartmentChange}
          />
        );

      case 'users':
        return (
          <UsersContent
            users={allUsers}
            currentUserId={user?.id}
            onToggleAdmin={handleToggleAdmin}
            onEditApartment={editApartmentModal.open}
            onDelete={handleDeleteUser}
            onImportUsers={handleOpenImport}
          />
        );

      case 'configuration':
        return <ScheduleConfigSection userId={user?.id} />;

      default:
        return null;
    }
  };

  if (showLog) {
    return (
      <View style={styles.container}>
        <AdminHeader onShowLog={() => setShowLog(false)} isLogView />
        <LogContent
          reservations={logReservations}
          loading={logLoading}
          filterApartment={filterApartment}
          filterStatus={filterStatus}
          onFilterApartment={setFilterApartment}
          onFilterStatus={setFilterStatus}
          total={logTotal}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AdminHeader onShowLog={() => setShowLog(true)} />

      <AdminTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        requestsCount={pendingUsers.length + changeRequests.length}
        usersCount={allUsers.length}
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
        user={editApartmentModal.modalState.user}
        staircase={editApartmentModal.modalState.staircase}
        floor={editApartmentModal.modalState.floor}
        door={editApartmentModal.modalState.door}
        saving={editApartmentModal.modalState.saving}
        onChangeStaircase={editApartmentModal.setStaircase}
        onChangeFloor={editApartmentModal.setFloor}
        onChangeDoor={editApartmentModal.setDoor}
        onSave={onSaveApartment}
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
        onDismiss={closeAlert}
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
