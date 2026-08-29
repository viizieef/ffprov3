import React, { useState, useMemo, useEffect } from 'react';
import { DeliveryRecord, DeliveryHouseRecord, DeliveryStatus } from '../../types';
import { useFarm } from '../../context/FarmContext';
import { 
  Truck, 
  X, 
  Sparkles, 
  Plus, 
  Trash2, 
  Save, 
  Clock, 
  Thermometer, 
  Layers, 
  Package, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  FileSpreadsheet
} from 'lucide-react';
import { useToast } from '../common/ToastContainer';

interface DeliveryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: DeliveryRecord | null;
  onSaved?: (record: DeliveryRecord) => void;
}

const DEFAULT_HOUSES = ['1', '2', '3', '4', '5', '6'];

const createEmptyHouseRow = (houseNumber: string): DeliveryHouseRecord => ({
  houseNumber,
  date5PercentHD: '2026-02-15',
  nheDelivered: 0,
  nheShortOver: 0,
  netNheReceived: 0,
  heDelivered: 0,
  heShortOver: 0,
  netHeReceived: 0,
  totalEggsReceived: 0,
  transitBreakage: 0,
  transitHairline: 0,
  transitSpoils: 0,
  intactHeReceived: 0,
  regradingDirty: 0,
  regradingThinShell: 0,
  regradingMisShape: 0,
  regradingOffSize: 0,
  regradingCrack: 0,
  regradingSpoil: 0,
  regradingJRS: 0,
  totalNheSorting: 0,
  totalSettableEggs: 0
});

