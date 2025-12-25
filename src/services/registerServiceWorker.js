// Registrar Service Worker para PWA y Web Push
// Callback para notificar cuando hay una actualización disponible
let onUpdateAvailable = null;
let pendingWorker = null;

export function setUpdateCallback(callback) {
  onUpdateAvailable = callback;
}

export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    // Escuchar cambios de controlador ANTES de registrar
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[SW] Controller changed, reloading...');
      window.location.reload();
    });

    const register = () => {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) => {
          console.log('Service Worker registrado:', registration.scope);

          // Verificar si hay una actualización disponible
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            console.log('[SW] Nueva versión encontrada, instalando...');

            newWorker.addEventListener('statechange', () => {
              console.log('[SW] Estado del worker:', newWorker.state);

              if (newWorker.state === 'installed') {
                // Hay un nuevo SW instalado
                if (navigator.serviceWorker.controller) {
                  // Hay un SW anterior, esto es una actualización
                  console.log('[SW] Nueva versión lista para activar');
                  pendingWorker = newWorker;
                  if (onUpdateAvailable) {
                    onUpdateAvailable();
                  }
                } else {
                  // Primera instalación
                  console.log('[SW] Service Worker instalado por primera vez');
                }
              }
            });
          });

          // Verificar actualizaciones periódicamente (cada 5 minutos)
          setInterval(() => {
            registration.update();
          }, 5 * 60 * 1000);

          // También verificar al volver a la app
          document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
              registration.update();
            }
          });
        })
        .catch((error) => {
          console.error('Error registrando Service Worker:', error);
        });
    };

    // Si la página ya está cargada, registrar inmediatamente
    if (document.readyState === 'complete') {
      register();
    } else {
      window.addEventListener('load', register);
    }
  }
}

// Forzar la activación del nuevo SW y recargar
export function applyUpdate() {
  console.log('[SW] applyUpdate called, pendingWorker:', pendingWorker);

  if (pendingWorker) {
    // Decirle al SW en espera que tome el control
    pendingWorker.postMessage({ type: 'SKIP_WAITING' });
  } else {
    // Si no hay worker pendiente, simplemente recargar
    console.log('[SW] No pending worker, just reloading...');
    window.location.reload();
  }
}
