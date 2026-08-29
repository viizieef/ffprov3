import React, { useState, useEffect } from 'react';
import { FarmProvider, useFarm } from './context/FarmContext';
import { ModuleType, UserRole } from './types';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { NotificationDrawer } from './components/layout/NotificationDrawer';
import { AuthModals } from './components/auth/AuthModals';
import { LoginScreen } from './components/auth/LoginScreen';
import { MessengerReportQuickModal } from './components/layout/MessengerReportQuickModal';
import { CommandPalette } from './components/common/CommandPalette';
import { KeyboardShortcutsModal } from './components/common/KeyboardShortcutsModal';
import { CrossPlatformModal } from './components/common/CrossPlatformModal';
import { MobileInstallBanner } from './components/common/MobileInstallBanner';
import { ToastProvider, useToast } from './components/common/ToastContainer';
import { detectPlatform, triggerHaptic } from './utils/platform';

// Views
import { FarmDashboardOverview } from './components/dashboard/FarmDashboardOverview';
import { FarmProfileView } from './components/farmProfile/FarmProfileView';
import { FeedInventoryView } from './components/feed/FeedInventoryView';
import { FlockListView } from './components/flock/FlockListView';
import { FlockmanModuleView } from './components/flockman/FlockmanModuleView';
import { MortalityManagementView } from './components/mortality/MortalityManagementView';
import { MedicineVaccineView } from './components/medicine/MedicineVaccineView';
import { BodyWeightView } from './components/bodyWeight/BodyWeightView';
import { EggProductionView } from './components/eggProduction/EggProductionView';
import { DeliveryView } from './components/delivery/DeliveryView';
import { DynamicReportsView } from './components/reports/DynamicReportsView';
import { SettingsView } from './components/settings/SettingsView';
import { RoleBadge } from './components/common/RoleBadge';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Shield, Sparkles, UserCheck, AlertCircle } from 'lucide-react';

