import React, { useState, useMemo } from 'react';
import { useFarm } from '../../context/FarmContext';
import { HatchingSummaryRecord } from '../../types';
import { 
  Egg, 
  Plus, 
  Search, 
  Filter, 
  FileSpreadsheet, 
  Eye, 
  Edit3, 
  Trash2, 
  Calendar, 
  Sparkles, 
  Award, 
  TrendingUp, 
  Building2, 
  Layers, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { exportReportToExcel, ReportMetadata, SheetData } from '../../utils/reportExportUtils';
import { useToast } from '../common/ToastContainer';
import { HatchingSummaryFormModal } from './HatchingSummaryFormModal';
import { HatchingSummaryPrintDocument } from './HatchingSummaryPrintDocument';

export const HatchingSummaryTab: React.FC = () => {
  const { 
    hatchingSummaries = [], 
    deleteHatchingSummary, 
    currentUser, 
    farmProfile, 
    flocks = [] 
  } = useFarm();
  const toast = useToast();

  const safeSummaries = Array.isArray(hatchingSummaries) ? hatchingSummaries : [];

  const [searchQuery, setSearchQuery] = useState('');
  const [houseFilter, setHouseFilter] = useState<string>('All');
  const [breedFilter, setBreedFilter] = useState<string>('All');

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingSummary, setEditingSummary] = useState<HatchingSummaryRecord | null>(null);
  const [selectedSummaryForView, setSelectedSummaryForView] = useState<HatchingSummaryRecord | null>(null);

  // Filtered Summaries
  const filteredSummaries = useMemo(() => {
    return safeSummaries.filter(item => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || (
        item.settingDate.includes(q) ||
        item.pullOutDate.includes(q) ||
        item.breed.toLowerCase().includes(q) ||
        `house ${item.houseNumber}`.toLowerCase().includes(q) ||
        (item.hatcheryName && item.hatcheryName.toLowerCase().includes(q)) ||
        (item.notes && item.notes.toLowerCase().includes(q))
      );

      const matchesHouse = houseFilter === 'All' || String(item.houseNumber) === houseFilter;
      const matchesBreed = breedFilter === 'All' || item.breed.toLowerCase() === breedFilter.toLowerCase();

      return matchesSearch && matchesHouse && matchesBreed;
    });
  }, [safeSummaries, searchQuery, houseFilter, breedFilter]);

  // Aggregate Metrics
  const summaryTotals = useMemo(() => {
    const totalEggsSet = filteredSummaries.reduce((acc, s) => acc + (s.eggsSet || 0), 0);
    const totalStandardChicks = filteredSummaries.reduce((acc, s) => acc + (s.standardChicks || 0), 0);
    const totalGradeOut = filteredSummaries.reduce((acc, s) => acc + (s.gradeOut || 0), 0);
    const totalChicksPulled = filteredSummaries.reduce((acc, s) => acc + (s.totalChicksPulled || 0), 0);
    
    const avgTotalHatchPct = totalEggsSet > 0 
      ? (totalChicksPulled / totalEggsSet) * 100 
      : 0;
    const avgSaleableHatchPct = totalEggsSet > 0 
      ? (totalStandardChicks / totalEggsSet) * 100 
      : 0;
    const avgGradeOutPct = totalEggsSet > 0 
      ? (totalGradeOut / totalEggsSet) * 100 
      : 0;

    return {
      totalEggsSet,
      totalStandardChicks,
      totalGradeOut,
      totalChicksPulled,
      avgTotalHatchPct,
      avgSaleableHatchPct,
      avgGradeOutPct,
      count: filteredSummaries.length
    };
  }, [filteredSummaries]);

  // House-by-House summaries
  const houseCards = useMemo(() => {
    return [1, 2, 3, 4, 5, 6].map(hNum => {
      const records = safeSummaries.filter(s => String(s.houseNumber) === String(hNum));
      const houseFlock = flocks.find(f => String(f.houseNumber) === String(hNum));
      const totalEggs = records.reduce((acc, r) => acc + r.eggsSet, 0);
      const totalStd = records.reduce((acc, r) => acc + r.standardChicks, 0);
      const totalPulled = records.reduce((acc, r) => acc + r.totalChicksPulled, 0);
      const avgSaleable = totalEggs > 0 ? ((totalStd / totalEggs) * 100).toFixed(2) : '0.00';
      const avgTotal = totalEggs > 0 ? ((totalPulled / totalEggs) * 100).toFixed(2) : '0.00';
      const latest = records[0] || null;

      return {
        houseNumber: hNum,
        breed: houseFlock?.breed || latest?.breed || (hNum % 2 === 0 ? 'Ross 308' : 'Cobb 500'),
        recordsCount: records.length,
        totalEggs,
        totalStd,
        avgSaleable,
        avgTotal,
        latest
      };
    });
  }, [safeSummaries, flocks]);

  const handleOpenCreateModal = () => {
    setEditingSummary(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (item: HatchingSummaryRecord) => {
    setEditingSummary(item);
    setIsFormModalOpen(true);
  };

  const handleDelete = (id: string, houseNo: string, date: string) => {
    if (window.confirm(`Are you sure you want to delete Hatching Summary for House ${houseNo} (Setting Date: ${date})?`)) {
      deleteHatchingSummary(id);
      toast.success(`Deleted Hatching Summary for House ${houseNo}`);
      if (selectedSummaryForView?.id === id) {
        setSelectedSummaryForView(null);
      }
    }
  };

  const handleExportAllToExcel = () => {
    if (filteredSummaries.length === 0) {
      toast.warning('No hatching summary records to export.');
      return;
    }

    const metadata: ReportMetadata = {
      companyName: farmProfile?.name || 'SAN MIGUEL FOODS, INC.',
      address: farmProfile?.address || 'Gen. Aguinaldo, Ramon, Isabela',
      contactNumber: 'LPL Farm Operations',
      email: 'von.lplimfarm@gmail.com',
      reportTitle: 'MASTER HATCHING SUMMARY REPORT',
      dateRange: `All Recorded Hatch Cycles (${filteredSummaries.length} Batches)`,
      houseFilter: houseFilter === 'All' ? 'All Houses (1 to 6)' : `House ${houseFilter}`,
      generatedBy: currentUser?.fullName || 'Farm Admin',
      generatedAt: new Date().toLocaleString()
    };

    const columns = [
      { header: 'SETTING DATE', key: 'settingDate', width: 14 },
      { header: 'HOUSE', key: 'houseNumber', width: 12 },
      { header: 'BREED', key: 'breed', width: 14 },
      { header: '# OF EGGS SET', key: 'eggsSet', width: 16 },
      { header: 'PULL-OUT DATE', key: 'pullOutDate', width: 14 },
      { header: 'STANDARD CHICKS', key: 'standardChicks', width: 16 },
      { header: 'GRADE OUT', key: 'gradeOut', width: 14 },
      { header: 'TOTAL CHICKS PULLED', key: 'totalChicksPulled', width: 18 },
      { header: 'TOTAL HATCH %', key: 'totalHatchPct', width: 14 },
      { header: 'SALEABLE HATCH %', key: 'saleableHatchPct', width: 16 },
      { header: 'GRADE OUT %', key: 'gradeOutPct', width: 14 },
      { header: 'HATCHERY', key: 'hatcheryName', width: 16 },
      { header: 'ESRRR VOUCHER REF', key: 'esrrrNumber', width: 16 },
      { header: 'REMARKS / NOTES', key: 'notes', width: 30 }
    ];

    const data = filteredSummaries.map(s => ({
      settingDate: s.settingDate,
      houseNumber: `House ${s.houseNumber}`,
      breed: s.breed,
      eggsSet: s.eggsSet,
      pullOutDate: s.pullOutDate,
      standardChicks: s.standardChicks,
      gradeOut: s.gradeOut,
      totalChicksPulled: s.totalChicksPulled,
      totalHatchPct: `${s.totalHatchPct.toFixed(2)}%`,
      saleableHatchPct: `${s.saleableHatchPct.toFixed(2)}%`,
      gradeOutPct: `${(s.gradeOutPct || 0).toFixed(2)}%`,
      hatcheryName: s.hatcheryName || 'MJBJ Hatchery',
      esrrrNumber: s.esrrrNumber || 'N/A',
      notes: s.notes || ''
    }));

    const sheets: SheetData[] = [
      {
        sheetName: 'HATCHING_SUMMARY_MASTER',
        title: 'Master Hatching Summary & Chick Yield Log',
        columns,
        data
      }
    ];

    exportReportToExcel(metadata, sheets, `Hatching_Summary_Master_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Downloaded Master Hatching Summary Excel spreadsheet!');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Action Bar & Summary Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              SMFI Breeder Protocol
            </span>
            <span className="text-xs text-slate-400 font-bold">&bull; 21-Day Pull-out Cycle</span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-slate-950 font-display tracking-tight mt-1">
            Hatching Summary & Chick Pull-out Yields
          </h2>
          <p className="text-xs text-slate-600">
            Track Setting Date, House, Breed, # of Eggs Set, Pull-out Date, Standard Chicks, Grade Out, Total Chicks Pulled, Total Hatch % and Saleable Hatch %.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={handleExportAllToExcel}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition border border-slate-200 cursor-pointer shadow-2xs"
            title="Export Hatching Summary table to Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-slate-950 font-black text-xs rounded-xl transition shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Hatching Summary</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
        
        {/* Total Eggs Set */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Eggs Set</span>
          <span className="text-xl sm:text-2xl font-black font-mono text-slate-900 block mt-1">
            {summaryTotals.totalEggsSet.toLocaleString()}
          </span>
          <span className="text-[10px] font-semibold text-slate-500 block mt-0.5">
            {summaryTotals.count} batches recorded
          </span>
        </div>

        {/* Standard Chicks */}
        <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">Standard Chicks</span>
          <span className="text-xl sm:text-2xl font-black font-mono text-emerald-950 block mt-1">
            {summaryTotals.totalStandardChicks.toLocaleString()}
          </span>
          <span className="text-[10px] font-extrabold text-emerald-700 block mt-0.5">
            Saleable Grade A
          </span>
        </div>

        {/* Grade Out */}
        <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">Grade Out</span>
          <span className="text-xl sm:text-2xl font-black font-mono text-amber-950 block mt-1">
            {summaryTotals.totalGradeOut.toLocaleString()}
          </span>
          <span className="text-[10px] font-bold text-amber-700 block mt-0.5">
            {summaryTotals.avgGradeOutPct.toFixed(2)}% cull rate
          </span>
        </div>

        {/* Total Chicks Pulled */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Pulled</span>
          <span className="text-xl sm:text-2xl font-black font-mono text-slate-900 block mt-1">
            {summaryTotals.totalChicksPulled.toLocaleString()}
          </span>
          <span className="text-[10px] font-semibold text-slate-500 block mt-0.5">
            Standard + Grade Out
          </span>
        </div>

        {/* Total Hatch % */}
        <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Hatch %</span>
          <span className="text-xl sm:text-2xl font-black font-mono text-emerald-400 block mt-1">
            {summaryTotals.avgTotalHatchPct.toFixed(2)}%
          </span>
          <span className="text-[10px] font-semibold text-slate-400 block mt-0.5">
            Target &ge; 88.0%
          </span>
        </div>

        {/* Saleable Hatch % */}
        <div className="bg-emerald-600 text-slate-950 p-4 rounded-2xl border border-emerald-500 shadow-2xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-950 block">Saleable Hatch %</span>
          <span className="text-xl sm:text-2xl font-black font-mono text-slate-950 block mt-1">
            {summaryTotals.avgSaleableHatchPct.toFixed(2)}%
          </span>
          <span className="text-[10px] font-black text-emerald-950 block mt-0.5">
            Target &ge; 85.0%
          </span>
        </div>

      </div>

      {/* House Performance Quick Overview */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-600" />
          <span>House Performance Overview (Houses 1 to 6)</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {houseCards.map(h => (
            <button
              key={h.houseNumber}
              onClick={() => setHouseFilter(houseFilter === String(h.houseNumber) ? 'All' : String(h.houseNumber))}
              className={`p-3 rounded-2xl text-left border transition cursor-pointer ${
                houseFilter === String(h.houseNumber)
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-900 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-black text-xs">House {h.houseNumber}</span>
                <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded-md font-bold ${
                  houseFilter === String(h.houseNumber) ? 'bg-slate-800 text-emerald-400' : 'bg-white text-slate-600 border border-slate-200'
                }`}>
                  {h.breed}
                </span>
              </div>
              <div className="mt-2 space-y-0.5">
                <div className="text-[10px] flex items-center justify-between">
                  <span className={houseFilter === String(h.houseNumber) ? 'text-slate-400' : 'text-slate-500'}>Saleable:</span>
                  <span className="font-black font-mono text-emerald-500">{h.avgSaleable}%</span>
                </div>
                <div className="text-[10px] flex items-center justify-between">
                  <span className={houseFilter === String(h.houseNumber) ? 'text-slate-400' : 'text-slate-500'}>Total Hatch:</span>
                  <span className="font-bold font-mono">{h.avgTotal}%</span>
                </div>
                <div className="text-[9px] text-slate-400 pt-1 border-t border-slate-200/40">
                  {h.recordsCount} {h.recordsCount === 1 ? 'batch' : 'batches'} logged
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search Setting Date, House, Breed, Pull-out Date, Hatchery, Notes..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-2">
          
          {/* House Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500">House:</span>
            <select
              value={houseFilter}
              onChange={e => setHouseFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            >
              <option value="All">All Houses (1-6)</option>
              {[1, 2, 3, 4, 5, 6].map(num => (
                <option key={num} value={String(num)}>House {num}</option>
              ))}
            </select>
          </div>

          {/* Breed Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500">Breed:</span>
            <select
              value={breedFilter}
              onChange={e => setBreedFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            >
              <option value="All">All Breeds</option>
              <option value="Cobb 500">Cobb 500</option>
              <option value="Ross 308">Ross 308</option>
            </select>
          </div>

        </div>
      </div>

      {/* Master Hatching Summary Interactive Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
                <th className="px-4 py-3.5">Setting Date</th>
                <th className="px-4 py-3.5">House</th>
                <th className="px-4 py-3.5">Breed</th>
                <th className="px-4 py-3.5 text-right"># of Eggs Set</th>
                <th className="px-4 py-3.5">Pull-out Date</th>
                <th className="px-4 py-3.5 text-right">Standard Chicks</th>
                <th className="px-4 py-3.5 text-right">Grade Out</th>
                <th className="px-4 py-3.5 text-right">Total Chicks Pulled</th>
                <th className="px-4 py-3.5 text-right">Total Hatch %</th>
                <th className="px-4 py-3.5 text-right">Saleable Hatch %</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredSummaries.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-6 py-12 text-center text-slate-500">
                    <div className="max-w-xs mx-auto space-y-2">
                      <Egg className="w-8 h-8 mx-auto text-slate-300" />
                      <p className="font-bold text-slate-700">No hatching summary records found</p>
                      <p className="text-[11px] text-slate-400">
                        Click &quot;New Hatching Summary&quot; to log setting dates, chick pull-out yields, and hatchability rates.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSummaries.map((item) => {
                  const isEx = item.saleableHatchPct >= 87.0;
                  const isStd = item.saleableHatchPct >= 85.0 && item.saleableHatchPct < 87.0;

                  return (
                    <tr 
                      key={item.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => setSelectedSummaryForView(item)}
                    >
                      
                      {/* Setting Date */}
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{item.settingDate}</span>
                        </div>
                      </td>

                      {/* House */}
                      <td className="px-4 py-3 font-black text-slate-900">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200">
                          House {item.houseNumber}
                        </span>
                      </td>

                      {/* Breed */}
                      <td className="px-4 py-3 font-bold text-slate-700">
                        {item.breed}
                      </td>

                      {/* # of Eggs set */}
                      <td className="px-4 py-3 text-right font-mono font-black text-slate-900 bg-slate-50/40">
                        {item.eggsSet.toLocaleString()}
                      </td>

                      {/* Pull-out Date */}
                      <td className="px-4 py-3 font-mono font-bold text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-sky-600" />
                          <span>{item.pullOutDate}</span>
                        </div>
                      </td>

                      {/* Standard Chicks */}
                      <td className="px-4 py-3 text-right font-mono font-black text-emerald-950 bg-emerald-50/30">
                        {item.standardChicks.toLocaleString()}
                      </td>

                      {/* Grade out */}
                      <td className="px-4 py-3 text-right font-mono font-bold text-amber-950">
                        {item.gradeOut.toLocaleString()}
                      </td>

                      {/* Total Chicks Pulled */}
                      <td className="px-4 py-3 text-right font-mono font-black text-slate-900">
                        {item.totalChicksPulled.toLocaleString()}
                      </td>

                      {/* Total Hatch % */}
                      <td className="px-4 py-3 text-right font-mono font-black text-slate-900">
                        {item.totalHatchPct.toFixed(2)}%
                      </td>

                      {/* Saleable Hatch % */}
                      <td className="px-4 py-3 text-right font-mono font-black text-emerald-700 bg-emerald-50/40">
                        {item.saleableHatchPct.toFixed(2)}%
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                          isEx ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                          isStd ? 'bg-sky-100 text-sky-800 border border-sky-200' :
                          'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {isEx ? '≥87% Ex' : isStd ? '≥85% Std' : '<85% Sub'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedSummaryForView(item)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                            title="View Printable Voucher Slip"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition cursor-pointer"
                            title="Edit Hatching Summary"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDelete(item.id, item.houseNumber, item.settingDate)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Delete Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail & Printable Slip Modal */}
      {selectedSummaryForView && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
          <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <HatchingSummaryPrintDocument
              summary={selectedSummaryForView}
              onClose={() => setSelectedSummaryForView(null)}
            />
          </div>
        </div>
      )}

      {/* Form Modal (Create / Edit) */}
      <HatchingSummaryFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        initialData={editingSummary}
        onSaved={(saved) => {
          setSelectedSummaryForView(saved);
        }}
      />

    </div>
  );
};
