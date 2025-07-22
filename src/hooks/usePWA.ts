import { useEffect } from 'react';

export const useServiceWorker = () => {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('SW registered: ', registration);
            
            // Check for updates
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    // New content available, notify user
                    if (window.confirm('New version available! Reload to update?')) {
                      window.location.reload();
                    }
                  }
                });
              }
            });
          })
          .catch((registrationError) => {
            console.log('SW registration failed: ', registrationError);
          });
      });
    }

    // Register for background sync when online
    if ('serviceWorker' in navigator) {
      window.addEventListener('online', () => {
        navigator.serviceWorker.ready.then((registration) => {
          // Background sync is not widely supported, so we'll just refresh data
          window.dispatchEvent(new Event('online-sync'));
        });
      });
    }
  }, []);
};

export const useInstallPrompt = () => {
  useEffect(() => {
    let deferredPrompt: any;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e;
      
      // Show custom install UI
      const installBanner = document.createElement('div');
      installBanner.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; right: 0; background: #8884d8; color: white; padding: 12px; text-align: center; z-index: 1000;">
          <span>Install Ather Support app for better experience</span>
          <button id="install-btn" style="margin-left: 12px; padding: 4px 12px; background: white; color: #8884d8; border: none; border-radius: 4px; cursor: pointer;">Install</button>
          <button id="dismiss-btn" style="margin-left: 8px; padding: 4px 12px; background: transparent; color: white; border: 1px solid white; border-radius: 4px; cursor: pointer;">Dismiss</button>
        </div>
      `;
      
      document.body.appendChild(installBanner);
      
      const installBtn = document.getElementById('install-btn');
      const dismissBtn = document.getElementById('dismiss-btn');
      
      installBtn?.addEventListener('click', () => {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(() => {
          deferredPrompt = null;
          document.body.removeChild(installBanner);
        });
      });
      
      dismissBtn?.addEventListener('click', () => {
        document.body.removeChild(installBanner);
      });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);
};