import React, { useState, useMemo, useCallback } from 'react';
import { useFarm } from '../../context/FarmContext';
import { EggCollectionEntry, EggSortingBreakdown } from '../../types';
import { 
  Egg, 
  Plus, 
  Share2, 
  Copy, 
  Check, 
  Calendar, 
  TrendingUp, 
  Layers, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  Clock,
  Sparkles,
  Scale,
  FileSpreadsheet,
  Search
} from 'lucide-react';
import { exportReportToExcel, ReportMetadata, SheetData } from '../../utils/reportExportUtils';
import { useToast } from '../common/ToastContainer';
import { HouseQuickBar } from '../common/HouseQuickBar';

export const EggProductionView: React.FC = () => {
  const { 
    eggProductionRecords = [], 
    addEggProductionRecord, 
    deleteEggProductionRecord, 
    flocks = [], 
    getFlockStats, 
    farmProfile,
    currentUser, 
    permissions 
  } = useFarm();

  const toast = useToast();

  const safeFlocks = Array.isArray(flocks) ? flocks : [];
  const safeEggProductionRecords = Array.isArray(eggProductionRecords) ? eggProductionRecords : [];

  const [selectedHouse, setSelectedHouse] = useState<string>(() => {
    if (currentUser?.designatedHouses && currentUser.designatedHouses.length > 0) {
      return currentUser.designatedHouses[0];
    }
    return (safeFlocks && safeFlocks[0]?.houseNumber) || 'House 1';
  });

  const [showLogModal, setShowLogModal] = useState(false);
  const [showMessengerReportModal, setShowMessengerReportModal] = useState(false);
  const [reportDate, setReportDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [copied, setCopied] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [displayLimit, setDisplayLimit] = useState(30);

  // Form State for Recording Egg Production
  const [houseNumber, setHouseNumber] = useState(selectedHouse === 'All' ? ((safeFlocks && safeFlocks[0]?.houseNumber) || 'House 1') : selectedHouse);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [sampleEggWeight, setSampleEggWeight] = useState(58.4);
  const [notes, setNotes] = useState('');

  // Collections (1st, 2nd, 3rd collection, left & right)
  const [c1Left, setC1Left] = useState(1200);
  const [c1Right, setC1Right] = useState(1250);
  const [c2Left, setC2Left] = useState(1800);
  const [c2Right, setC2Right] = useState(1850);
  const [c3Left, setC3Left] = useState(1150);
  const [c3Right, setC3Right] = useState(1170);

  // Hatching Eggs Classification (HE Nest Egg & HE Floor Egg)
  const [heNest, setHeNest] = useState(7750);
  const [heFloor, setHeFloor] = useState(50);

  // Non-Hatching Eggs Breakdown (Matching Farm Standard: SMALL, BROKEN, TS, DY, MS, OTH, SPOILED)
  const [nheSmall, setNheSmall] = useState(25);
  const [nheBroken, setNheBroken] = useState(30);
  const [nheThinShell, setNheThinShell] = useState(42);
  const [nheDoubleYolk, setNheDoubleYolk] = useState(14);
  const [nheMisshape, setNheMisshape] = useState(56);
  const [nheOthers, setNheOthers] = useState(10);
  const [nheSpoiled, setNheSpoiled] = useState(60);

  const totalCalculatedHE = useMemo(() => (Number(heNest) || 0) + (Number(heFloor) || 0), [heNest, heFloor]);
  const totalCalculatedNHE = useMemo(() => 
    (Number(nheSmall) || 0) + 
    (Number(nheBroken) || 0) + 
    (Number(nheThinShell) || 0) + 
    (Number(nheDoubleYolk) || 0) + 
    (Number(nheMisshape) || 0) + 
    (Number(nheOthers) || 0) + 
    (Number(nheSpoiled) || 0),
    [nheSmall, nheBroken, nheThinShell, nheDoubleYolk, nheMisshape, nheOthers, nheSpoiled]
  );
  const grandTotalLoggedEggs = useMemo(() => totalCalculatedHE + totalCalculatedNHE, [totalCalculatedHE, totalCalculatedNHE]);

  const activeFlock = useMemo(() => {
    if (!safeFlocks || safeFlocks.length === 0) return null;
    return safeFlocks.find(f => f && f.houseNumber === selectedHouse) || safeFlocks[0];
  }, [safeFlocks, selectedHouse]);

  const activeHouseRecords = useMemo(() => {
    const records = safeEggProductionRecords;
    if (selectedHouse === 'All') return records;
    return records.filter(r => r && r.houseNumber === selectedHouse);
  }, [safeEggProductionRecords, selectedHouse]);

  const filteredHistoryRecords = useMemo(() => {
    const records = activeHouseRecords || [];
    if (!searchFilter.trim()) return records;
    const q = searchFilter.toLowerCase().trim();
    return records.filter(r => 
      r && (
        (r.date && r.date.toLowerCase().includes(q)) || 
        (r.houseNumber && r.houseNumber.toLowerCase().includes(q)) || 
        (r.loggedBy && r.loggedBy.toLowerCase().includes(q))
      )
    );
  }, [activeHouseRecords, searchFilter]);

  // Latest production metrics
  const latestProd = useMemo(() => {
    if (activeHouseRecords && activeHouseRecords.length > 0) return activeHouseRecords[0];
    if (safeEggProductionRecords && safeEggProductionRecords.length > 0) return safeEggProductionRecords[0];
    return null;
  }, [activeHouseRecords, safeEggProductionRecords]);

  const handleSaveEggRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const flock = (flocks || []).find(f => f.houseNumber === houseNumber);
    const fStats = flock && getFlockStats ? getFlockStats(flock.houseNumber) : null;
    const femalePop = fStats ? fStats.currentFemales : ((flock && (Number(flock.currentFemales) || 0)) || 9500);

    const collections: EggCollectionEntry[] = [
      { id: 'c1', collectionNumber: 1, collectionTime: '08:00 AM', leftSideCount: Number(c1Left), rightSideCount: Number(c1Right), totalCount: Number(c1Left) + Number(c1Right) },
      { id: 'c2', collectionNumber: 2, collectionTime: '11:30 AM', leftSideCount: Number(c2Left), rightSideCount: Number(c2Right), totalCount: Number(c2Left) + Number(c2Right) },
      { id: 'c3', collectionNumber: 3, collectionTime: '03:30 PM', leftSideCount: Number(c3Left), rightSideCount: Number(c3Right), totalCount: Number(c3Left) + Number(c3Right) }
    ];

    const sorting: EggSortingBreakdown = {
      hatchingEggs: {
        total: totalCalculatedHE,
        heNest: Number(heNest),
        heFloor: Number(heFloor)
      },
      nonHatchingEggs: {
        total: totalCalculatedNHE,
        dirty: Number(nheSpoiled),
        cracked: Number(nheThinShell),
        broken: Number(nheBroken),
        abnormal: Number(nheMisshape),
        doubleYolk: Number(nheDoubleYolk),
        softShelled: Number(nheOthers),
        misshapen: Number(nheMisshape),
        leakers: 0
      }
    };

    addEggProductionRecord({
      houseNumber,
      date,
      heNest: Number(heNest),
      heFloor: Number(heFloor),
      small: Number(nheSmall),
      broken: Number(nheBroken),
      thinShell: Number(nheThinShell),
      doubleYolk: Number(nheDoubleYolk),
      misshape: Number(nheMisshape),
      others: Number(nheOthers),
      spoiled: Number(nheSpoiled),
      totalHE: totalCalculatedHE,
      totalNHE: totalCalculatedNHE,
      tep: grandTotalLoggedEggs,
      collections,
      sorting,
      sampleEggWeightGrams: Number(sampleEggWeight),
      femalePopulationAtDate: femalePop,
      notes: notes.trim()
    });

    toast.success(
      `Egg Record Saved (${houseNumber})`,
      `${grandTotalLoggedEggs.toLocaleString()} eggs graded (${totalCalculatedHE.toLocaleString()} HE / ${totalCalculatedNHE.toLocaleString()} NHE)`
    );

    setShowLogModal(false);
  };

  // Generate the exact "Messenger Report" formatted text
  const generateMessengerReport = useCallback((targetDate: string) => {
    const records = eggProductionRecords || [];
    const houseFlocks = flocks || [];
    const recordsOnDate = records.filter(r => r.date === targetDate);
    let dateFormatted = targetDate;
    try {
      dateFormatted = new Date(targetDate + 'T00:00:00').toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      }).toUpperCase();
    } catch {
      dateFormatted = targetDate;
    }

    const companyName = ((farmProfile?.name) || 'L.P. LIM CITY FAMILY FARM INC').toUpperCase();

    let report = `${companyName}\nDAILY EGG REPORT\n\nDATE:\t${dateFormatted}\n\n`;

    let totalTEP = 0;
    let totalHENest = 0;
    let totalHEFloor = 0;
    let totalHE = 0;
    let totalNHE = 0;
    let totalSpoil = 0;
    let totalDY = 0;

    // Houses with records on this date
    const activeRecords = recordsOnDate.length > 0 
      ? recordsOnDate 
      : houseFlocks.map(f => ({
          houseNumber: f.houseNumber,
          tep: 0,
          heNest: 0,
          heFloor: 0,
          small: 0,
          broken: 0,
          thinShell: 0,
          doubleYolk: 0,
          misshape: 0,
          others: 0,
          spoiled: 0,
          totalHE: 0,
          totalNHE: 0
        } as any));

    activeRecords.forEach((rec) => {
      const heNestVal = rec.heNest ?? rec.sorting?.hatchingEggs?.heNest ?? 0;
      const heFloorVal = rec.heFloor ?? rec.sorting?.hatchingEggs?.heFloor ?? 0;
      const heTotal = rec.totalHatchingEggs ?? rec.totalHE ?? (heNestVal + heFloorVal);

      const small = rec.small ?? rec.sorting?.nonHatchingEggs?.small ?? 0;
      const broken = rec.broken ?? rec.sorting?.nonHatchingEggs?.broken ?? 0;
      const ts = rec.thinShell ?? rec.sorting?.nonHatchingEggs?.cracked ?? 0;
      const dy = rec.doubleYolk ?? rec.sorting?.nonHatchingEggs?.doubleYolk ?? 0;
      const ms = rec.misshape ?? rec.sorting?.nonHatchingEggs?.abnormal ?? rec.sorting?.nonHatchingEggs?.misshapen ?? 0;
      const oth = rec.others ?? rec.sorting?.nonHatchingEggs?.softShelled ?? rec.sorting?.nonHatchingEggs?.leakers ?? 0;
      const spoiled = rec.spoiled ?? rec.sorting?.nonHatchingEggs?.dirty ?? 0;
      const nheTotal = rec.totalNonHatchingEggs ?? rec.totalNHE ?? (small + broken + ts + dy + ms + oth + spoiled);
      const tep = rec.tep ?? rec.totalEggs ?? (heTotal + nheTotal);

      totalTEP += tep;
      totalHENest += heNestVal;
      totalHEFloor += heFloorVal;
      totalHE += heTotal;
      totalNHE += nheTotal;
      totalSpoil += spoiled;
      totalDY += dy;

      report += `${(rec.houseNumber || 'HOUSE').toUpperCase()}\n\n`;
      report += `TEP;\t${tep}\n`;
      report += `HE NEST;\t${heNestVal}\n`;
      report += `HE FLOOR;\t${heFloorVal}\n\n`;
      report += `SMALL;\t${small}\n`;
      report += `BROKEN;\t${broken}\n`;
      report += `TS;\t${ts}\n`;
      report += `DY;\t${dy}\n`;
      report += `MS;\t${ms}\n`;
      report += `OTH:\t${oth}\n`;
      report += `SPOILED;\t${spoiled}\n`;
      report += `TOTAL NHE;\t${nheTotal}\n\n\n`;
    });

    const grandTEP = totalTEP - totalSpoil - totalDY;

    report += `TOTAL TEP;\t${totalTEP}\n`;
    report += `TOTAL HE NEST;\t${totalHENest}\n`;
    report += `TOTAL HE FLOOR;\t${totalHEFloor}\n`;
    report += `TOTAL HE;\t${totalHE}\n`;
    report += `TOTAL NHE;\t${totalNHE}\n`;
    report += `TOTAL SPOIL;\t${totalSpoil}\n`;
    report += `TOTAL DY;\t${totalDY}\n\n`;
    report += `GRAND TEP;\t${grandTEP}`;

    return report;
  }, [flocks, eggProductionRecords, reportDate, farmProfile]);

  const currentMessengerReportText = useMemo(() => {
    return generateMessengerReport(reportDate);
  }, [generateMessengerReport, reportDate]);

  const handleCopyReport = () => {
    navigator.clipboard.writeText(currentMessengerReportText);
    setCopied(true);
    toast.success('Messenger Report Copied', 'Daily egg summary formatted & ready to paste into Messenger / WhatsApp.');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportEggExcel = () => {
    const recordsToExport = selectedHouse === 'All' ? (eggProductionRecords || []) : (activeHouseRecords || []);
    const eggData = recordsToExport.map(r => {
      const hePct = r.tep && r.tep > 0 ? ((r.totalHE || 0) / r.tep) * 100 : 0;
      const nhePct = r.tep && r.tep > 0 ? ((r.totalNHE || 0) / r.tep) * 100 : 0;
      return {
        date: r.date || '',
        houseNumber: r.houseNumber || '',
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

    const meta: ReportMetadata = {
      companyName: farmProfile?.name || 'L.P. LIM CITY FAMILY FARM INC',
      logoUrl: farmProfile?.logoUrl,
      address: farmProfile?.address,
      contactNumber: farmProfile?.contactNumber,
      email: farmProfile?.email,
      reportTitle: `Egg Production & Hatching Performance Report (${selectedHouse})`,
      dateRange: `All Recorded Cycles`,
      houseFilter: selectedHouse,
      generatedBy: currentUser?.fullName || 'Authorized Staff',
      generatedAt: new Date().toLocaleString()
    };

    const sheet: SheetData = {
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
      data: eggData
    };

    exportReportToExcel(meta, [sheet], `${farmProfile?.name ? farmProfile.name.replace(/[^a-zA-Z0-9]/g, '_') : 'Farm'}_Egg_Production_${selectedHouse}.xlsx`);
    toast.success('Excel Generated', `Downloaded official workbook for ${selectedHouse}`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-teal-700 text-xs font-bold uppercase tracking-wider mb-1">
            <Egg className="w-4 h-4" />
            <span>Egg Grading & Daily Lay Rates</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Egg Production & Messenger Report</h2>
          <p className="text-xs text-slate-500 mt-1">
            Grading classification (HE vs NHE), Henday calculations, and one-click messenger dispatch report.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Action 1: Export Excel Report */}
          <button
            id="export-egg-excel-btn"
            onClick={handleExportEggExcel}
            className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-xs cursor-pointer active:scale-95"
            title="Export Excel with Company Header & Official Farm Logo"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Excel</span>
          </button>

          <div className="hidden sm:block w-px h-6 bg-slate-200" />

          {/* Action 2: Messenger Daily Dispatch */}
          <button
            id="open-messenger-report-btn"
            onClick={() => setShowMessengerReportModal(true)}
            className="px-4 py-2.5 bg-teal-950 hover:bg-teal-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-xs cursor-pointer active:scale-95"
            title="Generate & Copy Daily Text Summary for Messenger"
          >
            <Share2 className="w-4 h-4 text-teal-400" />
            <span>Messenger Daily Report</span>
          </button>

          {/* Action 3: Record Egg Production Entry */}
          {Boolean(permissions?.canRecordEggProduction ? permissions.canRecordEggProduction(selectedHouse === 'All' ? undefined : selectedHouse) : true) && (
            <>
              <div className="hidden sm:block w-px h-6 bg-slate-200" />
              <button
                id="record-daily-egg-btn"
                onClick={() => {
                  setHouseNumber(selectedHouse === 'All' ? ((flocks && flocks[0]?.houseNumber) || 'House 1') : selectedHouse);
                  setShowLogModal(true);
                }}
                className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-xs cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Record Egg Production</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* House Quick Selector Bar */}
      <HouseQuickBar
        selectedHouse={selectedHouse}
        onSelectHouse={setSelectedHouse}
        showAllOption={true}
      />

      {/* 4 Performance Metric Cards */}
      {latestProd && (() => {
        const totalEggsCount = latestProd.totalEggs ?? latestProd.tep ?? 0;
        const femalePopCount = latestProd.femalePopulationAtDate ?? 0;
        const totalHECount = latestProd.totalHatchingEggs ?? latestProd.totalHE ?? ((latestProd.heNest || 0) + (latestProd.heFloor || 0));
        const totalNHECount = latestProd.totalNonHatchingEggs ?? latestProd.totalNHE ?? 0;
        const hePctVal = typeof latestProd.hatchingEggPct === 'number' && !isNaN(latestProd.hatchingEggPct)
          ? latestProd.hatchingEggPct
          : (totalEggsCount > 0 ? (totalHECount / totalEggsCount) * 100 : 0);
        const nhePctVal = typeof latestProd.nonHatchingEggPct === 'number' && !isNaN(latestProd.nonHatchingEggPct)
          ? latestProd.nonHatchingEggPct
          : (totalEggsCount > 0 ? (totalNHECount / totalEggsCount) * 100 : 0);

        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Eggs */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                Total Eggs Collected
              </span>
              <p className="text-2xl font-black text-slate-900 mt-1">
                {totalEggsCount.toLocaleString()} <span className="text-xs font-semibold text-slate-500">eggs</span>
              </p>
              <p className="text-xs text-slate-500 mt-2">
                From {femalePopCount.toLocaleString()} active hens
              </p>
            </div>

            {/* Henday % */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-teal-600 tracking-wider block">
                Henday Laying Rate
              </span>
              <p className="text-2xl font-black text-teal-700 mt-1">
                {typeof latestProd.hendayPct === 'number' && !isNaN(latestProd.hendayPct) ? latestProd.hendayPct.toFixed(2) : '0.00'}%
              </p>
              <p className="text-xs text-teal-800 mt-2 font-medium">
                Target Standard: ~87.5% (High Peak)
              </p>
            </div>

            {/* Hatching Egg (HE) % */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-teal-700 tracking-wider block">
                Hatching Eggs (HE)
              </span>
              <p className="text-2xl font-black text-slate-900 mt-1">
                {totalHECount.toLocaleString()}{' '}
                <span className="text-sm font-bold text-teal-600">
                  ({hePctVal.toFixed(1)}%)
                </span>
              </p>
              <p className="text-xs text-slate-500 mt-2">
                Clean, set-grade hatching eggs
              </p>
            </div>

            {/* Non-Hatching Egg (NHE) % */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-rose-600 tracking-wider block">
                Non-Hatching Eggs (NHE)
              </span>
              <p className="text-2xl font-black text-rose-800 mt-1">
                {totalNHECount.toLocaleString()}{' '}
                <span className="text-sm font-bold text-rose-600">
                  ({nhePctVal.toFixed(1)}%)
                </span>
              </p>
              <p className="text-xs text-slate-500 mt-2">
                Egg Weight: <strong>{latestProd.sampleEggWeightGrams || 58.4}g</strong>
              </p>
            </div>
          </div>
        );
      })()}

      {/* Two Detailed Breakdown Tables: Collection Passes vs Sorting Quality */}
      {latestProd && (() => {
        const collectionsList = Array.isArray(latestProd.collections) ? latestProd.collections : [];
        const totalHECount = latestProd.totalHatchingEggs ?? latestProd.totalHE ?? ((latestProd.heNest || 0) + (latestProd.heFloor || 0));
        const totalNHECount = latestProd.totalNonHatchingEggs ?? latestProd.totalNHE ?? 0;
        const heNestCount = latestProd.heNest ?? latestProd.sorting?.hatchingEggs?.heNest ?? totalHECount;
        const heFloorCount = latestProd.heFloor ?? latestProd.sorting?.hatchingEggs?.heFloor ?? 0;

        const smallCount = latestProd.small ?? latestProd.sorting?.nonHatchingEggs?.small ?? 0;
        const brokenCount = latestProd.broken ?? latestProd.sorting?.nonHatchingEggs?.broken ?? 0;
        const thinShellCount = latestProd.thinShell ?? latestProd.sorting?.nonHatchingEggs?.cracked ?? 0;
        const doubleYolkCount = latestProd.doubleYolk ?? latestProd.sorting?.nonHatchingEggs?.doubleYolk ?? 0;
        const misshapeCount = latestProd.misshape ?? latestProd.sorting?.nonHatchingEggs?.abnormal ?? 0;
        const othersCount = latestProd.others ?? latestProd.sorting?.nonHatchingEggs?.softShelled ?? 0;
        const spoiledCount = latestProd.spoiled ?? latestProd.sorting?.nonHatchingEggs?.dirty ?? 0;

        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Collection Times (Left & Right Sides) */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-600" />
                <span>Collection Passes & Side Counts ({latestProd.houseNumber})</span>
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <th className="py-2 px-2.5">Pass #</th>
                      <th className="py-2 px-2.5">Time</th>
                      <th className="py-2 px-2.5">Left Side</th>
                      <th className="py-2 px-2.5">Right Side</th>
                      <th className="py-2 px-2.5 text-right font-bold">Total Pass</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {collectionsList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-slate-400">
                          Standard single collection logged ({totalHECount + totalNHECount} eggs)
                        </td>
                      </tr>
                    ) : (
                      collectionsList.map(c => (
                        <tr key={c.id || `${c.collectionNumber}`} className="hover:bg-slate-50">
                          <td className="py-2 px-2.5 font-bold text-slate-800">{c.collectionNumber}st / {c.collectionNumber}nd Pass</td>
                          <td className="py-2 px-2.5 text-slate-600">{c.collectionTime || '-'}</td>
                          <td className="py-2 px-2.5 font-semibold text-slate-700">{(c.leftSideCount || 0).toLocaleString()}</td>
                          <td className="py-2 px-2.5 font-semibold text-slate-700">{(c.rightSideCount || 0).toLocaleString()}</td>
                          <td className="py-2 px-2.5 text-right font-bold text-teal-700">{(c.totalCount || 0).toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Detailed Sorting Breakdown (HE vs NHE) */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-teal-700" />
                <span>Egg Grading Quality Breakdown</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Hatching Eggs Breakdown: HE Nest Egg vs HE Floor Egg */}
                <div className="p-3.5 bg-teal-50/70 border border-teal-200/80 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-teal-950 text-xs">Hatching Eggs (HE)</p>
                    <span className="font-black text-teal-900 text-xs">{totalHECount.toLocaleString()}</span>
                  </div>
                  
                  <div className="space-y-2 text-slate-700 text-[11px] pt-0.5">
                    <div className="p-2.5 bg-white rounded-xl border border-teal-100 flex items-center justify-between shadow-2xs">
                      <div>
                        <p className="font-bold text-teal-950 text-xs">HE Nest Egg</p>
                        <p className="text-[10px] text-slate-500">Clean nest-box laid eggs</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-slate-900 text-xs">
                          {heNestCount.toLocaleString()}
                        </p>
                        <p className="text-[10px] text-teal-700 font-bold">
                          {totalHECount > 0 
                            ? ((heNestCount / totalHECount) * 100).toFixed(1) + '%'
                            : '100%'}
                        </p>
                      </div>
                    </div>

                    <div className="p-2.5 bg-white rounded-xl border border-teal-100 flex items-center justify-between shadow-2xs">
                      <div>
                        <p className="font-bold text-teal-950 text-xs">HE Floor Egg</p>
                        <p className="text-[10px] text-slate-500">Sanitized slat / floor laid eggs</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-slate-900 text-xs">
                          {heFloorCount.toLocaleString()}
                        </p>
                        <p className="text-[10px] text-teal-700 font-bold">
                          {totalHECount > 0 
                            ? ((heFloorCount / totalHECount) * 100).toFixed(1) + '%'
                            : '0.0%'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* NHE rejects */}
                <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-rose-950 text-xs">Commercial / Reject (NHE)</p>
                    <span className="font-black text-rose-800 text-xs">{totalNHECount.toLocaleString()}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-slate-700 text-[11px] pt-0.5">
                    <div className="flex justify-between"><span>SMALL:</span> <strong>{smallCount.toLocaleString()}</strong></div>
                    <div className="flex justify-between"><span>BROKEN:</span> <strong>{brokenCount.toLocaleString()}</strong></div>
                    <div className="flex justify-between"><span>TS (Thin):</span> <strong>{thinShellCount.toLocaleString()}</strong></div>
                    <div className="flex justify-between"><span>DY (Double):</span> <strong>{doubleYolkCount.toLocaleString()}</strong></div>
                    <div className="flex justify-between"><span>MS (Misshape):</span> <strong>{misshapeCount.toLocaleString()}</strong></div>
                    <div className="flex justify-between"><span>OTH (Others):</span> <strong>{othersCount.toLocaleString()}</strong></div>
                    <div className="flex justify-between col-span-2 pt-1 border-t border-rose-200/60 font-semibold text-rose-950">
                      <span>SPOILED / DIRTY:</span> 
                      <strong>{spoiledCount.toLocaleString()}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Production Log History Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Historical Egg Production Log</h3>
            <p className="text-xs text-slate-500 font-medium">
              Showing {Math.min(displayLimit, filteredHistoryRecords.length)} of {filteredHistoryRecords.length} records
              {selectedHouse !== 'All' ? ` for ${selectedHouse}` : ''}
            </p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search date, house, staff..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">House #</th>
                <th className="py-2.5 px-3">Total Eggs</th>
                <th className="py-2.5 px-3">HE (Hatching)</th>
                <th className="py-2.5 px-3">NHE (Reject)</th>
                <th className="py-2.5 px-3">Henday %</th>
                <th className="py-2.5 px-3">Sample Wt</th>
                <th className="py-2.5 px-3">Logged By</th>
                {permissions?.canDeleteRecord && <th className="py-2.5 px-3 text-right">Del</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredHistoryRecords.length === 0 ? (
                <tr>
                  <td colSpan={permissions?.canDeleteRecord ? 9 : 8} className="py-8 text-center text-slate-400">
                    No egg production records found.
                  </td>
                </tr>
              ) : (
                filteredHistoryRecords.slice(0, displayLimit).map(rec => {
                  const recTotal = rec.totalEggs ?? rec.tep ?? 0;
                  const recHE = rec.totalHatchingEggs ?? rec.totalHE ?? ((rec.heNest || 0) + (rec.heFloor || 0));
                  const recNHE = rec.totalNonHatchingEggs ?? rec.totalNHE ?? 0;
                  const recHEPct = typeof rec.hatchingEggPct === 'number' && !isNaN(rec.hatchingEggPct)
                    ? rec.hatchingEggPct
                    : (recTotal > 0 ? (recHE / recTotal) * 100 : 0);
                  const recNHEPct = typeof rec.nonHatchingEggPct === 'number' && !isNaN(rec.nonHatchingEggPct)
                    ? rec.nonHatchingEggPct
                    : (recTotal > 0 ? (recNHE / recTotal) * 100 : 0);

                  return (
                    <tr key={rec.id} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-3 font-medium text-slate-700">{rec.date}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{rec.houseNumber}</td>
                      <td className="py-2.5 px-3 font-black text-slate-900">{recTotal.toLocaleString()}</td>
                      <td className="py-2.5 px-3 font-bold text-teal-800">
                        {recHE.toLocaleString()} ({recHEPct.toFixed(1)}%)
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-rose-700">
                        {recNHE.toLocaleString()} ({recNHEPct.toFixed(1)}%)
                      </td>
                      <td className="py-2.5 px-3 font-black text-teal-700">
                        {typeof rec.hendayPct === 'number' && !isNaN(rec.hendayPct) ? rec.hendayPct.toFixed(2) : '0.00'}%
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-700">{rec.sampleEggWeightGrams || 58.4}g</td>
                      <td className="py-2.5 px-3 text-slate-500">{rec.loggedBy || 'Staff'}</td>
                      {permissions?.canDeleteRecord && (
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => deleteEggProductionRecord(rec.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {filteredHistoryRecords.length > displayLimit && (
          <div className="pt-2 flex justify-center">
            <button
              onClick={() => setDisplayLimit(prev => prev + 30)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
            >
              Load More Records (+30)
            </button>
          </div>
        )}
      </div>

      {/* Modal 1: Log Daily Egg Production */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-teal-950 p-5 text-white flex items-center justify-between shrink-0 border-b border-teal-900/50">
              <div>
                <h3 className="font-bold text-base text-white">Record Egg Production & Grading</h3>
                <p className="text-xs text-teal-300/80">{houseNumber} • Daily Collection Passes & Quality Sorting</p>
              </div>
              <button onClick={() => setShowLogModal(false)} className="text-teal-400 hover:text-white p-1 rounded-lg">
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveEggRecord} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">House # *</label>
                  <select
                    value={houseNumber}
                    onChange={e => setHouseNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-bold border border-slate-200 rounded-xl bg-white outline-hidden focus:outline-teal-500"
                  >
                    {(flocks || []).map(f => (
                      <option key={f.id || f.houseNumber} value={f.houseNumber}>{f.houseNumber}</option>
                    ))}
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
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sample Egg Wt (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={sampleEggWeight}
                    onChange={e => setSampleEggWeight(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-hidden font-bold focus:outline-teal-500"
                  />
                </div>
              </div>

              {/* Collections Table (Pass 1, 2, 3) */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <p className="text-xs font-bold text-teal-950 uppercase tracking-wider text-[11px]">Collection Passes (Left & Right Side Counts)</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5 shadow-2xs">
                    <span className="text-[11px] font-bold text-slate-800 block">1st Pass (08:00 AM)</span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[10px] text-slate-500">Left</label>
                        <input type="number" value={c1Left} onChange={e => setC1Left(Number(e.target.value))} className="w-full p-1.5 border border-slate-200 rounded-lg text-xs" />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500">Right</label>
                        <input type="number" value={c1Right} onChange={e => setC1Right(Number(e.target.value))} className="w-full p-1.5 border border-slate-200 rounded-lg text-xs" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5 shadow-2xs">
                    <span className="text-[11px] font-bold text-slate-800 block">2nd Pass (11:30 AM)</span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[10px] text-slate-500">Left</label>
                        <input type="number" value={c2Left} onChange={e => setC2Left(Number(e.target.value))} className="w-full p-1.5 border border-slate-200 rounded-lg text-xs" />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500">Right</label>
                        <input type="number" value={c2Right} onChange={e => setC2Right(Number(e.target.value))} className="w-full p-1.5 border border-slate-200 rounded-lg text-xs" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5 shadow-2xs">
                    <span className="text-[11px] font-bold text-slate-800 block">3rd Pass (03:30 PM)</span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[10px] text-slate-500">Left</label>
                        <input type="number" value={c3Left} onChange={e => setC3Left(Number(e.target.value))} className="w-full p-1.5 border border-slate-200 rounded-lg text-xs" />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500">Right</label>
                        <input type="number" value={c3Right} onChange={e => setC3Right(Number(e.target.value))} className="w-full p-1.5 border border-slate-200 rounded-lg text-xs" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Egg Grading / Sorting (HE Nest Egg & HE Floor Egg) */}
              <div className="p-4 bg-forest-50/70 border border-forest-200/80 rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs font-bold text-forest-950 uppercase tracking-wider">Hatching Eggs (HE) Classification</p>
                    <p className="text-[10px] text-graphite-500">Separation by collection method (Nest vs Floor)</p>
                  </div>
                  <span className="text-xs font-extrabold text-forest-900 bg-white px-2.5 py-1 rounded-lg border border-forest-200 shadow-2xs">
                    Total HE: {totalCalculatedHE.toLocaleString()}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-forest-100 shadow-2xs space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-forest-950 block">HE Nest Egg *</label>
                      <span className="text-[10px] text-mint-600 bg-forest-950 px-2 py-0.5 rounded font-bold">Standard Setting Grade</span>
                    </div>
                    <p className="text-[10px] text-graphite-500">Clean eggs gathered directly from nest boxes</p>
                    <input 
                      type="number" 
                      min="0"
                      value={heNest} 
                      onChange={e => setHeNest(Number(e.target.value))} 
                      className="w-full p-2 border border-forest-200 rounded-lg bg-forest-50/30 text-xs font-black text-forest-950 focus:outline-mint-400 focus:bg-white transition" 
                    />
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-forest-100 shadow-2xs space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-forest-950 block">HE Floor Egg *</label>
                      <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-bold border border-amber-200">Floor Laid</span>
                    </div>
                    <p className="text-[10px] text-graphite-500">Sanitized floor or slat-laid hatching eggs</p>
                    <input 
                      type="number" 
                      min="0"
                      value={heFloor} 
                      onChange={e => setHeFloor(Number(e.target.value))} 
                      className="w-full p-2 border border-forest-200 rounded-lg bg-forest-50/30 text-xs font-black text-forest-950 focus:outline-mint-400 focus:bg-white transition" 
                    />
                  </div>
                </div>
              </div>

              {/* Non-Hatching Eggs (NHE rejects) */}
              <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs font-bold text-rose-950 uppercase tracking-wider">Non-Hatching Eggs (NHE) Defects</p>
                    <p className="text-[10px] text-graphite-500">Commercial / reject egg grading breakdown</p>
                  </div>
                  <span className="text-xs font-extrabold text-rose-900 bg-white px-2.5 py-1 rounded-lg border border-rose-200 shadow-2xs">
                    Total NHE: {totalCalculatedNHE.toLocaleString()}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className="bg-white p-2.5 rounded-xl border border-rose-100 shadow-2xs">
                    <label className="text-[11px] font-bold text-graphite-900 block">SMALL</label>
                    <span className="text-[9px] text-graphite-500 block mb-1">Under-weight</span>
                    <input type="number" min="0" value={nheSmall} onChange={e => setNheSmall(Number(e.target.value))} className="w-full p-1.5 border border-graphite-200 rounded-lg bg-rose-50/30 text-xs font-bold" />
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-rose-100 shadow-2xs">
                    <label className="text-[11px] font-bold text-graphite-900 block">BROKEN</label>
                    <span className="text-[9px] text-graphite-500 block mb-1">Punctured / smashed</span>
                    <input type="number" min="0" value={nheBroken} onChange={e => setNheBroken(Number(e.target.value))} className="w-full p-1.5 border border-graphite-200 rounded-lg bg-rose-50/30 text-xs font-bold" />
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-rose-100 shadow-2xs">
                    <label className="text-[11px] font-bold text-graphite-900 block">TS (Thin Shell)</label>
                    <span className="text-[9px] text-graphite-500 block mb-1">Hairline crack / weak</span>
                    <input type="number" min="0" value={nheThinShell} onChange={e => setNheThinShell(Number(e.target.value))} className="w-full p-1.5 border border-graphite-200 rounded-lg bg-rose-50/30 text-xs font-bold" />
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-rose-100 shadow-2xs">
                    <label className="text-[11px] font-bold text-graphite-900 block">DY (Double Yolk)</label>
                    <span className="text-[9px] text-graphite-500 block mb-1">Twin yolk oversize</span>
                    <input type="number" min="0" value={nheDoubleYolk} onChange={e => setNheDoubleYolk(Number(e.target.value))} className="w-full p-1.5 border border-graphite-200 rounded-lg bg-rose-50/30 text-xs font-bold" />
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-rose-100 shadow-2xs">
                    <label className="text-[11px] font-bold text-graphite-900 block">MS (Misshape)</label>
                    <span className="text-[9px] text-graphite-500 block mb-1">Deformed / rough</span>
                    <input type="number" min="0" value={nheMisshape} onChange={e => setNheMisshape(Number(e.target.value))} className="w-full p-1.5 border border-graphite-200 rounded-lg bg-rose-50/30 text-xs font-bold" />
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-rose-100 shadow-2xs">
                    <label className="text-[11px] font-bold text-graphite-900 block">OTH (Others)</label>
                    <span className="text-[9px] text-graphite-500 block mb-1">Soft / leaker / reject</span>
                    <input type="number" min="0" value={nheOthers} onChange={e => setNheOthers(Number(e.target.value))} className="w-full p-1.5 border border-graphite-200 rounded-lg bg-rose-50/30 text-xs font-bold" />
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-rose-100 shadow-2xs col-span-2">
                    <label className="text-[11px] font-bold text-graphite-900 block">SPOILED</label>
                    <span className="text-[9px] text-graphite-500 block mb-1">Dirty / blood / rotten</span>
                    <input type="number" min="0" value={nheSpoiled} onChange={e => setNheSpoiled(Number(e.target.value))} className="w-full p-1.5 border border-graphite-200 rounded-lg bg-rose-50/30 text-xs font-bold" />
                  </div>
                </div>
              </div>

              {/* Total Summary preview */}
              <div className="p-3.5 bg-slate-900 text-white rounded-2xl flex items-center justify-between text-xs font-bold">
                <span>Grand Total Eggs Recorded:</span>
                <span className="text-base font-black text-teal-400">{grandTotalLoggedEggs.toLocaleString()} Eggs</span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                >
                  Save Production Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Messenger Daily Egg Production Report */}
      {showMessengerReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-graphite-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-graphite-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[88vh]">
            <div className="bg-forest-950 p-5 text-white flex items-center justify-between shrink-0 border-b border-forest-900">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-mint-500 text-forest-950 rounded-xl shadow-xs">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Daily Messenger Report</h3>
                  <p className="text-[11px] text-mint-300/90 font-medium">L.P. LIM CITY FAMILY FARM INC format</p>
                </div>
              </div>
              <button onClick={() => setShowMessengerReportModal(false)} className="text-graphite-400 hover:text-white p-1 rounded-lg transition">
                &times;
              </button>
            </div>

            <div className="p-4 bg-graphite-50 border-b border-graphite-200 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 text-xs">
                <label className="font-bold text-graphite-700 uppercase tracking-wider text-[10px]">Report Date:</label>
                <input
                  type="date"
                  value={reportDate}
                  onChange={e => setReportDate(e.target.value)}
                  className="px-3 py-1.5 text-xs border border-graphite-300 rounded-xl bg-white text-graphite-900 font-semibold focus:outline-mint-500"
                />
              </div>

              <button
                id="copy-messenger-report-btn"
                onClick={handleCopyReport}
                className="px-4 py-2 bg-forest-900 hover:bg-forest-850 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs border border-forest-800"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-mint-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className={copied ? 'text-mint-300 font-bold' : ''}>{copied ? 'Copied to Clipboard!' : 'Copy Report'}</span>
              </button>
            </div>

            {/* Monospaced code box for easy copying */}
            <div className="p-5 overflow-y-auto bg-graphite-950 font-mono text-xs text-mint-300 whitespace-pre-wrap leading-relaxed select-all border-y border-graphite-850">
              {currentMessengerReportText}
            </div>

            <div className="p-4 bg-graphite-50 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-graphite-500 font-medium">Ready for broadcast to group chat</span>
              <button
                onClick={() => setShowMessengerReportModal(false)}
                className="px-4 py-2 bg-graphite-200 hover:bg-graphite-300 text-graphite-800 rounded-xl text-xs font-bold transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
