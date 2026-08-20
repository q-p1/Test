export function registerServiceWorker(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator) || !/^https?:$/.test(window.location.protocol)) return;
  let refreshing = false;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { scope: './', updateViaCache: 'none' }).then((registration) => {
      const announceWaiting = () => window.dispatchEvent(new CustomEvent('routine:update-ready', { detail: registration }));
      if (registration.waiting) announceWaiting();
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        if (!worker) return;
        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) announceWaiting();
        });
      });
      window.addEventListener('routine:check-update', () => registration.update());
      registration.update();
      window.setInterval(() => registration.update(), 60 * 60 * 1000);
    }).catch(() => {
      window.dispatchEvent(new CustomEvent('routine:offline-unavailable'));
    });
  });
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
}
