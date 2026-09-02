import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import { UserRole } from '../../types';
import { 
  X, 
  Lock, 
  User, 
  Mail, 
  Phone, 
  KeyRound, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Check, 
  ShieldAlert 
} from 'lucide-react';
import { evaluatePasswordStrength } from '../../utils/security';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister?: () => void;
  onSwitchToLogin?: () => void;
  onSwitchToForgot?: () => void;
}

export const LoginModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSwitchToRegister, onSwitchToForgot }) => {
  const { login } = useFarm();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lockoutMinutes, setLockoutMinutes] = useState(0);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLockoutMinutes(0);
    setIsLoading(true);

    try {
      const res = await login(username, password);
      setIsLoading(false);
      if (res.success) {
        setSuccessMsg(res.message);
        setTimeout(() => {
          onClose();
        }, 700);
      } else {
        setErrorMsg(res.message);
        if (res.lockedOut) {
          setLockoutMinutes(res.remainingMinutes || 15);
        }
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(err?.message || 'Login error occurred.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-graphite-950/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-graphite-200/80 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-forest-950 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-graphite-400 hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 rounded-2xl bg-mint-400 text-forest-950 flex items-center justify-center font-black text-xl mb-3 shadow-md shadow-mint-500/20">
            FF
          </div>
          <h2 className="text-xl font-bold">FarmFlow Pro Sign In</h2>
          <p className="text-xs text-mint-300 mt-1">Broiler-Breeder Farm Operations System</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {lockoutMinutes > 0 && (
            <div className="p-3 bg-rose-50 border-2 border-rose-300 text-rose-900 text-xs rounded-xl flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Account Locked ({lockoutMinutes}m remaining)</p>
                <p className="text-[11px] text-rose-800 mt-0.5">Please wait for the lockout window to expire or contact your Farm Administrator.</p>
              </div>
            </div>
          )}

          {errorMsg && lockoutMinutes === 0 && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-mint-50 border border-mint-200 text-forest-800 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-forest-700 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-graphite-700 mb-1">Username or Email</label>
            <div className="relative">
              <User className="w-4 h-4 text-graphite-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                inputMode="text"
                enterKeyHint="next"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                autoComplete="username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full pl-9 pr-3 py-2 text-sm border border-graphite-200 rounded-xl focus:border-mint-500 focus:ring-1 focus:ring-mint-500 outline-hidden transition"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-graphite-700">Password</label>
              {onSwitchToForgot && (
                <button
                  type="button"
                  onClick={onSwitchToForgot}
                  className="text-xs text-forest-700 hover:text-forest-900 font-semibold"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-graphite-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                enterKeyHint="go"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2 text-sm border border-graphite-200 rounded-xl focus:border-mint-500 focus:ring-1 focus:ring-mint-500 outline-hidden transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-graphite-400 hover:text-graphite-700"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-mint-400 hover:bg-mint-300 text-forest-950 text-sm font-extrabold rounded-xl transition shadow-xs active:scale-98 disabled:opacity-60 cursor-pointer"
          >
            {isLoading ? 'Signing In...' : 'Sign In to Dashboard'}
          </button>

          <div className="pt-2 text-center text-xs text-graphite-500">
            Don't have an account?{' '}
            {onSwitchToRegister && (
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="font-bold text-forest-700 hover:underline"
              >
                Register New User
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export const RegisterModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSwitchToLogin }) => {
  const { registerUser } = useFarm();
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [role, setRole] = useState<UserRole>('flockman');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [securityQuestion, setSecurityQuestion] = useState('What town were you born in?');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [designatedHouses, setDesignatedHouses] = useState<string[]>(['House 1']);
  const [isLoading, setIsLoading] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const regStrength = evaluatePasswordStrength(password);

  if (!isOpen) return null;

  const housesList = ['House 1', 'House 2', 'House 3', 'House 4', 'House 5', 'House 6'];

  const toggleHouse = (h: string) => {
    if (designatedHouses.includes(h)) {
      setDesignatedHouses(designatedHouses.filter(item => item !== h));
    } else {
      setDesignatedHouses([...designatedHouses, h]);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters for security compliance.');
      return;
    }

    if (!securityAnswer.trim()) {
      setErrorMsg('Please provide a security answer for account recovery.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await registerUser({
        username: username.trim(),
        fullName: fullName.trim(),
        email: email.trim(),
        contactNumber: contactNumber.trim(),
        role,
        password,
        securityQuestion,
        securityAnswer: securityAnswer.trim(),
        designatedHouses: ['admin', 'farm_manager'].includes(role) ? housesList : designatedHouses
      });

      setIsLoading(false);
      if (res.success) {
        setSuccessMsg(res.message);
        setTimeout(() => {
          if (onSwitchToLogin) onSwitchToLogin();
          else onClose();
        }, 2500);
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(err?.message || 'Registration failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-graphite-950/70 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-graphite-200/80 w-full max-w-lg overflow-hidden my-8">
        <div className="bg-forest-950 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-graphite-400 hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 text-mint-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Secure Account Registration</span>
          </div>
          <h2 className="text-xl font-bold">Register Farm Staff Account</h2>
          <p className="text-xs text-mint-300 mt-1">
            New accounts are encrypted with salted SHA-256 hashes and reviewed by the Admin.
          </p>
        </div>

        <form onSubmit={handleRegister} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-4 bg-mint-50 border border-mint-200 text-forest-900 text-xs rounded-xl flex flex-col gap-1">
              <div className="flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-4 h-4 text-forest-700 shrink-0" />
                <span>Application Submitted!</span>
              </div>
              <p>{successMsg}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-graphite-700 mb-1">Username *</label>
              <div className="relative">
                <User className="w-4 h-4 text-graphite-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="e.g. j_bautista"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-graphite-200 rounded-xl focus:border-mint-500 focus:ring-1 focus:ring-mint-500 outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-graphite-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="e.g. Joel Bautista"
                className="w-full px-3 py-2 text-sm border border-graphite-200 rounded-xl focus:border-mint-500 focus:ring-1 focus:ring-mint-500 outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-graphite-700 mb-1">Email Address *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-graphite-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="joel@lplimfarm.com"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-graphite-200 rounded-xl focus:border-mint-500 focus:ring-1 focus:ring-mint-500 outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-graphite-700 mb-1">Contact Phone</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-graphite-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={contactNumber}
                  onChange={e => setContactNumber(e.target.value)}
                  placeholder="+63 9XX XXX XXXX"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-graphite-200 rounded-xl focus:border-mint-500 focus:ring-1 focus:ring-mint-500 outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-xs font-semibold text-graphite-700 mb-1">System Role requested *</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value as UserRole)}
              className="w-full px-3 py-2 text-sm border border-graphite-200 rounded-xl focus:border-mint-500 focus:ring-1 focus:ring-mint-500 outline-hidden bg-white"
            >
              <option value="flockman">Flockman (Record Egg Production, View Flockman Module & Profile)</option>
              <option value="leadman">Leadman (Record Egg Production, Record Flockman Module, View Profile)</option>
              <option value="egg_collector">Egg Collector (Record Egg Production Only)</option>
              <option value="farm_manager">Farm Manager (Full Operations & Logging, no delete/user approval)</option>
              <option value="admin">System Administrator (Full Access & User Approvals)</option>
            </select>
          </div>

          {/* Designated Houses for Flockman/Egg Collector */}
          {!['admin', 'farm_manager'].includes(role) && (
            <div>
              <label className="block text-xs font-semibold text-graphite-700 mb-1">
                Designated House(s) Assigned:
              </label>
              <div className="flex flex-wrap gap-2">
                {housesList.map(h => (
                  <button
                    type="button"
                    key={h}
                    onClick={() => toggleHouse(h)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                      designatedHouses.includes(h)
                        ? 'bg-forest-900 text-mint-300 border-mint-400 shadow-xs'
                        : 'bg-graphite-50 text-graphite-600 border-graphite-200 hover:bg-graphite-100'
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Passwords */}
          <div className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-graphite-700 mb-1">Password * (Min 8 chars)</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-graphite-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-9 pr-10 py-2 text-sm border border-graphite-200 rounded-xl focus:border-mint-500 focus:ring-1 focus:ring-mint-500 outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-graphite-400 hover:text-graphite-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-graphite-700 mb-1">Confirm Password *</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="w-full px-3 py-2 text-sm border border-graphite-200 rounded-xl focus:border-mint-500 focus:ring-1 focus:ring-mint-500 outline-hidden"
                />
              </div>
            </div>

            {/* Strength Meter */}
            {password.length > 0 && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-semibold">Strength:</span>
                  <span className={`font-bold uppercase ${
                    regStrength.level === 'strong' ? 'text-emerald-700' :
                    regStrength.level === 'good' ? 'text-blue-700' :
                    regStrength.level === 'fair' ? 'text-amber-700' : 'text-rose-700'
                  }`}>
                    {regStrength.level}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1 h-1.5">
                  <div className={`h-full rounded-full ${regStrength.score >= 1 ? 'bg-amber-500' : 'bg-slate-200'}`} />
                  <div className={`h-full rounded-full ${regStrength.score >= 2 ? 'bg-amber-500' : 'bg-slate-200'}`} />
                  <div className={`h-full rounded-full ${regStrength.score >= 3 ? 'bg-blue-500' : 'bg-slate-200'}`} />
                  <div className={`h-full rounded-full ${regStrength.score >= 4 ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                </div>
              </div>
            )}
          </div>

          {/* Account Recovery Security Question */}
          <div className="p-3.5 bg-forest-50/70 border border-forest-200/80 rounded-2xl space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-forest-950">
              <KeyRound className="w-3.5 h-3.5 text-forest-700" />
              <span>Password Recovery Setup</span>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-graphite-600 mb-1">Security Question *</label>
              <select
                value={securityQuestion}
                onChange={e => setSecurityQuestion(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-graphite-200 rounded-lg bg-white outline-hidden focus:border-mint-500"
              >
                <option value="What town were you born in?">What town were you born in?</option>
                <option value="What was the first house you managed?">What was the first house you managed?</option>
                <option value="What is your farm experience in years?">What is your farm experience in years?</option>
                <option value="What is your mother's maiden name?">What is your mother's maiden name?</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-graphite-600 mb-1">Security Answer *</label>
              <input
                type="text"
                required
                value={securityAnswer}
                onChange={e => setSecurityAnswer(e.target.value)}
                placeholder="Your secret answer (used for recovery)"
                className="w-full px-2.5 py-1.5 text-xs border border-graphite-200 rounded-lg bg-white outline-hidden focus:border-mint-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-mint-400 hover:bg-mint-300 text-forest-950 text-sm font-black rounded-xl transition shadow-xs active:scale-98 disabled:opacity-60 cursor-pointer"
          >
            {isLoading ? 'Encrypting & Registering...' : 'Submit Account Application'}
          </button>

          <div className="text-center text-xs text-graphite-500">
            Already have an account?{' '}
            {onSwitchToLogin && (
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="font-bold text-forest-700 hover:underline"
              >
                Sign In
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export const ForgotPasswordModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSwitchToLogin }) => {
  const { recoverAccount, users } = useFarm();
  const [username, setUsername] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'err' | 'ok'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleFindUser = () => {
    const u = users.find(x => x.username.toLowerCase() === username.toLowerCase().trim());
    if (u) {
      setSecurityQuestion(u.securityQuestion);
      setMsg(null);
    } else {
      setMsg({ type: 'err', text: 'Username not found in system directory.' });
      setSecurityQuestion('');
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await recoverAccount(username, securityAnswer, newPassword);
      setIsLoading(false);
      if (res.success) {
        setMsg({ type: 'ok', text: res.message });
        setTimeout(() => {
          if (onSwitchToLogin) onSwitchToLogin();
          else onClose();
        }, 2000);
      } else {
        setMsg({ type: 'err', text: res.message });
      }
    } catch (err: any) {
      setIsLoading(false);
      setMsg({ type: 'err', text: err?.message || 'Password reset failed.' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-graphite-950/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-graphite-200/80 w-full max-w-md overflow-hidden">
        <div className="bg-forest-950 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-graphite-400 hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-bold">Account Password Recovery</h2>
          <p className="text-xs text-mint-300 mt-1">Verify your identity via your security question</p>
        </div>

        <form onSubmit={handleReset} className="p-6 space-y-4">
          {msg && (
            <div
              className={`p-3 text-xs rounded-xl flex items-center gap-2 border ${
                msg.type === 'ok'
                  ? 'bg-mint-50 border-mint-200 text-forest-900'
                  : 'bg-rose-50 border-rose-200 text-rose-700'
              }`}
            >
              {msg.type === 'ok' ? <CheckCircle2 className="w-4 h-4 text-forest-700 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{msg.text}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-graphite-700 mb-1">Enter your Username</label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="e.g. joel_bautista"
                className="flex-1 px-3 py-2 text-sm border border-graphite-200 rounded-xl focus:border-mint-500 focus:ring-1 focus:ring-mint-500 outline-hidden"
              />
              <button
                type="button"
                onClick={handleFindUser}
                className="px-3.5 py-2 bg-graphite-100 hover:bg-graphite-200 text-graphite-700 text-xs font-bold rounded-xl transition"
              >
                Find
              </button>
            </div>
          </div>

          {securityQuestion && (
            <div className="p-3.5 bg-graphite-50 border border-graphite-200/80 rounded-2xl space-y-3">
              <div>
                <p className="text-xs text-graphite-500 font-medium">Security Question:</p>
                <p className="text-xs font-semibold text-graphite-800 mt-0.5">{securityQuestion}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-graphite-700 mb-1">Security Answer *</label>
                <input
                  type="text"
                  required
                  value={securityAnswer}
                  onChange={e => setSecurityAnswer(e.target.value)}
                  placeholder="Enter your security answer"
                  className="w-full px-3 py-2 text-xs border border-graphite-200 rounded-xl outline-hidden bg-white focus:border-mint-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-graphite-700 mb-1">New Password *</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full px-3 py-2 text-xs border border-graphite-200 rounded-xl outline-hidden bg-white focus:border-mint-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-mint-400 hover:bg-mint-300 text-forest-950 text-xs font-black rounded-xl transition shadow-xs"
              >
                Verify & Reset Password
              </button>
            </div>
          )}

          <div className="text-center text-xs text-graphite-500">
            Remembered your password?{' '}
            {onSwitchToLogin && (
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="font-bold text-forest-700 hover:underline"
              >
                Back to Sign In
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export interface UnifiedAuthModalsProps {
  mode: 'login' | 'register' | 'forgot' | null;
  onClose: () => void;
  onSwitchMode: (mode: 'login' | 'register' | 'forgot' | null) => void;
}

export const AuthModals: React.FC<UnifiedAuthModalsProps> = ({ mode, onClose, onSwitchMode }) => {
  if (!mode) return null;

  return (
    <>
      <LoginModal
        isOpen={mode === 'login'}
        onClose={onClose}
        onSwitchToRegister={() => onSwitchMode('register')}
        onSwitchToForgot={() => onSwitchMode('forgot')}
      />
      <RegisterModal
        isOpen={mode === 'register'}
        onClose={onClose}
        onSwitchToLogin={() => onSwitchMode('login')}
      />
      <ForgotPasswordModal
        isOpen={mode === 'forgot'}
        onClose={onClose}
        onSwitchToLogin={() => onSwitchMode('login')}
      />
    </>
  );
};

