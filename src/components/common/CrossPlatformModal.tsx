import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Smartphone, 
  Monitor, 
  Apple, 
  Download, 
  Check, 
  X, 
  Copy, 
  Share2, 
  Sparkles, 
  ShieldCheck, 
  Wifi, 
  Database, 
  Sun, 
  Vibrate, 
  QrCode,
  Laptop,
  CheckCircle2,
  ArrowRight,
  HelpCircle,
  ExternalLink,
  Layers,
  ChevronRight,
  HardDrive
} from 'lucide-react';
import { detectPlatform, triggerHaptic, requestScreenWakeLock, releaseScreenWakeLock, isWakeLockActive, shareAppData } from '../../utils/platform';
import { useFarm } from '../../context/FarmContext';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface CrossPlatformModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'android' | 'ios' | 'pc' | 'overview';
}

export const CrossPlatformModal: React.FC<CrossPlatformModalProps> = ({
  isOpen,
  onClose,
  initialTab
}) => {
  const { farmProfile } = useFarm();
  const [platformInfo, setPlatformInfo] = useState(detectPlatform());
  const [activeTab, setActiveTab] = useState<'overview' | 'android' | 'ios' | 'pc'>(() => {
    if (initialTab) return initialTab;
    const current = detectPlatform();
    if (current.os === 'android') return 'android';
    if (current.os === 'ios') return 'ios';
    if (current.os === 'windows' || current.os === 'macos' || current.os === 'linux') return 'pc';
    return 'overview';
  });

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [wakeLockEnabled, setWakeLockEnabled] = useState(isWakeLockActive());

  const appUrl = typeof window !== 'undefined' ? window.location.href.split('#')[0] : 'https://ais-pre-cupjad67n6ntomphx2p2z3-116744961637.asia-east1.run.app';

  useEffect(() => {
    setPlatformInfo(detectPlatform());

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
      setInstalledSuccess(true);
      triggerHaptic('success');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (!isOpen) return null;

  const handleNativeInstall = async () => {
    triggerHaptic('medium');
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstallable(false);
        setInstalledSuccess(true);
      }
      setDeferredPrompt(null);
    }
  };

  const handleCopy = () => {
    triggerHaptic('light');
    navigator.clipboard.writeText(appUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShare = async () => {
    triggerHaptic('light');
    await shareAppData({
      title: `${farmProfile.name || 'FarmFlow Pro'} - Multi-Platform Farm Management`,
      text: 'Access FarmFlow Pro on Android, iOS, or PC desktop for poultry house logging and inventory management.',
      url: appUrl
    });
  };

  const handleToggleWakeLock = async () => {
    triggerHaptic('medium');
    if (wakeLockEnabled) {
      releaseScreenWakeLock();
      setWakeLockEnabled(false);
    } else {
      const res = await requestScreenWakeLock();
      setWakeLockEnabled(res);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-forest-950 via-slate-900 to-forest-900 p-5 sm:p-6 text-white relative shrink-0">
          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-mint-400 text-forest-950 flex items-center justify-center font-black text-xl shadow-lg shadow-mint-400/20 shrink-0">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold text-mint-400 uppercase tracking-widest px-2 py-0.5 rounded-md bg-forest-900/80 border border-mint-500/20">
                  Universal Cross-Platform
                </span>
                <span className="text-[10px] text-slate-300 font-mono hidden sm:inline">
                  Current OS: {platformInfo.osName} {platformInfo.isPWA ? '• Installed' : '• Web'}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white mt-1">
                FarmFlow Pro for Android, iOS & PC
              </h2>
            </div>
          </div>

          {/* Platform Switcher Tabs */}
          <div className="grid grid-cols-4 gap-1.5 mt-5 p-1 bg-forest-900/60 backdrop-blur-xs rounded-2xl border border-forest-800/80 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setActiveTab('overview');
              }}
              className={`py-2 px-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-mint-400 text-forest-950 font-black shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Overview</span>
              <span className="sm:hidden">All</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setActiveTab('android');
              }}
              className={`py-2 px-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'android'
                  ? 'bg-mint-400 text-forest-950 font-black shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Android</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setActiveTab('ios');
              }}
              className={`py-2 px-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'ios'
                  ? 'bg-mint-400 text-forest-950 font-black shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Apple className="w-3.5 h-3.5" />
              <span>iOS / Mac</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setActiveTab('pc');
              }}
              className={`py-2 px-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'pc'
                  ? 'bg-mint-400 text-forest-950 font-black shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>PC / Linux</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-slate-800 text-xs">
          
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-br from-forest-50 to-mint-50/50 rounded-2xl border border-forest-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-forest-950 text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-forest-700" />
                    <span>Single Codebase, Seamless Everywhere</span>
                  </span>
                  <span className="text-[11px] font-bold text-orange-700 bg-white px-2.5 py-1 rounded-full border border-orange-200 shadow-2xs">
                    Cloud Connected
                  </span>
                </div>
                <p className="text-slate-700 leading-relaxed text-xs">
                  FarmFlow Pro is engineered as a high-performance Progressive Web Application (PWA) that installs seamlessly as a native application on Android smartphones, iPhones, iPads, Windows PCs, MacBooks, and Linux workstations.
                </p>
              </div>

              {/* 3 Platforms Grid Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Android Card */}
                <div 
                  onClick={() => setActiveTab('android')}
                  className="p-4 bg-slate-50 hover:bg-slate-100/90 rounded-2xl border border-slate-200 transition cursor-pointer space-y-2.5 group"
                >
                  <div className="w-9 h-9 rounded-xl bg-forest-900 text-mint-400 flex items-center justify-center font-bold">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 group-hover:text-forest-900 flex items-center justify-between">
                      <span>Android OS</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-forest-900" />
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      1-Tap Install, Chrome/Edge/Samsung, Vibration & Camera QR scan.
                    </p>
                  </div>
                </div>

                {/* iOS Card */}
                <div 
                  onClick={() => setActiveTab('ios')}
                  className="p-4 bg-slate-50 hover:bg-slate-100/90 rounded-2xl border border-slate-200 transition cursor-pointer space-y-2.5 group"
                >
                  <div className="w-9 h-9 rounded-xl bg-forest-900 text-mint-400 flex items-center justify-center font-bold">
                    <Apple className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 group-hover:text-forest-900 flex items-center justify-between">
                      <span>Apple iOS / iPad</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-forest-900" />
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Safari Add to Home Screen, Safe Area Insets, Instant Cloud Sync.
                    </p>
                  </div>
                </div>

                {/* PC Card */}
                <div 
                  onClick={() => setActiveTab('pc')}
                  className="p-4 bg-slate-50 hover:bg-slate-100/90 rounded-2xl border border-slate-200 transition cursor-pointer space-y-2.5 group"
                >
                  <div className="w-9 h-9 rounded-xl bg-forest-900 text-mint-400 flex items-center justify-center font-bold">
                    <Monitor className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 group-hover:text-forest-900 flex items-center justify-between">
                      <span>PC / Desktop</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-forest-900" />
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Windows/Mac/Linux standalone window, hotkeys, wide table views.
                    </p>
                  </div>
                </div>
              </div>

              {/* Hardware Matrix Table */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] block">
                  Cross-Platform Hardware Capabilities
                </span>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                    <p className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-forest-700" />
                      <span>Central Cloud DB</span>
                    </p>
                    <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">✓ Live Synchronized</p>
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                    <p className="font-bold text-slate-900 flex items-center gap-1.5">
                      <QrCode className="w-3.5 h-3.5 text-forest-700" />
                      <span>Camera QR Scan</span>
                    </p>
                    <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">✓ Mobile & PC</p>
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                    <p className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Sun className="w-3.5 h-3.5 text-forest-700" />
                      <span>Screen Stay-Awake</span>
                    </p>
                    <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                      {platformInfo.supportsWakeLock ? '✓ Supported here' : '✓ Android & PC'}
                    </p>
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                    <p className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Vibrate className="w-3.5 h-3.5 text-forest-700" />
                      <span>Haptic Vibration</span>
                    </p>
                    <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">✓ Android Native</p>
                  </div>
                </div>
              </div>

              {/* Quick Screen Wake Lock Toggle for barn walkthroughs */}
              {platformInfo.supportsWakeLock && (
                <div className="p-3.5 bg-forest-900 text-white rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Sun className="w-4 h-4 text-mint-400" />
                    <div>
                      <p className="font-bold text-xs">Barn Walkthrough Screen Keep-Awake</p>
                      <p className="text-[10px] text-slate-300">Prevents phone or tablet screen from dimming while logging pens.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleWakeLock}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      wakeLockEnabled 
                        ? 'bg-mint-400 text-forest-950 shadow-sm' 
                        : 'bg-white/10 hover:bg-white/20 text-white'
                    }`}
                  >
                    {wakeLockEnabled ? 'Awake Active' : 'Enable Keep-Awake'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ANDROID TAB */}
          {activeTab === 'android' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-start gap-3">
                <div className="p-2 rounded-xl bg-forest-900 text-mint-400 shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-emerald-950 text-sm">Android Installation & Native APK Experience</h4>
                  <p className="text-slate-700 text-xs mt-1">
                    Installs directly to your Android home screen and app drawer as an independent app icon with standalone full-screen view, live central synchronization, and hardware haptics.
                  </p>
                </div>
              </div>

              {isInstallable && (
                <div className="p-4 bg-forest-950 text-white rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                  <div>
                    <span className="text-[10px] font-bold text-mint-400 uppercase tracking-wider">Ready to Install</span>
                    <p className="font-bold text-sm text-white">Install to Android Device Now</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleNativeInstall}
                    className="px-4 py-2.5 bg-mint-400 hover:bg-mint-300 text-forest-950 font-black rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Install FarmFlow Android App</span>
                  </button>
                </div>
              )}

              {/* Step-by-Step Manual Android Instructions */}
              <div className="space-y-2">
                <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] block">
                  Installation Steps for Android (Chrome / Samsung / Edge):
                </span>

                <div className="space-y-2">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-forest-900 text-mint-400 font-black text-xs flex items-center justify-center shrink-0">1</span>
                    <p className="text-xs text-slate-800">
                      Open FarmFlow in <strong>Google Chrome</strong> or <strong>Samsung Internet</strong> on your phone.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-forest-900 text-mint-400 font-black text-xs flex items-center justify-center shrink-0">2</span>
                    <p className="text-xs text-slate-800">
                      Tap the <strong>three dots menu (⋮)</strong> in the top-right corner of Chrome.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-forest-900 text-mint-400 font-black text-xs flex items-center justify-center shrink-0">3</span>
                    <p className="text-xs text-slate-800">
                      Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-forest-900 text-mint-400 font-black text-xs flex items-center justify-center shrink-0">4</span>
                    <p className="text-xs text-slate-800">
                      FarmFlow Pro icon is added to your Android Home Screen with zero URL bars.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* IOS TAB */}
          {activeTab === 'ios' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-100 border border-slate-200 rounded-2xl flex items-start gap-3">
                <div className="p-2 rounded-xl bg-forest-900 text-mint-400 shrink-0">
                  <Apple className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Apple iOS & iPadOS (iPhone & iPad)</h4>
                  <p className="text-slate-700 text-xs mt-1">
                    Native web app installation via Safari with custom apple-touch icons, black-translucent status bars, and full notch / Dynamic Island safe-area layout support.
                  </p>
                </div>
              </div>

              {/* iOS Visual Steps */}
              <div className="space-y-2">
                <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] block">
                  Installation Guide for iPhone & iPad (Safari):
                </span>

                <div className="space-y-2.5">
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-forest-900 text-mint-400 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">1</span>
                    <div>
                      <p className="font-bold text-slate-900">Open in Safari</p>
                      <p className="text-[11px] text-slate-600">Ensure you are viewing this page in Apple Safari on your iPhone or iPad.</p>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-forest-900 text-mint-400 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">2</span>
                    <div>
                      <p className="font-bold text-slate-900">Tap the Share Icon</p>
                      <p className="text-[11px] text-slate-600">
                        Tap the blue <strong>Share button (square with arrow pointing up)</strong> at the bottom of Safari toolbar.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-forest-900 text-mint-400 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">3</span>
                    <div>
                      <p className="font-bold text-slate-900">Select "Add to Home Screen"</p>
                      <p className="text-[11px] text-slate-600">
                        Scroll down the share sheet and tap <strong>"Add to Home Screen"</strong> (icon with a plus sign).
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-forest-900 text-mint-400 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">4</span>
                    <div>
                      <p className="font-bold text-slate-900">Tap "Add" in Top Right</p>
                      <p className="text-[11px] text-slate-600">
                        FarmFlow Pro is now installed on your iOS home screen for instant access!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PC / DESKTOP TAB */}
          {activeTab === 'pc' && (
            <div className="space-y-4">
              <div className="p-4 bg-sky-50/70 border border-sky-200/80 rounded-2xl flex items-start gap-3">
                <div className="p-2 rounded-xl bg-forest-900 text-mint-400 shrink-0">
                  <Monitor className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sky-950 text-sm">Windows PC, macOS & Linux Desktop App</h4>
                  <p className="text-slate-700 text-xs mt-1">
                    Runs in an ultra-fast standalone desktop window with custom system shortcuts, command palette (`Ctrl+K` or `Cmd+K`), and high-density widescreen tables.
                  </p>
                </div>
              </div>

              {isInstallable && (
                <div className="p-4 bg-forest-950 text-white rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                  <div>
                    <span className="text-[10px] font-bold text-mint-400 uppercase tracking-wider">Desktop Native Mode</span>
                    <p className="font-bold text-sm text-white">Install FarmFlow to Windows / Mac / Linux</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleNativeInstall}
                    className="px-4 py-2.5 bg-mint-400 hover:bg-mint-300 text-forest-950 font-black rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Install Desktop App</span>
                  </button>
                </div>
              )}

              {/* PC Desktop Hotkeys Card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] block">
                  Desktop PC Power Shortcuts
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div className="p-2 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                    <span className="text-slate-600 font-medium">Command Palette:</span>
                    <kbd className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded-md font-mono text-[11px] font-bold">Ctrl+K</kbd>
                  </div>

                  <div className="p-2 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                    <span className="text-slate-600 font-medium">Shortcuts Help:</span>
                    <kbd className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded-md font-mono text-[11px] font-bold">?</kbd>
                  </div>

                  <div className="p-2 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                    <span className="text-slate-600 font-medium">Print Current Report:</span>
                    <kbd className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded-md font-mono text-[11px] font-bold">Ctrl+P</kbd>
                  </div>

                  <div className="p-2 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                    <span className="text-slate-600 font-medium">Dashboard:</span>
                    <kbd className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded-md font-mono text-[11px] font-bold">D</kbd>
                  </div>

                  <div className="p-2 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                    <span className="text-slate-600 font-medium">Egg Production:</span>
                    <kbd className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded-md font-mono text-[11px] font-bold">E</kbd>
                  </div>

                  <div className="p-2 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                    <span className="text-slate-600 font-medium">Feed Inventory:</span>
                    <kbd className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded-md font-mono text-[11px] font-bold">F</kbd>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick QR Sharing Section at bottom */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-xl border border-slate-200 shrink-0">
                <QRCodeSVG value={appUrl} size={64} level="M" />
              </div>
              <div>
                <p className="font-bold text-slate-900 text-xs">Scan from Phone or Tablet</p>
                <p className="text-[11px] text-slate-500">Scan this QR code with any iOS or Android camera to open and install instantly.</p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleCopy}
                className="flex-1 sm:flex-none px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>

              {platformInfo.supportsShare && (
                <button
                  type="button"
                  onClick={handleShare}
                  className="flex-1 sm:flex-none px-3.5 py-2 bg-forest-900 hover:bg-forest-950 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Share2 className="w-3.5 h-3.5 text-mint-400" />
                  <span>Share</span>
                </button>
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500">
            Powered by FarmFlow Universal PWA Core
          </span>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="px-4 py-2 bg-forest-900 hover:bg-forest-950 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
