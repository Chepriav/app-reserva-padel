// Registrar Service Worker para PWA y Web Push
export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    const register = () => {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) => {
          console.log('Service Worker registrado:', registration.scope);
          // Actualizar el SW si hay una nueva versión
          registration.update();
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
