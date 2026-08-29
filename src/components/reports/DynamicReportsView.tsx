import React, { useState, useMemo } from 'react';
import { useFarm } from '../../context/FarmContext';
import { CompanyReportHeader, CompanyReportSignatures } from './CompanyReportHeader';
import { EggProductionReportSection } from './EggProductionReportSection';
import { MortalityReportSection } from './MortalityReportSection';
import { VaccinesMedicineReportSection } from './VaccinesMedicineReportSection';
import { exportReportToExcel, exportReportToCsv, ReportMetadata, SheetData } from '../../utils/reportExportUtils';
import { useToast } from '../common/ToastContainer';
import { 
  Printer, 
  FileSpreadsheet, 
  Download, 
  Calendar, 
  Filter, 
  Building2, 
  Egg, 
  Skull, 
  Syringe, 
  Layers, 
  Search, 
  Edit3, 
  Check, 
  X,
  Sparkles,
  RefreshCw
} from 'lucide-react';

export type ReportTabType = 'egg_production' | 'mortality' | 'medicine' | 'master';
export type DatePresetType = 'today' | '7days' | '30days' | 'this_month' | 'all' | 'custom';

export const DynamicReportsView: React.FC = () => {
  const { 
    farmProfile, 
    updateFarmProfile,
    currentUser, 
    flocks, 
    getFlockStats, 
    eggProductionRecords, 
    depletions, 
    medAdministrations, 
    medProducts 
  } = useFarm();

  const toast = useToast();

  // Active Report Tab
  const [activeTab, setActiveTab] = useState<ReportTabType>('egg_production');
  
  // Date Filtering State
  const [datePreset, setDatePreset] = useState<DatePresetType>('30days');
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // House Filter
  const [selectedHouse, setSelectedHouse] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Company Info Edit Modal State
  const [showEditCompanyModal, setShowEditCompanyModal] = useState(false);
  const [companyName, setCompanyName] = useState(farmProfile.name || 'L.P. LIM CITY FAMILY FARM INC');
  const [companyLogo, setCompanyLogo] = useState(farmProfile.logoUrl || '');
  const [companyAddress, setCompanyAddress] = useState(farmProfile.address || '');
  const [companyContact, setCompanyContact] = useState(farmProfile.contactNumber || '');
  const [companyEmail, setCompanyEmail] = useState(farmProfile.email || '');

  // Handle Preset Change
  const handleDatePresetChange = (preset: DatePresetType) => {
    setDatePreset(preset);
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    setEndDate(todayStr);

    if (preset === 'today') {
      setStartDate(todayStr);
    } else if (preset === '7days') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      setStartDate(d.toISOString().split('T')[0]);
    } else if (preset === '30days') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      setStartDate(d.toISOString().split('T')[0]);
    } else if (preset === 'this_month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(firstDay.toISOString().split('T')[0]);
    } else if (preset === 'all') {
      setStartDate('2020-01-01');
    }
  };

  // 1. Filter Egg Production Records
  const filteredEggRecords = useMemo(() => {
    const safeRecords = Array.isArray(eggProductionRecords) ? eggProductionRecords : [];
    return safeRecords.filter(r => {
      if (!r) return false;
      const inDate = (!startDate || r.date >= startDate) && (!endDate || r.date <= endDate);
      const inHouse = selectedHouse === 'All' || r.houseNumber === selectedHouse;
      const inSearch = !searchQuery || 
        (r.houseNumber && r.houseNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (r.loggedBy && r.loggedBy.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (r.notes && r.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      return inDate && inHouse && inSearch;
    }).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [eggProductionRecords, startDate, endDate, selectedHouse, searchQuery]);

  // 2. Filter Mortality Records
  const filteredDepletions = useMemo(() => {
    const safeDepletions = Array.isArray(depletions) ? depletions : [];
    return safeDepletions.filter(d => {
      if (!d) return false;
      const inDate = (!startDate || d.date >= startDate) && (!endDate || d.date <= endDate);
      const inHouse = selectedHouse === 'All' || d.houseNumber === selectedHouse;
      const inSearch = !searchQuery || 
        (d.houseNumber && d.houseNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (d.category && d.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (d.reasonDetails && d.reasonDetails.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (d.loggedBy && d.loggedBy.toLowerCase().includes(searchQuery.toLowerCase()));
      return inDate && inHouse && inSearch;
    }).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [depletions, startDate, endDate, selectedHouse, searchQuery]);

  // 3. Filter Medicine Administrations
  const filteredAdministrations = useMemo(() => {
    const safeAdmins = Array.isArray(medAdministrations) ? medAdministrations : [];
    return safeAdmins.filter(a => {
      if (!a) return false;
      const inDate = (!startDate || a.date >= startDate) && (!endDate || a.date <= endDate);
      const inHouse = selectedHouse === 'All' || a.houseNumber === selectedHouse;
      const inSearch = !searchQuery || 
        (a.houseNumber && a.houseNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (a.productName && a.productName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (a.productType && a.productType.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (a.administeredBy && a.administeredBy.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (a.loggedBy && a.loggedBy.toLowerCase().includes(searchQuery.toLowerCase()));
      return inDate && inHouse && inSearch;
    }).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [medAdministrations, startDate, endDate, selectedHouse, searchQuery]);

  // Date Range Text for Report Header
  const dateRangeText = useMemo(() => {
    if (datePreset === 'today') return `Today (${endDate})`;
    if (datePreset === '7days') return `Last 7 Days (${startDate} to ${endDate})`;
    if (datePreset === '30days') return `Last 30 Days (${startDate} to ${endDate})`;
    if (datePreset === 'this_month') return `Current Month (${startDate} to ${endDate})`;
    if (datePreset === 'all') return `Complete Production Cycle`;
    return `${startDate} to ${endDate}`;
  }, [datePreset, startDate, endDate]);

  const reportMetadata: ReportMetadata = {
    companyName: farmProfile.name || 'L.P. LIM CITY FAMILY FARM INC',
    logoUrl: farmProfile.logoUrl,
    address: farmProfile.address,
    contactNumber: farmProfile.contactNumber,
    email: farmProfile.email,
    reportTitle: activeTab === 'egg_production'
      ? 'Daily Egg Production & Hatching Performance Report'
      : activeTab === 'mortality'
      ? 'Flock Mortality, Culling & Depletion Incident Report'
      : activeTab === 'medicine'
      ? 'Breeder Vaccination & Medication Health Record'
      : 'Comprehensive Master Farm Operations Executive Report',
    dateRange: dateRangeText,
    houseFilter: selectedHouse === 'All' ? 'All Houses (Farm-wide)' : selectedHouse,
    generatedBy: currentUser?.fullName || 'Authorized Staff',
    generatedAt: new Date().toLocaleString()
  };

  // Handle Print Action
  const handlePrint = () => {
    window.print();
  };

  // Handle Excel (.xlsx) Export
  const handleExportExcel = () => {
    const sheets: SheetData[] = [];

    if (activeTab === 'egg_production' || activeTab === 'master') {
      const eggData = filteredEggRecords.map(r => {
        const hePct = r.tep && r.tep > 0 ? ((r.totalHE || 0) / r.tep) * 100 : 0;
        const nhePct = r.tep && r.tep > 0 ? ((r.totalNHE || 0) / r.tep) * 100 : 0;
        return {
          date: r.date,
          houseNumber: r.houseNumber,
          femalePop: r.femalePopulationAtDate || '',
          heNest: r.heNest || 0,
          heFloor: r.heFloor || 0,
          totalHE: r.totalHE || 0,
          hePct: Number(hePct.toFixed(1)),
          small: r.small || 0,
          thinShell: r.thinShell || 0,
          misshape: r.misshape || 0,
          doubleYolk: r.doubleYolk || 0,
          broken: r.broken || 0,
          spoiled: r.spoiled || 0,
          totalNHE: r.totalNHE || 0,
          nhePct: Number(nhePct.toFixed(1)),
          tep: r.tep || 0,
          hendayPct: r.hendayPct ? Number(r.hendayPct.toFixed(1)) : '',
          sampleEggWeight: r.sampleEggWeightGrams ? Number(r.sampleEggWeightGrams.toFixed(1)) : '',
          loggedBy: r.loggedBy || ''
        };
      });

      const totalTEP = filteredEggRecords.reduce((acc, r) => acc + (r.tep || 0), 0);
      const totalHE = filteredEggRecords.reduce((acc, r) => acc + (r.totalHE || 0), 0);
      const totalNHE = filteredEggRecords.reduce((acc, r) => acc + (r.totalNHE || 0), 0);

      sheets.push({
        sheetName: 'Egg Production',
        title: 'Egg Production & Hatching Performance Report',
        columns: [
          { header: 'Date', key: 'date', width: 12 },
          { header: 'House', key: 'houseNumber', width: 10 },
          { header: 'Female Birds', key: 'femalePop', width: 12 },
          { header: 'HE Nest', key: 'heNest', width: 10 },
          { header: 'HE Floor', key: 'heFloor', width: 10 },
          { header: 'Total HE', key: 'totalHE', width: 12 },
          { header: 'HE %', key: 'hePct', width: 10 },
          { header: 'Small', key: 'small', width: 8 },
          { header: 'Thin Shell', key: 'thinShell', width: 10 },
          { header: 'Misshape', key: 'misshape', width: 10 },
          { header: 'Double Yolk', key: 'doubleYolk', width: 12 },
          { header: 'Broken', key: 'broken', width: 8 },
          { header: 'Spoiled', key: 'spoiled', width: 8 },
          { header: 'Total NHE', key: 'totalNHE', width: 12 },
          { header: 'NHE %', key: 'nhePct', width: 10 },
          { header: 'Total Eggs (TEP)', key: 'tep', width: 15 },
          { header: 'Hen-Day %', key: 'hendayPct', width: 12 },
          { header: 'Egg Wt (g)', key: 'sampleEggWeight', width: 12 },
          { header: 'Logged By', key: 'loggedBy', width: 18 }
        ],
        data: eggData,
        summaryRow: {
          date: 'TOTALS',
          houseNumber: `${filteredEggRecords.length} records`,
          totalHE,
          totalNHE,
          tep: totalTEP,
          hePct: totalTEP > 0 ? Number(((totalHE / totalTEP) * 100).toFixed(1)) : 0,
          nhePct: totalTEP > 0 ? Number(((totalNHE / totalTEP) * 100).toFixed(1)) : 0
        }
      });
    }

    if (activeTab === 'mortality' || activeTab === 'master') {
      const mortData = filteredDepletions.map(d => ({
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

      const totalM = filteredDepletions.reduce((acc, d) => acc + (d.maleCount || 0), 0);
      const totalF = filteredDepletions.reduce((acc, d) => acc + (d.femaleCount || 0), 0);

      sheets.push({
        sheetName: 'Mortality & Depletion',
        title: 'Flock Mortality, Culling & Depletion Incident Report',
        columns: [
          { header: 'Date', key: 'date', width: 12 },
          { header: 'House', key: 'houseNumber', width: 10 },
          { header: 'Side / Pen', key: 'penName', width: 12 },
          { header: 'Depletion Category', key: 'category', width: 18 },
          { header: 'Males Lost', key: 'males', width: 12 },
          { header: 'Females Lost', key: 'females', width: 14 },
          { header: 'Total Birds Lost', key: 'totalLost', width: 16 },
          { header: 'Reason / Post-Mortem Diagnosis', key: 'reasonDetails', width: 35 },
          { header: 'Source Module', key: 'source', width: 14 },
          { header: 'Logged By', key: 'loggedBy', width: 18 }
        ],
        data: mortData,
        summaryRow: {
          date: 'TOTALS',
          houseNumber: `${filteredDepletions.length} incidents`,
          males: totalM,
          females: totalF,
          totalLost: totalM + totalF
        }
      });
    }

    if (activeTab === 'medicine' || activeTab === 'master') {
      const medData = filteredAdministrations.map(a => ({
        date: a.date,
        houseNumber: a.houseNumber,
        productName: a.productName,
        productType: a.productType,
        method: a.method,
        unitsUsed: a.unitsUsed,
        totalDoses: a.totalDosesAdministered || (a.unitsUsed * 1000),
        peripherals: a.peripheralsUsed || '',
        administeredBy: a.administeredBy || a.loggedBy || 'Veterinary Crew',
        status: 'Completed'
      }));

      const totalUnits = filteredAdministrations.reduce((acc, a) => acc + (a.unitsUsed || 0), 0);
      const totalDoses = filteredAdministrations.reduce((acc, a) => acc + (a.totalDosesAdministered || (a.unitsUsed * 1000) || 0), 0);

      sheets.push({
        sheetName: 'Vaccines & Medicine',
        title: 'Breeder Vaccination & Medication Health Record',
        columns: [
          { header: 'Admin Date', key: 'date', width: 12 },
          { header: 'House', key: 'houseNumber', width: 10 },
          { header: 'Product Name', key: 'productName', width: 25 },
          { header: 'Product Type', key: 'productType', width: 14 },
          { header: 'Route / Method', key: 'method', width: 20 },
          { header: 'Units Consumed', key: 'unitsUsed', width: 15 },
          { header: 'Total Doses Administered', key: 'totalDoses', width: 22 },
          { header: 'Peripherals / Equipment', key: 'peripherals', width: 25 },
          { header: 'Administered By', key: 'administeredBy', width: 20 },
          { header: 'Status', key: 'status', width: 12 }
        ],
        data: medData,
        summaryRow: {
          date: 'TOTALS',
          houseNumber: `${filteredAdministrations.length} events`,
          unitsUsed: totalUnits,
          totalDoses: totalDoses
        }
      });
    }

    const filename = `${farmProfile.name ? farmProfile.name.replace(/[^a-zA-Z0-9]/g, '_') : 'Farm'}_${activeTab.toUpperCase()}_REPORT_${startDate}_to_${endDate}.xlsx`;
    exportReportToExcel(reportMetadata, sheets, filename);
    toast.success('Excel Workbook Generated', `Downloaded official report with company letterhead for ${activeTab.toUpperCase()}`);
  };

  // Handle CSV Export
  const handleExportCsv = () => {
    if (activeTab === 'egg_production') {
      const columns = [
        { header: 'Date', key: 'date' },
        { header: 'House', key: 'houseNumber' },
        { header: 'HE Nest', key: 'heNest' },
        { header: 'HE Floor', key: 'heFloor' },
        { header: 'Total HE', key: 'totalHE' },
        { header: 'Total NHE', key: 'totalNHE' },
        { header: 'Total Eggs TEP', key: 'tep' },
        { header: 'Hen-Day %', key: 'hendayPct' },
        { header: 'Logged By', key: 'loggedBy' }
      ];
      exportReportToCsv(`Egg_Production_${startDate}_${endDate}.csv`, columns, filteredEggRecords);
    } else if (activeTab === 'mortality') {
      const columns = [
        { header: 'Date', key: 'date' },
        { header: 'House', key: 'houseNumber' },
        { header: 'Category', key: 'category' },
        { header: 'Males Lost', key: 'maleCount' },
        { header: 'Females Lost', key: 'femaleCount' },
        { header: 'Reason', key: 'reasonDetails' },
        { header: 'Logged By', key: 'loggedBy' }
      ];
      exportReportToCsv(`Mortality_Report_${startDate}_${endDate}.csv`, columns, filteredDepletions);
    } else {
      const columns = [
        { header: 'Date', key: 'date' },
        { header: 'House', key: 'houseNumber' },
        { header: 'Product Name', key: 'productName' },
        { header: 'Type', key: 'productType' },
        { header: 'Method', key: 'method' },
        { header: 'Units', key: 'unitsUsed' },
        { header: 'Administered By', key: 'administeredBy' }
      ];
      exportReportToCsv(`Vaccine_Medicine_${startDate}_${endDate}.csv`, columns, filteredAdministrations);
    }
    toast.success('CSV Exported', 'Raw dataset downloaded successfully.');
  };

  // Save updated company info & logo
  const handleSaveCompanyInfo = (e: React.FormEvent) => {
    e.preventDefault();
    updateFarmProfile({
      name: companyName.trim() || farmProfile.name,
      logoUrl: companyLogo.trim() || farmProfile.logoUrl,
      address: companyAddress.trim() || farmProfile.address,
      contactNumber: companyContact.trim() || farmProfile.contactNumber,
      email: companyEmail.trim() || farmProfile.email
    });
    toast.success('Letterhead Updated', 'Farm logo and letterhead details refreshed across all reports.');
    setShowEditCompanyModal(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12 print:p-0 print:m-0 print:space-y-4">
      {/* Top Controls Bar (Hidden during window.print) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs print:hidden space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-forest-900 text-mint-300">
                <FileSpreadsheet className="w-5 h-5 text-mint-400" />
              </span>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Dynamic Farm Reports Hub
                </h1>
                <p className="text-xs text-slate-500">
                  Generate, print, and export official reports for Egg Production, Mortality, Vaccines & Medicine
                </p>
              </div>
            </div>
          </div>

          {/* Top Primary Actions: Print, Export Excel, Edit Company Info */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              id="edit-company-branding-btn"
              onClick={() => {
                setCompanyName(farmProfile.name || '');
                setCompanyLogo(farmProfile.logoUrl || '');
                setCompanyAddress(farmProfile.address || '');
                setCompanyContact(farmProfile.contactNumber || '');
                setCompanyEmail(farmProfile.email || '');
                setShowEditCompanyModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl text-xs font-bold transition cursor-pointer"
              title="Edit Company Name & Logo for Report Headers"
            >
              <Building2 className="w-4 h-4 text-slate-600" />
              <span>Company & Logo</span>
            </button>

            <button
              id="export-csv-btn"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl text-xs font-bold transition cursor-pointer"
              title="Export lightweight CSV format"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>CSV</span>
            </button>

            <button
              id="export-excel-btn"
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-2xl text-xs font-black shadow-xs transition cursor-pointer"
              title="Export full multi-sheet formatted Excel workbook (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export to Excel (.xlsx)</span>
            </button>

            <button
              id="print-report-btn"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-forest-900 hover:bg-forest-800 active:scale-95 text-mint-300 rounded-2xl text-xs font-black shadow-xs transition cursor-pointer"
              title="Print official letterhead document or save as PDF"
            >
              <Printer className="w-4 h-4 text-mint-400" />
              <span>Print Report</span>
            </button>
          </div>
        </div>

        {/* Report Type Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-100">
          <button
            id="tab-egg-production-report"
            onClick={() => setActiveTab('egg_production')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'egg_production'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Egg className="w-4 h-4" />
            <span>Egg Production Report</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/15 font-mono">
              {filteredEggRecords.length}
            </span>
          </button>

          <button
            id="tab-mortality-report"
            onClick={() => setActiveTab('mortality')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'mortality'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Skull className="w-4 h-4" />
            <span>Mortality & Depletion Report</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/15 font-mono">
              {filteredDepletions.length}
            </span>
          </button>

          <button
            id="tab-vaccines-report"
            onClick={() => setActiveTab('medicine')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'medicine'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Syringe className="w-4 h-4" />
            <span>Vaccines & Medicine Report</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/15 font-mono">
              {filteredAdministrations.length}
            </span>
          </button>

          <button
            id="tab-master-report"
            onClick={() => setActiveTab('master')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'master'
                ? 'bg-forest-900 text-mint-300 shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Executive Master Report</span>
          </button>
        </div>

        {/* Dynamic Filters Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Preset Buttons */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Date Period Preset
            </label>
            <div className="grid grid-cols-3 gap-1">
              {[
                { id: 'today', label: 'Today' },
                { id: '7days', label: '7 Days' },
                { id: '30days', label: '30 Days' },
                { id: 'this_month', label: 'Month' },
                { id: 'all', label: 'All Cycle' },
                { id: 'custom', label: 'Custom' }
              ].map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleDatePresetChange(p.id as DatePresetType)}
                  className={`px-2 py-1.5 text-[11px] font-bold rounded-xl transition ${
                    datePreset === p.id 
                      ? 'bg-forest-900 text-mint-300' 
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range Start / End */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Date Range
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={startDate}
                onChange={e => {
                  setStartDate(e.target.value);
                  setDatePreset('custom');
                }}
                className="w-full px-2.5 py-1.5 text-xs font-semibold border border-slate-200 rounded-xl focus:outline-teal-500 bg-slate-50 text-slate-800"
              />
              <span className="text-slate-400 text-xs">to</span>
              <input
                type="date"
                value={endDate}
                onChange={e => {
                  setEndDate(e.target.value);
                  setDatePreset('custom');
                }}
                className="w-full px-2.5 py-1.5 text-xs font-semibold border border-slate-200 rounded-xl focus:outline-teal-500 bg-slate-50 text-slate-800"
              />
            </div>
          </div>

          {/* House Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Flock / House Scope
            </label>
            <select
              value={selectedHouse}
              onChange={e => setSelectedHouse(e.target.value)}
              className="w-full px-3 py-1.5 text-xs font-bold border border-slate-200 rounded-xl focus:outline-teal-500 bg-slate-50 text-slate-800"
            >
              <option value="All">All Houses (Farm-wide)</option>
              {flocks.map(f => (
                <option key={f.id} value={f.houseNumber}>
                  {f.houseNumber} ({f.breed} &bull; {(f.currentFemales + f.currentMales).toLocaleString()} birds)
                </option>
              ))}
            </select>
          </div>

          {/* Search Query */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Search Within Records
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search staff, notes, diseases..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-teal-500 bg-slate-50 text-slate-800"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Printable Document Canvas */}
      <div id="printable-report-canvas" className="bg-transparent print:bg-white">
        {/* Company Header with Logo, Name, Address & Meta */}
        <CompanyReportHeader
          title={
            activeTab === 'egg_production'
              ? 'Daily Egg Production & Hatching Quality Report'
              : activeTab === 'mortality'
              ? 'Flock Mortality, Culling & Depletion Incident Report'
              : activeTab === 'medicine'
              ? 'Breeder Vaccination & Medication Administration Record'
              : 'Comprehensive Master Farm Operations Executive Report'
          }
          subtitle={
            activeTab === 'egg_production'
              ? 'Daily breakdown of Hatching Eggs (Nest/Floor), Non-Hatching, TEP, and Hen-Day %'
              : activeTab === 'mortality'
              ? 'Comprehensive tracking of natural deaths, spot culls, missex, and cumulative livability'
              : activeTab === 'medicine'
              ? 'Official administration history and standard vaccination protocol compliance'
              : 'Consolidated summary of egg production, flock mortality, and medical treatments'
          }
          dateRangeText={dateRangeText}
          houseFilterText={selectedHouse === 'All' ? 'All Houses (Farm-wide)' : selectedHouse}
          categoryFilterText={searchQuery ? `Search: "${searchQuery}"` : undefined}
        />

        {/* Dynamic Section Contents based on activeTab */}
        {activeTab === 'egg_production' && (
          <EggProductionReportSection
            records={filteredEggRecords}
            standardHenday={farmProfile.standardHenday}
            flocks={flocks}
          />
        )}

        {activeTab === 'mortality' && (
          <MortalityReportSection
            depletions={filteredDepletions}
            flocks={flocks}
            getFlockStats={getFlockStats}
          />
        )}

        {activeTab === 'medicine' && (
          <VaccinesMedicineReportSection
            administrations={filteredAdministrations}
            products={medProducts}
            standardProgram={farmProfile.standardVaccinationProgram}
            flocks={flocks}
          />
        )}

        {activeTab === 'master' && (
          <div className="space-y-10">
            <div>
              <h3 className="text-base font-black text-slate-900 mb-4 pb-2 border-b border-slate-200 flex items-center gap-2">
                <Egg className="w-5 h-5 text-amber-600" />
                1. Egg Production & Hatching Performance
              </h3>
              <EggProductionReportSection
                records={filteredEggRecords}
                standardHenday={farmProfile.standardHenday}
                flocks={flocks}
              />
            </div>

            <div className="pt-6">
              <h3 className="text-base font-black text-slate-900 mb-4 pb-2 border-b border-slate-200 flex items-center gap-2">
                <Skull className="w-5 h-5 text-rose-600" />
                2. Mortality, Culls & Depletion Tracking
              </h3>
              <MortalityReportSection
                depletions={filteredDepletions}
                flocks={flocks}
                getFlockStats={getFlockStats}
              />
            </div>

            <div className="pt-6">
              <h3 className="text-base font-black text-slate-900 mb-4 pb-2 border-b border-slate-200 flex items-center gap-2">
                <Syringe className="w-5 h-5 text-teal-600" />
                3. Vaccination & Medication Administration
              </h3>
              <VaccinesMedicineReportSection
                administrations={filteredAdministrations}
                products={medProducts}
                standardProgram={farmProfile.standardVaccinationProgram}
                flocks={flocks}
              />
            </div>
          </div>
        )}

        {/* Formal Report Verification & Sign-off Block */}
        <CompanyReportSignatures />
      </div>

      {/* Edit Company Branding & Logo Modal */}
      {showEditCompanyModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-forest-800" />
                <h3 className="text-base font-bold text-slate-900">Customize Company Branding & Logo</h3>
              </div>
              <button
                onClick={() => setShowEditCompanyModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCompanyInfo} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Farm Name *</label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  placeholder="e.g. L.P. LIM CITY FAMILY FARM INC"
                  className="w-full px-3 py-2 text-xs font-bold border border-slate-200 rounded-xl focus:outline-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Company Logo Image URL</label>
                <input
                  type="url"
                  value={companyLogo}
                  onChange={e => setCompanyLogo(e.target.value)}
                  placeholder="https://... or data:image/png;base64,..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-teal-500"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Paste any valid image link or image hosted online to display in the header
                </p>
              </div>

              {/* Logo Preview */}
              {companyLogo && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-transparent border border-slate-200 shrink-0 flex items-center justify-center p-1">
                    <img 
                      src={companyLogo} 
                      alt="Logo Preview" 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain bg-transparent"
                      onError={(e) => {
                        (e.target as any).style.display = 'none';
                      }}
                    />
                  </div>
                  <div className="text-xs text-slate-600">
                    <p className="font-bold text-slate-900">Logo Preview</p>
                    <p className="text-[10px] text-slate-500">Will be printed on official document headers</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Farm Complex / Address</label>
                <input
                  type="text"
                  value={companyAddress}
                  onChange={e => setCompanyAddress(e.target.value)}
                  placeholder="e.g. San Jose Agro-Industrial Complex, Batangas"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={companyContact}
                    onChange={e => setCompanyContact(e.target.value)}
                    placeholder="+63 917 555 2473"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Official Email</label>
                  <input
                    type="email"
                    value={companyEmail}
                    onChange={e => setCompanyEmail(e.target.value)}
                    placeholder="von.lplimfarm@gmail.com"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-teal-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditCompanyModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-forest-900 hover:bg-forest-800 text-mint-300 rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  Save Company Branding
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
