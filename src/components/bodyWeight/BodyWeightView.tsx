import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import { 
  Scale, 
  Plus, 
  TrendingUp, 
  Calendar, 
  Activity, 
  CheckCircle2, 
  Trash2, 
  ArrowUpRight, 
  ArrowDownRight,
  Sparkles
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';

export const BodyWeightView: React.FC = () => {
  const { 
    bodyWeights, 
    addBodyWeightRecord, 
    deleteBodyWeightRecord, 
    farmProfile, 
    flocks, 
    getFlockStats, 
    permissions 
  } = useFarm();

  const [selectedHouse, setSelectedHouse] = useState('House 1');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Record State
  const [houseNumber, setHouseNumber] = useState('House 1');
  const [week, setWeek] = useState(32);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [maleAvgWeightGrams, setMaleAvgWeightGrams] = useState(4120);
  const [femaleAvgWeightGrams, setFemaleAvgWeightGrams] = useState(3420);
  const [uniformityPct, setUniformityPct] = useState(88);
  const [sampleSize, setSampleSize] = useState(100);
  const [notes, setNotes] = useState('Weekly routine sample weighing');

  const activeFlock = flocks.find(f => f.houseNumber === selectedHouse) || flocks[0];
  const houseRecords = bodyWeights
    .filter(r => r.houseNumber === selectedHouse)
    .sort((a, b) => a.week - b.week);

  // Build combined chart data (standard vs actual)
  const chartData = farmProfile.standardBodyWeights.map(std => {
    const actual = houseRecords.find(r => r.week === std.ageWeek);
    return {
      ageWeek: `Wk ${std.ageWeek}`,
      weekNum: std.ageWeek,
      maleStd: std.maleStandardGrams,
      femaleStd: std.femaleStandardGrams,
      maleActual: actual ? actual.maleAvgWeightGrams : null,
      femaleActual: actual ? actual.femaleAvgWeightGrams : null,
      maleDiff: actual ? actual.maleAvgWeightGrams - std.maleStandardGrams : null,
      femaleDiff: actual ? actual.femaleAvgWeightGrams - std.femaleStandardGrams : null
    };
  });

  const latestRecord = houseRecords[houseRecords.length - 1];
  const latestStd = farmProfile.standardBodyWeights.find(s => s.ageWeek === latestRecord?.week);

  const handleAddRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (maleAvgWeightGrams <= 0 || femaleAvgWeightGrams <= 0) return;

    addBodyWeightRecord({
      houseNumber,
      week: Number(week),
      date,
      maleAvgWeightGrams: Number(maleAvgWeightGrams),
      femaleAvgWeightGrams: Number(femaleAvgWeightGrams),
      uniformityPct: Number(uniformityPct),
      sampleSize: Number(sampleSize),
      notes: notes.trim()
    });

    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-teal-700 text-xs font-bold uppercase tracking-wider mb-1">
            <Scale className="w-4 h-4" />
            <span>Growth & Fleshing Benchmarks</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Body Weight & Growth Curve Analysis</h2>
          <p className="text-xs text-slate-500 mt-1">
            Actual male and female body weights compared against standard Cobb/Ross breed target curves.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedHouse}
            onChange={e => setSelectedHouse(e.target.value)}
            className="px-3.5 py-2.5 text-xs font-bold border border-slate-200 rounded-xl bg-white focus:outline-teal-500 outline-hidden"
          >
            {flocks.map(f => (
              <option key={f.id} value={f.houseNumber}>
                {f.houseNumber} ({f.breed})
              </option>
            ))}
          </select>

          <button
            id="log-body-weight-btn"
            onClick={() => {
              setHouseNumber(selectedHouse);
              setShowAddModal(true);
            }}
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Record Sample Weight</span>
          </button>
        </div>
      </div>

      {/* KPI Cards: Current vs Standard Performance */}
      {latestRecord && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Male Actual Weight */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-teal-700 tracking-wider">
                Male Body Weight (Wk {latestRecord.week})
              </span>
              <span className="text-xs font-bold text-teal-900 bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-100">
                Sample: {latestRecord.sampleSize || 100}
              </span>
            </div>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {(latestRecord.maleAvgWeightGrams || 0).toLocaleString()} <span className="text-sm font-semibold text-slate-500">g</span>
            </p>
            {latestStd && (
              <div className="mt-2 text-xs flex items-center gap-1.5">
                <span className="text-slate-500">Standard: {latestStd.maleStandardGrams || 0}g</span>
                {(() => {
                  const actual = latestRecord.maleAvgWeightGrams || 0;
                  const std = latestStd.maleStandardGrams || 0;
                  const diff = actual - std;
                  return (
                    <span className={`font-bold ${actual >= std ? 'text-teal-600' : 'text-amber-600'}`}>
                      ({actual >= std ? '+' : ''}{isNaN(diff) ? 0 : diff}g)
                    </span>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Female Actual Weight */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-rose-600 tracking-wider">
                Female Body Weight (Wk {latestRecord.week || 1})
              </span>
              <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100">
                Sample: {latestRecord.sampleSize || 100}
              </span>
            </div>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {(latestRecord.femaleAvgWeightGrams || 0).toLocaleString()} <span className="text-sm font-semibold text-slate-500">g</span>
            </p>
            {latestStd && (
              <div className="mt-2 text-xs flex items-center gap-1.5">
                <span className="text-slate-500">Standard: {latestStd.femaleStandardGrams || 0}g</span>
                {(() => {
                  const actual = latestRecord.femaleAvgWeightGrams || 0;
                  const std = latestStd.femaleStandardGrams || 0;
                  const diff = actual - std;
                  return (
                    <span className={`font-bold ${actual >= std ? 'text-emerald-600' : 'text-amber-600'}`}>
                      ({actual >= std ? '+' : ''}{isNaN(diff) ? 0 : diff}g)
                    </span>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Flock Uniformity % */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-teal-700 tracking-wider block">
              Flock Uniformity
            </span>
            <p className="text-2xl font-black text-teal-800 mt-1">
              {latestRecord.uniformityPct || 88}%
            </p>
            <p className="text-xs text-slate-500 mt-2 font-medium">
              Within ±10% Body Weight Mean
            </p>
          </div>

          {/* Weekly Weight Gain */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
              Weekly Gain Pace
            </span>
            <p className="text-xl font-bold text-slate-900 mt-1">
              M: +{latestRecord.weeklyGainMale ?? 35}g • F: +{latestRecord.weeklyGainFemale ?? 28}g
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Last Logged: {latestRecord.date}
            </p>
          </div>
        </div>
      )}

      {/* Visual Growth Curves (Chart Component) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Standard vs Actual Growth Curves (Grams)</h3>
            <p className="text-xs text-slate-500">Visual comparison of breeder flesh progression by week of age</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-teal-700">
              <span className="w-3 h-0.5 bg-teal-600 inline-block"></span> Male Actual
            </span>
            <span className="flex items-center gap-1.5 text-rose-600">
              <span className="w-3 h-0.5 bg-rose-600 inline-block"></span> Female Actual
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-3 h-0.5 bg-slate-400 inline-block border-b border-dashed"></span> Breed Target
            </span>
          </div>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="ageWeek" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} unit="g" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#042f2e',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '12px'
                }}
              />
              <Line type="monotone" dataKey="maleStd" stroke="#94a3b8" strokeDasharray="4 4" name="Male Standard" dot={false} />
              <Line type="monotone" dataKey="femaleStd" stroke="#cbd5e1" strokeDasharray="4 4" name="Female Standard" dot={false} />
              <Line type="monotone" dataKey="maleActual" stroke="#0d9488" strokeWidth={2.5} name="Male Actual" connectNulls />
              <Line type="monotone" dataKey="femaleActual" stroke="#e11d48" strokeWidth={2.5} name="Female Actual" connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Historical Weight Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Historical Body Weight Records ({selectedHouse})</h3>
          <span className="text-xs text-slate-500 font-medium">{houseRecords.length} records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Age (Week)</th>
                <th className="py-2.5 px-3">Male Avg (g)</th>
                <th className="py-2.5 px-3">Female Avg (g)</th>
                <th className="py-2.5 px-3">Uniformity %</th>
                <th className="py-2.5 px-3">Sample Count</th>
                <th className="py-2.5 px-3">Logged By</th>
                {permissions.canDeleteRecord && <th className="py-2.5 px-3 text-right">Del</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {houseRecords.map(rec => (
                <tr key={rec.id} className="hover:bg-slate-50 transition">
                  <td className="py-2.5 px-3 font-medium text-slate-700">{rec.date}</td>
                  <td className="py-2.5 px-3 font-bold text-slate-900">Week {rec.week}</td>
                  <td className="py-2.5 px-3 font-bold text-teal-950">{rec.maleAvgWeightGrams.toLocaleString()} g</td>
                  <td className="py-2.5 px-3 font-bold text-rose-900">{rec.femaleAvgWeightGrams.toLocaleString()} g</td>
                  <td className="py-2.5 px-3 font-semibold text-emerald-700">{rec.uniformityPct || 88}%</td>
                  <td className="py-2.5 px-3 text-slate-600">{rec.sampleSize || 100} birds</td>
                  <td className="py-2.5 px-3 text-slate-500">{rec.loggedBy}</td>
                  {permissions.canDeleteRecord && (
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => deleteBodyWeightRecord(rec.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Record Sample Weight */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="bg-teal-950 p-5 text-white flex items-center justify-between border-b border-teal-900/50">
              <div>
                <h3 className="font-bold text-base text-white">Record Weekly Sample Weights</h3>
                <p className="text-xs text-teal-300/80">Log sample bird weights and uniformity</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-teal-400 hover:text-white p-1 rounded-lg">
                &times;
              </button>
            </div>

            <form onSubmit={handleAddRecord} className="p-6 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">House Number *</label>
                  <select
                    value={houseNumber}
                    onChange={e => setHouseNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white outline-hidden focus:outline-teal-500"
                  >
                    {flocks.map(f => (
                      <option key={f.id} value={f.houseNumber}>{f.houseNumber}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Flock Age (Weeks) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="80"
                    value={week}
                    onChange={e => setWeek(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-hidden font-bold focus:outline-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Weighing Date *</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-hidden focus:outline-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-teal-50/70 p-3 rounded-2xl border border-teal-200/80">
                  <label className="block font-bold text-teal-950 mb-1">Male Avg Weight (g) *</label>
                  <input
                    type="number"
                    required
                    value={maleAvgWeightGrams}
                    onChange={e => setMaleAvgWeightGrams(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white outline-hidden font-bold text-teal-950 focus:outline-teal-500"
                  />
                </div>

                <div className="bg-rose-50/70 p-3 rounded-2xl border border-rose-200/80">
                  <label className="block font-bold text-rose-950 mb-1">Female Avg Weight (g) *</label>
                  <input
                    type="number"
                    required
                    value={femaleAvgWeightGrams}
                    onChange={e => setFemaleAvgWeightGrams(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white outline-hidden font-bold text-rose-950 focus:outline-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Uniformity %</label>
                  <input
                    type="number"
                    min="50"
                    max="100"
                    value={uniformityPct}
                    onChange={e => setUniformityPct(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-hidden focus:outline-teal-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Sample Count (Birds)</label>
                  <input
                    type="number"
                    value={sampleSize}
                    onChange={e => setSampleSize(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-hidden focus:outline-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes / Fleshing Score</label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. Fleshing score 3, calm disposition"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-hidden focus:outline-teal-500"
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
                  Save Weight Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
