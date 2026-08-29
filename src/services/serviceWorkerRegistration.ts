/**
 * FarmFlow Pro - Service Worker Registration & Lifecycle Manager
 * Handles PWA registration, update notifications, offline detection, and background sync triggers.
 */

export interface ServiceWorkerConfig {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
  onOfflineReady?: () => void;
}

export function registerServiceWorker(config?: ServiceWorkerConfig) {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', () => {
    const swUrl = '/sw.js';

    navigator.serviceWorker
      .register(swUrl)
      .then((registration) => {
        // Check for updates on load
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (installingWorker == null) {
            return;
          }

          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // New content is available and will be used when all tabs for this page are closed.
                console.log('[SW] New version available; will activate on reload.');
                if (config && config.onUpdate) {
                  config.onUpdate(registration);
                }
              } else {
                // Content is cached for offline use.
                console.log('[SW] FarmFlow Pro is cached for offline use.');
                if (config && config.onSuccess) {
                  config.onSuccess(registration);
                }
                if (config && config.onOfflineReady) {
                  config.onOfflineReady();
                }
              }
            }
          };
        };
      })
      .catch((error) => {
        console.warn('[SW] Service worker registration failed:', error);
        if (config && config.onError) {
          config.onError(error);
        }
      });
  });
}

export function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}
