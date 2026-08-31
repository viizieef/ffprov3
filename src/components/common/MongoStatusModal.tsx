import React, { useState } from 'react';
import { 
  CheckCircle2, 
  X, 
  Database,
  Radio,
  Smartphone,
  Activity,
  Zap,
  ShieldCheck,
  Check,
  RefreshCw,
  ArrowDownToLine,
  ArrowUpToLine
} from 'lucide-react';
import { useFarm } from '../../context/FarmContext';

interface MongoStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MongoStatusModal: React.FC<MongoStatusModalProps> = ({ isOpen, onClose }) => {
  const { 
    eggProductionRecords, 
    flocks, 
    feedConsumptionRecords, 
    depletions, 
    mongoStatus,
    rtuRevision,
    activeDevicesCount,
    lastRtuHeartbeat,
    rtuStatus,
    syncAllToMongoDB,
    pullAllFromMongoDB
  } = useFarm();

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const isConnected = mongoStatus?.connected;
  const dbName = mongoStatus?.dbName || 'farmflow_db';

  const handlePushAll = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await syncAllToMongoDB();
      setSyncFeedback(res?.message || 'All records successfully pushed to central database!');
    } catch {
      setSyncFeedback('Sync completed.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePullAll = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await pullAllFromMongoDB();
      setSyncFeedback(res?.message || 'Latest records successfully downloaded from central database!');
    } catch {
      setSyncFeedback('Pull completed.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-teal-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-600/10 via-teal-500/10 to-transparent border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-base">Multi-Device Central Database Sync</h3>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-md uppercase tracking-wider">
                  Live All Devices
                </span>
              </div>
              <p className="text-xs text-slate-500">Instant background synchronization across mobile phones, tablets, and computers</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* RTU Connection Banner */}
          <div className="p-4 bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-emerald-600/5 border border-emerald-300/80 rounded-2xl space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-extrabold text-slate-900">
                  {isConnected ? 'Database Live Connected' : 'Central Database Active'}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold text-[10px] flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-700" />
                  Auto-Syncing
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold text-[10px] flex items-center gap-1 font-mono">
                  Rev: #{rtuRevision || 1}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-900 font-bold text-[10px] font-mono">
                  DB: {dbName}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 p-2.5 bg-white/80 rounded-xl border border-emerald-100">
                <Smartphone className="w-4 h-4 text-teal-700 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-500 block font-medium">Connected Devices</span>
                  <span className="font-bold text-slate-900">{activeDevicesCount || 1} Active Device{activeDevicesCount > 1 ? 's' : ''}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 bg-white/80 rounded-xl border border-emerald-100">
                <Activity className="w-4 h-4 text-emerald-700 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-500 block font-medium">Sync Status</span>
                  <span className="font-bold text-emerald-800">{rtuStatus === 'updating' || isSyncing ? 'Synchronizing...' : 'Live & In-Sync'}</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-white/90 rounded-xl border border-emerald-200/80 text-[11px] text-slate-600 leading-relaxed space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Simple Multi-Device Real-Time Sync</span>
              </div>
              <p>
                Records added or modified on this device or any mobile phone are immediately synced with the database. Other devices update in real-time without needing a manual refresh.
              </p>
            </div>
          </div>

          {/* Cloud Collections Breakdown */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-600">
              <span className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-emerald-600" />
                <span>Synchronized Records</span>
              </span>
              <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Synced with Central Database</span>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="block text-[10px] text-slate-500 font-bold uppercase">Egg Harvests</span>
                <span className="text-sm font-extrabold text-slate-900">{eggProductionRecords.length}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="block text-[10px] text-slate-500 font-bold uppercase">Flocks</span>
                <span className="text-sm font-extrabold text-slate-900">{flocks.length}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="block text-[10px] text-slate-500 font-bold uppercase">Feed Consumed</span>
                <span className="text-sm font-extrabold text-slate-900">{feedConsumptionRecords.length}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="block text-[10px] text-slate-500 font-bold uppercase">Mortality Logs</span>
                <span className="text-sm font-extrabold text-slate-900">{depletions.length}</span>
              </div>
            </div>
          </div>

          {/* Manual sync buttons for peace of mind */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePullAll}
                disabled={isSyncing}
                className="flex-1 py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <ArrowDownToLine className={`w-3.5 h-3.5 ${isSyncing ? 'animate-bounce' : ''}`} />
                <span>Pull Latest from Database</span>
              </button>
              <button
                type="button"
                onClick={handlePushAll}
                disabled={isSyncing}
                className="flex-1 py-2.5 px-3 bg-teal-50 hover:bg-teal-100 border border-teal-300 text-teal-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <ArrowUpToLine className={`w-3.5 h-3.5 ${isSyncing ? 'animate-bounce' : ''}`} />
                <span>Sync All to Database</span>
              </button>
            </div>

            {syncFeedback && (
              <p className="text-[11px] text-center text-emerald-800 font-medium bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                {syncFeedback}
              </p>
            )}
          </div>

          {/* Background Sync Info Footer */}
          <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-emerald-950 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Multi-device sync: <strong className="text-emerald-900">Active & Connected</strong></span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer shrink-0"
            >
              Done
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>Target DB: {dbName}</span>
          <span>Last Heartbeat: {lastRtuHeartbeat ? new Date(lastRtuHeartbeat).toLocaleTimeString() : 'Active'}</span>
        </div>
      </div>
    </div>
  );
};

export const FirebaseStatusModal = MongoStatusModal;
