/**
 * Cross-Platform Detection and Hardware Integration Utilities
 * Supports Android, iOS (iPhone/iPad), Windows PC, macOS, Linux, and ChromeOS.
 */

export interface PlatformInfo {
  os: 'android' | 'ios' | 'windows' | 'macos' | 'linux' | 'unknown';
  osName: string;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isPWA: boolean;
  browser: string;
  hasTouch: boolean;
  supportsWakeLock: boolean;
  supportsVibration: boolean;
  supportsShare: boolean;
}

export function detectPlatform(): PlatformInfo {
  if (typeof window === 'undefined') {
    return {
      os: 'unknown',
      osName: 'Web',
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      isPWA: false,
      browser: 'Unknown',
      hasTouch: false,
      supportsWakeLock: false,
      supportsVibration: false,
      supportsShare: false
    };
  }

  const userAgent = window.navigator.userAgent.toLowerCase();
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  // OS Detection
  let os: 'android' | 'ios' | 'windows' | 'macos' | 'linux' | 'unknown' = 'unknown';
  let osName = 'Desktop / Web';

  if (/android/.test(userAgent)) {
    os = 'android';
    osName = 'Android';
  } else if (/iphone|ipad|ipod/.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
    os = 'ios';
    osName = /ipad/.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ? 'iPadOS' : 'iOS';
  } else if (/windows|win32|win64/.test(userAgent)) {
    os = 'windows';
    osName = 'Windows PC';
  } else if (/macintosh|mac os x/.test(userAgent)) {
    os = 'macos';
    osName = 'macOS';
  } else if (/linux/.test(userAgent)) {
    os = 'linux';
    osName = 'Linux PC';
  }

  // Device Form Factor
  const isMobile = /mobile|iphone|android.*mobile/.test(userAgent) || (isTouch && window.innerWidth < 768);
  const isTablet = (/ipad|tablet|android(?!.*mobile)/.test(userAgent) || (isTouch && window.innerWidth >= 768 && window.innerWidth <= 1024));
  const isDesktop = !isMobile && !isTablet;

  // Standalone PWA detection
  const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://');

  // Browser detection
  let browser = 'Web Browser';
  if (/edg\//.test(userAgent)) browser = 'Microsoft Edge';
  else if (/samsungbrowser/.test(userAgent)) browser = 'Samsung Internet';
  else if (/chrome|crios/.test(userAgent)) browser = 'Google Chrome';
  else if (/firefox|fxios/.test(userAgent)) browser = 'Mozilla Firefox';
  else if (/safari/.test(userAgent) && !/chrome|crios/.test(userAgent)) browser = 'Apple Safari';

  return {
    os,
    osName,
    isMobile,
    isTablet,
    isDesktop,
    isPWA,
    browser,
    hasTouch: isTouch,
    supportsWakeLock: 'wakeLock' in navigator,
    supportsVibration: 'vibrate' in navigator,
    supportsShare: 'share' in navigator
  };
}

/**
 * Trigger subtle haptic vibration feedback on supported mobile devices (Android)
 */
export function triggerHaptic(type: 'light' | 'medium' | 'success' | 'warning' = 'light') {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      if (type === 'light') {
        navigator.vibrate(20);
      } else if (type === 'medium') {
        navigator.vibrate(40);
      } else if (type === 'success') {
        navigator.vibrate([30, 40, 30]);
      } else if (type === 'warning') {
        navigator.vibrate([60, 50, 60]);
      }
    } catch {
      // Ignore vibration errors if blocked by browser policy
    }
  }
}

/**
 * Request Screen Wake Lock so screen doesn't dim during barn inspections
 */
let wakeLockSentinel: any = null;

export async function requestScreenWakeLock(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
    try {
      wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
      wakeLockSentinel.addEventListener('release', () => {
        wakeLockSentinel = null;
      });
      return true;
    } catch (err) {
      console.warn('Wake Lock request error:', err);
      return false;
    }
  }
  return false;
}

export function releaseScreenWakeLock() {
  if (wakeLockSentinel) {
    try {
      wakeLockSentinel.release();
    } catch {
      // ignore
    }
    wakeLockSentinel = null;
  }
}

export function isWakeLockActive(): boolean {
  return wakeLockSentinel !== null;
}

/**
 * Universal Native Share with Clipboard Fallback
 */
export async function shareAppData(data: { title: string; text?: string; url?: string }): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share(data);
      return true;
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('Native share failed, falling back to clipboard:', err);
      }
    }
  }

  // Fallback to clipboard
  if (typeof navigator !== 'undefined' && navigator.clipboard && data.url) {
    try {
      await navigator.clipboard.writeText(data.url);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}
