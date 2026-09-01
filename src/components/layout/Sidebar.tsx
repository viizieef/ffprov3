import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import { AppAccessQRModal } from '../common/AppAccessQRModal';
import { CrossPlatformModal } from '../common/CrossPlatformModal';
import { 
  Building2, 
  Wheat, 
  Bird, 
  Grid2X2, 
  Skull, 
  Syringe, 
  Scale, 
  Egg, 
  Settings, 
  ShieldAlert, 
  FileSpreadsheet,
  LayoutDashboard,
  LogOut,
  QrCode,
  Smartphone,
  Truck,
  X
} from 'lucide-react';

interface SidebarProps {
  currentModule: string;
  onSelectModule: (moduleId: string) => void;
  isOpen: boolean;
  onClose: () => void;
  onOpenReport: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentModule,
  onSelectModule,
  isOpen,
  onClose,
  onOpenReport
}) => {
  const { currentUser, permissions, getLowStockAlerts, getUpcomingVaccines, users, farmProfile, logout } = useFarm();
  const [showQRModal, setShowQRModal] = useState(false);
  const [showCrossPlatformModal, setShowCrossPlatformModal] = useState(false);

  const lowFeeds = getLowStockAlerts();
  const upcomingVaccines = getUpcomingVaccines();
  const pendingUsers = users.filter(u => u.status === 'pending');

  const managementItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      sublabel: 'Operations Overview',
      icon: LayoutDashboard,
      visible: true,
      badge: null
    },
    {
      id: 'flock_list',
      label: 'Flock Profile',
      sublabel: 'Houses, Breed, Livability',
      icon: Bird,
      visible: permissions.canViewModule('flock_list') || permissions.canViewModule('flock'),
      badge: null
    },
    {
      id: 'feed_inventory',
      label: 'Feed Inventory',
      sublabel: 'CSC, CGC, BLC, BMCC Stocks',
      icon: Wheat,
      visible: permissions.canViewModule('feed_inventory'),
      badge: lowFeeds.length > 0 ? `${lowFeeds.length} Low` : null,
      badgeColor: 'bg-rose-500 text-white'
    },
    {
      id: 'mortality',
      label: 'Mortality Log',
      sublabel: 'Culls, Missex, Depletions',
      icon: Skull,
      visible: permissions.canViewModule('mortality'),
      badge: null
    }
  ];

  const productionItems = [
    {
      id: 'egg_production',
      label: 'Egg Production',
      sublabel: 'HE, NHE, Daily Logs & Messenger',
      icon: Egg,
      visible: permissions.canViewModule('egg_production'),
      badge: null
    },
    {
      id: 'delivery',
      label: 'Egg Delivery & Hatching',
      sublabel: 'ESRRR & Hatching Summary',
      icon: Truck,
      visible: permissions.canViewModule('delivery'),
      badge: 'ESRRR',
      badgeColor: 'bg-emerald-600 text-white font-extrabold'
    },
    {
      id: 'flockman_module',
      label: 'Flockman\'s Module',
      sublabel: 'Side & Pen Feed / Depletion',
      icon: Grid2X2,
      visible: permissions.canViewModule('flockman_module') || permissions.canViewModule('flockman'),
      badge: null
    },
    {
      id: 'body_weight',
      label: 'Body Weight Log',
      sublabel: 'Weekly Weights & Growth Curve',
      icon: Scale,
      visible: permissions.canViewModule('body_weight'),
      badge: null
    },
    {
      id: 'medicine',
      label: 'Vaccine Schedule',
      sublabel: 'Health Logs & Schedule Alert',
      icon: Syringe,
      visible: permissions.canViewModule('medicine'),
      badge: upcomingVaccines.length > 0 ? `${upcomingVaccines.length} Due` : null,
      badgeColor: 'bg-amber-500 text-slate-950 font-bold'
    }
  ];

  const reportingItems = [
    {
      id: 'reports',
      label: 'Dynamic Reports Hub',
      sublabel: 'Print & Export Excel (Eggs, Mort, Meds)',
      icon: FileSpreadsheet,
      visible: permissions.canViewModule('reports'),
      badge: 'Excel / Print',
      badgeColor: 'bg-emerald-500 text-white font-black'
    }
  ];

  const systemItems = [
    {
      id: 'farm_profile',
      label: 'Farm Profile & Standards',
      sublabel: 'Vaccine, Feed & Henday Standard',
      icon: Building2,
      visible: permissions.canViewModule('farm_profile'),
      badge: null
    },
    {
      id: 'settings',
      label: 'Settings & Audit Logs',
      sublabel: 'User Access, Approvals & Logs',
      icon: Settings,
      visible: permissions.canViewModule('settings'),
      badge: currentUser?.role === 'admin' && pendingUsers.length > 0 ? `${pendingUsers.length} New` : null,
      badgeColor: 'bg-teal-400 text-teal-950 font-bold'
    }
  ];

  const renderNavGroup = (title: string, items: typeof managementItems) => {
    const visibleGroup = items.filter(i => i.visible);
    if (visibleGroup.length === 0) return null;

    return (
      <div className="mb-5">
        <div className="px-5 mb-1.5 text-[10px] font-extrabold text-mint-400 uppercase tracking-widest">
          {title}
        </div>
        <div className="space-y-1 px-2.5">
          {visibleGroup.map(item => {
            const Icon = item.icon;
            const isActive = currentModule === item.id;

            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => {
                  onSelectModule(item.id);
                  onClose();
                }}
                className={`w-full text-left flex items-center justify-between px-3.5 py-2 rounded-xl transition-all duration-150 group cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-500/5 text-mint-300 font-bold border-l-2 border-emerald-400 shadow-2xs'
                    : 'text-graphite-300 hover:bg-forest-900/70 hover:text-white font-medium'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-1.5 rounded-lg transition-colors ${
                    isActive ? 'bg-emerald-500/20 text-mint-300' : 'text-mint-400/70 group-hover:text-mint-300 group-hover:bg-forest-900'
                  }`}>
                    <Icon className="w-4 h-4 shrink-0" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs truncate block">{item.label}</span>
                  </div>
                </div>

                {item.badge && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 shadow-2xs ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-graphite-950/75 z-50 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-72 sm:w-80 lg:w-64 max-w-[85vw] bg-forest-950 text-white flex flex-col shrink-0 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } border-r border-forest-900/80 shadow-2xl lg:shadow-none select-none print:hidden`}
      >
        {/* Farm Brand Header */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-forest-900/70 bg-forest-950/90 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {farmProfile.logoUrl ? (
              <div className="w-10 h-10 rounded-2xl overflow-hidden bg-white/95 p-0.5 shadow-md shadow-black/20 shrink-0 border border-forest-800 flex items-center justify-center">
                <img
                  src={farmProfile.logoUrl}
                  alt={farmProfile.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain rounded-xl"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-mint-400 to-emerald-500 text-forest-950 rounded-2xl flex items-center justify-center font-black text-lg italic shadow-md shadow-emerald-500/20 shrink-0">
                FF
              </div>
            )}
            <div className="leading-tight min-w-0">
              <h1 className="font-bold text-sm text-white tracking-tight truncate font-display">
                FarmFlow Pro
              </h1>
              <p className="text-[10px] text-mint-400 uppercase tracking-wider font-bold truncate">
                {farmProfile.name.split(' ')[0] || 'L.P. LIM'} Operations
              </p>
            </div>
          </div>

          {/* Close drawer button (Mobile only) */}
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-xl text-mint-400 hover:text-white hover:bg-forest-900/80 transition-colors cursor-pointer"
            aria-label="Close menu drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Assigned Houses Indicator */}
        {currentUser && (
          <div className="px-4 sm:px-5 py-2 bg-forest-900/30 border-b border-forest-900/60 text-[11px] flex items-center justify-between shrink-0">
            <span className="text-mint-400/80 font-medium">Assigned Scope:</span>
            <span className="font-bold text-mint-100 truncate ml-2">
              {currentUser.role === 'admin' || currentUser.role === 'farm_manager' || currentUser.role === 'System Administrator' || currentUser.role === 'Farm Manager'
                ? 'All Houses (1-6)' 
                : currentUser.designatedHouses.join(', ')}
            </span>
          </div>
        )}

        {/* Navigation Groups */}
        <nav className="flex-1 py-3 overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-forest-900">
          {renderNavGroup('Management', managementItems)}
          {renderNavGroup('Production', productionItems)}
          {renderNavGroup('Reports & Analytics', reportingItems)}
          {renderNavGroup('System & Compliance', systemItems)}

          {/* Quick Action: Messenger Report */}
          <div className="px-4 sm:px-5 pt-2 pb-4">
            <button
              onClick={() => {
                onOpenReport();
                onClose();
              }}
              className="w-full py-2.5 bg-gradient-to-r from-mint-400 to-emerald-400 hover:from-mint-300 hover:to-emerald-300 active:scale-98 text-forest-950 rounded-xl text-[11px] font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-mint-400/20 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Messenger Report</span>
            </button>
          </div>
        </nav>

        {/* User Card & Action Controls in Drawer Footer */}
        <div className="p-3 pb-6 lg:pb-3 space-y-2 bg-forest-950/95 border-t border-forest-900/60 shrink-0 pb-[max(1.25rem,env(safe-area-inset-bottom,0px))]">
          <div className="flex items-center gap-2.5 p-2.5 bg-forest-900/40 rounded-xl border border-forest-900/80">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-mint-400 to-emerald-500 text-forest-950 flex items-center justify-center text-xs font-black uppercase shrink-0 shadow-xs">
              {currentUser?.username ? currentUser.username.substring(0, 2).toUpperCase() : 'SA'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">
                {currentUser?.fullName || 'Admin User'}
              </p>
              <p className="text-[10px] text-mint-400 truncate uppercase font-semibold">
                {currentUser?.role ? currentUser.role.replace('_', ' ') : 'Systems Administrator'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setShowCrossPlatformModal(true);
              }}
              className="py-2 px-2 bg-forest-900/80 hover:bg-forest-800 text-mint-300 border border-forest-800/80 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
              title="Add FarmFlow to Phone Home Screen"
            >
              <Smartphone className="w-3.5 h-3.5 text-mint-400" />
              <span>Add App</span>
            </button>
            <button
              onClick={() => setShowQRModal(true)}
              className="py-2 px-2 bg-forest-900/60 hover:bg-forest-800 text-mint-300 border border-forest-800/80 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
              title="Scan QR Code for Mobile Access"
            >
              <QrCode className="w-3.5 h-3.5 text-mint-400" />
              <span>QR Poster</span>
            </button>
          </div>
          <button
            onClick={() => {
              logout();
              onClose();
            }}
            className="w-full py-2.5 px-3 bg-rose-950/30 hover:bg-rose-900/40 text-rose-300 hover:text-rose-200 border border-rose-900/50 hover:border-rose-700/60 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-98"
            title="Log Out"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      <AppAccessQRModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
      />

      <CrossPlatformModal
        isOpen={showCrossPlatformModal}
        onClose={() => setShowCrossPlatformModal(false)}
      />
    </>
  );
};
