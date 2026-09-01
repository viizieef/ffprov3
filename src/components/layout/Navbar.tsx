import React, { useState, useEffect } from 'react';
import { useFarm } from '../../context/FarmContext';
import { RoleBadge } from '../common/RoleBadge';
import { MongoStatusModal } from '../common/MongoStatusModal';
import { PWAInstallPrompt } from '../common/PWAInstallPrompt';
import { AppAccessQRModal } from '../common/AppAccessQRModal';
import { 
  Bell, 
  FileSpreadsheet, 
  LogOut, 
  LogIn, 
  UserCheck, 
  Menu,
  Sparkles,
  ChevronDown,
  Database,
  Share2,
  Egg,
  Plus,
  Search,
  Keyboard,
  HelpCircle,
  QrCode
} from 'lucide-react';

interface NavbarProps {
  onOpenReport: () => void;
  onOpenNotifications: () => void;
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onToggleSidebar: () => void;
  onNavigate?: (moduleId: any) => void;
  currentModule: string;
  onOpenCommandPalette?: () => void;
  onOpenShortcuts?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenReport,
  onOpenNotifications,
  onOpenLogin,
  onOpenRegister,
  onToggleSidebar,
  onNavigate,
  currentModule,
  onOpenCommandPalette,
  onOpenShortcuts
}) => {
  const { 
    currentUser, 
    users, 
    switchUser, 
    logout, 
    farmProfile, 
    getLowStockAlerts, 
    getUpcomingVaccines,
    dbStatus,
    permissions
  } = useFarm();

  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showMongoModal, setShowMongoModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);

  const lowFeeds = getLowStockAlerts();
  const upcomingVaccines = getUpcomingVaccines();
  const pendingUsers = users.filter(u => u.status === 'pending');
  const alertCount = lowFeeds.length + upcomingVaccines.length + (currentUser?.role === 'admin' ? pendingUsers.length : 0);

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <header className="h-16 bg-white/90 backdrop-blur-md border-b border-graphite-200/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between shrink-0 sticky top-0 z-40 shadow-xs print:hidden">
      {/* Left: Mobile Toggle & System Label */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          id="toggle-sidebar-btn"
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl text-graphite-600 hover:bg-graphite-100 hover:text-graphite-900 transition-colors"
          aria-label="Toggle navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/50 hidden sm:block" />
          <span className="text-xs font-bold text-graphite-900 uppercase tracking-wider font-display hidden md:inline">
            FarmFlow Pro &bull; Broiler-Breeder OS
          </span>
          <span className="text-xs font-bold text-graphite-900 uppercase tracking-wider font-display md:hidden">
            FarmFlow Pro
          </span>
        </div>

        {/* Global Quick Search Button (Ctrl+K) */}
        {onOpenCommandPalette && (
          <button
            id="navbar-quick-search-btn"
            onClick={onOpenCommandPalette}
            className="hidden xl:flex items-center gap-2 px-3.5 py-1.5 bg-graphite-50/80 hover:bg-graphite-100/80 text-graphite-600 rounded-xl text-xs font-medium border border-graphite-200/80 transition-all shadow-2xs group cursor-pointer"
            title="Search anything or jump to houses (Ctrl + K)"
          >
            <Search className="w-3.5 h-3.5 text-graphite-400 group-hover:text-forest-700 transition-colors" />
            <span>Search houses, modules, actions...</span>
            <kbd className="px-1.5 py-0.5 bg-white rounded-md text-[10px] font-mono font-bold text-graphite-500 border border-graphite-200 shadow-2xs">
              Ctrl+K
            </kbd>
          </button>
        )}
      </div>

      {/* Right: Date Badge, Alerts, Report, User */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Live Date Badge */}
        <div className="hidden sm:flex items-center px-3 py-1 bg-forest-50 text-forest-900 text-xs font-semibold rounded-full border border-forest-200/80">
          <span className="mr-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>{todayFormatted}</span>
        </div>

        {/* Universal PWA Install Button */}
        <PWAInstallPrompt />

        {/* Live Database Status Button */}
        <button
          id="navbar-mongo-sync-btn"
          onClick={() => setShowMongoModal(true)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-950 hover:bg-emerald-100 border border-emerald-300 shadow-2xs transition cursor-pointer"
          title="Central Database Connected - Synchronized across all accounts and devices"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
          </span>
          <Database className="w-3.5 h-3.5 text-emerald-700" />
          <span className="hidden xl:inline text-[11px] font-bold">Cloud DB</span>
        </button>

        {/* Action Pod 1: Dynamic Reports Hub */}
        {onNavigate && (
          <button
            id="navbar-dynamic-reports-btn"
            onClick={() => onNavigate('reports')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs border cursor-pointer ${
              currentModule === 'reports'
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 ring-2 ring-emerald-300'
                : 'bg-emerald-50/80 hover:bg-emerald-100/80 text-emerald-950 border-emerald-200'
            }`}
            title="Dynamic Reports (Egg Production, Mortality, Vaccines, Meds) - Print & Export Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            <span className="hidden sm:inline">Dynamic Reports</span>
          </button>
        )}

        <div className="w-px h-5 bg-graphite-200 hidden sm:block" />

        {/* Action Pod 2: Messenger Daily Report */}
        <button
          id="navbar-messenger-report-btn"
          onClick={onOpenReport}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-forest-950 hover:bg-forest-900 active:scale-95 text-mint-300 border border-forest-800 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
          title="Generate Daily Egg & Flock Summary for Messenger/WhatsApp"
        >
          <Share2 className="w-3.5 h-3.5 text-mint-400" />
          <span className="hidden md:inline">Messenger Report</span>
        </button>

        {/* Action Pod 3: Log Egg Production Shortcut */}
        {onNavigate && permissions?.canRecordEggProduction && permissions.canRecordEggProduction() && (
          <>
            <div className="w-px h-5 bg-graphite-200 hidden lg:block" />
            <button
              id="navbar-log-egg-btn"
              onClick={() => onNavigate('egg_production')}
              className={`hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs border cursor-pointer ${
                currentModule === 'egg_production'
                  ? 'bg-forest-800 text-white border-forest-900 ring-2 ring-emerald-300'
                  : 'bg-mint-50/80 hover:bg-mint-100 text-forest-900 border-mint-200'
              }`}
              title="Record Daily Egg Grading & Lay Rate"
            >
              <Plus className="w-3.5 h-3.5 text-forest-700" />
              <span>Log Egg</span>
            </button>
          </>
        )}

        {/* Keyboard Shortcuts Trigger */}
        {onOpenShortcuts && (
          <button
            id="navbar-shortcuts-btn"
            onClick={onOpenShortcuts}
            className="p-2 text-graphite-500 hover:text-graphite-800 hover:bg-graphite-100 rounded-xl transition hidden sm:flex items-center justify-center"
            title="Keyboard Shortcuts Cheat Sheet ( ? )"
            aria-label="Keyboard Shortcuts"
          >
            <Keyboard className="w-4 h-4" />
          </button>
        )}

        {/* QR Code Quick Access Button */}
        <button
          id="navbar-qr-access-btn"
          onClick={() => setShowQRModal(true)}
          className="p-2 text-graphite-600 hover:text-forest-900 hover:bg-forest-50 rounded-xl transition flex items-center justify-center cursor-pointer"
          title="Scan QR Code for Mobile Access / Print Badge"
          aria-label="App QR Code Access"
        >
          <QrCode className="w-4 h-4 text-forest-700" />
        </button>

        {/* Notification Bell */}
        <button
          id="navbar-notifications-btn"
          onClick={onOpenNotifications}
          className="relative p-2 text-graphite-500 hover:text-graphite-800 hover:bg-graphite-100 rounded-xl transition"
          title="Operational Alerts"
        >
          <Bell className="w-5 h-5" />
          {alertCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white animate-pulse">
              {alertCount}
            </span>
          )}
        </button>

        <div className="w-px h-6 bg-graphite-200 hidden sm:block" />

        {/* Active User Switcher / Profile */}
        {currentUser ? (
          <div className="relative">
            <button
              id="user-profile-menu-btn"
              onClick={() => setShowRoleDropdown(!showRoleDropdown)}
              className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 bg-graphite-50/90 hover:bg-graphite-100/90 border border-graphite-200/80 rounded-2xl transition-all shadow-2xs cursor-pointer"
            >
              <div className="w-7 h-7 rounded-xl bg-forest-950 text-mint-300 flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                {currentUser.username ? currentUser.username.substring(0, 2).toUpperCase() : 'U'}
              </div>
              <div className="text-left hidden md:block">
                <p className="text-xs font-bold text-graphite-900 leading-tight truncate max-w-[120px]">
                  {currentUser.fullName}
                </p>
                <div className="mt-0.5">
                  <RoleBadge role={currentUser.role} size="sm" showIcon={false} />
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-graphite-400" />
            </button>

            {/* Dropdown Menu for fast Role Switching / Logouts */}
            {showRoleDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowRoleDropdown(false)} 
                />
                <div className="absolute right-0 mt-2 w-72 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-graphite-200/80 py-2 z-50 animate-fadeIn">
                  <div className="px-4 py-3 border-b border-graphite-100 bg-graphite-50/50 rounded-t-2xl">
                    <p className="text-[10px] font-extrabold text-forest-800 uppercase tracking-widest">Active Account</p>
                    <p className="font-bold text-graphite-900 text-sm mt-0.5">{currentUser.fullName}</p>
                    <p className="text-xs text-graphite-500">{currentUser.email}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {currentUser.designatedHouses?.map(h => (
                        <span key={h} className="text-[10px] bg-forest-50 text-forest-900 border border-forest-200/80 px-2 py-0.5 rounded-lg font-semibold">
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="px-4 py-2.5 border-b border-graphite-100">
                    <p className="text-[10px] font-bold text-graphite-500 uppercase tracking-wider flex items-center gap-1">
                      <UserCheck className="w-3 h-3 text-forest-700" />
                      <span>Switch Role (Simulation)</span>
                    </p>
                    <div className="mt-2 space-y-1 max-h-48 overflow-y-auto pr-1">
                      {users
                        .filter(u => u.status === 'active')
                        .map(u => (
                          <button
                            key={u.id}
                            onClick={() => {
                              switchUser(u.id);
                              setShowRoleDropdown(false);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition-all cursor-pointer ${
                              u.id === currentUser.id 
                                ? 'bg-forest-50 text-forest-950 font-bold border border-mint-400/60' 
                                : 'text-graphite-700 hover:bg-graphite-50'
                            }`}
                          >
                            <div className="truncate">
                              <p className="truncate font-semibold">{u.fullName}</p>
                              <p className="text-[10px] text-graphite-400 capitalize">{u.role.replace('_', ' ')}</p>
                            </div>
                            {u.id === currentUser.id && (
                              <Sparkles className="w-3.5 h-3.5 text-mint-600 shrink-0" />
                            )}
                          </button>
                        ))}
                    </div>
                  </div>

                  <div className="px-2 pt-1.5">
                    <button
                      onClick={() => {
                        logout();
                        setShowRoleDropdown(false);
                      }}
                      className="w-full px-3 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl flex items-center gap-2 transition cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenLogin}
              className="px-3 py-1.5 text-xs font-semibold text-graphite-700 hover:bg-graphite-100 rounded-xl transition cursor-pointer flex items-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Log In</span>
            </button>
            <button
              onClick={onOpenRegister}
              className="px-3.5 py-1.5 text-xs font-bold bg-forest-950 hover:bg-forest-900 text-mint-300 border border-forest-800 rounded-xl transition shadow-xs cursor-pointer"
            >
              Register
            </button>
          </div>
        )}
      </div>

      <MongoStatusModal
        isOpen={showMongoModal}
        onClose={() => setShowMongoModal(false)}
      />

      <AppAccessQRModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
      />
    </header>
  );
};
