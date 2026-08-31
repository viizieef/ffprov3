import React, { useState, useEffect } from 'react';
import { Smartphone, Apple, Download, X, Share2, PlusSquare, Sparkles, CheckCircle2 } from 'lucide-react';
import { detectPlatform, triggerHaptic } from '../../utils/platform';
import { CrossPlatformModal } from './CrossPlatformModal';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const MobileInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [platformInfo, setPlatformInfo] = useState(detectPlatform());

  useEffect(() => {
    const info = detectPlatform();
    setPlatformInfo(info);

    // Check if dismissed previously in this session
    const dismissed = sessionStorage.getItem('farmflow_pwa_banner_dismissed');
    if (dismissed) {
      setIsDismissed(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
      setIsDismissed(true);
      triggerHaptic('success');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // If already running in standalone PWA mode (added to home screen) or user dismissed, don't show floating banner
  if (platformInfo.isPWA || isDismissed) {
    return (
      <CrossPlatformModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        initialTab={platformInfo.os === 'ios' ? 'ios' : platformInfo.os === 'android' ? 'android' : 'overview'}
      />
    );
  }

  const handleDismiss = () => {
    triggerHaptic('light');
    setIsDismissed(true);
    sessionStorage.setItem('farmflow_pwa_banner_dismissed', 'true');
  };

  const handleInstallClick = async () => {
    triggerHaptic('medium');
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstallable(false);
        setIsDismissed(true);
      }
      setDeferredPrompt(null);
    } else {
      setShowGuideModal(true);
    }
  };

  const isIOS = platformInfo.os === 'ios';

  return (
    <>
      <div 
        id="mobile-install-banner"
        className="fixed bottom-20 md:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-40 bg-linear-to-r from-forest-950 via-slate-900 to-forest-900 text-white p-3.5 sm:p-4 rounded-2xl shadow-2xl border border-mint-500/30 backdrop-blur-md animate-fadeIn"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-mint-400 text-forest-950 flex items-center justify-center font-black text-base shadow-md shrink-0">
              {isIOS ? <Apple className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-mint-400">
                  {isIOS ? 'iPhone / iPad' : 'Android & Mobile'}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-mint-400 animate-pulse"></span>
              </div>
              <p className="font-extrabold text-xs text-white leading-tight mt-0.5">
                Add FarmFlow to Phone Home Screen
              </p>
              <p className="text-[11px] text-slate-300 line-clamp-1 mt-0.5">
                {isIOS 
                  ? 'Tap Safari Share (📤) > Add to Home Screen'
                  : 'Fast 1-tap access with native app icon'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer shrink-0"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Buttons Row */}
        <div className="mt-3 pt-2.5 border-t border-forest-800/80 flex items-center gap-2">
          {isIOS ? (
            <button
              type="button"
              id="ios-add-guide-btn"
              onClick={() => {
                triggerHaptic('light');
                setShowGuideModal(true);
              }}
              className="flex-1 py-2 px-3 bg-mint-400 hover:bg-mint-300 text-forest-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>See How to Add (2 Steps)</span>
            </button>
          ) : (
            <button
              type="button"
              id="android-install-1click-btn"
              onClick={handleInstallClick}
              className="flex-1 py-2 px-3 bg-mint-400 hover:bg-mint-300 text-forest-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{deferredPrompt ? 'Add to Home Screen (1-Tap)' : 'Install to Home Screen'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setShowGuideModal(true);
            }}
            className="py-2 px-2.5 bg-white/10 hover:bg-white/20 text-slate-200 font-bold rounded-xl text-xs transition cursor-pointer"
            title="View cross-platform details"
          >
            Details
          </button>
        </div>
      </div>

      <CrossPlatformModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        initialTab={isIOS ? 'ios' : 'android'}
      />
    </>
  );
};
