import React, { useState, useRef, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useFarm } from '../../context/FarmContext';
import { UserRole } from '../../types';
import { 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Database,
  HelpCircle,
  UserPlus,
  QrCode,
  Smartphone,
  Copy,
  Check,
  Download,
  Printer,
  Sparkles,
  ShieldCheck,
  Building2,
  Mail,
  Phone,
  KeyRound,
  Layers,
  Globe,
  Apple,
  Share2,
  ShieldAlert,
  Clock
} from 'lucide-react';
import { AppAccessQRModal } from '../common/AppAccessQRModal';
import { CrossPlatformModal } from '../common/CrossPlatformModal';
import { detectPlatform, triggerHaptic } from '../../utils/platform';
import { evaluatePasswordStrength } from '../../utils/security';

interface LoginScreenProps {
  onRegisterClick?: () => void;
  onForgotPasswordClick?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ 
  onRegisterClick,
  onForgotPasswordClick 
}) => {
  const { login, registerUser, farmProfile, users, dbStatus, pullAllFromMongoDB } = useFarm();
  
  // Tab Mode: 'login' | 'register' | 'qr'
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'qr'>('login');
  const [showCrossPlatformModal, setShowCrossPlatformModal] = useState(false);
  const [platformInfo, setPlatformInfo] = useState(detectPlatform());
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    setPlatformInfo(detectPlatform());
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  // Login Form States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Register Form States
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('flockman');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regShowPassword, setRegShowPassword] = useState(false);
  const [regSecurityQuestion, setRegSecurityQuestion] = useState('What was your first assigned farm house?');
  const [regSecurityAnswer, setRegSecurityAnswer] = useState('');
  const [regHouses, setRegHouses] = useState<string[]>(['House 1']);
  const [regAutoActivate, setRegAutoActivate] = useState(true);
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);
  const [lockoutInfo, setLockoutInfo] = useState<{ isLocked: boolean; remainingMinutes: number }>({ isLocked: false, remainingMinutes: 0 });

  // QR Modal State
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCopied, setQrCopied] = useState(false);

  const qrContainerRef = useRef<HTMLDivElement>(null);
  const currentAppUrl = typeof window !== 'undefined' ? window.location.href.split('#')[0] : 'https://ais-pre-cupjad67n6ntomphx2p2z3-116744961637.asia-east1.run.app';

  const regStrength = evaluatePasswordStrength(regPassword);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLockoutInfo({ isLocked: false, remainingMinutes: 0 });
    setIsLoading(true);

    try {
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        await pullAllFromMongoDB();
      }
    } catch {
      // Direct pull attempt completed
    }

    try {
      const res = await login(username.trim(), password);
      setIsLoading(false);
      if (!res.success) {
        setErrorMessage(res.message);
        if (res.lockedOut) {
          setLockoutInfo({ isLocked: true, remainingMinutes: res.remainingMinutes || 15 });
        }
      } else {
        setSuccessMessage(`Authenticated successfully. Loading ${res.user?.fullName || 'dashboard'}...`);
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err?.message || 'Authentication failed. Please check credentials.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegSuccess(null);

    if (!regFullName.trim() || !regUsername.trim()) {
      setRegError('Full Name and Username are required.');
      return;
    }
    if (regPassword.length < 8) {
      setRegError('Password must be at least 8 characters long for security compliance.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegError('Passwords do not match. Please re-enter.');
      return;
    }
    if (!regSecurityAnswer.trim()) {
      setRegError('Please provide a secret security question answer for password recovery.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await registerUser({
        fullName: regFullName.trim(),
        username: regUsername.trim().toLowerCase(),
        email: regEmail.trim() || `${regUsername.trim().toLowerCase()}@lplimfarm.com`,
        contactNumber: regPhone.trim() || '+63 900 000 0000',
        role: regRole,
        password: regPassword,
        securityQuestion: regSecurityQuestion,
        securityAnswer: regSecurityAnswer.trim(),
        designatedHouses: regHouses.length > 0 ? regHouses : ['House 1']
      }, regAutoActivate);

      setIsLoading(false);
      if (!res.success) {
        setRegError(res.message);
      } else {
        setRegSuccess(res.message);
        if (!regAutoActivate) {
          setTimeout(() => {
            setActiveTab('login');
            setUsername(regUsername.trim().toLowerCase());
            setPassword(regPassword);
          }, 1500);
        }
      }
    } catch (err: any) {
      setIsLoading(false);
      setRegError(err?.message || 'Registration failed. Please try again.');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentAppUrl);
    setQrCopied(true);
    setTimeout(() => setQrCopied(false), 2000);
  };

  const handleDownloadSVG = () => {
    if (!qrContainerRef.current) return;
    const svgElement = qrContainerRef.current.querySelector('svg');
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    const downloadLink = document.createElement('a');
    downloadLink.href = svgUrl;
    downloadLink.download = `${farmProfile.name.toLowerCase().replace(/\s+/g, '_')}_qr.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(svgUrl);
  };

  const allHouses = ['House 1', 'House 2', 'House 3', 'House 4', 'House 5', 'House 6'];

  const toggleHouse = (house: string) => {
    if (regHouses.includes(house)) {
      if (regHouses.length > 1) {
        setRegHouses(regHouses.filter(h => h !== house));
      }
    } else {
      setRegHouses([...regHouses, house]);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-forest-950 via-slate-900 to-forest-900 flex flex-col justify-between text-slate-100 font-sans selection:bg-mint-400 selection:text-forest-950">
      
      {/* Top Header Bar */}
      <header className="px-4 sm:px-6 py-4 flex items-center justify-between border-b border-forest-800/40 backdrop-blur-md bg-forest-950/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-mint-400 text-forest-950 flex items-center justify-center font-black text-xl shadow-lg shadow-mint-400/20">
            FF
          </div>
          <div>
            <span className="font-black text-white text-base tracking-tight block">
              {farmProfile.name || 'FarmFlow Pro'}
            </span>
            <span className="text-[11px] text-mint-400 font-medium">
              Broiler-Breeder Management Platform
            </span>
          </div>
        </div>

        {/* Right Header Pods: Add to Home Screen, QR Code Quick Trigger & Database Status */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('medium');
              if (deferredPrompt) {
                deferredPrompt.prompt();
              } else {
                setShowCrossPlatformModal(true);
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-forest-900/90 hover:bg-forest-800 border border-mint-500/40 text-mint-400 text-xs font-bold transition shadow-xs cursor-pointer"
            title="Add FarmFlow Pro to Phone Home Screen"
          >
            {platformInfo.os === 'ios' ? (
              <Apple className="w-3.5 h-3.5 text-mint-400" />
            ) : (
              <Smartphone className="w-3.5 h-3.5 text-mint-400" />
            )}
            <span className="hidden sm:inline">Add to Home Screen</span>
            <span className="sm:hidden">Install</span>
          </button>

          <button
            type="button"
            onClick={() => setShowQRModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-mint-400/15 hover:bg-mint-400/25 border border-mint-400/30 text-mint-300 text-xs font-bold transition shadow-xs cursor-pointer"
            title="Scan QR Code for Mobile Access"
          >
            <QrCode className="w-3.5 h-3.5 text-mint-400" />
            <span className="hidden sm:inline">Mobile QR Code</span>
          </button>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-forest-900/80 border border-forest-800/80 text-xs">
            <Database className={`w-3.5 h-3.5 ${dbStatus.connected ? 'text-mint-400' : 'text-amber-400'}`} />
            <span className="text-[11px] text-slate-300 hidden md:inline">DB Engine:</span>
            <span className={`text-[11px] font-bold ${dbStatus.connected ? 'text-mint-300' : 'text-amber-300'}`}>
              {dbStatus.connected ? 'MongoDB Active' : 'MongoDB (Auto)'}
            </span>
            <span className={`w-2 h-2 rounded-full ${dbStatus.connected ? 'bg-mint-400 animate-pulse' : 'bg-amber-400'}`}></span>
          </div>
        </div>
      </header>

      {/* Main Authentication & QR Portal */}
      <main className="flex-1 flex items-center justify-center px-4 py-6 sm:py-10">
        <div className="w-full max-w-lg bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col">
          
          {/* Card Top Banner */}
          <div className="bg-gradient-to-r from-forest-950 via-slate-900 to-forest-900 p-6 text-white relative">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-forest-900/90 border border-forest-800 text-[11px] text-mint-300 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-mint-400" />
                <span>Authorized Farm Access</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                v2.6 Secure
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-3">
              {activeTab === 'login' && 'Staff Sign In'}
              {activeTab === 'register' && 'New User Registration'}
              {activeTab === 'qr' && 'Mobile QR Code Access'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              {activeTab === 'login' && 'Enter your staff credentials to access daily egg, feed, and flock records.'}
              {activeTab === 'register' && 'Register your staff profile to start logging house records.'}
              {activeTab === 'qr' && 'Scan with any smartphone camera for instant field logging in House 1-6.'}
            </p>

            {/* Navigation Tabs */}
            <div className="grid grid-cols-3 gap-1.5 mt-5 p-1 bg-forest-900/60 backdrop-blur-xs rounded-2xl border border-forest-800/80 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setErrorMessage(null);
                }}
                className={`py-2 px-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'login'
                    ? 'bg-mint-400 text-forest-950 font-black shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('register');
                  setRegError(null);
                }}
                className={`py-2 px-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'register'
                    ? 'bg-mint-400 text-forest-950 font-black shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Register</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('qr')}
                className={`py-2 px-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'qr'
                    ? 'bg-mint-400 text-forest-950 font-black shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Mobile QR</span>
              </button>
            </div>
          </div>

          {/* Quick "Add to Phone Home Screen" banner for mobile browsers */}
          {!platformInfo.isPWA && (
            <div className="bg-emerald-50/90 border-b border-emerald-200/80 px-4 py-2.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-md bg-forest-900 text-mint-400">
                  {platformInfo.os === 'ios' ? <Apple className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
                </div>
                <div className="text-[11px]">
                  <p className="font-extrabold text-forest-950">Add to Phone Home Screen</p>
                  <p className="text-forest-800 text-[10px] hidden sm:inline">Fast 1-tap mobile experience</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  if (deferredPrompt && platformInfo.os === 'android') {
                    deferredPrompt.prompt();
                  } else {
                    setShowCrossPlatformModal(true);
                  }
                }}
                className="px-2.5 py-1 bg-forest-900 hover:bg-forest-950 text-mint-300 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs shrink-0"
              >
                <Download className="w-3 h-3 text-mint-400" />
                <span>{deferredPrompt ? '1-Tap Install' : 'How to Add'}</span>
              </button>
            </div>
          )}

          {/* TAB 1: SIGN IN FORM */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="p-6 sm:p-7 space-y-4">
              {/* Account Lockout Warning Banner */}
              {lockoutInfo.isLocked && (
                <div className="p-4 bg-rose-50 border-2 border-rose-400 rounded-2xl text-xs text-rose-900 flex items-start gap-3 animate-fadeIn">
                  <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <p className="font-extrabold text-rose-950 flex items-center gap-1.5">
                      <span>Account Temporarily Locked</span>
                      <span className="px-1.5 py-0.5 rounded bg-rose-200 text-rose-900 text-[10px] font-mono">
                        {lockoutInfo.remainingMinutes}m remaining
                      </span>
                    </p>
                    <p className="text-[11px] text-rose-800 leading-relaxed">
                      For your farm data protection, this account is locked after 5 consecutive incorrect password entries. Please wait for the lockout window to expire, reset your password using your security question, or contact the System Administrator.
                    </p>
                  </div>
                </div>
              )}

              {errorMessage && !lockoutInfo.isLocked && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start gap-2.5 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold">Sign In Failed</p>
                    <p className="text-[11px] text-rose-700 mt-0.5">{errorMessage}</p>
                  </div>
                </div>
              )}

              {successMessage && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2.5 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold">{successMessage}</span>
                </div>
              )}

              {/* Username / Email Field */}
              <div className="space-y-1">
                <label htmlFor="login-username-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Username or Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="login-username-input"
                    type="text"
                    required
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username or email"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-forest-700 focus:border-transparent transition"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="login-password-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Password
                  </label>
                  {onForgotPasswordClick && (
                    <button
                      type="button"
                      onClick={onForgotPasswordClick}
                      className="text-xs text-forest-700 hover:text-forest-900 font-semibold hover:underline cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="login-password-input"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-forest-700 focus:border-transparent transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Keep Signed In Checkbox */}
              <div className="flex items-center justify-between text-xs text-slate-600 pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded-md border-slate-300 text-forest-700 focus:ring-forest-600"
                  />
                  <span className="font-medium">Keep me signed in on this device</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                id="login-submit-btn"
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-forest-900 hover:bg-forest-950 text-white font-black rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 text-sm disabled:opacity-60 cursor-pointer"
              >
                {isLoading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="w-4 h-4 text-mint-400" />
                  </>
                )}
              </button>

              {/* Switch to Register link */}
              <div className="pt-2 text-center text-xs text-slate-600">
                <span>First time on FarmFlow? </span>
                <button
                  type="button"
                  onClick={() => setActiveTab('register')}
                  className="font-bold text-forest-800 hover:text-forest-950 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Create New Staff Account</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: REGISTRATION FORM */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="p-6 sm:p-7 space-y-3.5 overflow-y-auto max-h-[60vh]">
              {regError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <p className="font-semibold">{regError}</p>
                </div>
              )}

              {regSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="font-semibold">{regSuccess}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={regFullName}
                    onChange={e => setRegFullName(e.target.value)}
                    placeholder="e.g. Maria Santos"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-forest-700 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Username *</label>
                  <input
                    type="text"
                    required
                    value={regUsername}
                    onChange={e => setRegUsername(e.target.value)}
                    placeholder="e.g. msantos"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-forest-700 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    placeholder="name@farm.com"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-forest-700 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={e => setRegPhone(e.target.value)}
                    placeholder="+63 912 345 6789"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-forest-700 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Operational Role</label>
                <select
                  value={regRole}
                  onChange={e => setRegRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-forest-700 focus:outline-hidden font-medium"
                >
                  <option value="flockman">Flockman (House Feeding, Mortality, Pen Logs)</option>
                  <option value="leadman">Leadman (House Supervisor & Grading Logs)</option>
                  <option value="egg_collector">Egg Collector (HE / NHE Grading & Sorter Logs)</option>
                  <option value="farm_manager">Farm Manager (Overall Facility & Feed Inventories)</option>
                  <option value="admin">System Administrator (Full Management Access)</option>
                </select>
              </div>

              {/* Assigned Houses */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Poultry Houses</label>
                <div className="grid grid-cols-3 gap-2">
                  {allHouses.map(house => {
                    const isSelected = regHouses.includes(house);
                    return (
                      <button
                        key={house}
                        type="button"
                        onClick={() => toggleHouse(house)}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition cursor-pointer ${
                          isSelected
                            ? 'bg-forest-900 text-mint-300 border-forest-900 shadow-2xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {house}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Password Fields & Security Meter */}
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Password * (Min 8 chars)</label>
                    <input
                      type={regShowPassword ? 'text' : 'password'}
                      required
                      value={regPassword}
                      onChange={e => setRegPassword(e.target.value)}
                      placeholder="Enter secure password"
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-forest-700 focus:outline-hidden font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Confirm Password *</label>
                    <input
                      type={regShowPassword ? 'text' : 'password'}
                      required
                      value={regConfirmPassword}
                      onChange={e => setRegConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-forest-700 focus:outline-hidden font-medium"
                    />
                  </div>
                </div>

                {/* Password Strength Meter & Policy Checklist */}
                {regPassword.length > 0 && (
                  <div className="p-3 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-2 animate-fadeIn">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-600">Password Strength:</span>
                      <span className={`font-black uppercase tracking-wider text-[11px] ${
                        regStrength.level === 'strong' ? 'text-emerald-700' :
                        regStrength.level === 'good' ? 'text-blue-700' :
                        regStrength.level === 'fair' ? 'text-amber-700' : 'text-rose-700'
                      }`}>
                        {regStrength.level} ({regStrength.score}/4)
                      </span>
                    </div>

                    {/* Visual Segmented Progress Bar */}
                    <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
                      <div className={`h-full rounded-full transition-all ${regStrength.score >= 1 ? (regStrength.level === 'weak' ? 'bg-rose-500' : regStrength.level === 'fair' ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-slate-200'}`} />
                      <div className={`h-full rounded-full transition-all ${regStrength.score >= 2 ? (regStrength.level === 'fair' ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-slate-200'}`} />
                      <div className={`h-full rounded-full transition-all ${regStrength.score >= 3 ? 'bg-blue-500' : 'bg-slate-200'}`} />
                      <div className={`h-full rounded-full transition-all ${regStrength.score >= 4 ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                    </div>

                    {/* Criteria Badges */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 text-[10px] pt-1">
                      <div className={`flex items-center gap-1 font-medium ${regStrength.checks.hasMinLength ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                        <Check className={`w-3 h-3 ${regStrength.checks.hasMinLength ? 'text-emerald-600' : 'text-slate-300'}`} />
                        <span>8+ Characters</span>
                      </div>
                      <div className={`flex items-center gap-1 font-medium ${regStrength.checks.hasUppercase && regStrength.checks.hasLowercase ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                        <Check className={`w-3 h-3 ${regStrength.checks.hasUppercase && regStrength.checks.hasLowercase ? 'text-emerald-600' : 'text-slate-300'}`} />
                        <span>Upper & Lower</span>
                      </div>
                      <div className={`flex items-center gap-1 font-medium ${regStrength.checks.hasNumber ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                        <Check className={`w-3 h-3 ${regStrength.checks.hasNumber ? 'text-emerald-600' : 'text-slate-300'}`} />
                        <span>Number (0-9)</span>
                      </div>
                      <div className={`flex items-center gap-1 font-medium ${regStrength.checks.hasSpecial ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                        <Check className={`w-3 h-3 ${regStrength.checks.hasSpecial ? 'text-emerald-600' : 'text-slate-300'}`} />
                        <span>Symbol (!@#$)</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Password Recovery Setup */}
              <div className="p-3.5 bg-forest-50/80 border border-forest-200/90 rounded-2xl space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-forest-950">
                  <KeyRound className="w-3.5 h-3.5 text-forest-700" />
                  <span>Account Security & Recovery Setup</span>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Security Question *</label>
                    <select
                      value={regSecurityQuestion}
                      onChange={e => setRegSecurityQuestion(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg outline-hidden focus:ring-1 focus:ring-forest-700"
                    >
                      <option value="What was your first assigned farm house?">What was your first assigned farm house?</option>
                      <option value="What town or city were you born in?">What town or city were you born in?</option>
                      <option value="What is your mother's maiden surname?">What is your mother's maiden surname?</option>
                      <option value="What is the name of your first poultry mentor?">What is the name of your first poultry mentor?</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Security Answer (Salted & Hashed for Recovery) *</label>
                    <input
                      type="text"
                      required
                      value={regSecurityAnswer}
                      onChange={e => setRegSecurityAnswer(e.target.value)}
                      placeholder="e.g. House 1 or San Jose"
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg outline-hidden focus:ring-1 focus:ring-forest-700 font-medium"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={regShowPassword}
                    onChange={e => setRegShowPassword(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-slate-300 text-forest-700"
                  />
                  <span>Show password</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer select-none text-xs text-forest-800 font-bold">
                  <input
                    type="checkbox"
                    checked={regAutoActivate}
                    onChange={e => setRegAutoActivate(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-slate-300 text-forest-700"
                  />
                  <span>Instant Activation & Sign In</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-forest-900 hover:bg-forest-950 text-white font-black rounded-xl shadow-md transition flex items-center justify-center gap-2 text-sm disabled:opacity-60 cursor-pointer mt-2"
              >
                {isLoading ? (
                  <span>Registering Account...</span>
                ) : (
                  <>
                    <span>Complete Registration</span>
                    <ArrowRight className="w-4 h-4 text-mint-400" />
                  </>
                )}
              </button>

              <div className="pt-2 text-center text-xs text-slate-600">
                <span>Already registered? </span>
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className="font-bold text-forest-800 hover:underline cursor-pointer"
                >
                  Return to Sign In
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: QR CODE ACCESS TAB */}
          {activeTab === 'qr' && (
            <div className="p-6 sm:p-7 space-y-4">
              <div className="flex flex-col items-center justify-center p-5 bg-gradient-to-b from-slate-50 to-slate-100/80 rounded-2xl border border-slate-200 text-center">
                <div 
                  ref={qrContainerRef}
                  className="p-4 bg-white rounded-2xl shadow-md border border-slate-200/80 inline-block mb-3"
                >
                  <QRCodeSVG
                    value={currentAppUrl}
                    size={190}
                    level="H"
                    includeMargin={false}
                  />
                </div>

                <div className="space-y-1 max-w-sm">
                  <p className="text-xs font-bold text-slate-900 flex items-center justify-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-forest-700" />
                    <span>Scan with Mobile Camera to Open App</span>
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Allows flockmen and field technicians to quickly access FarmFlow on iOS & Android phones.
                  </p>
                </div>
              </div>

              {/* Direct Access Link Box */}
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2">
                <p className="text-xs text-slate-700 font-mono truncate flex-1 pl-1">
                  {currentAppUrl}
                </p>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    qrCopied
                      ? 'bg-emerald-500 text-white'
                      : 'bg-forest-900 hover:bg-forest-950 text-white shadow-2xs'
                  }`}
                >
                  {qrCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleDownloadSVG}
                  className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer border border-slate-200"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>Download SVG</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowQRModal(true)}
                  className="px-3.5 py-2.5 bg-forest-900 hover:bg-forest-950 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5 text-mint-400" />
                  <span>Station Poster & Details</span>
                </button>
              </div>

              <div className="pt-2 text-center text-xs text-slate-600">
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className="font-bold text-forest-800 hover:underline cursor-pointer"
                >
                  ← Back to Staff Sign In
                </button>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Footer Bar */}
      <footer className="px-6 py-3 border-t border-forest-800/40 bg-forest-950/70 text-center text-[11px] text-slate-400">
        <p>© {new Date().getFullYear()} {farmProfile.name || 'FarmFlow Pro'} — Broiler-Breeder Management Platform. All records secured.</p>
      </footer>

      {/* Full QR Modal */}
      <AppAccessQRModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        defaultUrl={currentAppUrl}
      />

      {/* Cross Platform & Add to Home Screen Modal */}
      <CrossPlatformModal
        isOpen={showCrossPlatformModal}
        onClose={() => setShowCrossPlatformModal(false)}
        initialTab={platformInfo.os === 'ios' ? 'ios' : platformInfo.os === 'android' ? 'android' : 'overview'}
      />
    </div>
  );
};
