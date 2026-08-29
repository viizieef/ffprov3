import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import { FeedType, PenConfig, Flock } from '../../types';
import { 
  Grid2X2, 
  Plus, 
  Wheat, 
  Skull, 
  TrendingDown, 
  CheckCircle2, 
  AlertCircle, 
  Info,
  Calendar,
  Layers,
  ArrowRight,
  ArrowLeftRight,
  Sparkles,
  History,
  Trash2,
  Check,
  RotateCcw,
  Edit3,
  AlertTriangle,
  Users
} from 'lucide-react';

export const FlockmanModuleView: React.FC = () => {
  const { 
    flocks, 
    updateFlock, 
    getFlockStats, 
    feedStockEntries, 
    addFeedConsumption, 
    addDepletion, 
    transfers,
    addTransfer,
    deleteTransfer,
    farmProfile,
    currentUser,
    permissions 
  } = useFarm();

  const [selectedHouse, setSelectedHouse] = useState<string>(() => {
    if (currentUser?.designatedHouses && currentUser.designatedHouses.length > 0) {
      return currentUser.designatedHouses[0];
    }
    return 'House 1';
  });

  const [activeTab, setActiveTab] = useState<'daily_ops' | 'transfer_station' | 'transfer_history'>('daily_ops');
  const [activeSide, setActiveSide] = useState<'Left' | 'Right'>('Left');

  // Pen Adding Modal
  const [showAddPenModal, setShowAddPenModal] = useState(false);
  const [newPenName, setNewPenName] = useState('Pen L3');
  const [newPenSide, setNewPenSide] = useState<'Left' | 'Right'>('Left');
  const [newPenMales, setNewPenMales] = useState(240);
  const [newPenFemales, setNewPenFemales] = useState(2300);

  // Pen Editing & Deletion State (Farm Manager & Admin Controls)
  const [editingPen, setEditingPen] = useState<PenConfig | null>(null);
  const [editPenName, setEditPenName] = useState<string>('');
  const [editPenSide, setEditPenSide] = useState<'Left' | 'Right'>('Left');
  const [editPenMales, setEditPenMales] = useState<number>(0);
  const [editPenFemales, setEditPenFemales] = useState<number>(0);
  const [syncFlockPopulationWithPens, setSyncFlockPopulationWithPens] = useState<boolean>(false);

  const [deletingPen, setDeletingPen] = useState<PenConfig | null>(null);

  // Feed Log State for Side/Pen (in grams per bird)
  const [femaleFeedType, setFemaleFeedType] = useState<FeedType>('BLC 1');
  const [femaleFeedGrams, setFemaleFeedGrams] = useState<number>(155);
  const [maleFeedType, setMaleFeedType] = useState<FeedType>('BMCC');
  const [maleFeedGrams, setMaleFeedGrams] = useState<number>(125);
  const [feedDate, setFeedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [feedNotes, setFeedNotes] = useState<string>('');
  const [feedSuccess, setFeedSuccess] = useState(false);

  // Mortality State for Side/Pen
  const [selectedPenName, setSelectedPenName] = useState('Pen L1');
  const [mortMales, setMortMales] = useState(0);
  const [mortFemales, setMortFemales] = useState(1);
  const [mortNotes, setMortNotes] = useState('Morning flockman inspection');
  const [mortSuccess, setMortSuccess] = useState(false);

  // Inter-House Bird Transfer State
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferSourceHouse, setTransferSourceHouse] = useState<string>(selectedHouse);
  const [transferDestHouse, setTransferDestHouse] = useState<string>(() => {
    const other = flocks.find(f => f.houseNumber !== selectedHouse);
    return other ? other.houseNumber : 'House 2';
  });
  const [transferSourceSide, setTransferSourceSide] = useState<'Left' | 'Right' | 'All'>('All');
  const [transferDestSide, setTransferDestSide] = useState<'Left' | 'Right' | 'All'>('All');
  const [transferMales, setTransferMales] = useState<number>(10);
  const [transferFemales, setTransferFemales] = useState<number>(0);
  const [transferDate, setTransferDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [transferReason, setTransferReason] = useState<string>('Spiking young active males to boost mating ratio');
  const [transferFeedback, setTransferFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const activeFlock = flocks.find(f => f.houseNumber === selectedHouse) || flocks[0];
  const stats = activeFlock ? getFlockStats(activeFlock.houseNumber) : null;

  // Filter pens by side
  const sidePens = (activeFlock?.pens || []).filter(p => p.side === activeSide);
  const sideMales = sidePens.length > 0 
    ? sidePens.reduce((sum, p) => sum + (Number(p.males) || 0), 0) 
    : Math.floor((stats?.currentMales || 0) / 2);
  const sideFemales = sidePens.length > 0 
    ? sidePens.reduce((sum, p) => sum + (Number(p.females) || 0), 0) 
    : Math.floor((stats?.currentFemales || 0) / 2);

  // Recommended feed from Standard Feed Guide
  const feedGuideItem = farmProfile.standardFeedGuide.find(fg => fg.ageWeek >= (stats?.ageWeeks || 30)) || farmProfile.standardFeedGuide[farmProfile.standardFeedGuide.length - 1];

  // Beginning inventory for selected feed types
  const beginningFemaleStock = feedStockEntries
    .filter(e => e.feedType === femaleFeedType)
    .reduce((sum, e) => sum + (Number(e.totalKg) || 0), 0);
  const beginningMaleStock = feedStockEntries
    .filter(e => e.feedType === maleFeedType)
    .reduce((sum, e) => sum + (Number(e.totalKg) || 0), 0);

  // Transfer Calculation Helpers
  const sourceFlockObj = flocks.find(f => f.houseNumber === transferSourceHouse) || activeFlock;
  const destFlockObj = flocks.find(f => f.houseNumber === transferDestHouse);

  const sourceStats = sourceFlockObj ? getFlockStats(sourceFlockObj.houseNumber) : null;
  const destStats = destFlockObj ? getFlockStats(destFlockObj.houseNumber) : null;

  // Projected numbers after transfer
  const projectedSourceMales = Math.max(0, (sourceStats?.currentMales || 0) - transferMales);
  const projectedSourceFemales = Math.max(0, (sourceStats?.currentFemales || 0) - transferFemales);
  const projectedSourceRatio = projectedSourceMales > 0 ? (projectedSourceFemales / projectedSourceMales).toFixed(1) : '0';

  const projectedDestMales = (destStats?.currentMales || 0) + transferMales;
  const projectedDestFemales = (destStats?.currentFemales || 0) + transferFemales;
  const projectedDestRatio = projectedDestMales > 0 ? (projectedDestFemales / projectedDestMales).toFixed(1) : '0';

  const isTransferValid = 
    transferSourceHouse !== transferDestHouse &&
    (transferMales > 0 || transferFemales > 0) &&
    transferMales <= (sourceStats?.currentMales || 0) &&
    transferFemales <= (sourceStats?.currentFemales || 0);

  const userRole = currentUser?.role || '';
  const isManagerOrAdmin = 
    userRole === 'admin' || 
    userRole === 'System Administrator' || 
    userRole === 'farm_manager' || 
    userRole === 'Farm Manager';

  const handleAddPen = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFlock) return;

    const newPen: PenConfig = {
      id: 'pen_' + Date.now(),
      name: newPenName.trim() || `Pen ${newPenSide[0]}${(activeFlock.pens || []).length + 1}`,
      side: newPenSide,
      males: Math.max(0, Number(newPenMales) || 0),
      females: Math.max(0, Number(newPenFemales) || 0)
    };

    const updatedPens = [...(activeFlock.pens || []), newPen];
    updateFlock(activeFlock.id, { pens: updatedPens });
    setTransferFeedback({
      type: 'success',
      message: `Created new ${newPen.name} (${newPen.side} side) with ${newPen.males.toLocaleString()} males and ${newPen.females.toLocaleString()} females.`
    });
    setShowAddPenModal(false);
    setTimeout(() => setTransferFeedback(null), 4000);
  };

  const handleOpenEditPen = (pen: PenConfig) => {
    setEditingPen(pen);
    setEditPenName(pen.name);
    setEditPenSide(pen.side);
    setEditPenMales(pen.males);
    setEditPenFemales(pen.females);
    setSyncFlockPopulationWithPens(false);
  };

  const handleSavePenEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFlock || !editingPen) return;

    const parsedMales = Math.max(0, Number(editPenMales) || 0);
    const parsedFemales = Math.max(0, Number(editPenFemales) || 0);

    const updatedPens = (activeFlock.pens || []).map(p => {
      if (p.id === editingPen.id) {
        return {
          ...p,
          name: editPenName.trim() || p.name,
          side: editPenSide,
          males: parsedMales,
          females: parsedFemales
        };
      }
      return p;
    });

    const totalPenMales = updatedPens.reduce((acc, p) => acc + (Number(p.males) || 0), 0);
    const totalPenFemales = updatedPens.reduce((acc, p) => acc + (Number(p.females) || 0), 0);

    const flockUpdates: Partial<Flock> = {
      pens: updatedPens,
      ...(syncFlockPopulationWithPens ? {
        currentMales: totalPenMales,
        currentFemales: totalPenFemales
      } : {})
    };

    updateFlock(activeFlock.id, flockUpdates);
    setTransferFeedback({
      type: 'success',
      message: `Successfully updated ${editPenName} population: ${parsedMales.toLocaleString()} Males, ${parsedFemales.toLocaleString()} Females${syncFlockPopulationWithPens ? ' (and synchronized house total)' : ''}.`
    });
    setEditingPen(null);
    setTimeout(() => setTransferFeedback(null), 4000);
  };

  const handleConfirmDeletePen = () => {
    if (!activeFlock || !deletingPen) return;

    const penNameToRemove = deletingPen.name;
    const updatedPens = (activeFlock.pens || []).filter(p => p.id !== deletingPen.id);

    updateFlock(activeFlock.id, { pens: updatedPens });
    setTransferFeedback({
      type: 'success',
      message: `Pen "${penNameToRemove}" was successfully removed from ${activeFlock.houseNumber}.`
    });
    setDeletingPen(null);
    setTimeout(() => setTransferFeedback(null), 4000);
  };

  const femaleFeedKg = sideFemales > 0 ? Math.round((sideFemales * (Number(femaleFeedGrams) || 0)) / 1000) : 0;
  const maleFeedKg = sideMales > 0 ? Math.round((sideMales * (Number(maleFeedGrams) || 0)) / 1000) : 0;
  const totalFeedKg = femaleFeedKg + maleFeedKg;

  const handleLogFeed = (e: React.FormEvent) => {
    e.preventDefault();
    if ((femaleFeedGrams <= 0 && maleFeedGrams <= 0) || !activeFlock) return;

    addFeedConsumption({
      houseNumber: activeFlock.houseNumber,
      date: feedDate,
      side: activeSide,
      femaleFeedType,
      femaleQuantityKg: femaleFeedKg,
      femaleGramsPerBird: Number(femaleFeedGrams) || 0,
      maleFeedType,
      maleQuantityKg: maleFeedKg,
      maleGramsPerBird: Number(maleFeedGrams) || 0,
      feedType: femaleFeedType,
      quantityKg: totalFeedKg,
      notes: feedNotes.trim() || `${activeSide} Side: ${femaleFeedGrams}g/bird (${femaleFeedKg}kg ${femaleFeedType}) + ${maleFeedGrams}g/bird (${maleFeedKg}kg ${maleFeedType})`
    });

    setFeedSuccess(true);
    setFeedNotes('');
    setTimeout(() => setFeedSuccess(false), 2500);
  };

  const applyFeedGuidePreset = () => {
    if (!feedGuideItem) return;
    setFemaleFeedType(feedGuideItem.recommendedFeedType || 'BLC 1');
    setFemaleFeedGrams(feedGuideItem.femaleGramsPerBird || 155);
    setMaleFeedGrams(feedGuideItem.maleGramsPerBird || 125);
  };

  const handleLogMortality = (e: React.FormEvent) => {
    e.preventDefault();
    if ((mortMales <= 0 && mortFemales <= 0) || !activeFlock) return;

    addDepletion({
      houseNumber: activeFlock.houseNumber,
      date: new Date().toISOString().split('T')[0],
      side: activeSide,
      penName: selectedPenName,
      category: 'Mortality',
      maleCount: Number(mortMales),
      femaleCount: Number(mortFemales),
      sourceModule: 'flockman',
      reasonDetails: mortNotes
    });

    setMortMales(0);
    setMortFemales(0);
    setMortSuccess(true);
    setTimeout(() => setMortSuccess(false), 2500);
  };

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isTransferValid) return;

    const res = addTransfer({
      date: transferDate,
      sourceHouse: transferSourceHouse,
      sourceSide: transferSourceSide === 'All' ? undefined : transferSourceSide,
      destHouse: transferDestHouse,
      destSide: transferDestSide === 'All' ? undefined : transferDestSide,
      maleCount: Number(transferMales),
      femaleCount: Number(transferFemales),
      reason: transferReason.trim()
    });

    if (res.success) {
      setTransferFeedback({ type: 'success', message: res.message });
      setShowTransferModal(false);
      setTimeout(() => setTransferFeedback(null), 4000);
    } else {
      setTransferFeedback({ type: 'error', message: res.message });
    }
  };

  const canEditHouse = permissions.canRecordFlockmanModule(selectedHouse);

  // House-specific transfers (either source or destination)
  const houseTransfers = transfers.filter(
    t => t.sourceHouse === selectedHouse || t.destHouse === selectedHouse
  );

  return (
    <div className="space-y-6">
      {/* Header & House Selector */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-teal-700 text-xs font-bold uppercase tracking-wider mb-1">
            <Grid2X2 className="w-4 h-4" />
            <span>Daily Operations Module</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Flockman's Pen, Feeding & Transfer Station</h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage pen counts, side-by-side feed rations, pen-level mortality, and inter-house male/female transfers.
          </p>
        </div>

        {/* Right Action Group */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Bird Transfer Button */}
          <button
            onClick={() => {
              setTransferSourceHouse(selectedHouse);
              const other = flocks.find(f => f.houseNumber !== selectedHouse);
              if (other) setTransferDestHouse(other.houseNumber);
              setShowTransferModal(true);
            }}
            className="px-3.5 py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <ArrowLeftRight className="w-4 h-4 text-teal-300" />
            <span>Transfer Birds to Other House</span>
          </button>

          {/* House Switcher */}
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <label className="text-xs font-bold text-slate-700">House:</label>
            <select
              value={selectedHouse}
              onChange={e => {
                setSelectedHouse(e.target.value);
                setTransferSourceHouse(e.target.value);
              }}
              className="px-2.5 py-1 text-xs font-bold border-0 bg-transparent focus:outline-hidden text-teal-900 cursor-pointer"
            >
              {flocks.map(f => (
                <option key={f.id} value={f.houseNumber}>
                  {f.houseNumber} ({f.breed} - Wk {getFlockStats(f.houseNumber)?.ageWeeks || 0})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {transferFeedback && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-bold animate-fadeIn ${
            transferFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {transferFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{transferFeedback.message}</span>
          </div>
          <button onClick={() => setTransferFeedback(null)} className="text-slate-400 hover:text-slate-700">
            &times;
          </button>
        </div>
      )}

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('daily_ops')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'daily_ops'
              ? 'bg-teal-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Grid2X2 className="w-3.5 h-3.5" />
          <span>Pens, Feeding & Mortality</span>
        </button>

        <button
          onClick={() => {
            setTransferSourceHouse(selectedHouse);
            const other = flocks.find(f => f.houseNumber !== selectedHouse);
            if (other) setTransferDestHouse(other.houseNumber);
            setActiveTab('transfer_station');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'transfer_station'
              ? 'bg-teal-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ArrowLeftRight className="w-3.5 h-3.5 text-teal-400" />
          <span>Inter-House Transfer Station</span>
        </button>

        <button
          onClick={() => setActiveTab('transfer_history')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'transfer_history'
              ? 'bg-teal-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <History className="w-3.5 h-3.5 text-amber-500" />
          <span>Transfer Logs ({transfers.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DAILY OPERATIONS (FEED, PENS, MORTALITY)                           */}
      {/* ========================================================================= */}
      {activeTab === 'daily_ops' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Population & Side Toggle Card */}
          {activeFlock && stats && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-teal-600 text-white font-black text-xs">
                      {activeFlock.houseNumber}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 text-[11px] font-bold">
                      {activeFlock.breed}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1">
                    Active Population: <span className="text-teal-800">{stats.totalCurrent.toLocaleString()} birds</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Age: <strong className="text-teal-900">Week {stats.ageWeeks} (Day {stats.ageDays || 1})</strong> • Males: <strong className="text-teal-700">{stats.currentMales.toLocaleString()}</strong> • Females: <strong className="text-rose-700">{stats.currentFemales.toLocaleString()}</strong> • Ratio: <strong className="text-purple-700">{stats.maleToFemaleRatioStr}</strong> • Livability: <strong className="text-emerald-700">{stats.livabilityPct}%</strong>
                  </p>
                </div>

                {/* Side Tabs (Left vs Right) */}
                <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 self-start">
                  <button
                    onClick={() => setActiveSide('Left')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                      activeSide === 'Left'
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    LEFT SIDE
                  </button>
                  <button
                    onClick={() => setActiveSide('Right')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                      activeSide === 'Right'
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    RIGHT SIDE
                  </button>
                </div>
              </div>

              {/* Side Pens List */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-teal-600" />
                      <span>Pens in {activeSide} Side ({sidePens.length} Pens)</span>
                    </h4>
                    <span className="text-[11px] text-slate-500 font-medium">
                      &bull; Side Totals: <strong className="text-teal-700">{sideMales.toLocaleString()} M</strong> / <strong className="text-rose-700">{sideFemales.toLocaleString()} F</strong> ({ (sideMales + sideFemales).toLocaleString() } birds)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isManagerOrAdmin && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-bold flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-600" />
                        Manager / Admin Controls Active
                      </span>
                    )}

                    {(isManagerOrAdmin || permissions.canRecordFlockmanModule(selectedHouse)) && (
                      <button
                        type="button"
                        onClick={() => {
                          setNewPenSide(activeSide);
                          setNewPenName(`Pen ${activeSide[0]}${sidePens.length + 1}`);
                          setShowAddPenModal(true);
                        }}
                        className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition shadow-2xs cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Pen</span>
                      </button>
                    )}
                  </div>
                </div>

                {sidePens.length === 0 ? (
                  <div className="p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <p className="text-xs text-slate-500 font-medium">No pens configured for {activeSide} side yet.</p>
                    {isManagerOrAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          setNewPenSide(activeSide);
                          setNewPenName(`Pen ${activeSide[0]}1`);
                          setShowAddPenModal(true);
                        }}
                        className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 text-white text-xs font-bold rounded-xl hover:bg-teal-700 transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Create First Pen</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                    {sidePens.map(pen => {
                      const penTotal = pen.males + pen.females;
                      const penRatio = pen.males > 0 ? (pen.females / pen.males).toFixed(1) : '0';
                      return (
                        <div
                          key={pen.id}
                          className="p-3.5 bg-slate-50/90 hover:bg-white border border-slate-200 hover:border-teal-300 hover:shadow-xs rounded-2xl space-y-2.5 transition-all flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                                {pen.name}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white font-bold text-slate-600 border border-slate-200 shadow-2xs">
                                {pen.side} Side
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs pt-2">
                              <div className="p-2 bg-teal-50/70 rounded-xl border border-teal-100">
                                <span className="text-[10px] text-teal-700 block font-bold uppercase tracking-wider">Males</span>
                                <span className="font-extrabold text-sm text-teal-950">{pen.males.toLocaleString()}</span>
                              </div>
                              <div className="p-2 bg-rose-50/70 rounded-xl border border-rose-100">
                                <span className="text-[10px] text-rose-700 block font-bold uppercase tracking-wider">Females</span>
                                <span className="font-extrabold text-sm text-rose-950">{pen.females.toLocaleString()}</span>
                              </div>
                            </div>

                            <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 font-medium border-t border-slate-200/60 mt-1">
                              <span>Total: <strong className="text-slate-800">{penTotal.toLocaleString()}</strong></span>
                              <span>Ratio: <strong className="text-purple-700">1:{penRatio}</strong></span>
                            </div>
                          </div>

                          {/* Action Buttons for Farm Manager & Admin */}
                          {isManagerOrAdmin && (
                            <div className="pt-2 border-t border-slate-200/70 flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEditPen(pen)}
                                className="flex-1 py-1.5 px-2 bg-white hover:bg-teal-50 text-teal-800 border border-teal-200 hover:border-teal-400 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition shadow-2xs cursor-pointer"
                                title={`Edit ${pen.name} Population`}
                              >
                                <Edit3 className="w-3.5 h-3.5 text-teal-600" />
                                <span>Edit Pop.</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setDeletingPen(pen)}
                                className="py-1.5 px-2.5 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 hover:border-rose-400 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition shadow-2xs cursor-pointer"
                                title={`Delete ${pen.name}`}
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                <span className="hidden sm:inline">Delete</span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Two Action Panels: Feed Intake vs Side Mortality Logger */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Panel 1: Feed Consumption Logger */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Wheat className="w-4 h-4 text-teal-600" />
                    <span>Feed Consumption ({activeSide} Side)</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {sideFemales.toLocaleString()} females &bull; {sideMales.toLocaleString()} males on this side
                  </p>
                </div>
                {feedSuccess && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full flex items-center gap-1 animate-pulse">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Logged
                  </span>
                )}
              </div>

              {/* Reference & Guide Card */}
              <div className="p-3 bg-teal-50/80 border border-teal-200/80 rounded-2xl text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-teal-950">Standard Target (Wk {stats?.ageWeeks || 30}):</span>
                  {feedGuideItem && (
                    <button
                      type="button"
                      onClick={applyFeedGuidePreset}
                      className="px-2 py-0.5 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-[10px] font-bold transition shadow-2xs cursor-pointer"
                    >
                      Apply Guide Presets
                    </button>
                  )}
                </div>
                {feedGuideItem && (
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-teal-900">
                    <div className="p-1.5 bg-white/70 rounded-lg border border-teal-100">
                      <span className="text-slate-600 block">Female Target:</span>
                      <strong>{feedGuideItem.femaleGramsPerBird} g/bird</strong> &bull; {feedGuideItem.recommendedFeedType}
                    </div>
                    <div className="p-1.5 bg-white/70 rounded-lg border border-teal-100">
                      <span className="text-slate-600 block">Male Target:</span>
                      <strong>{feedGuideItem.maleGramsPerBird || 125} g/bird</strong> &bull; BMCC
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={handleLogFeed} className="space-y-4">
                {/* Feeding Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Feeding Date *</label>
                  <input
                    type="date"
                    required
                    value={feedDate}
                    onChange={e => setFeedDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-hidden focus:outline-teal-500"
                  />
                </div>

                {/* Female Feeding Section */}
                <div className="p-3.5 bg-rose-50/50 border border-rose-200/80 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-950 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                      Female Feeding ({sideFemales.toLocaleString()} Birds)
                    </span>
                    <span className="text-[10px] font-semibold text-rose-800">
                      Stock: {beginningFemaleStock.toLocaleString()} kg
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Female Feed Type *</label>
                      <select
                        value={femaleFeedType}
                        onChange={e => setFemaleFeedType(e.target.value as FeedType)}
                        className="w-full px-2.5 py-1.5 text-xs font-bold border border-rose-200 rounded-xl bg-white outline-hidden focus:outline-rose-500 text-rose-950"
                      >
                        {['CSC 1', 'CSC 2', 'CGC', 'PDC', 'BLC 1', 'BLC 2', 'BLC 3', 'BMCC', 'BMCR', 'CBB'].map(ft => (
                          <option key={ft} value={ft}>{ft}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Female Amount (g/bird) *</label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          required
                          value={femaleFeedGrams}
                          onChange={e => setFemaleFeedGrams(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 text-xs font-bold border border-rose-200 rounded-xl bg-white outline-hidden focus:outline-rose-500 text-rose-950 pr-14"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-rose-600">
                          g/bird
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-rose-900 bg-rose-100/60 px-2.5 py-1.5 rounded-lg">
                    <span>Calculated Female Feed:</span>
                    <strong>
                      {(femaleFeedKg || 0).toLocaleString()} kg (~{((femaleFeedKg || 0) / 50).toFixed(1)} bags)
                      {feedGuideItem && (
                        <span className="text-[10px] text-rose-700 font-normal ml-1.5">
                          (Target: {feedGuideItem.femaleGramsPerBird || 0}g)
                        </span>
                      )}
                    </strong>
                  </div>
                </div>

                {/* Male Feeding Section */}
                <div className="p-3.5 bg-teal-50/50 border border-teal-200/80 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                      Male Feeding ({(sideMales || 0).toLocaleString()} Birds)
                    </span>
                    <span className="text-[10px] font-semibold text-teal-800">
                      Stock: {(beginningMaleStock || 0).toLocaleString()} kg
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Male Feed Type *</label>
                      <select
                        value={maleFeedType}
                        onChange={e => setMaleFeedType(e.target.value as FeedType)}
                        className="w-full px-2.5 py-1.5 text-xs font-bold border border-teal-200 rounded-xl bg-white outline-hidden focus:outline-teal-500 text-teal-950"
                      >
                        {['BMCC', 'BMCR', 'CSC 1', 'CSC 2', 'CGC', 'PDC', 'BLC 1', 'BLC 2', 'BLC 3', 'CBB'].map(ft => (
                          <option key={ft} value={ft}>{ft}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Male Amount (g/bird) *</label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          required
                          value={maleFeedGrams}
                          onChange={e => setMaleFeedGrams(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 text-xs font-bold border border-teal-200 rounded-xl bg-white outline-hidden focus:outline-teal-500 text-teal-950 pr-14"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-teal-600">
                          g/bird
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-teal-900 bg-teal-100/60 px-2.5 py-1.5 rounded-lg">
                    <span>Calculated Male Feed:</span>
                    <strong>
                      {(maleFeedKg || 0).toLocaleString()} kg (~{((maleFeedKg || 0) / 50).toFixed(1)} bags)
                      {feedGuideItem && (
                        <span className="text-[10px] text-teal-700 font-normal ml-1.5">
                          (Target: {feedGuideItem.maleGramsPerBird || 125}g)
                        </span>
                      )}
                    </strong>
                  </div>
                </div>

                {/* Total Summary */}
                <div className="p-3 bg-slate-900 text-white rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Total Feed Logged</span>
                    <span className="font-bold text-sm text-teal-300">
                      {(totalFeedKg || 0).toLocaleString()} kg
                    </span>
                  </div>
                  <div className="text-right text-[11px] text-slate-300">
                    <span>~{((totalFeedKg || 0) / 50).toFixed(1)} Bags (50kg)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Clean-up Observations</label>
                  <input
                    type="text"
                    value={feedNotes}
                    onChange={e => setFeedNotes(e.target.value)}
                    placeholder="e.g. Feed clean-up time 3.5 hrs, pan lines clear"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-hidden focus:outline-teal-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!canEditHouse || (femaleFeedGrams <= 0 && maleFeedGrams <= 0)}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold text-white transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer ${
                    canEditHouse && (femaleFeedGrams > 0 || maleFeedGrams > 0)
                      ? 'bg-teal-600 hover:bg-teal-700'
                      : 'bg-slate-300 cursor-not-allowed text-slate-500'
                  }`}
                >
                  <Wheat className="w-4 h-4" />
                  <span>Record {activeSide} Side Feeding</span>
                </button>
              </form>
            </div>

            {/* Panel 2: Pen Mortality Logger */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Skull className="w-4 h-4 text-rose-600" />
                  <span>Log Mortality ({activeSide} Side / Pen)</span>
                </h3>
                {mortSuccess && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Recorded
                  </span>
                )}
              </div>

              <form onSubmit={handleLogMortality} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Select Pen *</label>
                  <select
                    value={selectedPenName}
                    onChange={e => setSelectedPenName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white outline-hidden focus:outline-teal-500"
                  >
                    {sidePens.map(p => (
                      <option key={p.id} value={p.name}>
                        {p.name} ({p.side} Side)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Dead Males</label>
                    <input
                      type="number"
                      min="0"
                      value={mortMales}
                      onChange={e => setMortMales(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-hidden focus:outline-teal-500 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Dead Females</label>
                    <input
                      type="number"
                      min="0"
                      value={mortFemales}
                      onChange={e => setMortFemales(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-hidden focus:outline-rose-500 font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Inspection Notes / Symptoms</label>
                  <input
                    type="text"
                    value={mortNotes}
                    onChange={e => setMortNotes(e.target.value)}
                    placeholder="e.g. Found under slats during morning walk"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-hidden focus:outline-teal-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!canEditHouse}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold text-white transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer ${
                    canEditHouse
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-slate-300 cursor-not-allowed text-slate-500'
                  }`}
                >
                  <Skull className="w-4 h-4" />
                  <span>Record Pen Mortality</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: INTER-HOUSE BIRD TRANSFER STATION (FOR BOTH MALE AND FEMALE)       */}
      {/* ========================================================================= */}
      {activeTab === 'transfer_station' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Main Transfer Form Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ArrowLeftRight className="w-5 h-5 text-teal-600" />
                  <span>Inter-House Bird Movement (Male & Female)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Transfer active parent stock birds between production houses for ratio rebalancing, spiking males, or pen balancing.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-teal-800 bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-200">
                <Sparkles className="w-4 h-4 text-teal-600" />
                <span>Live Impact Simulation Enabled</span>
              </div>
            </div>

            <form onSubmit={handleExecuteTransfer} className="space-y-6">
              {/* House Route Selection: From House -> To House */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80">
                {/* Source House Card */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
                      <span>1. FROM (Source House)</span>
                    </span>
                    {sourceStats && (
                      <span className="text-[11px] font-bold text-slate-600">
                        {sourceStats.flock.breed} • Wk {sourceStats.ageWeeks}
                      </span>
                    )}
                  </div>

                  <select
                    value={transferSourceHouse}
                    onChange={e => {
                      setTransferSourceHouse(e.target.value);
                      if (e.target.value === transferDestHouse) {
                        const other = flocks.find(f => f.houseNumber !== e.target.value);
                        if (other) setTransferDestHouse(other.houseNumber);
                      }
                    }}
                    className="w-full px-3.5 py-2.5 text-sm font-bold border border-slate-300 rounded-xl bg-white focus:outline-teal-500"
                  >
                    {flocks.map(f => (
                      <option key={f.id} value={f.houseNumber}>
                        {f.houseNumber} ({f.currentMales}M / {f.currentFemales}F)
                      </option>
                    ))}
                  </select>

                  {/* Available stock in source */}
                  {sourceStats && (
                    <div className="grid grid-cols-2 gap-2 p-2.5 bg-white rounded-xl border border-slate-200 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Available Males:</span>
                        <strong className="text-teal-900 font-black text-sm">{sourceStats.currentMales.toLocaleString()}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Available Females:</span>
                        <strong className="text-rose-900 font-black text-sm">{sourceStats.currentFemales.toLocaleString()}</strong>
                      </div>
                    </div>
                  )}
                </div>

                {/* Destination House Card */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                      <span>2. TO (Destination House)</span>
                    </span>
                    {destStats && (
                      <span className="text-[11px] font-bold text-slate-600">
                        {destStats.flock.breed} • Wk {destStats.ageWeeks}
                      </span>
                    )}
                  </div>

                  <select
                    value={transferDestHouse}
                    onChange={e => setTransferDestHouse(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm font-bold border border-slate-300 rounded-xl bg-white focus:outline-teal-500"
                  >
                    {flocks
                      .filter(f => f.houseNumber !== transferSourceHouse)
                      .map(f => (
                        <option key={f.id} value={f.houseNumber}>
                          {f.houseNumber} ({f.currentMales}M / {f.currentFemales}F)
                        </option>
                      ))}
                  </select>

                  {/* Available stock in dest */}
                  {destStats && (
                    <div className="grid grid-cols-2 gap-2 p-2.5 bg-white rounded-xl border border-slate-200 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Current Males:</span>
                        <strong className="text-teal-900 font-black text-sm">{destStats.currentMales.toLocaleString()}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Current Females:</span>
                        <strong className="text-rose-900 font-black text-sm">{destStats.currentFemales.toLocaleString()}</strong>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bird Counts & Quick Preset Helpers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Male Transfer Input */}
                <div className="p-4 bg-teal-50/60 border border-teal-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
                      <span>Male Birds to Transfer</span>
                    </label>
                    <span className="text-[11px] font-semibold text-teal-700">
                      Max: {sourceStats?.currentMales || 0}
                    </span>
                  </div>

                  <input
                    type="number"
                    min="0"
                    max={sourceStats?.currentMales || 9999}
                    value={transferMales}
                    onChange={e => setTransferMales(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3.5 py-2.5 text-base font-black border border-teal-300 rounded-xl bg-white focus:outline-teal-600 text-teal-950"
                  />

                  {/* Quick Male Presets */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {[5, 10, 15, 20, 50].map(amt => (
                      <button
                        type="button"
                        key={amt}
                        onClick={() => setTransferMales(amt)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                          transferMales === amt
                            ? 'bg-teal-700 text-white border-teal-700'
                            : 'bg-white text-teal-800 border-teal-200 hover:bg-teal-100'
                        }`}
                      >
                        +{amt} M
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setTransferMales(0)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white text-slate-500 border border-slate-200 hover:bg-slate-100 cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Female Transfer Input */}
                <div className="p-4 bg-rose-50/60 border border-rose-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-rose-950 flex items-center gap-1.5">
                      <span>Female Birds to Transfer</span>
                    </label>
                    <span className="text-[11px] font-semibold text-rose-700">
                      Max: {sourceStats?.currentFemales || 0}
                    </span>
                  </div>

                  <input
                    type="number"
                    min="0"
                    max={sourceStats?.currentFemales || 99999}
                    value={transferFemales}
                    onChange={e => setTransferFemales(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3.5 py-2.5 text-base font-black border border-rose-300 rounded-xl bg-white focus:outline-rose-600 text-rose-950"
                  />

                  {/* Quick Female Presets */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {[25, 50, 100, 250, 500].map(amt => (
                      <button
                        type="button"
                        key={amt}
                        onClick={() => setTransferFemales(amt)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                          transferFemales === amt
                            ? 'bg-rose-700 text-white border-rose-700'
                            : 'bg-white text-rose-800 border-rose-200 hover:bg-rose-100'
                        }`}
                      >
                        +{amt} F
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setTransferFemales(0)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white text-slate-500 border border-slate-200 hover:bg-slate-100 cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>

              {/* Date & Reason */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Transfer Date *</label>
                  <input
                    type="date"
                    required
                    value={transferDate}
                    onChange={e => setTransferDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Transfer Reason / Operational Purpose</label>
                  <input
                    type="text"
                    value={transferReason}
                    onChange={e => setTransferReason(e.target.value)}
                    placeholder="e.g. Spiking young active males to boost mating ratio"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-teal-500"
                  />
                </div>
              </div>

              {/* Quick Reason Suggestions */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-slate-400 font-medium">Presets:</span>
                {[
                  'Spiking young active males to boost mating ratio',
                  'Mating ratio rebalancing & pen adjustment',
                  'Flock density balancing across houses',
                  'Late cycle male spike rotation',
                  'Consolidation for shed maintenance'
                ].map(preset => (
                  <button
                    type="button"
                    key={preset}
                    onClick={() => setTransferReason(preset)}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition cursor-pointer"
                  >
                    {preset}
                  </button>
                ))}
              </div>

              {/* Projected Outcome Simulator */}
              <div className="p-4 bg-gradient-to-br from-teal-900 to-slate-900 text-white rounded-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-teal-800/60 pb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-teal-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Projected Flock Statistics After Transfer</span>
                  </span>
                  <span className="text-[11px] text-teal-200">
                    Total Moving: <strong>{((Number(transferMales) || 0) + (Number(transferFemales) || 0)).toLocaleString()} birds</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Source Projected */}
                  <div className="p-3 bg-white/10 rounded-xl border border-white/10 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <strong className="text-rose-300 font-bold">{transferSourceHouse} (Source)</strong>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-900/60 text-rose-200 font-bold">
                        -{((Number(transferMales) || 0) + (Number(transferFemales) || 0))} Birds
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300 space-y-0.5">
                      <p>Males: {sourceStats?.currentMales} &rarr; <strong className="text-white">{projectedSourceMales}</strong></p>
                      <p>Females: {sourceStats?.currentFemales} &rarr; <strong className="text-white">{projectedSourceFemales}</strong></p>
                      <p>New M:F Ratio: <strong className="text-teal-200">1 : {projectedSourceRatio}</strong></p>
                    </div>
                  </div>

                  {/* Destination Projected */}
                  <div className="p-3 bg-white/10 rounded-xl border border-white/10 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <strong className="text-emerald-300 font-bold">{transferDestHouse} (Destination)</strong>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-900/60 text-emerald-200 font-bold">
                        +{((Number(transferMales) || 0) + (Number(transferFemales) || 0))} Birds
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300 space-y-0.5">
                      <p>Males: {destStats?.currentMales} &rarr; <strong className="text-white">{projectedDestMales}</strong></p>
                      <p>Females: {destStats?.currentFemales} &rarr; <strong className="text-white">{projectedDestFemales}</strong></p>
                      <p>New M:F Ratio: <strong className="text-teal-200">1 : {projectedDestRatio}</strong></p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!isTransferValid}
                className={`w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider text-white transition flex items-center justify-center gap-2 shadow-md cursor-pointer ${
                  isTransferValid
                    ? 'bg-teal-600 hover:bg-teal-700'
                    : 'bg-slate-300 cursor-not-allowed text-slate-500'
                }`}
              >
                <ArrowLeftRight className="w-4 h-4" />
                <span>Execute Transfer ({transferMales} Males &amp; {transferFemales} Females)</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: TRANSFER HISTORY LOGS TABLE                                       */}
      {/* ========================================================================= */}
      {activeTab === 'transfer_history' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-teal-600" />
                <span>Inter-House Bird Movement Audit History</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Full chronological record of parent stock transfers across houses.
              </p>
            </div>

            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-xl">
              {transfers.length} Recorded Movement{transfers.length !== 1 ? 's' : ''}
            </span>
          </div>

          {transfers.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <History className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p>No bird transfers recorded yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">From (Source)</th>
                    <th className="py-3 px-4">To (Dest)</th>
                    <th className="py-3 px-4">Males</th>
                    <th className="py-3 px-4">Females</th>
                    <th className="py-3 px-4">Total</th>
                    <th className="py-3 px-4">Reason / Notes</th>
                    <th className="py-3 px-4">Logged By</th>
                    {permissions.canDeleteRecord && <th className="py-3 px-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transfers.map(tr => (
                    <tr key={tr.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4 font-semibold text-slate-800 whitespace-nowrap">
                        {tr.date}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-rose-50 text-rose-800 rounded-md font-bold text-[11px] border border-rose-200">
                          {tr.sourceHouse}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-md font-bold text-[11px] border border-emerald-200">
                          {tr.destHouse}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-black text-teal-900">
                        {tr.maleCount > 0 ? `+${tr.maleCount} M` : '-'}
                      </td>
                      <td className="py-3 px-4 font-black text-rose-900">
                        {tr.femaleCount > 0 ? `+${tr.femaleCount} F` : '-'}
                      </td>
                      <td className="py-3 px-4 font-black text-slate-900">
                        {(Number(tr.maleCount) || 0) + (Number(tr.femaleCount) || 0)}
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={tr.reason}>
                        {tr.reason || 'Inter-house adjustment'}
                      </td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {tr.loggedBy}
                      </td>
                      {permissions.canDeleteRecord && (
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => deleteTransfer(tr.id, true)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Revert and remove transfer record"
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
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: QUICK INTER-HOUSE BIRD TRANSFER                                    */}
      {/* ========================================================================= */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-teal-950 p-5 text-white flex items-center justify-between border-b border-teal-900/50">
              <div>
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <ArrowLeftRight className="w-4 h-4 text-teal-400" />
                  <span>Transfer Birds to Other House</span>
                </h3>
                <p className="text-xs text-teal-300/80">Flockman's Inter-House Bird Movement Station</p>
              </div>
              <button onClick={() => setShowTransferModal(false)} className="text-teal-400 hover:text-white p-1 rounded-lg cursor-pointer">
                &times;
              </button>
            </div>

            <form onSubmit={handleExecuteTransfer} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">From House (Source) *</label>
                  <select
                    value={transferSourceHouse}
                    onChange={e => {
                      setTransferSourceHouse(e.target.value);
                      if (e.target.value === transferDestHouse) {
                        const other = flocks.find(f => f.houseNumber !== e.target.value);
                        if (other) setTransferDestHouse(other.houseNumber);
                      }
                    }}
                    className="w-full px-3 py-2 text-xs font-bold border border-slate-200 rounded-xl bg-white focus:outline-teal-500"
                  >
                    {flocks.map(f => (
                      <option key={f.id} value={f.houseNumber}>
                        {f.houseNumber} ({f.currentMales}M / {f.currentFemales}F)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">To House (Destination) *</label>
                  <select
                    value={transferDestHouse}
                    onChange={e => setTransferDestHouse(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-bold border border-slate-200 rounded-xl bg-white focus:outline-teal-500"
                  >
                    {flocks
                      .filter(f => f.houseNumber !== transferSourceHouse)
                      .map(f => (
                        <option key={f.id} value={f.houseNumber}>
                          {f.houseNumber} ({f.currentMales}M / {f.currentFemales}F)
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl space-y-1.5">
                  <label className="block text-xs font-bold text-teal-900">Males to Transfer</label>
                  <input
                    type="number"
                    min="0"
                    max={sourceStats?.currentMales || 9999}
                    value={transferMales}
                    onChange={e => setTransferMales(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-1.5 text-sm font-black border border-teal-300 rounded-lg bg-white focus:outline-teal-600"
                  />
                  <div className="flex gap-1 pt-1">
                    {[5, 10, 20].map(n => (
                      <button
                        type="button"
                        key={n}
                        onClick={() => setTransferMales(n)}
                        className="px-2 py-0.5 text-[10px] font-bold bg-white border border-teal-200 rounded hover:bg-teal-100 text-teal-800 cursor-pointer"
                      >
                        +{n}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1.5">
                  <label className="block text-xs font-bold text-rose-900">Females to Transfer</label>
                  <input
                    type="number"
                    min="0"
                    max={sourceStats?.currentFemales || 99999}
                    value={transferFemales}
                    onChange={e => setTransferFemales(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-1.5 text-sm font-black border border-rose-300 rounded-lg bg-white focus:outline-rose-600"
                  />
                  <div className="flex gap-1 pt-1">
                    {[25, 50, 100].map(n => (
                      <button
                        type="button"
                        key={n}
                        onClick={() => setTransferFemales(n)}
                        className="px-2 py-0.5 text-[10px] font-bold bg-white border border-rose-200 rounded hover:bg-rose-100 text-rose-800 cursor-pointer"
                      >
                        +{n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Transfer Date *</label>
                <input
                  type="date"
                  required
                  value={transferDate}
                  onChange={e => setTransferDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Transfer Reason / Notes</label>
                <input
                  type="text"
                  value={transferReason}
                  onChange={e => setTransferReason(e.target.value)}
                  placeholder="e.g. Spiking young active males to boost mating ratio"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-teal-500"
                />
              </div>

              {/* Quick simulation summary */}
              <div className="p-3 bg-slate-900 text-white rounded-xl text-xs space-y-1">
                <div className="flex justify-between text-teal-300 font-bold text-[11px]">
                  <span>{transferSourceHouse} &rarr; {transferDestHouse}</span>
                  <span>Total: {transferMales + transferFemales} Birds</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-300 pt-1">
                  <div>
                    <span className="block text-slate-400">Source After:</span>
                    <span>{projectedSourceMales}M / {projectedSourceFemales}F (1:{projectedSourceRatio})</span>
                  </div>
                  <div>
                    <span className="block text-slate-400">Dest After:</span>
                    <span>{projectedDestMales}M / {projectedDestFemales}F (1:{projectedDestRatio})</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isTransferValid}
                  className={`px-4 py-2 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
                    isTransferValid
                      ? 'bg-teal-600 hover:bg-teal-700'
                      : 'bg-slate-300 cursor-not-allowed text-slate-500'
                  }`}
                >
                  Confirm Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD PEN PARTITION                                                  */}
      {/* ========================================================================= */}
      {showAddPenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="bg-teal-950 p-5 text-white flex items-center justify-between border-b border-teal-900/50">
              <div>
                <h3 className="font-bold text-base text-white">Add New Pen Partition</h3>
                <p className="text-xs text-teal-300/80">{activeFlock.houseNumber} • {newPenSide} Side</p>
              </div>
              <button onClick={() => setShowAddPenModal(false)} className="text-teal-400 hover:text-white p-1 rounded-lg cursor-pointer">
                &times;
              </button>
            </div>

            <form onSubmit={handleAddPen} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pen Name / Tag *</label>
                <input
                  type="text"
                  required
                  value={newPenName}
                  onChange={e => setNewPenName(e.target.value)}
                  placeholder="e.g. Pen L3"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-teal-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Side *</label>
                <select
                  value={newPenSide}
                  onChange={e => setNewPenSide(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white outline-hidden focus:outline-teal-500"
                >
                  <option value="Left">Left Side</option>
                  <option value="Right">Right Side</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Number of Males *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newPenMales}
                    onChange={e => setNewPenMales(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-hidden focus:outline-teal-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Number of Females *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newPenFemales}
                    onChange={e => setNewPenFemales(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-hidden focus:outline-rose-500 font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddPenModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  Create Pen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT PEN POPULATION (FARM MANAGER & ADMIN)                          */}
      {/* ========================================================================= */}
      {editingPen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="bg-teal-950 p-5 text-white flex items-center justify-between border-b border-teal-900/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-800 text-teal-200">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Edit Pen Population</h3>
                  <p className="text-xs text-teal-300/80">{activeFlock.houseNumber} &bull; {editingPen.name} ({editingPen.side} Side)</p>
                </div>
              </div>
              <button 
                onClick={() => setEditingPen(null)} 
                className="text-teal-400 hover:text-white p-1 rounded-lg cursor-pointer transition text-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSavePenEdit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pen Name / Identifier *</label>
                  <input
                    type="text"
                    required
                    value={editPenName}
                    onChange={e => setEditPenName(e.target.value)}
                    placeholder="e.g. Pen L1"
                    className="w-full px-3 py-2 text-xs font-bold border border-slate-200 rounded-xl focus:outline-teal-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Side Placement *</label>
                  <select
                    value={editPenSide}
                    onChange={e => setEditPenSide(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs font-bold border border-slate-200 rounded-xl bg-white outline-hidden focus:outline-teal-500"
                  >
                    <option value="Left">Left Side</option>
                    <option value="Right">Right Side</option>
                  </select>
                </div>
              </div>

              {/* Male & Female Population Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {/* Males */}
                <div className="p-3.5 bg-teal-50/70 border border-teal-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                      Male Population
                    </label>
                    <span className="text-[10px] font-bold text-teal-700 uppercase">Birds</span>
                  </div>

                  <input
                    type="number"
                    min="0"
                    required
                    value={editPenMales}
                    onChange={e => setEditPenMales(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-2 text-base font-black border border-teal-300 rounded-xl outline-hidden focus:outline-teal-600 bg-white text-teal-950"
                  />

                  {/* Quick Adjust buttons */}
                  <div className="flex items-center gap-1 flex-wrap pt-0.5">
                    <button
                      type="button"
                      onClick={() => setEditPenMales(prev => Math.max(0, prev - 10))}
                      className="px-2 py-0.5 text-[10px] font-bold bg-white border border-teal-200 rounded-md hover:bg-teal-100 text-teal-800 cursor-pointer"
                    >
                      -10
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditPenMales(prev => Math.max(0, prev - 5))}
                      className="px-2 py-0.5 text-[10px] font-bold bg-white border border-teal-200 rounded-md hover:bg-teal-100 text-teal-800 cursor-pointer"
                    >
                      -5
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditPenMales(prev => prev + 5)}
                      className="px-2 py-0.5 text-[10px] font-bold bg-white border border-teal-200 rounded-md hover:bg-teal-100 text-teal-800 cursor-pointer"
                    >
                      +5
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditPenMales(prev => prev + 10)}
                      className="px-2 py-0.5 text-[10px] font-bold bg-white border border-teal-200 rounded-md hover:bg-teal-100 text-teal-800 cursor-pointer"
                    >
                      +10
                    </button>
                  </div>
                </div>

                {/* Females */}
                <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-rose-950 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                      Female Population
                    </label>
                    <span className="text-[10px] font-bold text-rose-700 uppercase">Birds</span>
                  </div>

                  <input
                    type="number"
                    min="0"
                    required
                    value={editPenFemales}
                    onChange={e => setEditPenFemales(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-2 text-base font-black border border-rose-300 rounded-xl outline-hidden focus:outline-rose-600 bg-white text-rose-950"
                  />

                  {/* Quick Adjust buttons */}
                  <div className="flex items-center gap-1 flex-wrap pt-0.5">
                    <button
                      type="button"
                      onClick={() => setEditPenFemales(prev => Math.max(0, prev - 50))}
                      className="px-2 py-0.5 text-[10px] font-bold bg-white border border-rose-200 rounded-md hover:bg-rose-100 text-rose-800 cursor-pointer"
                    >
                      -50
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditPenFemales(prev => Math.max(0, prev - 25))}
                      className="px-2 py-0.5 text-[10px] font-bold bg-white border border-rose-200 rounded-md hover:bg-rose-100 text-rose-800 cursor-pointer"
                    >
                      -25
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditPenFemales(prev => prev + 25)}
                      className="px-2 py-0.5 text-[10px] font-bold bg-white border border-rose-200 rounded-md hover:bg-rose-100 text-rose-800 cursor-pointer"
                    >
                      +25
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditPenFemales(prev => prev + 50)}
                      className="px-2 py-0.5 text-[10px] font-bold bg-white border border-rose-200 rounded-md hover:bg-rose-100 text-rose-800 cursor-pointer"
                    >
                      +50
                    </button>
                  </div>
                </div>
              </div>

              {/* Real-time Summary Card */}
              <div className="p-3.5 bg-slate-900 text-white rounded-2xl space-y-2 text-xs">
                <div className="flex items-center justify-between text-teal-300 font-bold text-xs border-b border-slate-800 pb-2">
                  <span>Pen Population Metrics</span>
                  <span>Total: {(Number(editPenMales) + Number(editPenFemales)).toLocaleString()} Birds</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-[11px] text-slate-300 pt-1">
                  <div>
                    <span className="block text-slate-400">M:F Mating Ratio:</span>
                    <strong className="text-white text-sm">
                      {editPenMales > 0 && editPenFemales > 0 
                        ? `1 : ${(Number(editPenFemales) / Number(editPenMales)).toFixed(1)}`
                        : 'N/A'}
                    </strong>
                  </div>
                  <div>
                    <span className="block text-slate-400">Current House Males / Females:</span>
                    <strong className="text-white">
                      {stats?.currentMales.toLocaleString()}M / {stats?.currentFemales.toLocaleString()}F
                    </strong>
                  </div>
                </div>
              </div>

              {/* Synchronize Option */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={syncFlockPopulationWithPens}
                    onChange={e => setSyncFlockPopulationWithPens(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      Synchronize {activeFlock.houseNumber} total population
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      Recalculates active house totals to match the exact sum of all configured pen partitions.
                    </span>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const penToDelete = editingPen;
                    setEditingPen(null);
                    setDeletingPen(penToDelete);
                  }}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Pen</span>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingPen(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DELETE PEN CONFIRMATION (FARM MANAGER & ADMIN)                      */}
      {/* ========================================================================= */}
      {deletingPen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="bg-rose-950 p-5 text-white flex items-center justify-between border-b border-rose-900/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-800 text-rose-200">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Delete Pen Partition</h3>
                  <p className="text-xs text-rose-300/80">{activeFlock.houseNumber} &bull; {deletingPen.name}</p>
                </div>
              </div>
              <button 
                onClick={() => setDeletingPen(null)} 
                className="text-rose-400 hover:text-white p-1 rounded-lg cursor-pointer transition text-lg"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to permanently delete <strong>{deletingPen.name}</strong> from <strong>{activeFlock.houseNumber}</strong>?
              </p>

              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl space-y-1.5 text-xs text-rose-950">
                <div className="font-bold flex items-center justify-between">
                  <span>{deletingPen.name} ({deletingPen.side} Side)</span>
                  <span className="px-2 py-0.5 bg-rose-200 text-rose-900 rounded-md text-[10px] font-black">
                    {((deletingPen.males || 0) + (deletingPen.females || 0)).toLocaleString()} Birds
                  </span>
                </div>
                <p className="text-[11px] text-rose-800">
                  Males: <strong>{(deletingPen.males || 0).toLocaleString()}</strong> &bull; Females: <strong>{(deletingPen.females || 0).toLocaleString()}</strong>
                </p>
              </div>

              <p className="text-[11px] text-slate-500 italic">
                Note: This removes the pen subdivision record from this house. If these birds are still present in the house, you can allocate their numbers across remaining pens.
              </p>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDeletingPen(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeletePen}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Confirm Delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
