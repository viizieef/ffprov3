import React, { useState, useEffect } from 'react';
import { Download, Monitor, Smartphone, Apple, Sparkles } from 'lucide-react';
import { CrossPlatformModal } from './CrossPlatformModal';
import { detectPlatform, triggerHaptic } from '../../utils/platform';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [platformInfo, setPlatformInfo] = useState(detectPlatform());

  useEffect(() => {
    const info = detectPlatform();
    setPlatformInfo(info);
    setIsStandalone(info.isPWA);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    triggerHaptic('medium');
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstallable(false);
      }
      setDeferredPrompt(null);
    } else {
      setShowModal(true);
    }
  };

  // If already installed in standalone window, show small standalone indicator or null
  if (isStandalone) {
    return (
      <>
        <button
          type="button"
          id="pwa-cross-platform-hub-btn"
          onClick={() => setShowModal(true)}
          title={`Running as standalone app on ${platformInfo.osName}`}
          className="px-2.5 py-1 rounded-xl bg-forest-900/90 hover:bg-forest-800 text-mint-300 border border-forest-700/80 text-[11px] font-bold transition flex items-center gap-1.5 shadow-2xs shrink-0 cursor-pointer"
        >
          {platformInfo.os === 'android' ? (
            <Smartphone className="w-3.5 h-3.5 text-mint-400" />
          ) : platformInfo.os === 'ios' ? (
            <Apple className="w-3.5 h-3.5 text-mint-400" />
          ) : (
            <Monitor className="w-3.5 h-3.5 text-mint-400" />
          )}
          <span className="hidden sm:inline">Installed App</span>
        </button>

        <CrossPlatformModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
        />
      </>
    );
  }

  return (
    <>
      {/* Header Install Button */}
      <button
        type="button"
        id="pwa-install-app-btn"
        onClick={handleInstallClick}
        title="Install FarmFlow Pro to your device (Android, iOS, Windows, Mac, Linux)"
        className="px-3 py-1.5 rounded-xl bg-forest-900/90 hover:bg-forest-800 text-mint-400 hover:text-mint-300 border border-forest-700/80 text-xs font-bold transition flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer"
      >
        <Download className="w-3.5 h-3.5 text-mint-400" />
        <span className="hidden sm:inline">Install App</span>
      </button>

      {/* Universal Cross-Platform Modal */}
      <CrossPlatformModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
};
