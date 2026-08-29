import React from 'react';
import { Keyboard, X, Command, Sparkles } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const shortcuts = [
    {
      group: 'Universal Navigation',
      items: [
        { keys: ['Ctrl', 'K'], desc: 'Open Command Palette & Quick Jump' },
        { keys: ['?'], desc: 'Toggle Keyboard Shortcuts Cheat Sheet' },
        { keys: ['Esc'], desc: 'Close any active modal or drawer' }
      ]
    },
    {
      group: 'Module Shortcuts',
      items: [
        { keys: ['D'], desc: 'Jump to Executive Dashboard' },
        { keys: ['E'], desc: 'Jump to Egg Production & Grading' },
        { keys: ['M'], desc: 'Jump to Messenger Daily Report' },
        { keys: ['R'], desc: 'Jump to Dynamic Reports & Excel Exports' },
        { keys: ['F'], desc: 'Jump to Feed Inventory' },
        { keys: ['V'], desc: 'Jump to Vaccine & Medicine Schedule' }
      ]
    },
    {
      group: 'Houses Quick Jump',
      items: [
        { keys: ['1', '-', '7'], desc: 'Switch directly to House 1 through House 7' },
        { keys: ['['], desc: 'Cycle to previous house' },
        { keys: [']'], desc: 'Cycle to next house' }
      ]
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div 
        className="w-full max-w-lg bg-forest-950 border border-forest-800 rounded-3xl shadow-2xl p-6 relative overflow-hidden animate-scaleUp text-white space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-forest-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-mint-400 text-forest-950 rounded-xl shadow-xs">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Keyboard Shortcuts</h3>
              <p className="text-xs text-graphite-300">Fast keyboard ergonomics for farm managers and flockmen</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-graphite-400 hover:text-white rounded-xl bg-forest-900 border border-forest-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {shortcuts.map((sec) => (
            <div key={sec.group} className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-mint-400">{sec.group}</p>
              <div className="bg-forest-900/60 rounded-2xl border border-forest-800/80 divide-y divide-forest-800/60">
                {sec.items.map((item, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between text-xs">
                    <span className="text-graphite-200">{item.desc}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      {item.keys.map((k, kIdx) => (
                        <kbd
                          key={kIdx}
                          className="px-2 py-1 bg-forest-950 border border-forest-700 text-mint-300 rounded-lg text-[11px] font-mono font-bold shadow-xs"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-forest-800/80 flex items-center justify-between text-xs text-graphite-400">
          <span>Tip: Press <kbd className="px-1.5 py-0.5 bg-forest-900 rounded font-mono text-mint-300 border border-forest-700">Ctrl+K</kbd> to search anytime</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-mint-400 hover:bg-mint-300 text-forest-950 font-bold rounded-xl text-xs transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
