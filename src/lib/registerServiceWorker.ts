export function registerServiceWorker(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator) || !/^https?:$/.test(window.location.protocol)) return;
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
  navigator.serviceWorker.addEventListener(
    'controllerchange',
    createControllerChangeHandler(Boolean(navigator.serviceWorker.controller), () => window.location.reload()),
  );
}

export function createControllerChangeHandler(initiallyControlled: boolean, reload: () => void): () => void {
  let hadController = initiallyControlled;
  let refreshing = false;

  return () => {
    // clients.claim() also fires on the very first install. The current shell is
    // already correct then, so reloading would interrupt the user's first tap.
    if (!hadController) {
      hadController = true;
      return;
    }
    if (refreshing) return;
    refreshing = true;
    reload();
  };
}
