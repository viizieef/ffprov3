import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  Shield, 
  Home, 
  KeyRound, 
  Check, 
  AlertCircle, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  Sparkles,
  Lock,
  UserCheck
} from 'lucide-react';
import { UserAccount, UserRole, UserStatus, Flock } from '../../types';
import { evaluatePasswordStrength } from '../../utils/security';

const triggerHaptic = (_type?: string) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate(10);
    } catch {
      // ignore
    }
  }
};

interface StaffFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  userToEdit: UserAccount | null; // null means creating a new staff
  onSave: (data: any) => Promise<{ success: boolean; message: string }>;
  existingUsers: UserAccount[];
  flocks?: Flock[];
}

const DEFAULT_HOUSES = ['House 1', 'House 2', 'House 3', 'House 4', 'House 5', 'House 6'];

const ROLE_DESCRIPTIONS: Record<string, string> = {
  'System Administrator': 'Full system control: user roster, access controls, biosecurity audits, cycle resets & system backups.',
  'Farm Manager': 'Complete operational control: production reporting, feed inventory, medications, vaccinations, and transfers.',
  'Leadman': 'Supervisory access: house inspections, mortality reviews, egg grading and staff task verification.',
  'Flockman': 'House specialist: daily bird care, feeding logs, temperature, and mortality entry for designated houses.',
  'Egg Collector': 'Egg handling: daily collection tallies, egg grading (table/hatching/rejects), and delivery logs.'
};

const SECURITY_QUESTIONS = [
  'What is your primary farm house assignment?',
  'What is your employee / staff identification number?',
  'What is the name of the farm founder / owner?',
  'What was the breed of your first managed flock?',
  'What city or municipality was your previous farm assignment?'
];

