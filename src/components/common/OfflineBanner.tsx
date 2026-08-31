import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import { WifiOff, RefreshCw, Layers, CheckCircle2, ChevronRight } from 'lucide-react';
import { OfflineSyncManager } from './OfflineSyncManager';

export const OfflineBanner: React.FC = () => {
  const { isOnline, pendingOfflineCount, syncOfflineQueue } = useFarm();
  const [showManager, setShowManager] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // If online and no pending items, don't show the floating banner
  if (isOnline && pendingOfflineCount === 0) {
    return null;
  }

  const handleQuickSync = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSyncing(true);
    try {
      await syncOfflineQueue();
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <>
      <div 
        onClick={() => setShowManager(true)}
        className="fixed bottom-4 left-4 z-40 max-w-md bg-forest-950 text-white rounded-2xl shadow-xl border border-forest-800 p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-forest-900 transition-all group animate-slideUp"
        role="alert"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl shrink-0 ${
            !isOnline 
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
          }`}>
            {!isOnline ? <WifiOff className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white">
                {!isOnline ? 'Offline Mode Active' : 'Pending Offline Logs'}
              </span>
              {pendingOfflineCount > 0 && (
                <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-extrabold rounded-md">
                  {pendingOfflineCount} queued
                </span>
              )}
            </div>
            <p className="text-[11px] text-graphite-300">
              {!isOnline 
                ? 'Data safely queued for central MongoDB sync'
                : 'Click to synchronize pending items with server'
              }
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {isOnline && pendingOfflineCount > 0 && (
            <button
              onClick={handleQuickSync}
              disabled={isSyncing}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-lg transition flex items-center gap-1 shadow-xs"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Sync</span>
            </button>
          )}
          <ChevronRight className="w-4 h-4 text-graphite-400 group-hover:text-white transition-colors" />
        </div>
      </div>

      <OfflineSyncManager 
        isOpen={showManager} 
        onClose={() => setShowManager(false)} 
      />
    </>
  );
};