export const DeliveryFormModal: React.FC<DeliveryFormModalProps> = ({
  isOpen,
  onClose,
  initialData,
  onSaved
}) => {
  const { 
    addDelivery, 
    updateDelivery, 
    currentUser, 
    farmProfile, 
    eggProductionRecords,
    flocks 
  } = useFarm();
  const toast = useToast();

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Form states
  const [productionDate, setProductionDate] = useState(() => initialData?.productionDate || todayStr);
  const [dateReceived, setDateReceived] = useState(() => initialData?.dateReceived || todayStr);
  const [dateRegraded, setDateRegraded] = useState(() => initialData?.dateRegraded || todayStr);
  const [esrrrNumber, setEsrrrNumber] = useState(() => initialData?.esrrrNumber || `LPL${todayStr.replace(/-/g, '')}`);
  const [companyName, setCompanyName] = useState(() => initialData?.companyName || 'SAN MIGUEL FOODS, INC.');
  const [farmName, setFarmName] = useState(() => initialData?.farmName || farmProfile?.name || 'L. P. LIM CITY FAMILY FARM, INC.');
  const [farmCode, setFarmCode] = useState(() => initialData?.farmCode || 'LPL');
  const [farmAddress, setFarmAddress] = useState(() => initialData?.farmAddress || farmProfile?.address || 'GEN. AGUINALDO, RAMON, ISABELA');
  const [hatcheryName, setHatcheryName] = useState(() => initialData?.hatcheryName || 'MJBJ Hatchery');
  const [status, setStatus] = useState<DeliveryStatus>(() => initialData?.status || 'Completed');

  // Logistics & Containers
  const [cratesGreen, setCratesGreen] = useState(() => initialData?.cratesGreen || 160);
  const [cratesRed, setCratesRed] = useState(() => initialData?.cratesRed || 4);
  const [traysOrange, setTraysOrange] = useState(() => initialData?.traysOrange || 2250);
  const [traysYellow, setTraysYellow] = useState(() => initialData?.traysYellow || 44);
  const [traysGreen, setTraysGreen] = useState(() => initialData?.traysGreen || 0);
  const [traysRed, setTraysRed] = useState(() => initialData?.traysRed || 0);
  const [timeArrival, setTimeArrival] = useState(() => initialData?.timeArrival || '14:00');
  const [timeReceived, setTimeReceived] = useState(() => initialData?.timeReceived || '15:13');
  const [eggShellTemperature, setEggShellTemperature] = useState(() => initialData?.eggShellTemperature || 21.2);
  const [plateNumber, setPlateNumber] = useState(() => initialData?.plateNumber || 'CAL 4567');
  const [driverName, setDriverName] = useState(() => initialData?.driverName || 'SMFI Logistics Team');

  // Signatures
  const [preparedBy, setPreparedBy] = useState(() => initialData?.preparedBy || currentUser?.fullName || 'VON CARLO S. FRANCISCO');
  const [farmOic, setFarmOic] = useState(() => initialData?.farmOic || 'CHERYLE U. BAYDUA');
  const [checkedByFarm, setCheckedByFarm] = useState(() => initialData?.checkedByFarm || 'MARK MARLON TIU');
  const [receivedByHatchery, setReceivedByHatchery] = useState(() => initialData?.receivedByHatchery || 'G. ROMANO');
  const [checkedByHatchery, setCheckedByHatchery] = useState(() => initialData?.checkedByHatchery || 'SC AGONIOR');
  const [notes, setNotes] = useState(() => initialData?.notes || '');

  // House items
  const [items, setItems] = useState<DeliveryHouseRecord[]>(() => {
    if (initialData?.items && initialData.items.length > 0) {
      return JSON.parse(JSON.stringify(initialData.items));
    }
    return DEFAULT_HOUSES.map(createEmptyHouseRow);
  });

  // Re-sync if initialData changes
  useEffect(() => {
    if (initialData) {
      setProductionDate(initialData.productionDate);
      setDateReceived(initialData.dateReceived);
      setDateRegraded(initialData.dateRegraded || initialData.dateReceived);
      setEsrrrNumber(initialData.esrrrNumber);
      setCompanyName(initialData.companyName);
      setFarmName(initialData.farmName);
      setFarmCode(initialData.farmCode);
      setFarmAddress(initialData.farmAddress);
      setHatcheryName(initialData.hatcheryName);
      setStatus(initialData.status);
      setCratesGreen(initialData.cratesGreen);
      setCratesRed(initialData.cratesRed);
      setTraysOrange(initialData.traysOrange);
      setTraysYellow(initialData.traysYellow);
      setTraysGreen(initialData.traysGreen || 0);
      setTraysRed(initialData.traysRed || 0);
      setTimeArrival(initialData.timeArrival);
      setTimeReceived(initialData.timeReceived);
      setEggShellTemperature(initialData.eggShellTemperature);
      setPlateNumber(initialData.plateNumber);
      setDriverName(initialData.driverName || '');
      setPreparedBy(initialData.preparedBy);
      setFarmOic(initialData.farmOic);
      setCheckedByFarm(initialData.checkedByFarm);
      setReceivedByHatchery(initialData.receivedByHatchery);
      setCheckedByHatchery(initialData.checkedByHatchery);
      setNotes(initialData.notes || '');
      setItems(JSON.parse(JSON.stringify(initialData.items)));
    }
  }, [initialData]);

  // Handle live recalculations on house row modification
  const handleItemChange = (index: number, field: keyof DeliveryHouseRecord, value: any) => {
    setItems(prev => {
      const next = [...prev];
      const row = { ...next[index], [field]: value };

      // Parse numerical values
      const nheDeliv = Number(field === 'nheDelivered' ? value : row.nheDelivered) || 0;
      const nheDiff = Number(field === 'nheShortOver' ? value : row.nheShortOver) || 0;
      const netNhe = nheDeliv + nheDiff;

      const heDeliv = Number(field === 'heDelivered' ? value : row.heDelivered) || 0;
      const heDiff = Number(field === 'heShortOver' ? value : row.heShortOver) || 0;
      const netHe = heDeliv + heDiff;

      const totalReceived = netNhe + netHe;

      const tBreak = Number(field === 'transitBreakage' ? value : row.transitBreakage) || 0;
      const tHair = Number(field === 'transitHairline' ? value : row.transitHairline) || 0;
      const tSpoil = Number(field === 'transitSpoils' ? value : row.transitSpoils) || 0;
      const intactHe = Math.max(0, netHe - (tBreak + tHair + tSpoil));

      const rDirty = Number(field === 'regradingDirty' ? value : row.regradingDirty) || 0;
      const rThin = Number(field === 'regradingThinShell' ? value : row.regradingThinShell) || 0;
      const rMis = Number(field === 'regradingMisShape' ? value : row.regradingMisShape) || 0;
      const rOff = Number(field === 'regradingOffSize' ? value : row.regradingOffSize) || 0;
      const rCrack = Number(field === 'regradingCrack' ? value : row.regradingCrack) || 0;
      const rSpoil = Number(field === 'regradingSpoil' ? value : row.regradingSpoil) || 0;
      const rJRS = Number(field === 'regradingJRS' ? value : row.regradingJRS) || 0;

      const totalSorting = rDirty + rThin + rMis + rOff + rCrack + rSpoil + rJRS;
      const settable = Math.max(0, intactHe - totalSorting);

      row.netNheReceived = netNhe;
      row.netHeReceived = netHe;
      row.totalEggsReceived = totalReceived;
      row.intactHeReceived = intactHe;
      row.totalNheSorting = totalSorting;
      row.totalSettableEggs = settable;

      next[index] = row;
      return next;
    });
  };

  // 1-Click Pull from Daily Egg Production Records
  const handleAutoPullFromEggLogs = () => {
    if (!productionDate) {
      toast.error('Please select a Production Date first.');
      return;
    }

    const dayRecords = eggProductionRecords.filter(r => r.date === productionDate);
    if (dayRecords.length === 0) {
      toast.warning(`No egg collection records logged for date ${productionDate}. Populating with standard averages.`);
    }

    const updated = items.map(item => {
      const houseNumStr = item.houseNumber;
      const match = dayRecords.find(r => 
        r.houseNumber === houseNumStr || 
        r.houseNumber === `House ${houseNumStr}` || 
        r.houseNumber.endsWith(houseNumStr)
      );

      const he = match?.totalHE || (match?.heNest || 0) + (match?.heFloor || 0) || 8000;
      const nhe = match?.totalNHE || 180;

      const netNhe = nhe + item.nheShortOver;
      const netHe = he + item.heShortOver;
      const totalRcv = netNhe + netHe;
      const intact = Math.max(0, netHe - (item.transitBreakage + item.transitHairline + item.transitSpoils));
      const totalSorting = item.regradingDirty + item.regradingThinShell + item.regradingMisShape + item.regradingOffSize + item.regradingCrack + item.regradingSpoil + item.regradingJRS;
      const settable = Math.max(0, intact - totalSorting);

      return {
        ...item,
        heDelivered: he,
        nheDelivered: nhe,
        netNheReceived: netNhe,
        netHeReceived: netHe,
        totalEggsReceived: totalRcv,
        intactHeReceived: intact,
        totalNheSorting: totalSorting,
        totalSettableEggs: settable
      };
    });

    setItems(updated);
    toast.success(`Successfully loaded egg production numbers for ${productionDate}!`);
  };

  // Aggregated Totals
  const totals = useMemo(() => {
    return items.reduce((acc, row) => ({
      totalNheDelivered: acc.totalNheDelivered + (Number(row.nheDelivered) || 0),
      totalNheShortOver: acc.totalNheShortOver + (Number(row.nheShortOver) || 0),
      totalNetNheReceived: acc.totalNetNheReceived + (Number(row.netNheReceived) || 0),
      totalHeDelivered: acc.totalHeDelivered + (Number(row.heDelivered) || 0),
      totalHeShortOver: acc.totalHeShortOver + (Number(row.heShortOver) || 0),
      totalNetHeReceived: acc.totalNetHeReceived + (Number(row.netHeReceived) || 0),
      totalEggsReceived: acc.totalEggsReceived + (Number(row.totalEggsReceived) || 0),
      totalTransitBreakage: acc.totalTransitBreakage + (Number(row.transitBreakage) || 0),
      totalTransitHairline: acc.totalTransitHairline + (Number(row.transitHairline) || 0),
      totalTransitSpoils: acc.totalTransitSpoils + (Number(row.transitSpoils) || 0),
      totalIntactHeReceived: acc.totalIntactHeReceived + (Number(row.intactHeReceived) || 0),
      totalRegradingDirty: acc.totalRegradingDirty + (Number(row.regradingDirty) || 0),
      totalRegradingThinShell: acc.totalRegradingThinShell + (Number(row.regradingThinShell) || 0),
      totalRegradingMisShape: acc.totalRegradingMisShape + (Number(row.regradingMisShape) || 0),
      totalRegradingOffSize: acc.totalRegradingOffSize + (Number(row.regradingOffSize) || 0),
      totalRegradingCrack: acc.totalRegradingCrack + (Number(row.regradingCrack) || 0),
      totalRegradingSpoil: acc.totalRegradingSpoil + (Number(row.regradingSpoil) || 0),
      totalRegradingJRS: acc.totalRegradingJRS + (Number(row.regradingJRS) || 0),
      totalNheSorting: acc.totalNheSorting + (Number(row.totalNheSorting) || 0),
      totalSettableEggs: acc.totalSettableEggs + (Number(row.totalSettableEggs) || 0)
    }), {
      totalNheDelivered: 0,
      totalNheShortOver: 0,
      totalNetNheReceived: 0,
      totalHeDelivered: 0,
      totalHeShortOver: 0,
      totalNetHeReceived: 0,
      totalEggsReceived: 0,
      totalTransitBreakage: 0,
      totalTransitHairline: 0,
      totalTransitSpoils: 0,
      totalIntactHeReceived: 0,
      totalRegradingDirty: 0,
      totalRegradingThinShell: 0,
      totalRegradingMisShape: 0,
      totalRegradingOffSize: 0,
      totalRegradingCrack: 0,
      totalRegradingSpoil: 0,
      totalRegradingJRS: 0,
      totalNheSorting: 0,
      totalSettableEggs: 0
    });
  }, [items]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!esrrrNumber.trim()) {
      toast.error('Please enter an ESRRR Control Number.');
      return;
    }

    const payload: Omit<DeliveryRecord, 'id' | 'createdAt'> = {
      esrrrNumber: esrrrNumber.trim(),
      companyName: companyName.trim(),
      farmName: farmName.trim(),
      farmCode: farmCode.trim(),
      farmAddress: farmAddress.trim(),
      productionDate,
      dateReceived,
      dateRegraded,
      hatcheryName: hatcheryName.trim(),
      status,

      items,

      totalNheDelivered: totals.totalNheDelivered,
      totalNheShortOver: totals.totalNheShortOver,
      totalNetNheReceived: totals.totalNetNheReceived,
      totalHeDelivered: totals.totalHeDelivered,
      totalHeShortOver: totals.totalHeShortOver,
      totalNetHeReceived: totals.totalNetHeReceived,
      totalEggsReceived: totals.totalEggsReceived,
      totalTransitBreakage: totals.totalTransitBreakage,
      totalTransitHairline: totals.totalTransitHairline,
      totalTransitSpoils: totals.totalTransitSpoils,
      totalIntactHeReceived: totals.totalIntactHeReceived,
      totalRegradingDirty: totals.totalRegradingDirty,
      totalRegradingThinShell: totals.totalRegradingThinShell,
      totalRegradingMisShape: totals.totalRegradingMisShape,
      totalRegradingOffSize: totals.totalRegradingOffSize,
      totalRegradingCrack: totals.totalRegradingCrack,
      totalRegradingSpoil: totals.totalRegradingSpoil,
      totalRegradingJRS: totals.totalRegradingJRS,
      totalNheSorting: totals.totalNheSorting,
      totalSettableEggs: totals.totalSettableEggs,

      cratesGreen: Number(cratesGreen) || 0,
      cratesRed: Number(cratesRed) || 0,
      totalCrates: (Number(cratesGreen) || 0) + (Number(cratesRed) || 0),
      traysOrange: Number(traysOrange) || 0,
      traysYellow: Number(traysYellow) || 0,
      traysGreen: Number(traysGreen) || 0,
      traysRed: Number(traysRed) || 0,
      totalTrays: (Number(traysOrange) || 0) + (Number(traysYellow) || 0) + (Number(traysGreen) || 0) + (Number(traysRed) || 0),
      timeArrival,
      timeReceived,
      eggShellTemperature: Number(eggShellTemperature) || 0,
      plateNumber: plateNumber.trim(),
      driverName: driverName?.trim(),

      preparedBy: preparedBy.trim(),
      farmOic: farmOic.trim(),
      checkedByFarm: checkedByFarm.trim(),
      receivedByHatchery: receivedByHatchery.trim(),
      checkedByHatchery: checkedByHatchery.trim(),
      notes: notes.trim(),
      loggedBy: currentUser?.fullName || 'Staff'
    };

    if (initialData?.id) {
      updateDelivery(initialData.id, payload);
      toast.success(`Updated ESRRR Delivery #${esrrrNumber}!`);
      if (onSaved) onSaved({ ...payload, id: initialData.id, createdAt: initialData.createdAt });
    } else {
      const created = addDelivery(payload);
      toast.success(`Created ESRRR Delivery #${esrrrNumber}!`);
      if (onSaved) onSaved(created);
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-7xl max-h-[92vh] flex flex-col overflow-hidden text-slate-900">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight font-display">
                {initialData ? `Edit ESRRR Voucher #${initialData.esrrrNumber}` : 'New Egg Sending, Receiving & Regrading Report (ESRRR)'}
              </h2>
              <p className="text-xs text-slate-400">
                Official San Miguel Foods, Inc. delivery voucher, house-by-house grading, and cold chain logistics
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleAutoPullFromEggLogs}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/90 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl transition shadow-xs cursor-pointer"
              title="Auto-fetch and populate HE and NHE from Egg Production Logs for selected date"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Pull from Egg Logs</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Top Control Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                ESRRR Control Number *
              </label>
              <input
                type="text"
                required
                value={esrrrNumber}
                onChange={e => setEsrrrNumber(e.target.value)}
                placeholder="e.g. LPL20260809"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                Production Date *
              </label>
              <input
                type="date"
                required
                value={productionDate}
                onChange={e => setProductionDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                Date Received at Hatchery *
              </label>
              <input
                type="date"
                required
                value={dateReceived}
                onChange={e => setDateReceived(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                Receiving Hatchery *
              </label>
              <input
                type="text"
                required
                value={hatcheryName}
                onChange={e => setHatcheryName(e.target.value)}
                placeholder="e.g. MJBJ Hatchery"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                Company / Integrator
              </label>
              <input
                type="text"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                Farm Name & Code
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={farmName}
                  onChange={e => setFarmName(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium text-slate-900 text-xs"
                />
                <input
                  type="text"
                  value={farmCode}
                  onChange={e => setFarmCode(e.target.value)}
                  placeholder="LPL"
                  className="w-16 px-2 py-2 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 text-xs text-center"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                Delivery Status
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as DeliveryStatus)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold text-slate-900 text-xs focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Completed">Completed (Fully Re-graded)</option>
                <option value="Received">Received at Hatchery</option>
                <option value="Regraded">Regraded</option>
                <option value="Dispatched">Dispatched / In-Transit</option>
                <option value="Draft">Draft</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={handleAutoPullFromEggLogs}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer sm:hidden"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Pull from Egg Logs</span>
              </button>
            </div>
          </div>

          {/* House-by-House Grading & Regrading Matrix */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                House-by-House Egg Sending, Receiving & Regrading Grid
              </h3>
              <span className="text-[11px] text-slate-500 italic">
                * All net calculations, transit damages, and settable eggs calculate automatically in real-time.
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-300 rounded-2xl shadow-xs">
              <table className="w-full text-xs text-left border-collapse min-w-[1100px]">
                <thead>
                  {/* Group header */}
                  <tr className="bg-slate-800 text-white font-bold uppercase text-[9px] tracking-wider text-center border-b border-slate-700">
                    <th rowSpan={2} className="px-2 py-2 border-r border-slate-700 text-left w-20">House</th>
                    <th rowSpan={2} className="px-2 py-2 border-r border-slate-700 w-28">5% HD Date</th>
                    <th colSpan={3} className="px-2 py-1 bg-amber-900/60 text-amber-200 border-r border-slate-700">
                      NHE (Non-Hatching)
                    </th>
                    <th colSpan={3} className="px-2 py-1 bg-emerald-900/60 text-emerald-200 border-r border-slate-700">
                      HE (Hatching Eggs)
                    </th>
                    <th rowSpan={2} className="px-2 py-2 bg-sky-900/60 text-sky-200 border-r border-slate-700 w-24">
                      Total Recv
                    </th>
                    <th colSpan={4} className="px-2 py-1 bg-rose-900/60 text-rose-200 border-r border-slate-700">
                      Transit / Handling Discards (HE)
                    </th>
                    <th colSpan={8} className="px-2 py-1 bg-purple-900/60 text-purple-200 border-r border-slate-700">
                      Hatchery Regrading (NHE Sorting)
                    </th>
                    <th rowSpan={2} className="px-2 py-2 bg-emerald-800 text-white w-28">
                      Settable Eggs
                    </th>
                  </tr>
                  {/* Sub header */}
                  <tr className="bg-slate-700 text-slate-200 font-semibold text-[9px] uppercase tracking-wider text-center border-b border-slate-600">
                    {/* NHE */}
                    <th className="p-1 border-r border-slate-600 w-20">Deliv</th>
                    <th className="p-1 border-r border-slate-600 w-16">+/-</th>
                    <th className="p-1 border-r border-slate-600 w-20 text-white font-bold">Net Rcv</th>
                    {/* HE */}
                    <th className="p-1 border-r border-slate-600 w-20">Deliv</th>
                    <th className="p-1 border-r border-slate-600 w-16">+/-</th>
                    <th className="p-1 border-r border-slate-600 w-20 text-white font-bold">Net Rcv</th>
                    {/* Transit */}
                    <th className="p-1 border-r border-slate-600 w-16 text-rose-300">Break</th>
                    <th className="p-1 border-r border-slate-600 w-16 text-rose-300">Hair</th>
                    <th className="p-1 border-r border-slate-600 w-16 text-rose-300">Spoil</th>
                    <th className="p-1 border-r border-slate-600 w-20 text-emerald-300 font-bold">Intact</th>
                    {/* Regrading */}
                    <th className="p-1 border-r border-slate-600 w-14">Dirty</th>
                    <th className="p-1 border-r border-slate-600 w-14">Thin</th>
                    <th className="p-1 border-r border-slate-600 w-14">M-Shp</th>
                    <th className="p-1 border-r border-slate-600 w-14">Off-Sz</th>
                    <th className="p-1 border-r border-slate-600 w-14">Crack</th>
                    <th className="p-1 border-r border-slate-600 w-14">Spoil</th>
                    <th className="p-1 border-r border-slate-600 w-14">JRS</th>
                    <th className="p-1 border-r border-slate-600 w-20 text-amber-300 font-bold">Total NHE</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {items.map((row, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                      {/* House Label */}
                      <td className="p-2 font-bold text-slate-900 border-r border-slate-200">
                        House {row.houseNumber}
                      </td>
                      {/* Date 5% HD */}
                      <td className="p-1 border-r border-slate-200">
                        <input
                          type="date"
                          value={row.date5PercentHD || ''}
                          onChange={e => handleItemChange(idx, 'date5PercentHD', e.target.value)}
                          className="w-full px-1.5 py-1 text-[11px] font-mono border border-slate-200 rounded-lg"
                        />
                      </td>

                      {/* NHE Delivered */}
                      <td className="p-1 border-r border-slate-200">
                        <input
                          type="number"
                          min="0"
                          value={row.nheDelivered}
                          onChange={e => handleItemChange(idx, 'nheDelivered', e.target.value)}
                          className="w-full px-1.5 py-1 text-[11px] font-mono text-right border border-slate-200 rounded-lg focus:border-amber-500"
                        />
                      </td>
                      {/* NHE Short/Over */}
                      <td className="p-1 border-r border-slate-200">
                        <input
                          type="number"
                          value={row.nheShortOver}
                          onChange={e => handleItemChange(idx, 'nheShortOver', e.target.value)}
                          className="w-full px-1.5 py-1 text-[11px] font-mono text-right border border-slate-200 rounded-lg"
                        />
                      </td>
                      {/* Net NHE Received */}
                      <td className="p-2 text-right font-mono font-bold text-amber-950 bg-amber-50/50 border-r border-slate-200 text-[11px]">
                        {row.netNheReceived.toLocaleString()}
                      </td>

                      {/* HE Delivered */}
                      <td className="p-1 border-r border-slate-200">
                        <input
                          type="number"
                          min="0"
                          value={row.heDelivered}
                          onChange={e => handleItemChange(idx, 'heDelivered', e.target.value)}
                          className="w-full px-1.5 py-1 text-[11px] font-mono text-right border border-slate-200 rounded-lg focus:border-emerald-500 font-bold"
                        />
                      </td>
                      {/* HE Short/Over */}
                      <td className="p-1 border-r border-slate-200">
                        <input
                          type="number"
                          value={row.heShortOver}
                          onChange={e => handleItemChange(idx, 'heShortOver', e.target.value)}
                          className="w-full px-1.5 py-1 text-[11px] font-mono text-right border border-slate-200 rounded-lg"
                        />
                      </td>
                      {/* Net HE Received */}
                      <td className="p-2 text-right font-mono font-bold text-emerald-950 bg-emerald-50/50 border-r border-slate-200 text-[11px]">
                        {row.netHeReceived.toLocaleString()}
                      </td>

                      {/* Total Eggs Received */}
                      <td className="p-2 text-right font-mono font-black text-sky-950 bg-sky-50/50 border-r border-slate-200 text-[11px]">
                        {row.totalEggsReceived.toLocaleString()}
                      </td>

                      {/* Transit Breakage */}
                      <td className="p-1 border-r border-slate-200">
                        <input
                          type="number"
                          min="0"
                          value={row.transitBreakage}
                          onChange={e => handleItemChange(idx, 'transitBreakage', e.target.value)}
                          className="w-full px-1 py-1 text-[11px] font-mono text-right border border-slate-200 rounded-lg"
                        />
                      </td>
                      {/* Transit Hairline */}
                      <td className="p-1 border-r border-slate-200">
                        <input
                          type="number"
                          min="0"
                          value={row.transitHairline}
                          onChange={e => handleItemChange(idx, 'transitHairline', e.target.value)}
                          className="w-full px-1 py-1 text-[11px] font-mono text-right border border-slate-200 rounded-lg"
                        />
                      </td>
                      {/* Transit Spoils */}
                      <td className="p-1 border-r border-slate-200">
                        <input
                          type="number"
                          min="0"
                          value={row.transitSpoils}
                          onChange={e => handleItemChange(idx, 'transitSpoils', e.target.value)}
                          className="w-full px-1 py-1 text-[11px] font-mono text-right border border-slate-200 rounded-lg"
                        />
                      </td>
                      {/* Intact HE */}
                      <td className="p-2 text-right font-mono font-bold text-emerald-950 bg-emerald-50/30 border-r border-slate-200 text-[11px]">
                        {row.intactHeReceived.toLocaleString()}
                      </td>

                      {/* Regrading: Dirty */}
                      <td className="p-1 border-r border-slate-200">
                        <input
                          type="number"
                          min="0"
                          value={row.regradingDirty}
                          onChange={e => handleItemChange(idx, 'regradingDirty', e.target.value)}
                          className="w-full px-1 py-1 text-[11px] font-mono text-right border border-slate-200 rounded-lg"
                        />
                      </td>
                      {/* Regrading: Thin */}
                      <td className="p-1 border-r border-slate-200">
                        <input
                          type="number"
                          min="0"
                          value={row.regradingThinShell}
                          onChange={e => handleItemChange(idx, 'regradingThinShell', e.target.value)}
                          className="w-full px-1 py-1 text-[11px] font-mono text-right border border-slate-200 rounded-lg"
                        />
                      </td>
                      {/* Regrading: Mis-Shape */}
                      <td className="p-1 border-r border-slate-200">
                        <input
                          type="number"
                          min="0"
                          value={row.regradingMisShape}
                          onChange={e => handleItemChange(idx, 'regradingMisShape', e.target.value)}
                          className="w-full px-1 py-1 text-[11px] font-mono text-right border border-slate-200 rounded-lg"
                        />
                      </td>
                      {/* Regrading: Off Size */}
                      <td className="p-1 border-r border-slate-200">
                        <input
                          type="number"
                          min="0"
                          value={row.regradingOffSize}
                          onChange={e => handleItemChange(idx, 'regradingOffSize', e.target.value)}
                          className="w-full px-1 py-1 text-[11px] font-mono text-right border border-slate-200 rounded-lg"
                        />
                      </td>
                      {/* Regrading: Crack */}
                      <td className="p-1 border-r border-slate-200">
                        <input
                          type="number"
                          min="0"
                          value={row.regradingCrack}
                          onChange={e => handleItemChange(idx, 'regradingCrack', e.target.value)}
                          className="w-full px-1 py-1 text-[11px] font-mono text-right border border-slate-200 rounded-lg"
                        />
                      </td>
                      {/* Regrading: Spoil */}
                      <td className="p-1 border-r border-slate-200">
                        <input
                          type="number"
                          min="0"
                          value={row.regradingSpoil}
                          onChange={e => handleItemChange(idx, 'regradingSpoil', e.target.value)}
                          className="w-full px-1 py-1 text-[11px] font-mono text-right border border-slate-200 rounded-lg"
                        />
                      </td>
                      {/* Regrading: JRS */}
                      <td className="p-1 border-r border-slate-200">
                        <input
                          type="number"
                          min="0"
                          value={row.regradingJRS}
                          onChange={e => handleItemChange(idx, 'regradingJRS', e.target.value)}
                          className="w-full px-1 py-1 text-[11px] font-mono text-right border border-slate-200 rounded-lg"
                        />
                      </td>
                      {/* Total NHE Sorting */}
                      <td className="p-2 text-right font-mono font-bold text-amber-950 bg-amber-50/60 border-r border-slate-200 text-[11px]">
                        {row.totalNheSorting.toLocaleString()}
                      </td>

                      {/* Total Settable Eggs */}
                      <td className="p-2 text-right font-mono font-black text-emerald-900 bg-emerald-100/70 text-[11px]">
                        {row.totalSettableEggs.toLocaleString()}
                      </td>
                    </tr>
                  ))}

                  {/* Summary Totals Row */}
                  <tr className="bg-slate-900 text-white font-bold text-[11px] border-t-2 border-slate-900">
                    <td colSpan={2} className="p-2 text-left font-black uppercase">
                      TOTAL SUMMARY
                    </td>
                    <td className="p-2 text-right font-mono text-amber-300">{totals.totalNheDelivered.toLocaleString()}</td>
                    <td className="p-2 text-right font-mono text-slate-300">{totals.totalNheShortOver}</td>
                    <td className="p-2 text-right font-mono font-black text-amber-200">{totals.totalNetNheReceived.toLocaleString()}</td>
                    <td className="p-2 text-right font-mono text-emerald-300">{totals.totalHeDelivered.toLocaleString()}</td>
                    <td className="p-2 text-right font-mono text-slate-300">{totals.totalHeShortOver}</td>
                    <td className="p-2 text-right font-mono font-black text-emerald-200">{totals.totalNetHeReceived.toLocaleString()}</td>
                    <td className="p-2 text-right font-mono font-black text-sky-200 bg-sky-950/80">{totals.totalEggsReceived.toLocaleString()}</td>
                    <td className="p-2 text-right font-mono text-rose-300">{totals.totalTransitBreakage}</td>
                    <td className="p-2 text-right font-mono text-rose-300">{totals.totalTransitHairline}</td>
                    <td className="p-2 text-right font-mono text-rose-300">{totals.totalTransitSpoils}</td>
                    <td className="p-2 text-right font-mono font-black text-emerald-300">{totals.totalIntactHeReceived.toLocaleString()}</td>
                    <td className="p-2 text-right font-mono text-slate-300">{totals.totalRegradingDirty}</td>
                    <td className="p-2 text-right font-mono text-slate-300">{totals.totalRegradingThinShell}</td>
                    <td className="p-2 text-right font-mono text-slate-300">{totals.totalRegradingMisShape}</td>
                    <td className="p-2 text-right font-mono text-slate-300">{totals.totalRegradingOffSize}</td>
                    <td className="p-2 text-right font-mono text-slate-300">{totals.totalRegradingCrack}</td>
                    <td className="p-2 text-right font-mono text-slate-300">{totals.totalRegradingSpoil}</td>
                    <td className="p-2 text-right font-mono text-slate-300">{totals.totalRegradingJRS}</td>
                    <td className="p-2 text-right font-mono font-black text-amber-300">{totals.totalNheSorting.toLocaleString()}</td>
                    <td className="p-2 text-right font-mono font-black text-emerald-300 bg-emerald-950">
                      {totals.totalSettableEggs.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Grid: Packaging, Cold Chain Transit & Signatories */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            
            {/* Containers & Trays */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2 font-bold text-slate-900 border-b border-slate-200 pb-2">
                <Package className="w-4 h-4 text-emerald-600" />
                <span className="uppercase tracking-wider text-[10px]">Containers & Trays Inventory</span>
              </div>

              <div className="space-y-2.5">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Plastic Crates</span>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div>
                      <label className="block text-slate-600 text-[10px] font-bold uppercase mb-0.5">Green Crates</label>
                      <input
                        type="number"
                        min="0"
                        value={cratesGreen}
                        onChange={e => setCratesGreen(Number(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-mono text-right font-bold text-slate-900 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 text-[10px] font-bold uppercase mb-0.5">Red Crates</label>
                      <input
                        type="number"
                        min="0"
                        value={cratesRed}
                        onChange={e => setCratesRed(Number(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-mono text-right font-bold text-slate-900 text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Setting Trays</span>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div>
                      <label className="block text-slate-600 text-[10px] font-bold uppercase mb-0.5">Orange Trays</label>
                      <input
                        type="number"
                        min="0"
                        value={traysOrange}
                        onChange={e => setTraysOrange(Number(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-mono text-right font-bold text-slate-900 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 text-[10px] font-bold uppercase mb-0.5">Yellow Trays</label>
                      <input
                        type="number"
                        min="0"
                        value={traysYellow}
                        onChange={e => setTraysYellow(Number(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-mono text-right font-bold text-slate-900 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 text-[10px] font-bold uppercase mb-0.5">Green Trays</label>
                      <input
                        type="number"
                        min="0"
                        value={traysGreen}
                        onChange={e => setTraysGreen(Number(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-mono text-right font-bold text-slate-900 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 text-[10px] font-bold uppercase mb-0.5">Red Trays</label>
                      <input
                        type="number"
                        min="0"
                        value={traysRed}
                        onChange={e => setTraysRed(Number(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-mono text-right font-bold text-slate-900 text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex justify-between font-bold text-slate-900 text-xs">
                <span>Total Crates: <strong className="font-mono text-emerald-800">{cratesGreen + cratesRed}</strong></span>
                <span>Total Trays: <strong className="font-mono text-emerald-800">{(traysOrange + traysYellow + traysGreen + traysRed).toLocaleString()}</strong></span>
              </div>
            </div>

            {/* Cold Chain Logistics */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2 font-bold text-slate-900 border-b border-slate-200 pb-2">
                <Truck className="w-4 h-4 text-emerald-600" />
                <span className="uppercase tracking-wider text-[10px]">Cold Chain & Truck Logistics</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 text-[10px] font-bold uppercase mb-1">Time Arrival</label>
                  <input
                    type="time"
                    value={timeArrival}
                    onChange={e => setTimeArrival(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-mono font-medium text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 text-[10px] font-bold uppercase mb-1">Time Received</label>
                  <input
                    type="time"
                    value={timeReceived}
                    onChange={e => setTimeReceived(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-mono font-medium text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 text-[10px] font-bold uppercase mb-1">Egg Shell Temp (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={eggShellTemperature}
                    onChange={e => setEggShellTemperature(Number(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 text-right"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 text-[10px] font-bold uppercase mb-1">Plate Number</label>
                  <input
                    type="text"
                    value={plateNumber}
                    onChange={e => setPlateNumber(e.target.value)}
                    placeholder="CAL 4567"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 text-[10px] font-bold uppercase mb-1">Driver / Logistics Team</label>
                <input
                  type="text"
                  value={driverName}
                  onChange={e => setDriverName(e.target.value)}
                  placeholder="SMFI Logistics Team"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-slate-900"
                />
              </div>
            </div>

            {/* Signatures */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center gap-2 font-bold text-slate-900 border-b border-slate-200 pb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="uppercase tracking-wider text-[10px]">Verification Signatories</span>
              </div>

              <div className="space-y-1.5">
                <div>
                  <label className="block text-slate-600 text-[9px] font-bold uppercase">Prepared By (Farm)</label>
                  <input
                    type="text"
                    value={preparedBy}
                    onChange={e => setPreparedBy(e.target.value)}
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold uppercase"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 text-[9px] font-bold uppercase">Farm OIC / Manager</label>
                  <input
                    type="text"
                    value={farmOic}
                    onChange={e => setFarmOic(e.target.value)}
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold uppercase"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 text-[9px] font-bold uppercase">Checked By (Farm)</label>
                  <input
                    type="text"
                    value={checkedByFarm}
                    onChange={e => setCheckedByFarm(e.target.value)}
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold uppercase"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 text-[9px] font-bold uppercase">Received By (Hatchery)</label>
                  <input
                    type="text"
                    value={receivedByHatchery}
                    onChange={e => setReceivedByHatchery(e.target.value)}
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold uppercase"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 text-[9px] font-bold uppercase">Checked By (Hatchery QA)</label>
                  <input
                    type="text"
                    value={checkedByHatchery}
                    onChange={e => setCheckedByHatchery(e.target.value)}
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold uppercase"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Delivery Notes */}
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
              Dispatch & Logistics Notes / Remarks
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Official San Miguel Foods, Inc. delivery dispatched in refrigerated van CAL 4567. Temperature stable at 21.2°C."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          {/* Modal Actions Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-slate-950 font-black text-xs rounded-xl transition shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{initialData ? 'Update ESRRR Voucher' : 'Save & Issue ESRRR Voucher'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
