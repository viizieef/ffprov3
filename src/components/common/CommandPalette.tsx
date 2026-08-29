import React, { useState, useEffect, useMemo } from 'react';
import { useFarm } from '../../context/FarmContext';
import { ModuleType, UserRole } from '../../types';
import { 
  Search, 
  Egg, 
  Skull, 
  Wheat, 
  Syringe, 
  FileSpreadsheet, 
  Share2, 
  Scale, 
  Building2, 
  ShieldCheck, 
  Settings, 
  ArrowRight, 
  Command, 
  CornerDownLeft, 
  X,
  Clock,
  Sparkles,
  Truck,
  Users
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (module: ModuleType) => void;
  onOpenMessengerReport: () => void;
}

interface CommandItem {
  id: string;
  category: 'Navigation' | 'Houses' | 'Quick Actions' | 'Roles & System';
  title: string;
  description?: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenMessengerReport
}) => {
  const { flocks, currentUser, switchUserRole, permissions, getFlockStats } = useFarm();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Keyboard navigation inside palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const items: CommandItem[] = useMemo(() => {
    const list: CommandItem[] = [
      // Quick Actions
      {
        id: 'qa-messenger',
        category: 'Quick Actions',
        title: 'Messenger Daily Report',
        description: 'Generate & format WhatsApp/Messenger dispatch text',
        icon: <Share2 className="w-4 h-4 text-mint-400" />,
        shortcut: 'M',
        action: () => {
          onOpenMessengerReport();
          onClose();
        }
      },
      {
        id: 'qa-productivity-trends',
        category: 'Quick Actions',
        title: 'Flock Productivity & Mortality Trends',
        description: 'Interactive Recharts curves: Henday rates, depletions, feed FCR, weight',
        icon: <Sparkles className="w-4 h-4 text-mint-400" />,
        shortcut: 'T',
        action: () => {
          onNavigate('dashboard');
          onClose();
          setTimeout(() => {
            const el = document.getElementById('flock-productivity-dashboard-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
      },
      {
        id: 'qa-dynamic-reports',
        category: 'Quick Actions',
        title: 'Dynamic Reports Hub',
        description: 'Audit tables, print layouts, and Excel (.xlsx) exports',
        icon: <FileSpreadsheet className="w-4 h-4 text-emerald-400" />,
        shortcut: 'R',
        action: () => {
          onNavigate('reports');
          onClose();
        }
      },
      {
        id: 'qa-delivery-esrrr',
        category: 'Quick Actions',
        title: 'Egg Delivery & ESRRR Voucher',
        description: 'Dispatch batches, hatchery receiving, sorting regrading and print',
        icon: <Truck className="w-4 h-4 text-emerald-400" />,
        shortcut: 'V',
        action: () => {
          onNavigate('delivery');
          onClose();
        }
      },
      {
        id: 'qa-log-egg',
        category: 'Quick Actions',
        title: 'Log Daily Egg Production',
        description: 'Record morning, noon, and afternoon collections & grading',
        icon: <Egg className="w-4 h-4 text-amber-400" />,
        shortcut: 'E',
        action: () => {
          onNavigate('egg_production');
          onClose();
        }
      },
      {
        id: 'qa-log-mortality',
        category: 'Quick Actions',
        title: 'Log Mortality & Culling',
        description: 'Record natural mortality, spot culls, missex, spent culls',
        icon: <Skull className="w-4 h-4 text-rose-400" />,
        shortcut: 'D',
        action: () => {
          onNavigate('mortality');
          onClose();
        }
      },
      {
        id: 'qa-feed',
        category: 'Quick Actions',
        title: 'Feed Inventory & Restock',
        description: 'Check silo capacity, consumption, and low-feed alerts',
        icon: <Wheat className="w-4 h-4 text-amber-300" />,
        shortcut: 'F',
        action: () => {
          onNavigate('feed_inventory');
          onClose();
        }
      },

      // Module Navigation
      {
        id: 'nav-dashboard',
        category: 'Navigation',
        title: 'Farm Executive Dashboard',
        description: 'Live KPIs, breeder population, livability, feed alerts',
        icon: <Building2 className="w-4 h-4 text-teal-400" />,
        action: () => {
          onNavigate('dashboard');
          onClose();
        }
      },
      {
        id: 'nav-flockman',
        category: 'Navigation',
        title: 'Flockman Assigned Houses',
        description: 'Side-by-side house routines, egg tallies & body weights',
        icon: <Users className="w-4 h-4 text-sky-400" />,
        action: () => {
          onNavigate('flockman_module');
          onClose();
        }
      },
      {
        id: 'nav-flocks',
        category: 'Navigation',
        title: 'Flock Population Directory',
        description: 'View active cycles, female/male ratios, and hatch dates',
        icon: <Building2 className="w-4 h-4 text-indigo-400" />,
        action: () => {
          onNavigate('flock_list');
          onClose();
        }
      },
      {
        id: 'nav-vaccine',
        category: 'Navigation',
        title: 'Vaccine & Medicine Schedule',
        description: 'Biological inventories, scheduled booster doses & alerts',
        icon: <Syringe className="w-4 h-4 text-emerald-400" />,
        shortcut: 'V',
        action: () => {
          onNavigate('medicine');
          onClose();
        }
      },
      {
        id: 'nav-bodyweight',
        category: 'Navigation',
        title: 'Body Weight & Uniformity',
        description: 'Weekly sample weighings, CV% uniformity, standard curves',
        icon: <Scale className="w-4 h-4 text-purple-400" />,
        action: () => {
          onNavigate('body_weight');
          onClose();
        }
      },
      {
        id: 'nav-profile',
        category: 'Navigation',
        title: 'Farm Profile & Branding',
        description: 'Company logo, official name, address, and letterhead info',
        icon: <ShieldCheck className="w-4 h-4 text-teal-300" />,
        action: () => {
          onNavigate('farm_profile');
          onClose();
        }
      },
      {
        id: 'nav-settings',
        category: 'Navigation',
        title: 'System Settings & Audit Log',
        description: 'User access, database connection & backup controls',
        icon: <Settings className="w-4 h-4 text-slate-400" />,
        action: () => {
          onNavigate('settings');
          onClose();
        }
      }
    ];

    // House Specific Quick Jump
    flocks.forEach((flock) => {
      const stats = getFlockStats(flock.houseNumber);
      const totalBirds = stats ? stats.totalCurrent : (flock.currentFemales + flock.currentMales);
      const ageWeeks = stats ? stats.ageWeeks : 38;

      list.push({
        id: `house-${flock.houseNumber}`,
        category: 'Houses',
        title: `${flock.houseNumber} (${flock.breed})`,
        description: `Week ${ageWeeks} • ${totalBirds.toLocaleString()} Birds • ${flock.status}`,
        icon: <Building2 className="w-4 h-4 text-mint-400" />,
        shortcut: flock.houseNumber.replace('House ', ''),
        action: () => {
          onNavigate('egg_production');
          onClose();
        }
      });
    });

    // Persona Quick Switching
    const roles: UserRole[] = ['System Administrator', 'Farm Manager', 'Flockman', 'Leadman', 'Egg Collector'];
    roles.forEach((r) => {
      list.push({
        id: `role-${r}`,
        category: 'Roles & System',
        title: `Switch Persona: ${r}`,
        description: `Simulate view and capabilities for ${r}`,
        icon: <ShieldCheck className="w-4 h-4 text-mint-300" />,
        action: () => {
          switchUserRole(r);
          onClose();
        }
      });
    });

    return list;
  }, [flocks, onNavigate, onOpenMessengerReport, onClose, switchUserRole, getFlockStats]);

  const filteredItems = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        item.category.toLowerCase().includes(q)
    );
  }, [items, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 sm:pt-20 animate-fadeIn">
      <div 
        className="w-full max-w-2xl bg-forest-950 border border-forest-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Bar Header */}
        <div className="p-4 border-b border-forest-800/80 flex items-center gap-3 bg-forest-900/60">
          <Search className="w-5 h-5 text-mint-400 shrink-0" />
          <input
            type="text"
            placeholder="Type a command, house number, or module (e.g., 'House 1', 'Excel', 'Eggs')..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            className="flex-1 bg-transparent text-white placeholder-graphite-400 text-sm font-medium focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-graphite-400 hover:text-white rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <div className="flex items-center gap-1 text-[11px] text-graphite-400 font-bold bg-forest-950 px-2 py-1 rounded-lg border border-forest-800">
            <span>ESC</span>
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-graphite-400">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-40 text-mint-400" />
              <p className="text-sm font-bold text-white">No commands or houses matched "{query}"</p>
              <p className="text-xs mt-1">Try searching for 'Reports', 'Eggs', 'House 2', or 'Mortality'.</p>
            </div>
          ) : (
            // Group by category
            Object.entries(
              filteredItems.reduce((acc: Record<string, CommandItem[]>, item: CommandItem) => {
                acc[item.category] = acc[item.category] || [];
                acc[item.category].push(item);
                return acc;
              }, {})
            ).map(([category, catItems]) => (
              <div key={category} className="space-y-1">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-mint-400/80">
                  {category}
                </div>
                {(catItems as CommandItem[]).map((item) => {
                  const globalIdx = filteredItems.indexOf(item);
                  const isSelected = globalIdx === selectedIndex;

                  return (
                    <div
                      key={item.id}
                      onClick={() => item.action()}
                      onMouseEnter={() => setSelectedIndex(globalIdx)}
                      className={`px-3 py-2.5 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition ${
                        isSelected
                          ? 'bg-mint-400 text-forest-950 font-semibold shadow-xs'
                          : 'text-graphite-200 hover:bg-forest-900/60'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`p-2 rounded-xl shrink-0 ${
                            isSelected ? 'bg-forest-950 text-mint-300' : 'bg-forest-900 text-mint-400 border border-forest-800'
                          }`}
                        >
                          {item.icon}
                        </div>
                        <div className="min-w-0">
                          <p className={`text-xs font-bold leading-snug truncate ${isSelected ? 'text-forest-950' : 'text-white'}`}>
                            {item.title}
                          </p>
                          {item.description && (
                            <p className={`text-[11px] truncate leading-tight ${isSelected ? 'text-forest-900/80' : 'text-graphite-400'}`}>
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {item.shortcut && (
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                              isSelected
                                ? 'bg-forest-900 text-mint-300'
                                : 'bg-forest-900 text-graphite-400 border border-forest-800'
                            }`}
                          >
                            {item.shortcut}
                          </span>
                        )}
                        {isSelected && (
                          <CornerDownLeft className="w-4 h-4 text-forest-950 animate-pulse" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="p-3 border-t border-forest-800/80 bg-forest-900/40 text-[11px] text-graphite-400 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="bg-forest-950 px-1.5 py-0.5 rounded text-[10px] font-mono border border-forest-800">↑</kbd>
              <kbd className="bg-forest-950 px-1.5 py-0.5 rounded text-[10px] font-mono border border-forest-800">↓</kbd>
              <span>to navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="bg-forest-950 px-1.5 py-0.5 rounded text-[10px] font-mono border border-forest-800">↵</kbd>
              <span>to select</span>
            </span>
          </div>
          <span className="text-[10px] font-semibold text-mint-400">
            Press <kbd className="bg-forest-950 px-1 py-0.5 rounded font-mono border border-forest-800">?</kbd> for Hotkeys
          </span>
        </div>
      </div>
    </div>
  );
};
