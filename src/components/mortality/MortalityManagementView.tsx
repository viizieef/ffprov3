import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import { DepletionReason } from '../../types';
import { 
  Skull, 
  Plus, 
  Trash2, 
  TrendingDown, 
  Activity, 
  Filter, 
  CheckCircle2,
  Calendar,
  Layers,
  HeartHandshake,
  FileSpreadsheet
} from 'lucide-react';
import { exportReportToExcel, ReportMetadata, SheetData } from '../../utils/reportExportUtils';
import { useToast } from '../common/ToastContainer';
import { HouseQuickBar } from '../common/HouseQuickBar';

export const MortalityManagementView: React.FC = () => {
  const { 
    depletions, 
    addDepletion, 
    deleteDepletion, 
    flocks, 
    getFlockStats, 
    farmProfile,
    currentUser,
    permissions 
  } = useFarm();

  const toast = useToast();

  const [selectedHouse, setSelectedHouse] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // New Record Form State
  const [houseNumber, setHouseNumber] = useState('House 1');
  const [category, setCategory] = useState<DepletionReason>('Mortality');
  const [side, setSide] = useState<'Left' | 'Right'>('Left');
  const [maleCount, setMaleCount] = useState<number>(0);
  const [femaleCount, setFemaleCount] = useState<number>(1);
  const [reasonDetails, setReasonDetails] = useState('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [successMsg, setSuccessMsg] = useState(false);

  const handleAddDepletion = (e: React.FormEvent) => {
    e.preventDefault();
    if (maleCount <= 0 && femaleCount <= 0) return;

    addDepletion({
      houseNumber,
      category,
      side,
      maleCount: Number(maleCount),
      femaleCount: Number(femaleCount),
      date,
      sourceModule: 'mortality_mgmt',
      reasonDetails: reasonDetails.trim() || `${category} on ${side} side`
    });

    setMaleCount(0);
    setFemaleCount(0);
    setReasonDetails('');
    setSuccessMsg(true);
    toast.success(
      `Depletion Logged (${houseNumber})`,
      `${Number(maleCount) + Number(femaleCount)} birds recorded under ${category} (${side} side)`
    );
    setTimeout(() => setSuccessMsg(false), 2500);
  };

  // Filtered records
  const filteredRecords = depletions.filter(d => {
    if (selectedHouse !== 'All' && d.houseNumber !== selectedHouse) return false;
    if (selectedCategory !== 'All' && d.category !== selectedCategory) return false;
    return true;
  });

  // Calculate Farm-wide & Category-specific Depletions
  const totalMortalityM = depletions.filter(d => d.category === 'Mortality').reduce((s, d) => s + (Number(d.maleCount) || 0), 0);
  const totalMortalityF = depletions.filter(d => d.category === 'Mortality').reduce((s, d) => s + (Number(d.femaleCount) || 0), 0);

  const totalSpotCullM = depletions.filter(d => d.category === 'Spot Cull').reduce((s, d) => s + (Number(d.maleCount) || 0), 0);
  const totalSpotCullF = depletions.filter(d => d.category === 'Spot Cull').reduce((s, d) => s + (Number(d.femaleCount) || 0), 0);

  const totalMissexM = depletions.filter(d => d.category === 'Missex').reduce((s, d) => s + (Number(d.maleCount) || 0), 0);
  const totalMissexF = depletions.filter(d => d.category === 'Missex').reduce((s, d) => s + (Number(d.femaleCount) || 0), 0);

  const totalSpentCullM = depletions.filter(d => d.category === 'Spent Cull').reduce((s, d) => s + (Number(d.maleCount) || 0), 0);
  const totalSpentCullF = depletions.filter(d => d.category === 'Spent Cull').reduce((s, d) => s + (Number(d.femaleCount) || 0), 0);

  const grandTotalDepletionM = (totalMortalityM || 0) + (totalSpotCullM || 0) + (totalMissexM || 0) + (totalSpentCullM || 0);
  const grandTotalDepletionF = (totalMortalityF || 0) + (totalSpotCullF || 0) + (totalMissexF || 0) + (totalSpentCullF || 0);
  const grandTotalDepletion = grandTotalDepletionM + grandTotalDepletionF;

  const handleExportMortalityExcel = () => {
    const mortData = filteredRecords.map(d => ({
      date: d.date,
      houseNumber: d.houseNumber,
      penName: d.penName || d.side || 'All',
      category: d.category,
      males: d.maleCount || 0,
      females: d.femaleCount || 0,
      totalLost: (d.maleCount || 0) + (d.femaleCount || 0),
      reasonDetails: d.reasonDetails || '',
      source: d.sourceModule || '',
      loggedBy: d.loggedBy || ''
    }));

    const totalM = filteredRecords.reduce((acc, d) => acc + (d.maleCount || 0), 0);
    const totalF = filteredRecords.reduce((acc, d) => acc + (d.femaleCount || 0), 0);

    const meta: ReportMetadata = {
      companyName: farmProfile.name || 'L.P. LIM CITY FAMILY FARM INC',
      logoUrl: farmProfile.logoUrl,
      address: farmProfile.address,
      contactNumber: farmProfile.contactNumber,
      email: farmProfile.email,
      reportTitle: `Flock Mortality & Depletion Incident Report (${selectedHouse})`,
      dateRange: `All Recorded Incidents`,
      houseFilter: selectedHouse,
      generatedBy: currentUser?.fullName || 'Authorized Staff',
      generatedAt: new Date().toLocaleString()
    };

    const sheet: SheetData = {
      sheetName: 'Mortality & Depletion',
      title: 'Flock Mortality, Culling & Depletion Incident Report',
      columns: [
        { header: 'Date', key: 'date', width: 12 },
        { header: 'House', key: 'houseNumber', width: 10 },
        { header: 'Side / Pen', key: 'penName', width: 12 },
        { header: 'Category', key: 'category', width: 18 },
        { header: 'Males Lost', key: 'males', width: 12 },
        { header: 'Females Lost', key: 'females', width: 14 },
        { header: 'Total Birds Lost', key: 'totalLost', width: 16 },
        { header: 'Reason Details', key: 'reasonDetails', width: 35 },
        { header: 'Source Module', key: 'source', width: 14 },
        { header: 'Logged By', key: 'loggedBy', width: 18 }
      ],
      data: mortData,
      summaryRow: {
        date: 'TOTALS',
        houseNumber: `${filteredRecords.length} records`,
        males: totalM,
        females: totalF,
        totalLost: totalM + totalF
      }
    };

    exportReportToExcel(meta, [sheet], `${farmProfile.name ? farmProfile.name.replace(/[^a-zA-Z0-9]/g, '_') : 'Farm'}_Mortality_Report_${selectedHouse}.xlsx`);
    toast.success('Excel Generated', `Downloaded official mortality audit for ${selectedHouse}`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-rose-700 text-xs font-bold uppercase tracking-wider mb-1">
            <Skull className="w-4 h-4" />
            <span>Flock Depletion & Biosecurity Accounting</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Mortality & Depletion Management</h2>
          <p className="text-xs text-slate-500 mt-1">
            Unified accounting of Natural Mortality, Spot Culls, Missex & Spent Culls across Left/Right sides.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            id="export-mortality-excel-btn"
            onClick={handleExportMortalityExcel}
            className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer active:scale-95"
            title="Export Excel with Company Header & Logo"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Excel</span>
          </button>

          {/* Grand Total Depletion Metric Pill */}
          <div className="bg-rose-50/80 border border-rose-200/80 rounded-2xl p-3 sm:px-4 flex items-center gap-3">
            <div className="p-2.5 bg-rose-600 text-white rounded-xl shadow-xs">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-rose-800">Total Farm Depletion</p>
              <p className="text-lg font-black text-rose-950">
                {grandTotalDepletion.toLocaleString()} birds
              </p>
              <p className="text-[10px] text-rose-700 font-medium">
                {grandTotalDepletionM} Males • {grandTotalDepletionF} Females
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* House Quick Selector Bar */}
      <HouseQuickBar
        selectedHouse={selectedHouse}
        onSelectHouse={setSelectedHouse}
        showAllOption={true}
      />

      {/* 4 Depletion Category Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Mortality */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-rose-100 text-rose-800">
              Natural Mortality
            </span>
            <span className="text-xs font-extrabold text-slate-900">{totalMortalityM + totalMortalityF} birds</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">Disease & natural death losses</p>
          <div className="mt-3 pt-2 border-t border-slate-100 flex justify-between text-xs font-semibold">
            <span className="text-teal-700">♂ {totalMortalityM} Males</span>
            <span className="text-rose-700">♀ {totalMortalityF} Females</span>
          </div>
        </div>

        {/* Spot Cull */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-amber-100 text-amber-800">
              Spot Cull
            </span>
            <span className="text-xs font-extrabold text-slate-900">{totalSpotCullM + totalSpotCullF} birds</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">Leg issues, sick, poor vigor</p>
          <div className="mt-3 pt-2 border-t border-slate-100 flex justify-between text-xs font-semibold">
            <span className="text-teal-700">♂ {totalSpotCullM} Males</span>
            <span className="text-rose-700">♀ {totalSpotCullF} Females</span>
          </div>
        </div>

        {/* Missex */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-purple-100 text-purple-800">
              Missex
            </span>
            <span className="text-xs font-extrabold text-slate-900">{totalMissexM + totalMissexF} birds</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">Hatchery sexing corrections</p>
          <div className="mt-3 pt-2 border-t border-slate-100 flex justify-between text-xs font-semibold">
            <span className="text-teal-700">♂ {totalMissexM} Males</span>
            <span className="text-rose-700">♀ {totalMissexF} Females</span>
          </div>
        </div>

        {/* Spent Cull */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-800">
              Spent Cull
            </span>
            <span className="text-xs font-extrabold text-slate-900">{totalSpentCullM + totalSpentCullF} birds</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">Post-peak culling & molting</p>
          <div className="mt-3 pt-2 border-t border-slate-100 flex justify-between text-xs font-semibold">
            <span className="text-teal-700">♂ {totalSpentCullM} Males</span>
            <span className="text-rose-700">♀ {totalSpentCullF} Females</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Form on Left + History Log on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Panel */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Plus className="w-4 h-4 text-rose-600" />
              <span>Record Depletion Entry</span>
            </h3>
            {successMsg && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Saved
              </span>
            )}
          </div>

          <form onSubmit={handleAddDepletion} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">House Number *</label>
              <select
                value={houseNumber}
                onChange={e => setHouseNumber(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold border border-slate-200 rounded-xl bg-white focus:outline-teal-500 outline-hidden"
              >
                {flocks.map(f => (
                  <option key={f.id} value={f.houseNumber}>{f.houseNumber}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Depletion Category *</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as DepletionReason)}
                className="w-full px-3 py-2 text-xs font-semibold border border-slate-200 rounded-xl bg-white focus:outline-teal-500 outline-hidden"
              >
                <option value="Mortality">Natural Mortality</option>
                <option value="Spot Cull">Spot Cull</option>
                <option value="Missex">Missex</option>
                <option value="Spent Cull">Spent Cull</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Side *</label>
                <select
                  value={side}
                  onChange={e => setSide(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white outline-hidden focus:outline-teal-500"
                >
                  <option value="Left">Left Side</option>
                  <option value="Right">Right Side</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date *</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-hidden focus:outline-teal-500"
                />
              </div>
            </div>

            {/* Counts */}
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3">
              <p className="text-xs font-bold text-slate-800">Bird Count Depleted</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-teal-700 mb-1">Males (♂)</label>
                  <input
                    type="number"
                    min="0"
                    value={maleCount}
                    onChange={e => setMaleCount(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-sm font-bold border border-slate-200 rounded-lg bg-white outline-hidden focus:outline-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-rose-700 mb-1">Females (♀)</label>
                  <input
                    type="number"
                    min="0"
                    value={femaleCount}
                    onChange={e => setFemaleCount(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-sm font-bold border border-slate-200 rounded-lg bg-white outline-hidden focus:outline-rose-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reason / Clinical Details</label>
              <input
                type="text"
                value={reasonDetails}
                onChange={e => setReasonDetails(e.target.value)}
                placeholder="e.g. Leg weakness, unthrifty, necropsy showed peritonitis"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-hidden focus:outline-teal-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition active:scale-98"
            >
              Add Depletion Record
            </button>
          </form>
        </div>

        {/* Depletions Log Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Farm Depletion History Log</h3>
              <p className="text-xs text-slate-500">
                Combined logs from Flockman's Module and Mortality Management
              </p>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
              <select
                value={selectedHouse}
                onChange={e => setSelectedHouse(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white outline-hidden focus:outline-teal-500"
              >
                <option value="All">All Houses</option>
                {flocks.map(f => (
                  <option key={f.id} value={f.houseNumber}>{f.houseNumber}</option>
                ))}
              </select>

              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white outline-hidden focus:outline-teal-500"
              >
                <option value="All">All Types</option>
                <option value="Mortality">Mortality</option>
                <option value="Spot Cull">Spot Cull</option>
                <option value="Missex">Missex</option>
                <option value="Spent Cull">Spent Cull</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200/80 sticky top-0">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">House & Side</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Depleted (M/F)</th>
                  <th className="py-2.5 px-3">Details / Pen</th>
                  <th className="py-2.5 px-3">Source</th>
                  {permissions.canDeleteRecord && <th className="py-2.5 px-3 text-right">Del</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No depletion records found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map(record => (
                    <tr key={record.id} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-3 font-medium text-slate-700">{record.date}</td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-slate-900">{record.houseNumber}</span>
                        <span className="text-[10px] text-slate-500 block">{record.side} Side</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          record.category === 'Mortality' ? 'bg-rose-100 text-rose-800' :
                          record.category === 'Spot Cull' ? 'bg-amber-100 text-amber-800' :
                          record.category === 'Missex' ? 'bg-purple-100 text-purple-800' :
                          'bg-slate-200 text-slate-800'
                        }`}>
                          {record.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        <span className="text-teal-700">{record.maleCount}M</span> / <span className="text-rose-700">{record.femaleCount}F</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 truncate max-w-40" title={record.reasonDetails}>
                        {record.penName ? `[${record.penName}] ` : ''}{record.reasonDetails || '—'}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">
                          {record.sourceModule === 'flockman' ? 'Flockman' : 'Mortality'}
                        </span>
                      </td>
                      {permissions.canDeleteRecord && (
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => deleteDepletion(record.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                            title="Delete record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
