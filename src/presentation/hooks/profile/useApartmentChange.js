import { useState } from 'react';
import { combinarVivienda, formatearVivienda } from '../../../constants/config';
import { validarViviendaComponentes } from '../../../utils/validators';
import { authService } from '../../../services/authService.supabase';

export function useApartmentChange(user, updateProfile, showAlert) {
  const [solicitudModal, setSolicitudModal] = useState({
    visible: false,
    escalera: '',
    piso: '',
    puerta: '',
    saving: false,
  });
  const [cancelingSolicitud, setCancelingSolicitud] = useState(false);

  const openSolicitudModal = () => {
    setSolicitudModal({ visible: true, escalera: '', piso: '', puerta: '', saving: false });
  };

  const closeSolicitudModal = () => {
    setSolicitudModal({ visible: false, escalera: '', piso: '', puerta: '', saving: false });
  };

  const handleEnviarSolicitud = async () => {
    const { escalera, piso, puerta } = solicitudModal;
    const validacion = validarViviendaComponentes(escalera, piso, puerta);
    if (!validacion.valido) {
      showAlert('Error de validación', Object.values(validacion.errores).join('\n'));
      return;
    }

    const nuevaVivienda = combinarVivienda(escalera, piso, puerta);
    if (nuevaVivienda === user?.vivienda) {
      showAlert('Error', 'La vivienda seleccionada es igual a tu vivienda actual');
      return;
    }

    setSolicitudModal((prev) => ({ ...prev, saving: true }));
    const result = await authService.solicitarCambioVivienda(user.id, nuevaVivienda);

    if (result.success) {
      closeSolicitudModal();
      await updateProfile({ viviendaSolicitada: nuevaVivienda });
      showAlert('Solicitud Enviada', `Tu solicitud de cambio a ${formatearVivienda(nuevaVivienda)} ha sido enviada. Un administrador la revisará pronto.`);
    } else {
      setSolicitudModal((prev) => ({ ...prev, saving: false }));
      showAlert('Error', result.error || 'Error al enviar solicitud');
    }
  };

  const handleCancelarSolicitud = () => {
    showAlert(
      'Cancelar Solicitud',
      '¿Estás seguro de que quieres cancelar tu solicitud de cambio de vivienda?',
      [
        { text: 'No', style: 'cancel', onPress: () => {} },
        {
          text: 'Sí, Cancelar',
          style: 'destructive',
          onPress: async () => {
            setCancelingSolicitud(true);
            const result = await authService.cancelarSolicitudVivienda(user.id);
            if (result.success) {
              await updateProfile({ viviendaSolicitada: null });
              showAlert('Solicitud Cancelada', 'Tu solicitud de cambio de vivienda ha sido cancelada.');
            } else {
              showAlert('Error', result.error || 'Error al cancelar solicitud');
            }
            setCancelingSolicitud(false);
          },
        },
      ]
    );
  };

  return {
    solicitudModal, setSolicitudModal,
    cancelingSolicitud,
    openSolicitudModal,
    closeSolicitudModal,
    handleEnviarSolicitud,
    handleCancelarSolicitud,
  };
}
