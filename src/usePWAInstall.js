import { useState, useEffect } from 'react';

export function usePWAInstall() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isDismissed, setIsDismissed] = useState(() => {
    return sessionStorage.getItem('trackwise_pwa_install_dismissed') === 'true';
  });
  const [isAlreadyInstalled, setIsAlreadyInstalled] = useState(() => {
    return localStorage.getItem('trackwise_pwa_installed') === 'true';
  });
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    console.log("🚀 PWA hook loaded");
    // Check if running in standalone mode
    const checkStandalone = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone ||
        document.referrer.includes('android-app://');
      setIsStandalone(standalone);
      if (standalone) {
        localStorage.setItem('trackwise_pwa_installed', 'true');
        setIsAlreadyInstalled(true);
      }
    };

    checkStandalone();

    // Listen to changes in display mode (e.g. if opened in standalone after installing)
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleMediaChange = (e) => {
      setIsStandalone(e.matches);
      if (e.matches) {
        localStorage.setItem('trackwise_pwa_installed', 'true');
        setIsAlreadyInstalled(true);
      }
    };

    mediaQuery.addEventListener('change', handleMediaChange);

    // beforeinstallprompt listener
    const handleBeforeInstallPrompt = (e) => {
      console.log("🔥 beforeinstallprompt fired");
      console.log(e);

      e.preventDefault();

      setInstallPrompt(e);
    };

    // appinstalled listener
    const handleAppInstalled = () => {
      setInstallPrompt(null);
      localStorage.setItem('trackwise_pwa_installed', 'true');
      setIsAlreadyInstalled(true);
      setShowToast(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      mediaQuery.removeEventListener('change', handleMediaChange);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!installPrompt) return false;

    // Trigger prompt
    installPrompt.prompt();

    // Wait for user choice
    const { outcome } = await installPrompt.userChoice;

    if (outcome === 'accepted') {
      localStorage.setItem('trackwise_pwa_installed', 'true');
      setIsAlreadyInstalled(true);
      setInstallPrompt(null);
      setShowToast(true);
      return true;
    } else {
      // If user dismissed browser prompt, keep banner hidden for current session
      dismissBanner();
      return false;
    }
  };

  const dismissBanner = () => {
    sessionStorage.setItem('trackwise_pwa_install_dismissed', 'true');
    setIsDismissed(true);
  };

  const closeToast = () => {
    setShowToast(false);
  };

  // Toast should auto-dismiss after 4 seconds
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const showInstallBanner =
    installPrompt &&
    !isStandalone &&
    !isDismissed &&
    !isAlreadyInstalled;

  return {
    showInstallBanner,
    install,
    dismissBanner,
    showToast,
    closeToast
  };
}