const FarmAppContent: React.FC = () => {
  const { currentUser, switchUserRole, permissions, users } = useFarm();
  const [activeModule, setActiveModule] = useState<ModuleType>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'forgot' | null>(null);
  const [isMessengerReportOpen, setIsMessengerReportOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isCrossPlatformOpen, setIsCrossPlatformOpen] = useState(false);

  // Global UX Keyboard Shortcuts for PC Desktop and Tablet users
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger hotkeys if typing in input/textarea/select
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable) {
        return;
      }

      // Cmd+K or Ctrl+K -> Command Palette
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        return;
      }

      // '?' -> Keyboard Shortcuts Modal
      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
        return;
      }

      // Single Key Navigations when no modal is open
      if (!isCommandPaletteOpen && !isShortcutsOpen && !isMessengerReportOpen && !isNotificationOpen && !isCrossPlatformOpen) {
        if (e.key === 'd' || e.key === 'D') {
          setActiveModule('dashboard');
        } else if (e.key === 'e' || e.key === 'E') {
          setActiveModule('egg_production');
        } else if (e.key === 'm' || e.key === 'M') {
          setIsMessengerReportOpen(true);
        } else if (e.key === 'r' || e.key === 'R') {
          setActiveModule('reports');
        } else if (e.key === 'f' || e.key === 'F') {
          setActiveModule('feed_inventory');
        } else if (e.key === 'v' || e.key === 'V') {
          setActiveModule('medicine');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, isShortcutsOpen, isMessengerReportOpen, isNotificationOpen, isCrossPlatformOpen]);

  // If no user is logged in, present full-page LoginScreen
  if (!currentUser) {
    return (
      <>
        <LoginScreen
          onRegisterClick={() => setAuthModalMode('register')}
          onForgotPasswordClick={() => setAuthModalMode('forgot')}
        />
        <AuthModals
          mode={authModalMode}
          onClose={() => setAuthModalMode(null)}
          onSwitchMode={setAuthModalMode}
        />
      </>
    );
  }

  // If user is pending approval or disabled
  const isPendingApproval = currentUser.status === 'pending';
  const isDisabled = currentUser.status === 'disabled';

  return (
    <div className="min-h-screen bg-graphite-50 flex flex-col font-sans text-graphite-900 antialiased selection:bg-mint-400 selection:text-forest-950">
      {/* Top Demo Helper Bar: Sleek Fast Role Switching (Hidden during printing) */}
      <div className="bg-forest-950/95 backdrop-blur-md text-graphite-300 border-b border-forest-900/60 text-xs py-1 px-4 sm:px-6 flex flex-wrap items-center justify-between gap-2 shrink-0 z-50 print:hidden">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-mint-400 animate-pulse" />
          <span className="text-mint-400 font-semibold text-[11px] uppercase tracking-wider">Active Role:</span>
          <span className="font-bold text-white flex items-center gap-1.5 text-xs">
            {currentUser && <RoleBadge role={currentUser.role} size="sm" />}
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          <span className="text-[10px] text-mint-400/80 font-bold uppercase tracking-wider hidden md:inline">Quick Switch:</span>
          {(['System Administrator', 'Farm Manager', 'Flockman', 'Leadman', 'Egg Collector'] as UserRole[]).map((role) => (
            <button
              key={role}
              onClick={() => switchUserRole(role)}
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-all duration-200 whitespace-nowrap cursor-pointer ${
                currentUser?.role === role
                  ? 'bg-mint-400 text-forest-950 font-bold shadow-sm shadow-mint-400/30'
                  : 'bg-forest-900/60 hover:bg-forest-900 text-graphite-200 hover:text-white border border-forest-800/80'
              }`}
            >
              {role.replace('System ', '')}
            </button>
          ))}
        </div>
      </div>

      {/* Main App Navigation Bar */}
      <Navbar
        currentModule={activeModule}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onOpenNotifications={() => setIsNotificationOpen(true)}
        onOpenReport={() => setIsMessengerReportOpen(true)}
        onNavigate={setActiveModule}
        onOpenLogin={() => setAuthModalMode('login')}
        onOpenRegister={() => setAuthModalMode('register')}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
      />

      <div className="flex flex-1 overflow-hidden relative print:overflow-visible print:h-auto print:block">
        {/* Sidebar Navigation */}
        <Sidebar
          currentModule={activeModule}
          onSelectModule={(mod) => {
            setActiveModule(mod as ModuleType);
            setIsSidebarOpen(false);
          }}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onOpenReport={() => setIsMessengerReportOpen(true)}
        />

        {/* Main Content Area (With bottom padding on mobile for MobileBottomNav) */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 max-w-7xl mx-auto w-full print:p-0 print:m-0 print:max-w-none print:overflow-visible print:w-full">
          {isPendingApproval ? (
            <div className="max-w-md mx-auto my-12 bg-white rounded-3xl p-8 border border-amber-200 shadow-lg text-center space-y-4 animate-fadeIn">
              <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Account Pending Administrator Approval</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Your registration was submitted successfully. Per farm biosecurity and compliance protocol, a <strong>System Administrator</strong> must approve your account before access is granted.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => switchUserRole('System Administrator')}
                  className="px-4 py-2 bg-forest-800 hover:bg-forest-900 text-mint-300 rounded-xl text-xs font-bold transition shadow-xs border border-forest-700"
                >
                  Switch to Administrator to Approve
                </button>
              </div>
            </div>
          ) : isDisabled ? (
            <div className="max-w-md mx-auto my-12 bg-white rounded-3xl p-8 border border-rose-200 shadow-lg text-center space-y-4 animate-fadeIn">
              <div className="w-14 h-14 bg-rose-100 text-rose-700 rounded-2xl flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-rose-950">Account Deactivated</h2>
              <p className="text-xs text-slate-600">
                This account has been disabled by the farm administrator. Please contact system management.
              </p>
            </div>
          ) : (
            <ErrorBoundary key={activeModule} fallbackTitle="Farm Module Render Error" onReset={() => setActiveModule('dashboard')}>
              {activeModule === 'dashboard' && (
                <FarmDashboardOverview 
                  onNavigate={setActiveModule} 
                  onOpenMessengerReport={() => setIsMessengerReportOpen(true)} 
                />
              )}
              {activeModule === 'farm_profile' && <FarmProfileView />}
              {activeModule === 'feed_inventory' && <FeedInventoryView />}
              {(activeModule === 'flock_list' || (activeModule as string) === 'flock') && <FlockListView />}
              {(activeModule === 'flockman_module' || (activeModule as string) === 'flockman') && <FlockmanModuleView />}
              {activeModule === 'mortality' && <MortalityManagementView />}
              {activeModule === 'medicine' && <MedicineVaccineView />}
              {activeModule === 'body_weight' && <BodyWeightView />}
              {activeModule === 'egg_production' && <EggProductionView />}
              {activeModule === 'delivery' && <DeliveryView />}
              {activeModule === 'reports' && <DynamicReportsView />}
              {activeModule === 'settings' && <SettingsView />}
            </ErrorBoundary>
          )}
        </main>
      </div>

      {/* Mobile Native Bottom Navigation Bar for Android & iOS */}
      <MobileBottomNav
        currentModule={activeModule}
        onNavigate={setActiveModule}
        onOpenMenu={() => setIsSidebarOpen(true)}
      />

      {/* Global Modals, Drawers & Palettes */}
      <NotificationDrawer
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        onNavigate={(mod) => setActiveModule(mod as ModuleType)}
      />

      <MessengerReportQuickModal
        isOpen={isMessengerReportOpen}
        onClose={() => setIsMessengerReportOpen(false)}
      />

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={(mod) => setActiveModule(mod as ModuleType)}
        onOpenMessengerReport={() => setIsMessengerReportOpen(true)}
      />

      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      <CrossPlatformModal
        isOpen={isCrossPlatformOpen}
        onClose={() => setIsCrossPlatformOpen(false)}
      />

      <AuthModals
        mode={authModalMode}
        onClose={() => setAuthModalMode(null)}
        onSwitchMode={setAuthModalMode}
      />

      {/* Mobile Add to Home Screen Floating Smart Banner */}
      <MobileInstallBanner />
    </div>
  );
};

export default function App() {
  return (
    <FarmProvider>
      <ToastProvider>
        <FarmAppContent />
      </ToastProvider>
    </FarmProvider>
  );
}

