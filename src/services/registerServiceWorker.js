// Desregistrar Service Workers existentes y no registrar nuevos
// El SW estaba causando problemas con las peticiones a Supabase
export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    // Desregistrar todos los SW existentes
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        registration.unregister();
        console.log('🗑️ Service Worker unregistered');
      });
    });
  }
}
