import React, { useState, useEffect } from 'react';
import { useFarm } from '../../context/FarmContext';
import { 
  Wifi, 
  WifiOff, 
  Database, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Trash2, 
  HardDrive, 
  X, 
  Layers, 
  FileText, 
  Egg, 
  Wheat, 
  Skull, 
  ShieldCheck,
  Zap
} from 'lucide-react';

interface OfflineSyncManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OfflineSyncManager: React.FC<OfflineSyncManagerProps> = ({ isOpen, onClose }) => {
  const { 
    isOnline, 
    offlineQueue, 
    pendingOfflineCount, 
    syncOfflineQueue, 
    clearOfflineSyncQueue,
    storageQuota,
    refreshStorageQuota,
    lastIndexedDBSync
  } = useFarm();

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      refreshStorageQuota();
    }
  }, [isOpen, refreshStorageQuota]);

  if (!isOpen) return null;

  const handleSyncNow = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const res = await syncOfflineQueue();
      setSyncResult({ success: res.success, message: res.message });
      await refreshStorageQuota();
    } catch (err: any) {
      setSyncResult({ success: false, message: err?.message || 'Sync failed.' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearQueue = async () => {
    if (window.confirm('Are you sure you want to clear the pending offline queue? Unsynced records may be lost.')) {
      await clearOfflineSyncQueue();
      await refreshStorageQuota();
      setSyncResult({ success: true, message: 'Offline queue cleared successfully.' });
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'egg_production': return <Egg className="w-4 h-4 text-amber-600" />;
      case 'feed': return <Wheat className="w-4 h-4 text-emerald-600" />;
      case 'mortality': return <Skull className="w-4 h-4 text-rose-600" />;
      case 'biosecurity': return <ShieldCheck className="w-4 h-4 text-indigo-600" />;
      default: return <Layers className="w-4 h-4 text-forest-700" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div 
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-graphite-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-forest-950 text-white p-6 flex items-center justify-between border-b border-forest-900">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl ${isOnline ? 'bg-emerald-500/20 text-mint-300 border border-emerald-400/30' : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'}`}>
              {isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white font-display">Offline Operations & IndexedDB Cache</h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                  isOnline ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700' : 'bg-amber-900/60 text-amber-300 border border-amber-700'
                }`}>
                  {isOnline ? 'Online' : 'Offline Mode'}
                </span>
              </div>
              <p className="text-xs text-graphite-300">
                Service Worker active with native IndexedDB local storage & resilient background queue
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-graphite-400 hover:text-white rounded-xl hover:bg-forest-900 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Status Banners */}
          {!isOnline && (
            <div className="p-4 bg-amber-50 border border-amber-200/90 rounded-2xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-900">You are currently operating in Offline Mode</p>
                <p className="text-xs text-amber-800 mt-0.5">
                  All egg logs, feed records, mortality, and flockman entries are safely stored in your device's native IndexedDB cache. They will automatically queue and sync once a network connection is re-established.
                </p>
              </div>
            </div>
          )}

          {syncResult && (
            <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
              syncResult.success 
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
                : 'bg-rose-50 text-rose-900 border-rose-200'
            }`}>
              {syncResult.success ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
              <p className="text-xs font-medium">{syncResult.message}</p>
            </div>
          )}

          {/* Storage Quota & Capacity Grid */}
          <div>
            <h3 className="text-xs font-bold text-graphite-500 uppercase tracking-wider mb-3 flex items-center gap-1.5 font-display">
              <HardDrive className="w-3.5 h-3.5 text-forest-700" />
              <span>Local Storage & IndexedDB Diagnostics</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-graphite-50 p-3.5 rounded-2xl border border-graphite-200/80">
                <span className="text-[10px] font-bold text-graphite-500 uppercase tracking-wider block">IndexedDB Engine</span>
                <span className="text-sm font-extrabold text-forest-800 flex items-center gap-1 mt-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  {storageQuota.indexedDBAvailable ? 'Ready / Active' : 'Unavailable'}
                </span>
                <span className="text-[10px] text-graphite-400 block mt-0.5">Dual-Tier Persistence</span>
              </div>

              <div className="bg-graphite-50 p-3.5 rounded-2xl border border-graphite-200/80">
                <span className="text-[10px] font-bold text-graphite-500 uppercase tracking-wider block">Storage Used</span>
                <span className="text-sm font-extrabold text-graphite-900 mt-1 block">
                  {storageQuota.usageMB > 0 ? `${storageQuota.usageMB} MB` : '< 1.0 MB'}
                </span>
                <span className="text-[10px] text-graphite-400 block mt-0.5">
                  of {storageQuota.quotaMB > 0 ? `${storageQuota.quotaMB} MB` : 'Unlimited'}
                </span>
              </div>

              <div className="bg-graphite-50 p-3.5 rounded-2xl border border-graphite-200/80">
                <span className="text-[10px] font-bold text-graphite-500 uppercase tracking-wider block">Cached Records</span>
                <span className="text-sm font-extrabold text-graphite-900 mt-1 block">
                  {storageQuota.itemCounts.eggRecords + storageQuota.itemCounts.feedRecords + storageQuota.itemCounts.mortalityRecords + storageQuota.itemCounts.biosecurityLogs}
                </span>
                <span className="text-[10px] text-graphite-400 block mt-0.5">All Flock Modules</span>
              </div>

              <div className="bg-graphite-50 p-3.5 rounded-2xl border border-graphite-200/80">
                <span className="text-[10px] font-bold text-graphite-500 uppercase tracking-wider block">Pending Queue</span>
                <span className={`text-sm font-extrabold mt-1 block ${pendingOfflineCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {pendingOfflineCount} {pendingOfflineCount === 1 ? 'Action' : 'Actions'}
                </span>
                <span className="text-[10px] text-graphite-400 block mt-0.5">Awaiting Server Sync</span>
              </div>
            </div>
          </div>

          {/* Pending Offline Logs Queue Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-graphite-700 uppercase tracking-wider flex items-center gap-1.5 font-display">
                  <Clock className="w-3.5 h-3.5 text-forest-700" />
                  <span>Pending Offline Log Queue ({offlineQueue.length})</span>
                </h3>
                <p className="text-[11px] text-graphite-500">
                  Operations entered while without connection, preserved locally in IndexedDB
                </p>
              </div>

              {offlineQueue.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleClearQueue}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    title="Clear queue"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Clear</span>
                  </button>
                </div>
              )}
            </div>

            {offlineQueue.length === 0 ? (
              <div className="p-6 bg-graphite-50/70 border border-graphite-200/70 rounded-2xl text-center space-y-1.5">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="text-xs font-bold text-graphite-800">All local records are synchronized</p>
                <p className="text-[11px] text-graphite-500 max-w-sm mx-auto">
                  There are no pending offline changes. When you log data without an internet connection, it will appear here and sync automatically when you reconnect.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {offlineQueue.map((item) => (
                  <div 
                    key={item.id}
                    className="p-3 bg-white border border-graphite-200 rounded-xl flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-2 bg-graphite-100 rounded-lg shrink-0">
                        {getTypeIcon(item.type)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-graphite-900 truncate capitalize">{item.action.replace(/_/g, ' ')}</span>
                          {item.houseNumber && (
                            <span className="px-1.5 py-0.2 bg-forest-50 text-forest-800 text-[10px] font-bold rounded-md border border-forest-200">
                              {item.houseNumber}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-graphite-400">
                          Logged by <strong className="text-graphite-600">{item.user}</strong> &bull; {new Date(item.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                      Pending
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Service Worker Information Card */}
          <div className="p-4 bg-forest-50/60 rounded-2xl border border-forest-200/80 flex items-start gap-3">
            <Zap className="w-5 h-5 text-forest-700 shrink-0 mt-0.5" />
            <div className="text-xs text-forest-950 space-y-1">
              <p className="font-bold">Agricultural PWA & Service Worker Technology</p>
              <p className="text-forest-800 leading-relaxed">
                FarmFlow Pro utilizes a custom Service Worker cache and multi-tier IndexedDB storage. You can perform full daily farm routines (egg grading, feed allocation, mortality records, and biosecurity checklists) inside remote poultry houses with zero connectivity.
              </p>
              {lastIndexedDBSync && (
                <p className="text-[11px] text-forest-600 font-medium pt-1">
                  Last local IndexedDB sync: {new Date(lastIndexedDBSync).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-graphite-50 border-t border-graphite-200 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-graphite-600 hover:bg-graphite-200/70 rounded-xl transition cursor-pointer"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSyncNow}
              disabled={isSyncing}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer ${
                isSyncing 
                  ? 'bg-graphite-200 text-graphite-500 cursor-not-allowed'
                  : 'bg-forest-950 hover:bg-forest-900 text-mint-300 border border-forest-800'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Synchronizing...' : 'Sync Pending Items Now'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
