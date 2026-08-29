import React from 'react';
import { ModuleType } from '../../types';
import { useFarm } from '../../context/FarmContext';
import { 
  LayoutDashboard, 
  Egg, 
  ClipboardCheck, 
  Wheat, 
  Menu,
  Sparkles
} from 'lucide-react';
import { triggerHaptic } from '../../utils/platform';

interface MobileBottomNavProps {
  currentModule: ModuleType;
  onNavigate: (module: ModuleType) => void;
  onOpenMenu: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentModule,
  onNavigate,
  onOpenMenu
}) => {
  const { permissions } = useFarm();

  const handleNavClick = (mod: ModuleType) => {
    triggerHaptic('light');
    onNavigate(mod);
  };

  const navItems = [
    {
      id: 'dashboard' as ModuleType,
      label: 'Dashboard',
      icon: LayoutDashboard,
      show: true,
    },
    {
      id: 'egg_production' as ModuleType,
      label: 'Eggs',
      icon: Egg,
      show: permissions.canViewModule('egg_production'),
    },
    {
      id: 'flockman_module' as ModuleType,
      label: 'Flockman',
      icon: ClipboardCheck,
      show: permissions.canViewModule('flockman_module'),
    },
    {
      id: 'feed_inventory' as ModuleType,
      label: 'Feed',
      icon: Wheat,
      show: permissions.canViewModule('feed_inventory'),
    },
  ];

  return (
    <nav 
      aria-label="Mobile Navigation Bar"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-forest-950/95 backdrop-blur-lg border-t border-forest-800/60 pb-[env(safe-area-inset-bottom,0px)] print:hidden shadow-2xl transition-all"
    >
      <div className="flex items-center justify-around px-2 py-1.5 max-w-lg mx-auto">
        {navItems.filter(item => item.show).map((item) => {
          const Icon = item.icon;
          const isActive = currentModule === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-2xl transition-all cursor-pointer ${
                isActive
                  ? 'text-mint-400 font-extrabold scale-105'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition ${isActive ? 'bg-mint-400/15 text-mint-300' : ''}`}>
                <Icon className={`w-5 h-5 ${isActive ? 'text-mint-400' : 'text-slate-400'}`} />
              </div>
              <span className="text-[10px] tracking-tight mt-0.5 leading-none">
                {item.label}
              </span>
            </button>
          );
        })}

        {/* Menu / More Button */}
        <button
          onClick={() => {
            triggerHaptic('medium');
            onOpenMenu();
          }}
          className="flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-2xl text-slate-400 hover:text-slate-200 transition cursor-pointer"
          aria-label="Open Full App Menu"
        >
          <div className="p-1.5 rounded-xl text-slate-400">
            <Menu className="w-5 h-5" />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5 leading-none">
            Menu
          </span>
        </button>
      </div>
    </nav>
  );
};