export const StaffFormModal: React.FC<StaffFormModalProps> = ({
  isOpen,
  onClose,
  userToEdit,
  onSave,
  existingUsers,
  flocks
}) => {
  const isEdit = !!userToEdit;

  const availableHouseList = flocks && flocks.length > 0 ? flocks.map(f => f.houseNumber) : DEFAULT_HOUSES;

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [role, setRole] = useState<UserRole>('Flockman');
  const [status, setStatus] = useState<UserStatus>('active');
  const [designatedHouses, setDesignatedHouses] = useState<string[]>(['House 1', 'House 2']);
  
  // Password fields
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [securityQuestion, setSecurityQuestion] = useState(SECURITY_QUESTIONS[0]);
  const [securityAnswer, setSecurityAnswer] = useState('');

  // UI States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setSuccessMessage(null);
      if (userToEdit) {
        setFullName(userToEdit.fullName || '');
        setUsername(userToEdit.username || '');
        setEmail(userToEdit.email || '');
        setContactNumber(userToEdit.contactNumber || '');
        setRole(userToEdit.role || 'Flockman');
        setStatus(userToEdit.status || 'active');
        setDesignatedHouses(userToEdit.designatedHouses || ['House 1', 'House 2']);
        setPassword('');
        setSecurityQuestion(userToEdit.securityQuestion || SECURITY_QUESTIONS[0]);
        setSecurityAnswer(userToEdit.securityAnswer || '');
      } else {
        setFullName('');
        setUsername('');
        setEmail('');
        setContactNumber('');
        setRole('Flockman');
        setStatus('active');
        setDesignatedHouses(['House 1', 'House 2']);
        setPassword('Farm@2026!');
        setSecurityQuestion(SECURITY_QUESTIONS[0]);
        setSecurityAnswer('House 1');
      }
    }
  }, [isOpen, userToEdit]);

  if (!isOpen) return null;

  const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFullName(val);
    if (!isEdit && !username) {
      // Auto-suggest username from name (e.g. "Juan Dela Cruz" -> "juan.delacruz")
      const slug = val.toLowerCase().replace(/[^a-z0-9]/g, '.').replace(/\.+/g, '.').replace(/^\.|\.$/g, '');
      setUsername(slug);
    }
  };

  const toggleHouse = (house: string) => {
    triggerHaptic('light');
    setDesignatedHouses(prev => 
      prev.includes(house) ? prev.filter(h => h !== house) : [...prev, house]
    );
  };

  const selectAllHouses = () => {
    triggerHaptic();
    setDesignatedHouses([...availableHouseList]);
  };

  const clearHouses = () => {
    triggerHaptic();
    setDesignatedHouses([]);
  };

  const generateRandomPassword = () => {
    triggerHaptic();
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
    let res = '';
    for (let i = 0; i < 10; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(res + '9!');
    setShowPassword(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanFullName = fullName.trim();
    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim();

    if (!cleanFullName) {
      setErrorMessage('Please enter the staff member’s full name.');
      return;
    }

    if (!cleanUsername) {
      setErrorMessage('Please enter a unique username.');
      return;
    }

    // Check duplicate username against existing users (excluding self)
    const duplicate = existingUsers.some(u => 
      (!userToEdit || u.id !== userToEdit.id) && 
      u.username.toLowerCase().trim() === cleanUsername
    );
    if (duplicate) {
      setErrorMessage(`Username "@${cleanUsername}" is already in use by another staff member.`);
      return;
    }

    if (!isEdit && (!password || password.length < 8)) {
      setErrorMessage('Initial password must be at least 8 characters long.');
      return;
    }

    if (isEdit && password && password.length < 8) {
      setErrorMessage('New password must be at least 8 characters long.');
      return;
    }

    setIsSubmitting(true);
    triggerHaptic('light');

    try {
      const payload: any = {
        fullName: cleanFullName,
        username: cleanUsername,
        email: cleanEmail || `${cleanUsername}@lplimfarm.com`,
        contactNumber: contactNumber.trim(),
        role,
        status,
        designatedHouses: ['System Administrator', 'Farm Manager'].includes(role) 
          ? (designatedHouses.length > 0 ? designatedHouses : availableHouseList)
          : designatedHouses,
        securityQuestion,
        securityAnswer: securityAnswer.trim() || 'Farm Staff',
      };

      if (!isEdit) {
        payload.password = password;
      } else if (password) {
        payload.newPassword = password;
      }

      const res = await onSave(payload);

      if (res.success) {
        triggerHaptic('medium');
        setSuccessMessage(res.message);
        setTimeout(() => {
          onClose();
        }, 600);
      } else {
        setErrorMessage(res.message);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'An unexpected error occurred while saving staff profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const pwdStrength = password ? evaluatePasswordStrength(password) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-2xl overflow-hidden my-auto transition-all transform flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-forest-950 via-forest-900 to-teal-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 text-mint-300">
              {isEdit ? <UserCheck className="w-5 h-5" /> : <User className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">
                {isEdit ? `Edit Staff Profile — ${userToEdit.fullName}` : 'Add New Farm Staff Member'}
              </h2>
              <p className="text-xs text-mint-200/80">
                {isEdit ? 'Update designations, contact info, house assignments, or credentials' : 'Register and assign new personnel to poultry production & records'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Notifications */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-rose-800 text-xs animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <div className="font-medium">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-2.5 text-emerald-800 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              <div className="font-bold">{successMessage}</div>
            </div>
          )}

          {/* Section 1: Basic Identity */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
              <User className="w-3.5 h-3.5 text-forest-700" />
              <span>Personal & Contact Information</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={handleFullNameChange}
                  placeholder="e.g., Carlos Santos"
                  className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-forest-700 focus:ring-2 focus:ring-forest-700/20 outline-hidden transition"
                />
              </div>

              {/* Username */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Username <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-bold text-slate-400">@</span>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))}
                    placeholder="carlos.santos"
                    className="w-full pl-7 pr-3.5 py-2.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-forest-700 focus:ring-2 focus:ring-forest-700/20 outline-hidden transition"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 absolute inset-y-0 left-0 ml-3.5 my-auto text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="carlos@lplimfarm.com"
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-forest-700 focus:ring-2 focus:ring-forest-700/20 outline-hidden transition"
                  />
                </div>
              </div>

              {/* Contact Number */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Mobile / Contact Number
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 absolute inset-y-0 left-0 ml-3.5 my-auto text-slate-400" />
                  <input
                    type="tel"
                    value={contactNumber}
                    onChange={e => setContactNumber(e.target.value)}
                    placeholder="+63 917 123 4567"
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-forest-700 focus:ring-2 focus:ring-forest-700/20 outline-hidden transition"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Role & System Status */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
              <Shield className="w-3.5 h-3.5 text-teal-700" />
              <span>Role & Account Permissions</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Role Selection */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Assigned System Role <span className="text-rose-500">*</span>
                </label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-forest-700 focus:ring-2 focus:ring-forest-700/20 outline-hidden cursor-pointer"
                >
                  <option value="System Administrator">System Administrator (Universal Admin)</option>
                  <option value="Farm Manager">Farm Manager (Operations & Reports)</option>
                  <option value="Leadman">Leadman (House Operations Supervisor)</option>
                  <option value="Flockman">Flockman (Flock Care & Mortality)</option>
                  <option value="Egg Collector">Egg Collector (Collection & Deliveries)</option>
                </select>
                <p className="text-[11px] text-slate-500 italic mt-1 leading-relaxed">
                  {ROLE_DESCRIPTIONS[role] || 'Standard farm staff privileges'}
                </p>
              </div>

              {/* Status Selection */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Account Status <span className="text-rose-500">*</span>
                </label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as UserStatus)}
                  className="w-full px-3 py-2.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-forest-700 focus:ring-2 focus:ring-forest-700/20 outline-hidden cursor-pointer"
                >
                  <option value="active">Active (Can Sign In & Log Data)</option>
                  <option value="pending">Pending Approval (Awaiting Admin Review)</option>
                  <option value="disabled">Deactivated / Disabled (Login Suspended)</option>
                </select>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    status === 'active' || status === 'approved' ? 'bg-emerald-500 ring-2 ring-emerald-200' :
                    status === 'disabled' || status === 'rejected' ? 'bg-rose-500 ring-2 ring-rose-200' : 'bg-amber-500 ring-2 ring-amber-200'
                  }`} />
                  <span className="text-[11px] font-semibold text-slate-600 capitalize">
                    Current setting: {status === 'active' ? 'Full operational access' : status === 'disabled' ? 'Blocked access' : 'Restricted pending approval'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: House Assignments */}
          <div className="space-y-2.5 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Home className="w-3.5 h-3.5 text-forest-700" />
                  <span>Designated Poultry Houses</span>
                </label>
                <p className="text-[11px] text-slate-500">
                  Designate which poultry houses this staff member manages or enters daily records for
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={selectAllHouses}
                  className="px-2.5 py-1 text-[10px] font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg transition cursor-pointer"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={clearHouses}
                  className="px-2.5 py-1 text-[10px] font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg transition cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-1">
              {availableHouseList.map(house => {
                const isChecked = designatedHouses.includes(house);
                return (
                  <button
                    key={house}
                    type="button"
                    onClick={() => toggleHouse(house)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                      isChecked
                        ? 'bg-forest-900 border-forest-900 text-mint-300 shadow-xs ring-1 ring-forest-900'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100/70'
                    }`}
                  >
                    <span>{house}</span>
                    {isChecked && <Check className="w-3.5 h-3.5 text-mint-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 4: Password & Security */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                <span>{isEdit ? 'Password & Security (Optional Override)' : 'Initial Password & Credentials'}</span>
              </h3>
              {!isEdit && (
                <button
                  type="button"
                  onClick={generateRandomPassword}
                  className="text-[11px] font-bold text-forest-800 hover:text-forest-950 flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>Auto-Generate Strong Password</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Password Input */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  {isEdit ? 'New Password (leave blank to keep current)' : 'Account Password *'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={isEdit ? 'Leave blank to keep unchanged' : 'Min 8 chars (e.g. Farm@2026!)'}
                    className="w-full pl-3.5 pr-10 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-forest-700 focus:ring-2 focus:ring-forest-700/20 outline-hidden transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {pwdStrength && password && (
                  <div className="space-y-1 mt-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-semibold text-slate-500">Security strength:</span>
                      <span className={`font-bold ${
                        pwdStrength.level === 'strong' ? 'text-emerald-600' :
                        (pwdStrength.level === 'good' || pwdStrength.level === 'fair') ? 'text-amber-600' : 'text-rose-600'
                      }`}>
                        {pwdStrength.level.toUpperCase()}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className={`h-full transition-all duration-300 ${
                        pwdStrength.score >= 4 ? 'w-full bg-emerald-500' :
                        pwdStrength.score >= 3 ? 'w-3/4 bg-teal-500' :
                        pwdStrength.score >= 2 ? 'w-1/2 bg-amber-500' : 'w-1/4 bg-rose-500'
                      }`} />
                    </div>
                  </div>
                )}
              </div>

              {/* Security Question & Answer */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Security Question for Self-Recovery
                </label>
                <select
                  value={securityQuestion}
                  onChange={e => setSecurityQuestion(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-forest-700 outline-hidden mb-1.5 cursor-pointer"
                >
                  {SECURITY_QUESTIONS.map(q => (
                    <option key={q} value={q}>{q}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={securityAnswer}
                  onChange={e => setSecurityAnswer(e.target.value)}
                  placeholder="Recovery answer (e.g., House 1)"
                  className="w-full px-3.5 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-forest-700 outline-hidden"
                />
              </div>
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2 text-xs font-bold text-white bg-forest-900 hover:bg-forest-950 rounded-xl transition shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Saving Profile...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 text-mint-400" />
                <span>{isEdit ? 'Save Staff Changes' : 'Create Staff Member'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
