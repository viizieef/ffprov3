import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import { BreedType, Flock } from '../../types';
import { 
  Bird, 
  Plus, 
  Calendar, 
  Activity, 
  HeartHandshake, 
  Grid2X2, 
  Trash2, 
  TrendingUp, 
  ShieldCheck, 
  Layers,
  Edit3,
  Clock,
  Sparkles
} from 'lucide-react';
import { calculateFlockAgeFromLoadingDate } from '../../utils/dateCalculations';

export const FlockListView: React.FC = () => {
  const { flocks, addFlock, updateFlock, deleteFlock, getFlockStats, permissions } = useFarm();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingFlock, setEditingFlock] = useState<Flock | null>(null);

  // New Flock Form State
  const [houseNumber, setHouseNumber] = useState('House 7');
  const [breed, setBreed] = useState<BreedType>('Cobb 500');
  const [initialMales, setInitialMales] = useState<number>(1000);
  const [loadingDateMale, setLoadingDateMale] = useState<string>(new Date().toISOString().split('T')[0]);
  const [initialFemales, setInitialFemales] = useState<number>(9500);
  const [loadingDateFemale, setLoadingDateFemale] = useState<string>(new Date().toISOString().split('T')[0]);
  const [hatchDate, setHatchDate] = useState<string>('2026-01-01');
  const [notes, setNotes] = useState<string>('Newly placed parent stock breeder flock');

  // Edit Loading Date Form State
  const [editLoadingDateFemale, setEditLoadingDateFemale] = useState<string>('');
  const [editLoadingDateMale, setEditLoadingDateMale] = useState<string>('');
  const [editBreed, setEditBreed] = useState<BreedType>('Cobb 500');
  const [editNotes, setEditNotes] = useState<string>('');

  const handleOpenEdit = (flock: Flock) => {
    setEditingFlock(flock);
    setEditLoadingDateFemale(flock.loadingDateFemale || flock.loadingDateMale || '');
    setEditLoadingDateMale(flock.loadingDateMale || flock.loadingDateFemale || '');
    setEditBreed(flock.breed);
    setEditNotes(flock.notes || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFlock) return;

    updateFlock(editingFlock.id, {
      loadingDateFemale: editLoadingDateFemale,
      loadingDateMale: editLoadingDateMale,
      breed: editBreed,
      notes: editNotes.trim()
    });

    setEditingFlock(null);
  };

  const handleAddFlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (initialMales < 0 || initialFemales < 0) return;

    addFlock({
      houseNumber,
      breed,
      initialMales: Number(initialMales) || 0,
      initialFemales: Number(initialFemales) || 0,
      loadingDateMale,
      loadingDateFemale,
      hatchDate,
      status: 'active',
      notes: notes.trim()
    });

    setShowAddModal(false);
  };

  // Real-time calculation preview for Add Modal
  const addModalAgePreview = calculateFlockAgeFromLoadingDate(loadingDateFemale || loadingDateMale);
  // Real-time calculation preview for Edit Modal
  const editModalAgePreview = calculateFlockAgeFromLoadingDate(editLoadingDateFemale || editLoadingDateMale);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-teal-700 text-xs font-bold uppercase tracking-wider mb-1">
            <Bird className="w-4 h-4" />
            <span>Parent Stock Population Control</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Flock Management & Housing</h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time tracking of age in weeks, livability %, male-to-female mating ratios & depletions.
          </p>
        </div>

        {permissions.canAddFlock && (
          <button
            id="add-new-flock-btn"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-xs self-start"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Flock</span>
          </button>
        )}
      </div>

      {/* Flock Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {flocks.map(flock => {
          const stats = getFlockStats(flock.houseNumber);
          if (!stats) return null;

          return (
            <div
              key={flock.id}
              className="bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 shadow-xs overflow-hidden transition flex flex-col justify-between"
            >
              {/* Top Card Header */}
              <div className="p-5 bg-teal-950 text-white flex items-center justify-between border-b border-teal-900/50">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-teal-500 text-teal-950 font-black text-xs">
                      {flock.houseNumber}
                    </span>
                    <span className="text-xs font-semibold text-teal-200/90">
                      {flock.breed}
                    </span>
                  </div>
                  <p className="text-[11px] text-teal-300/70 mt-1">
                    Loading Date: {flock.loadingDateFemale || flock.loadingDateMale}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-teal-300/80 font-medium">Age from Loading</span>
                  <p className="text-lg font-black text-teal-300 leading-none mt-0.5">
                    Wk {stats.ageWeeks} <span className="text-xs font-bold text-teal-200/80">(Day {stats.ageDays || 1})</span>
                  </p>
                  <p className="text-[10px] text-teal-300/60 mt-0.5">{stats.totalDaysFromLoading || 0} total days</p>
                </div>
              </div>

              {/* Middle Metrics */}
              <div className="p-5 space-y-4">
                {/* Population Row */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 bg-teal-50/70 rounded-xl border border-teal-100">
                    <p className="text-[10px] font-bold text-teal-700 uppercase">Males</p>
                    <p className="text-base font-extrabold text-teal-950 mt-0.5">
                      {stats.currentMales.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-teal-600 font-medium">Init: {flock.initialMales}</p>
                  </div>

                  <div className="p-2.5 bg-rose-50/70 rounded-xl border border-rose-100">
                    <p className="text-[10px] font-bold text-rose-700 uppercase">Females</p>
                    <p className="text-base font-extrabold text-rose-950 mt-0.5">
                      {stats.currentFemales.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-rose-600 font-medium">Init: {flock.initialFemales}</p>
                  </div>

                  <div className="p-2.5 bg-emerald-50/70 rounded-xl border border-emerald-100">
                    <p className="text-[10px] font-bold text-emerald-700 uppercase">Livability</p>
                    <p className="text-base font-extrabold text-emerald-950 mt-0.5">
                      {typeof stats.livabilityPct === 'number' && !isNaN(stats.livabilityPct) ? stats.livabilityPct.toFixed(1) : '100.0'}%
                    </p>
                    <p className="text-[10px] text-emerald-600 font-medium">Total: {stats.totalCurrent}</p>
                  </div>
                </div>

                {/* Ratio & Depletion metrics */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 font-medium flex items-center gap-1">
                      <HeartHandshake className="w-3.5 h-3.5 text-rose-500" />
                      <span>Male to Female Ratio:</span>
                    </span>
                    <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs">
                      {stats.maleToFemaleRatioStr} ({stats.maleRatioPct}% M)
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 font-medium">Total Depletions (M/F):</span>
                    <span className="font-semibold text-rose-700">
                      -{stats.totalDepleted} birds ({stats.totalMaleDepleted}M, {stats.totalFemaleDepleted}F)
                    </span>
                  </div>
                </div>

                {/* Pens preview */}
                {flock.pens && flock.pens.length > 0 && (
                  <div className="pt-2">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Grid2X2 className="w-3 h-3 text-slate-400" />
                      <span>Pens Configuration ({flock.pens.length} pens)</span>
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {flock.pens.map(pen => (
                        <div key={pen.id} className="p-1.5 bg-slate-100/70 rounded-lg text-[11px] flex justify-between">
                          <span className="font-semibold text-slate-700">{pen.name} ({pen.side}):</span>
                          <span className="text-slate-600 font-medium">{pen.males}M / {pen.females}F</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 truncate max-w-48 italic" title={flock.notes}>
                  {flock.notes || 'Normal flock status'}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(flock)}
                    className="p-1.5 text-teal-700 hover:bg-teal-100 rounded-lg transition flex items-center gap-1 text-[11px] font-bold"
                    title="Edit flock loading dates and breed info"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Date</span>
                  </button>

                  {permissions.canDeleteRecord && (
                    <button
                      onClick={() => deleteFlock(flock.id)}
                      className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition"
                      title="Delete flock record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Edit Flock Loading Dates */}
      {editingFlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="bg-teal-950 p-5 text-white flex items-center justify-between border-b border-teal-900/50">
              <div>
                <h3 className="font-bold text-base text-white">Adjust Flock Loading Dates</h3>
                <p className="text-xs text-teal-300/80">{editingFlock.houseNumber} • Dynamic Age Recalculation</p>
              </div>
              <button onClick={() => setEditingFlock(null)} className="text-teal-400 hover:text-white p-1 rounded-lg">
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              {/* Dynamic Age Preview Card */}
              <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-teal-800 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                    <span>Calculated Age from Placement:</span>
                  </span>
                  <span className="px-2.5 py-1 bg-teal-600 text-white rounded-lg text-xs font-black">
                    Week {editModalAgePreview.ageWeeks} (Day {editModalAgePreview.ageDays})
                  </span>
                </div>
                <p className="text-[11px] text-teal-700">
                  Total days housed: <strong>{editModalAgePreview.totalDaysFromLoading} days</strong> as of today.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Female Placement / Loading Date *</label>
                <input
                  type="date"
                  required
                  value={editLoadingDateFemale}
                  onChange={e => setEditLoadingDateFemale(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-teal-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Male Placement / Loading Date *</label>
                <input
                  type="date"
                  required
                  value={editLoadingDateMale}
                  onChange={e => setEditLoadingDateMale(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-teal-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Breed Type</label>
                <select
                  value={editBreed}
                  onChange={e => setEditBreed(e.target.value as BreedType)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-teal-500 outline-hidden bg-white"
                >
                  <option value="Cobb 500">Cobb 500</option>
                  <option value="Ross 308">Ross 308</option>
                  <option value="Cobb">Cobb</option>
                  <option value="Ross">Ross</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-teal-500 outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingFlock(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add New Flock */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="bg-teal-950 p-5 text-white flex items-center justify-between border-b border-teal-900/50">
              <div>
                <h3 className="font-bold text-base text-white">Register New Breeder Flock</h3>
                <p className="text-xs text-teal-300/80">Set loading numbers and breed genetics parameters</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-teal-400 hover:text-white p-1 rounded-lg">
                &times;
              </button>
            </div>

            <form onSubmit={handleAddFlock} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Dynamic Age Preview Card */}
              <div className="p-3.5 bg-teal-50 border border-teal-200 rounded-2xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-teal-800 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                    <span>Dynamic Placement Age:</span>
                  </span>
                  <span className="px-2 py-0.5 bg-teal-600 text-white rounded-md text-xs font-black">
                    Week {addModalAgePreview.ageWeeks} (Day {addModalAgePreview.ageDays})
                  </span>
                </div>
                <p className="text-[10px] text-teal-700">
                  Calculated automatically from {loadingDateFemale || loadingDateMale} to today.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">House # *</label>
                  <input
                    type="text"
                    required
                    value={houseNumber}
                    onChange={e => setHouseNumber(e.target.value)}
                    placeholder="e.g. House 7"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-teal-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Breed Type *</label>
                  <select
                    value={breed}
                    onChange={e => setBreed(e.target.value as BreedType)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-teal-500 outline-hidden bg-white"
                  >
                    <option value="Cobb 500">Cobb 500</option>
                    <option value="Ross 308">Ross 308</option>
                    <option value="Cobb">Cobb</option>
                    <option value="Ross">Ross</option>
                  </select>
                </div>
              </div>

              {/* Male Population */}
              <div className="p-3.5 bg-teal-50/70 border border-teal-200/80 rounded-2xl space-y-3">
                <p className="text-xs font-bold text-teal-950">Male Population Details</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Initial Males (0 or more) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={initialMales}
                      onChange={e => setInitialMales(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white outline-hidden focus:outline-teal-500 font-bold text-teal-950"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Male Loading Date *</label>
                    <input
                      type="date"
                      required
                      value={loadingDateMale}
                      onChange={e => setLoadingDateMale(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white outline-hidden focus:outline-teal-500"
                    />
                  </div>
                </div>
              </div>

              {/* Female Population */}
              <div className="p-3.5 bg-rose-50/70 border border-rose-200/80 rounded-2xl space-y-3">
                <p className="text-xs font-bold text-rose-950">Female Population Details</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Initial Females (0 or more) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={initialFemales}
                      onChange={e => setInitialFemales(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white outline-hidden focus:outline-rose-500 font-bold text-rose-950"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Female Loading Date *</label>
                    <input
                      type="date"
                      required
                      value={loadingDateFemale}
                      onChange={e => setLoadingDateFemale(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white outline-hidden focus:outline-rose-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Hatch Date (Optional)</label>
                <input
                  type="date"
                  value={hatchDate}
                  onChange={e => setHatchDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-teal-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Placement Details</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-teal-500 outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                >
                  Save Flock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
