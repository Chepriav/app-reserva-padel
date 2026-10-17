import { useState } from 'react';
import { combineApartment, formatApartment } from '../../../constants/config';
import { validateApartmentComponentes } from '../../../utils/validators';
import { authService } from '../../../services/authService.supabase';
import { showToast } from '../../components/Toast';

export function useApartmentChange(user, updateProfile, showAlert) {
  const [requestModal, setRequestModal] = useState({
    visible: false,
    staircase: '',
    floor: '',
    door: '',
    saving: false,
  });
  const [cancelingRequest, setCancelingRequest] = useState(false);

  const openRequestModal = () => {
    setRequestModal({ visible: true, staircase: '', floor: '', door: '', saving: false });
  };

  const closeRequestModal = () => {
    setRequestModal({ visible: false, staircase: '', floor: '', door: '', saving: false });
  };

  const handleSubmitRequest = async () => {
    const { staircase, floor, door } = requestModal;
    const validation = validateApartmentComponentes(staircase, floor, door);
    if (!validation.valido) {
      showAlert('Error de validación', Object.values(validation.errores).join('\n'));
      return;
    }

    const newApartment = combineApartment(staircase, floor, door);
    if (newApartment === user?.apartment) {
      showAlert('Elige otra vivienda', 'La vivienda seleccionada es igual a tu vivienda actual');
      return;
    }

    setRequestModal((prev) => ({ ...prev, saving: true }));
    const result = await authService.requestApartmentChange(user.id, newApartment);

    if (result.success) {
      closeRequestModal();
      await updateProfile({ requestedApartment: newApartment });
      showToast(`Solicitud de cambio a ${formatApartment(newApartment)} enviada. Un administrador la revisará.`);
    } else {
      setRequestModal((prev) => ({ ...prev, saving: false }));
      showAlert('No se pudo enviar la solicitud', result.error || 'Inténtalo de nuevo en unos segundos.');
    }
  };

  const handleCancelRequest = () => {
    showAlert(
      'Cancelar solicitud',
      '¿Estás seguro de que quieres cancelar tu solicitud de cambio de vivienda?',
      [
        { text: 'No', style: 'cancel', onPress: () => {} },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            setCancelingRequest(true);
            const result = await authService.cancelApartmentRequest(user.id);
            if (result.success) {
              await updateProfile({ requestedApartment: null });
              showToast('Solicitud de cambio cancelada');
            } else {
              showAlert('No se pudo cancelar la solicitud', result.error || 'Inténtalo de nuevo en unos segundos.');
            }
            setCancelingRequest(false);
          },
        },
      ]
    );
  };

  return {
    requestModal, setRequestModal,
    cancelingRequest,
    openRequestModal,
    closeRequestModal,
    handleSubmitRequest,
    handleCancelRequest,
  };
}
