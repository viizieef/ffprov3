import React, { useState, useEffect } from 'react';
import { useFarm } from '../../context/FarmContext';
import { HatchingSummaryRecord } from '../../types';
import { 
  X, 
  Calendar, 
  Layers, 
  Sparkles, 
  CheckCircle2, 
  Egg, 
  Percent, 
  Building2, 
  FileText, 
  AlertCircle,
  Hash
} from 'lucide-react';
import { useToast } from '../common/ToastContainer';

interface HatchingSummaryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: HatchingSummaryRecord | null;
  onSaved?: (record: HatchingSummaryRecord) => void;
}

export const HatchingSummaryFormModal: React.FC<HatchingSummaryFormModalProps> = ({
  isOpen,
  onClose,
  initialData,
  onSaved
}) => {
  const { 
    flocks = [], 
    deliveries = [], 
    currentUser, 
    addHatchingSummary, 
    updateHatchingSummary 
  } = useFarm();
  const toast = useToast();

  const [settingDate, setSettingDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [houseNumber, setHouseNumber] = useState<string>('1');
  const [breed, setBreed] = useState<string>('Cobb 500');
  const [eggsSet, setEggsSet] = useState<number>(8000);
  const [pullOutDate, setPullOutDate] = useState<string>('');
  const [standardChicks, setStandardChicks] = useState<number>(7000);
  const [gradeOut, setGradeOut] = useState<number>(150);
  const [hatcheryName, setHatcheryName] = useState<string>('MJBJ Hatchery');
  const [esrrrNumber, setEsrrrNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Helper to calculate pull out date (+21 days from setting date)
  const calculateDefaultPullOutDate = (startDate: string) => {
    if (!startDate) return '';
    try {
      const d = new Date(startDate);
      if (isNaN(d.getTime())) return '';
      d.setDate(d.getDate() + 21);
      return d.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  // Populate form when initialData or modal opens
  useEffect(() => {
    if (initialData) {
      setSettingDate(initialData.settingDate || new Date().toISOString().split('T')[0]);
      setHouseNumber(String(initialData.houseNumber || '1'));
      setBreed(initialData.breed || 'Cobb 500');
      setEggsSet(initialData.eggsSet || 0);
      setPullOutDate(initialData.pullOutDate || calculateDefaultPullOutDate(initialData.settingDate));
      setStandardChicks(initialData.standardChicks || 0);
      setGradeOut(initialData.gradeOut || 0);
      setHatcheryName(initialData.hatcheryName || 'MJBJ Hatchery');
      setEsrrrNumber(initialData.esrrrNumber || '');
      setNotes(initialData.notes || '');
    } else {
      const today = new Date().toISOString().split('T')[0];
      setSettingDate(today);
      setHouseNumber('1');
      // Auto find breed from flock 1
      const flk1 = flocks.find(f => String(f.houseNumber) === '1');
      setBreed(flk1?.breed || 'Cobb 500');
      setEggsSet(8000);
      setPullOutDate(calculateDefaultPullOutDate(today));
      setStandardChicks(7000);
      setGradeOut(150);
      setHatcheryName('MJBJ Hatchery');
      setEsrrrNumber(deliveries[0]?.esrrrNumber || '');
      setNotes('');
    }
  }, [initialData, isOpen, flocks, deliveries]);

  // When setting date changes, auto calculate pull out date if not custom modified
  const handleSettingDateChange = (newDate: string) => {
    setSettingDate(newDate);
    setPullOutDate(calculateDefaultPullOutDate(newDate));
  };

  // When house changes, auto-suggest breed from flock
  const handleHouseChange = (newHouse: string) => {
    setHouseNumber(newHouse);
    const flk = flocks.find(f => String(f.houseNumber) === String(newHouse));
    if (flk?.breed) {
      setBreed(flk.breed);
    }
  };

  // Real-time calculations
  const totalChicksPulled = (Number(standardChicks) || 0) + (Number(gradeOut) || 0);
  const totalHatchPct = Number(eggsSet) > 0 
    ? ((totalChicksPulled / Number(eggsSet)) * 100) 
    : 0;
  const saleableHatchPct = Number(eggsSet) > 0 
    ? ((Number(standardChicks) / Number(eggsSet)) * 100) 
    : 0;
  const gradeOutPct = Number(eggsSet) > 0 
    ? ((Number(gradeOut) / Number(eggsSet)) * 100) 
    : 0;

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!settingDate) {
      toast.error('Setting Date is required.');
      return;
    }
    if (!houseNumber) {
      toast.error('House is required.');
      return;
    }
    if (eggsSet <= 0) {
      toast.error('# of Eggs set must be greater than 0.');
      return;
    }
    if (!pullOutDate) {
      toast.error('Pull-out Date is required.');
      return;
    }

    const payload = {
      settingDate,
      houseNumber: String(houseNumber),
      breed: breed || 'Cobb 500',
      eggsSet: Number(eggsSet),
      pullOutDate,
      standardChicks: Number(standardChicks) || 0,
      gradeOut: Number(gradeOut) || 0,
      totalChicksPulled,
      totalHatchPct: Number(totalHatchPct.toFixed(2)),
      saleableHatchPct: Number(saleableHatchPct.toFixed(2)),
      gradeOutPct: Number(gradeOutPct.toFixed(2)),
      hatcheryName: hatcheryName.trim() || 'MJBJ Hatchery',
      esrrrNumber: esrrrNumber.trim() || undefined,
      notes: notes.trim() || undefined,
      loggedBy: currentUser?.fullName || 'System User'
    };

    if (initialData?.id) {
      updateHatchingSummary(initialData.id, payload);
      toast.success(`Hatching summary for House ${houseNumber} updated successfully!`);
      if (onSaved) {
        onSaved({ ...initialData, ...payload, id: initialData.id });
      }
    } else {
      const created = addHatchingSummary(payload);
      toast.success(`New Hatching summary for House ${houseNumber} created successfully!`);
      if (onSaved) {
        onSaved(created);
      }
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Egg className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight">
                {initialData ? 'Edit Hatching Summary Record' : 'Record New Hatching Summary'}
              </h2>
              <p className="text-[11px] text-slate-400">
                Official San Miguel Foods, Inc. • Setter, Pull-out & Hatchability Data
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          
          {/* Main Setting & House Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Setting Date */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>Setting Date</span>
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={settingDate}
                onChange={e => handleSettingDateChange(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* House */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-600" />
                <span>House</span>
                <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={houseNumber}
                onChange={e => handleHouseChange(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              >
                {[1, 2, 3, 4, 5, 6].map(num => (
                  <option key={num} value={String(num)}>
                    House {num} {flocks.find(f => String(f.houseNumber) === String(num)) ? `(${flocks.find(f => String(f.houseNumber) === String(num))?.breed})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Breed */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Breed</span>
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={breed}
                onChange={e => setBreed(e.target.value)}
                placeholder="e.g. Cobb 500, Ross 308"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* # of Eggs Set */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-emerald-600" />
                <span># of Eggs Set</span>
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                required
                value={eggsSet || ''}
                onChange={e => setEggsSet(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Pull-out Date */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-sky-600" />
                <span>Pull-out Date (21 Days Cycle)</span>
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={pullOutDate}
                onChange={e => setPullOutDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* Receiving Hatchery */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Hatchery Facility</span>
              </label>
              <input
                type="text"
                value={hatcheryName}
                onChange={e => setHatcheryName(e.target.value)}
                placeholder="e.g. MJBJ Hatchery"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

          </div>

          {/* Hatch Results & Pull Out Yields */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Chicks Pulled & Grade Breakdown</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Standard Chicks */}
              <div className="space-y-1.5">
                <label className="font-bold text-emerald-950 flex items-center justify-between">
                  <span>Standard Chicks (Saleable)</span>
                  <span className="text-[10px] text-emerald-700 font-extrabold uppercase">Grade A</span>
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={standardChicks || ''}
                  onChange={e => setStandardChicks(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  placeholder="0"
                  className="w-full px-3.5 py-2.5 bg-white border border-emerald-300 rounded-xl text-xs font-mono font-black text-emerald-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                />
              </div>

              {/* Grade Out */}
              <div className="space-y-1.5">
                <label className="font-bold text-amber-950 flex items-center justify-between">
                  <span>Grade out (Culls / Defects)</span>
                  <span className="text-[10px] text-amber-700 font-extrabold uppercase">Non-Saleable</span>
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={gradeOut || ''}
                  onChange={e => setGradeOut(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  placeholder="0"
                  className="w-full px-3.5 py-2.5 bg-white border border-amber-300 rounded-xl text-xs font-mono font-bold text-amber-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500 shadow-2xs"
                />
              </div>

            </div>

            {/* Live Calculation Output Dashboard */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200">
              
              <div className="bg-white p-3 rounded-xl border border-slate-200 text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Chicks Pulled</span>
                <span className="text-base font-black font-mono text-slate-900 block mt-0.5">
                  {totalChicksPulled.toLocaleString()}
                </span>
                <span className="text-[9px] text-slate-400 font-medium">Std + Grade Out</span>
              </div>

              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-center">
                <span className="text-[10px] font-black text-emerald-800 uppercase block">Total Hatch %</span>
                <span className="text-base font-black font-mono text-emerald-900 block mt-0.5">
                  {totalHatchPct.toFixed(2)}%
                </span>
                <span className="text-[9px] text-emerald-700 font-bold">Of Eggs Set</span>
              </div>

              <div className="bg-sky-50 p-3 rounded-xl border border-sky-200 text-center">
                <span className="text-[10px] font-black text-sky-800 uppercase block">Saleable Hatch %</span>
                <span className="text-base font-black font-mono text-sky-900 block mt-0.5">
                  {saleableHatchPct.toFixed(2)}%
                </span>
                <span className="text-[9px] text-sky-700 font-bold">Target &ge; 85%</span>
              </div>

            </div>
          </div>

          {/* Reference & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Linked ESRRR Voucher */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>Linked ESRRR Control Voucher (Optional)</span>
              </label>
              <select
                value={esrrrNumber}
                onChange={e => setEsrrrNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">None / Standalone Batch</option>
                {deliveries.map(d => (
                  <option key={d.id} value={d.esrrrNumber}>
                    {d.esrrrNumber} (Prod: {d.productionDate} &bull; {d.totalEggsReceived.toLocaleString()} eggs)
                  </option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 flex items-center gap-1.5">
                <span>Technical Notes & Remarks</span>
              </label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Navel quality, candling infertile %, chick vigor"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black rounded-xl transition shadow-md cursor-pointer flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{initialData ? 'Save Changes' : 'Save Hatching Summary'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
