import React, { useRef } from 'react';
import { DeliveryRecord } from '../../types';
import { 
  Printer, 
  FileSpreadsheet, 
  Share2, 
  Copy, 
  Check, 
  X, 
  CheckCircle2, 
  Clock, 
  Thermometer, 
  Truck, 
  ShieldCheck,
  Building2,
  Package,
  Layers
} from 'lucide-react';
import { exportReportToExcel, ReportMetadata, SheetData } from '../../utils/reportExportUtils';
import { useToast } from '../common/ToastContainer';

interface DeliveryPrintDocumentProps {
  delivery: DeliveryRecord;
  onClose?: () => void;
}

export const DeliveryPrintDocument: React.FC<DeliveryPrintDocumentProps> = ({
  delivery,
  onClose
}) => {
  const toast = useToast();
  const [copied, setCopied] = React.useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    const metadata: ReportMetadata = {
      companyName: delivery.companyName || 'SAN MIGUEL FOODS, INC.',
      address: delivery.farmAddress || 'Gen. Aguinaldo, Ramon, Isabela',
      contactNumber: 'LPL Farm Operations',
      email: 'von.lplimfarm@gmail.com',
      reportTitle: 'EGG SENDING, RECEIVING AND REGRADING REPORT (ESRRR)',
      subtitle: `Control No: ${delivery.esrrrNumber} | Hatchery: ${delivery.hatcheryName}`,
      dateRange: `Prod Date: ${delivery.productionDate} | Received: ${delivery.dateReceived}`,
      houseFilter: 'Houses 1 to 6',
      generatedBy: delivery.preparedBy || 'System Encoder',
      generatedAt: new Date().toLocaleString()
    };

    // Columns matching official ESRRR template
    const columns = [
      { header: 'HOUSE NO.', key: 'houseNumber', width: 12 },
      { header: 'DATE 5% HD', key: 'date5PercentHD', width: 14 },
      { header: 'NHE DELIVERED', key: 'nheDelivered', width: 14 },
      { header: 'NHE SHORT/OVER', key: 'nheShortOver', width: 14 },
      { header: 'NET NHE RCVD', key: 'netNheReceived', width: 14 },
      { header: 'HE DELIVERED', key: 'heDelivered', width: 14 },
      { header: 'HE SHORT/OVER', key: 'heShortOver', width: 14 },
      { header: 'NET HE RCVD', key: 'netHeReceived', width: 14 },
      { header: 'TOTAL EGGS RCVD', key: 'totalEggsReceived', width: 16 },
      { header: 'TRANSIT BREAKAGE', key: 'transitBreakage', width: 14 },
      { header: 'TRANSIT HAIRLINE', key: 'transitHairline', width: 14 },
      { header: 'TRANSIT SPOILS', key: 'transitSpoils', width: 14 },
      { header: 'INTACT HE RCVD', key: 'intactHeReceived', width: 14 },
      { header: 'DIRTY', key: 'regradingDirty', width: 10 },
      { header: 'THIN SHELL', key: 'regradingThinShell', width: 10 },
      { header: 'MIS-SHAPE', key: 'regradingMisShape', width: 10 },
      { header: 'OFF SIZE', key: 'regradingOffSize', width: 10 },
      { header: 'CRACK', key: 'regradingCrack', width: 10 },
      { header: 'SPOIL', key: 'regradingSpoil', width: 10 },
      { header: 'JRS', key: 'regradingJRS', width: 10 },
      { header: 'TOTAL NHE SORTING', key: 'totalNheSorting', width: 16 },
      { header: 'TOTAL SETTABLE EGGS', key: 'totalSettableEggs', width: 18 }
    ];

    const data = delivery.items.map(item => ({
      houseNumber: `House ${item.houseNumber}`,
      date5PercentHD: item.date5PercentHD || 'N/A',
      nheDelivered: item.nheDelivered,
      nheShortOver: item.nheShortOver,
      netNheReceived: item.netNheReceived,
      heDelivered: item.heDelivered,
      heShortOver: item.heShortOver,
      netHeReceived: item.netHeReceived,
      totalEggsReceived: item.totalEggsReceived,
      transitBreakage: item.transitBreakage,
      transitHairline: item.transitHairline,
      transitSpoils: item.transitSpoils,
      intactHeReceived: item.intactHeReceived,
      regradingDirty: item.regradingDirty,
      regradingThinShell: item.regradingThinShell,
      regradingMisShape: item.regradingMisShape,
      regradingOffSize: item.regradingOffSize,
      regradingCrack: item.regradingCrack,
      regradingSpoil: item.regradingSpoil,
      regradingJRS: item.regradingJRS,
      totalNheSorting: item.totalNheSorting,
      totalSettableEggs: item.totalSettableEggs
    }));

    const summaryRow = {
      houseNumber: 'TOTAL',
      date5PercentHD: '',
      nheDelivered: delivery.totalNheDelivered,
      nheShortOver: delivery.totalNheShortOver,
      netNheReceived: delivery.totalNetNheReceived,
      heDelivered: delivery.totalHeDelivered,
      heShortOver: delivery.totalHeShortOver,
      netHeReceived: delivery.totalNetHeReceived,
      totalEggsReceived: delivery.totalEggsReceived,
      transitBreakage: delivery.totalTransitBreakage,
      transitHairline: delivery.totalTransitHairline,
      transitSpoils: delivery.totalTransitSpoils,
      intactHeReceived: delivery.totalIntactHeReceived,
      regradingDirty: delivery.totalRegradingDirty,
      regradingThinShell: delivery.totalRegradingThinShell,
      regradingMisShape: delivery.totalRegradingMisShape,
      regradingOffSize: delivery.totalRegradingOffSize,
      regradingCrack: delivery.totalRegradingCrack,
      regradingSpoil: delivery.totalRegradingSpoil,
      regradingJRS: delivery.totalRegradingJRS,
      totalNheSorting: delivery.totalNheSorting,
      totalSettableEggs: delivery.totalSettableEggs
    };

    const sheets: SheetData[] = [
      {
        sheetName: 'ESRRR_VOUCHER',
        title: `ESRRR_${delivery.esrrrNumber}`,
        columns,
        data,
        summaryRow
      }
    ];

    exportReportToExcel(metadata, sheets, `ESRRR_${delivery.esrrrNumber}_${delivery.productionDate}.xlsx`);
    toast.success('ESRRR Excel report downloaded successfully!');
  };

  const handleCopyMessengerSummary = () => {
    const settablePct = delivery.totalNetHeReceived > 0 
      ? ((delivery.totalSettableEggs / delivery.totalNetHeReceived) * 100).toFixed(2)
      : '0.00';

    const text = `🚚 *ESRRR DISPATCH & RECEIVING REPORT*
📋 *Control No:* ${delivery.esrrrNumber}
🏢 *Company:* ${delivery.companyName}
🏡 *Farm:* ${delivery.farmName} (${delivery.farmCode})
📍 *Hatchery:* ${delivery.hatcheryName}
📅 *Production Date:* ${delivery.productionDate}
📅 *Received Date:* ${delivery.dateReceived}
🚛 *Plate No:* ${delivery.plateNumber} | *Temp:* ${delivery.eggShellTemperature}°C

━━━━━━━━━━━━━━━━━━━━━━━━━━
🥚 *EGG DISPATCH SUMMARY:*
• *Hatching Eggs (HE):* ${delivery.totalHeDelivered.toLocaleString()} pcs
• *Non-Hatching (NHE):* ${delivery.totalNheDelivered.toLocaleString()} pcs
• *Total Eggs Dispatched:* ${(delivery.totalHeDelivered + delivery.totalNheDelivered).toLocaleString()} pcs
• *Net Received at Hatchery:* ${delivery.totalEggsReceived.toLocaleString()} pcs
• *Total Settable Eggs:* ${delivery.totalSettableEggs.toLocaleString()} pcs (${settablePct}%)

📦 *CONTAINERS:*
• *Crates:* Green ${delivery.cratesGreen} + Red ${delivery.cratesRed} = ${delivery.totalCrates}
• *Trays:* Orange ${delivery.traysOrange} + Yellow ${delivery.traysYellow}${delivery.traysGreen ? ` + Green ${delivery.traysGreen}` : ''}${delivery.traysRed ? ` + Red ${delivery.traysRed}` : ''} = ${delivery.totalTrays}

✍️ *SIGNATORIES:*
• Prepared by: ${delivery.preparedBy}
• Farm OIC: ${delivery.farmOic}
• Hatchery Received: ${delivery.receivedByHatchery}
━━━━━━━━━━━━━━━━━━━━━━━━━━
Generated via FarmFlow Pro OS`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied ESRRR summary to clipboard for Messenger/WhatsApp!');
    setTimeout(() => setCopied(false), 2500);
  };

  const settabilityRate = delivery.totalNetHeReceived > 0
    ? ((delivery.totalSettableEggs / delivery.totalNetHeReceived) * 100).toFixed(2)
    : '0.00';

  const totalTransitLoss = delivery.totalTransitBreakage + delivery.totalTransitHairline + delivery.totalTransitSpoils;
  const transitLossRate = delivery.totalNetHeReceived > 0
    ? ((totalTransitLoss / delivery.totalNetHeReceived) * 100).toFixed(2)
    : '0.00';

  return (
    <div className="bg-white text-slate-900 rounded-2xl shadow-xl border border-slate-200 overflow-hidden print:shadow-none print:border-none print:m-0 print:p-0">
      {/* Top Action Toolbar (Hidden in Print) */}
      <div className="bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold tracking-tight">ESRRR Voucher #{delivery.esrrrNumber}</h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wide ${
                delivery.status === 'Completed' ? 'bg-emerald-500 text-slate-950' :
                delivery.status === 'Received' ? 'bg-sky-500 text-slate-950' :
                delivery.status === 'Regraded' ? 'bg-teal-500 text-slate-950' :
                delivery.status === 'Dispatched' ? 'bg-amber-500 text-slate-950' :
                'bg-slate-700 text-slate-200'
              }`}>
                {delivery.status}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Prod Date: <span className="text-white font-medium">{delivery.productionDate}</span> &bull; Received: <span className="text-white font-medium">{delivery.dateReceived}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyMessengerSummary}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-xs font-semibold rounded-xl transition border border-slate-700 cursor-pointer text-emerald-400"
            title="Copy formatted text for Messenger / WhatsApp"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy for Messenger'}</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-slate-950 font-bold text-xs rounded-xl transition shadow-xs cursor-pointer"
            title="Export full ESRRR voucher to Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 active:scale-95 text-slate-950 font-bold text-xs rounded-xl transition shadow-xs cursor-pointer"
            title="Print Official Document"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Document</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer ml-1"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Printable Document Body (Matches San Miguel Foods, Inc. Standard Layout) */}
      <div className="p-6 sm:p-8 space-y-6 print:p-2 print:space-y-4 font-sans max-w-[1000px] mx-auto text-slate-900">
        
        {/* Document Header */}
        <div className="border-b-2 border-slate-900 pb-4 text-center space-y-1">
          <div className="text-[11px] tracking-widest font-black text-slate-500 uppercase">
            Official Quality Assurance & Logistics Control Document
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 uppercase font-display">
            {delivery.companyName || 'SAN MIGUEL FOODS, INC.'}
          </h1>
          <div className="text-xs font-extrabold text-emerald-800 uppercase tracking-wide">
            EGG SENDING, RECEIVING AND REGRADING REPORT (ESRRR)
          </div>
          <p className="text-[11px] text-slate-600 font-medium">
            {delivery.farmName} &bull; {delivery.farmAddress} &bull; Code: <strong>{delivery.farmCode}</strong>
          </p>
        </div>

        {/* Metadata Top Info Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
          <div>
            <span className="text-slate-500 font-semibold uppercase text-[10px] block">Production Date</span>
            <span className="font-bold text-slate-900 text-sm">{delivery.productionDate}</span>
          </div>
          <div>
            <span className="text-slate-500 font-semibold uppercase text-[10px] block">Date Received</span>
            <span className="font-bold text-slate-900 text-sm">{delivery.dateReceived}</span>
          </div>
          <div>
            <span className="text-slate-500 font-semibold uppercase text-[10px] block">Control / ESRRR No.</span>
            <span className="font-bold text-emerald-800 text-sm font-mono">{delivery.esrrrNumber}</span>
          </div>
          <div>
            <span className="text-slate-500 font-semibold uppercase text-[10px] block">Receiving Hatchery</span>
            <span className="font-bold text-slate-900 text-sm">{delivery.hatcheryName}</span>
          </div>
        </div>

        {/* Key KPI summary strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
            <span className="text-[10px] font-bold text-emerald-800 uppercase block">Total HE Dispatched</span>
            <span className="text-base font-black text-emerald-950">{delivery.totalHeDelivered.toLocaleString()}</span>
          </div>
          <div className="p-2.5 bg-sky-50 border border-sky-200 rounded-xl">
            <span className="text-[10px] font-bold text-sky-800 uppercase block">Total Eggs Received</span>
            <span className="text-base font-black text-sky-950">{delivery.totalEggsReceived.toLocaleString()}</span>
          </div>
          <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl">
            <span className="text-[10px] font-bold text-indigo-800 uppercase block">Total Settable Eggs</span>
            <span className="text-base font-black text-indigo-950">{delivery.totalSettableEggs.toLocaleString()}</span>
          </div>
          <div className="p-2.5 bg-teal-50 border border-teal-200 rounded-xl">
            <span className="text-[10px] font-bold text-teal-800 uppercase block">Hatchery Settability</span>
            <span className="text-base font-black text-teal-950">{settabilityRate}%</span>
          </div>
          <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl">
            <span className="text-[10px] font-bold text-rose-800 uppercase block">Transit Damage Loss</span>
            <span className="text-base font-black text-rose-950">{totalTransitLoss.toLocaleString()} ({transitLossRate}%)</span>
          </div>
        </div>

        {/* The Official ESRRR Multi-Header House Table */}
        <div className="overflow-x-auto border border-slate-300 rounded-lg shadow-2xs">
          <table className="w-full text-[11px] border-collapse text-left">
            <thead>
              {/* Row 1: Group Headers */}
              <tr className="bg-slate-800 text-white font-bold uppercase text-[9px] tracking-wider text-center border-b border-slate-700">
                <th rowSpan={2} className="px-2 py-2 border-r border-slate-700 text-left">House No.</th>
                <th rowSpan={2} className="px-2 py-2 border-r border-slate-700">Date 5% HD</th>
                <th colSpan={3} className="px-2 py-1.5 border-r border-slate-700 bg-amber-900/60 text-amber-200">
                  NHE (Non-Hatching)
                </th>
                <th colSpan={3} className="px-2 py-1.5 border-r border-slate-700 bg-emerald-900/60 text-emerald-200">
                  HE (Hatching Eggs)
                </th>
                <th rowSpan={2} className="px-2 py-2 border-r border-slate-700 bg-sky-900/60 text-sky-200">
                  Total Eggs Recv
                </th>
                <th colSpan={4} className="px-2 py-1.5 border-r border-slate-700 bg-rose-900/60 text-rose-200">
                  Transit / Handling (HE)
                </th>
                <th colSpan={8} className="px-2 py-1.5 border-r border-slate-700 bg-purple-900/60 text-purple-200">
                  NHE Removed at Hatchery Sorting (Regrading)
                </th>
                <th rowSpan={2} className="px-2 py-2 bg-emerald-800 text-white">
                  Total Settable Eggs
                </th>
              </tr>

              {/* Row 2: Sub-headers */}
              <tr className="bg-slate-700 text-slate-200 font-semibold text-[9px] uppercase tracking-wider text-right border-b border-slate-600">
                {/* NHE */}
                <th className="px-1.5 py-1.5 border-r border-slate-600">Deliv</th>
                <th className="px-1.5 py-1.5 border-r border-slate-600">+/-</th>
                <th className="px-1.5 py-1.5 border-r border-slate-600 font-bold text-white">Net Rcv</th>
                {/* HE */}
                <th className="px-1.5 py-1.5 border-r border-slate-600">Deliv</th>
                <th className="px-1.5 py-1.5 border-r border-slate-600">+/-</th>
                <th className="px-1.5 py-1.5 border-r border-slate-600 font-bold text-white">Net Rcv</th>
                {/* Transit Handling */}
                <th className="px-1.5 py-1.5 border-r border-slate-600 text-rose-300">Break</th>
                <th className="px-1.5 py-1.5 border-r border-slate-600 text-rose-300">Hair</th>
                <th className="px-1.5 py-1.5 border-r border-slate-600 text-rose-300">Spoil</th>
                <th className="px-1.5 py-1.5 border-r border-slate-600 font-bold text-emerald-300">Intact HE</th>
                {/* Regrading Sorting Defects */}
                <th className="px-1 py-1.5 border-r border-slate-600">Dirty</th>
                <th className="px-1 py-1.5 border-r border-slate-600">Thin</th>
                <th className="px-1 py-1.5 border-r border-slate-600">M-Shp</th>
                <th className="px-1 py-1.5 border-r border-slate-600">Off-Sz</th>
                <th className="px-1 py-1.5 border-r border-slate-600">Crack</th>
                <th className="px-1 py-1.5 border-r border-slate-600">Spoil</th>
                <th className="px-1 py-1.5 border-r border-slate-600">JRS</th>
                <th className="px-1.5 py-1.5 border-r border-slate-600 font-bold text-amber-300">Total NHE</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {delivery.items.map((item, idx) => (
                <tr 
                  key={idx} 
                  className={idx % 2 === 0 ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/70 hover:bg-slate-100/70'}
                >
                  <td className="px-2 py-1.5 font-bold text-slate-900 border-r border-slate-200 text-left">
                    House {item.houseNumber}
                  </td>
                  <td className="px-2 py-1.5 text-center font-mono text-[10px] text-slate-600 border-r border-slate-200">
                    {item.date5PercentHD || '-'}
                  </td>
                  {/* NHE */}
                  <td className="px-1.5 py-1.5 text-right font-mono border-r border-slate-200">{item.nheDelivered.toLocaleString()}</td>
                  <td className={`px-1.5 py-1.5 text-right font-mono border-r border-slate-200 ${item.nheShortOver < 0 ? 'text-rose-600 font-bold' : item.nheShortOver > 0 ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                    {item.nheShortOver > 0 ? `+${item.nheShortOver}` : item.nheShortOver}
                  </td>
                  <td className="px-1.5 py-1.5 text-right font-mono font-bold text-slate-900 border-r border-slate-200 bg-amber-50/40">
                    {item.netNheReceived.toLocaleString()}
                  </td>
                  {/* HE */}
                  <td className="px-1.5 py-1.5 text-right font-mono border-r border-slate-200">{item.heDelivered.toLocaleString()}</td>
                  <td className={`px-1.5 py-1.5 text-right font-mono border-r border-slate-200 ${item.heShortOver < 0 ? 'text-rose-600 font-bold' : item.heShortOver > 0 ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                    {item.heShortOver > 0 ? `+${item.heShortOver}` : item.heShortOver}
                  </td>
                  <td className="px-1.5 py-1.5 text-right font-mono font-bold text-slate-900 border-r border-slate-200 bg-emerald-50/40">
                    {item.netHeReceived.toLocaleString()}
                  </td>
                  {/* Total Received */}
                  <td className="px-2 py-1.5 text-right font-mono font-black text-sky-950 border-r border-slate-200 bg-sky-50/40">
                    {item.totalEggsReceived.toLocaleString()}
                  </td>
                  {/* Transit Handling */}
                  <td className={`px-1.5 py-1.5 text-right font-mono border-r border-slate-200 ${item.transitBreakage > 0 ? 'text-rose-600 font-semibold' : 'text-slate-400'}`}>
                    {item.transitBreakage}
                  </td>
                  <td className={`px-1.5 py-1.5 text-right font-mono border-r border-slate-200 ${item.transitHairline > 0 ? 'text-rose-600 font-semibold' : 'text-slate-400'}`}>
                    {item.transitHairline}
                  </td>
                  <td className={`px-1.5 py-1.5 text-right font-mono border-r border-slate-200 ${item.transitSpoils > 0 ? 'text-rose-600 font-semibold' : 'text-slate-400'}`}>
                    {item.transitSpoils}
                  </td>
                  <td className="px-1.5 py-1.5 text-right font-mono font-bold text-emerald-950 border-r border-slate-200 bg-emerald-50/30">
                    {item.intactHeReceived.toLocaleString()}
                  </td>
                  {/* Regrading Sorting Defects */}
                  <td className="px-1 py-1.5 text-right font-mono border-r border-slate-200 text-slate-700">{item.regradingDirty || 0}</td>
                  <td className="px-1 py-1.5 text-right font-mono border-r border-slate-200 text-slate-700">{item.regradingThinShell || 0}</td>
                  <td className="px-1 py-1.5 text-right font-mono border-r border-slate-200 text-slate-700">{item.regradingMisShape || 0}</td>
                  <td className="px-1 py-1.5 text-right font-mono border-r border-slate-200 text-slate-700">{item.regradingOffSize || 0}</td>
                  <td className="px-1 py-1.5 text-right font-mono border-r border-slate-200 text-slate-700">{item.regradingCrack || 0}</td>
                  <td className="px-1 py-1.5 text-right font-mono border-r border-slate-200 text-slate-700">{item.regradingSpoil || 0}</td>
                  <td className="px-1 py-1.5 text-right font-mono border-r border-slate-200 text-slate-700">{item.regradingJRS || 0}</td>
                  <td className="px-1.5 py-1.5 text-right font-mono font-bold text-amber-950 border-r border-slate-200 bg-amber-50/50">
                    {item.totalNheSorting.toLocaleString()}
                  </td>
                  {/* Settable */}
                  <td className="px-2 py-1.5 text-right font-mono font-black text-emerald-900 bg-emerald-100/60">
                    {item.totalSettableEggs.toLocaleString()}
                  </td>
                </tr>
              ))}

              {/* Summary / Total Footer Row */}
              <tr className="bg-slate-900 text-white font-bold text-[11px] border-t-2 border-slate-900">
                <td className="px-2 py-2 text-left font-black tracking-wider uppercase" colSpan={2}>
                  TOTAL SUMMARY
                </td>
                {/* NHE Totals */}
                <td className="px-1.5 py-2 text-right font-mono text-amber-300">{delivery.totalNheDelivered.toLocaleString()}</td>
                <td className="px-1.5 py-2 text-right font-mono text-slate-300">{delivery.totalNheShortOver}</td>
                <td className="px-1.5 py-2 text-right font-mono font-black text-amber-200">{delivery.totalNetNheReceived.toLocaleString()}</td>
                {/* HE Totals */}
                <td className="px-1.5 py-2 text-right font-mono text-emerald-300">{delivery.totalHeDelivered.toLocaleString()}</td>
                <td className="px-1.5 py-2 text-right font-mono text-slate-300">{delivery.totalHeShortOver}</td>
                <td className="px-1.5 py-2 text-right font-mono font-black text-emerald-200">{delivery.totalNetHeReceived.toLocaleString()}</td>
                {/* Total Received */}
                <td className="px-2 py-2 text-right font-mono font-black text-sky-200 bg-sky-950/80">
                  {delivery.totalEggsReceived.toLocaleString()}
                </td>
                {/* Transit Damage Totals */}
                <td className="px-1.5 py-2 text-right font-mono text-rose-300">{delivery.totalTransitBreakage}</td>
                <td className="px-1.5 py-2 text-right font-mono text-rose-300">{delivery.totalTransitHairline}</td>
                <td className="px-1.5 py-2 text-right font-mono text-rose-300">{delivery.totalTransitSpoils}</td>
                <td className="px-1.5 py-2 text-right font-mono font-black text-emerald-300">{delivery.totalIntactHeReceived.toLocaleString()}</td>
                {/* Regrading Sorting Totals */}
                <td className="px-1 py-2 text-right font-mono text-slate-300">{delivery.totalRegradingDirty}</td>
                <td className="px-1 py-2 text-right font-mono text-slate-300">{delivery.totalRegradingThinShell}</td>
                <td className="px-1 py-2 text-right font-mono text-slate-300">{delivery.totalRegradingMisShape}</td>
                <td className="px-1 py-2 text-right font-mono text-slate-300">{delivery.totalRegradingOffSize}</td>
                <td className="px-1 py-2 text-right font-mono text-slate-300">{delivery.totalRegradingCrack}</td>
                <td className="px-1 py-2 text-right font-mono text-slate-300">{delivery.totalRegradingSpoil}</td>
                <td className="px-1 py-2 text-right font-mono text-slate-300">{delivery.totalRegradingJRS}</td>
                <td className="px-1.5 py-2 text-right font-mono font-black text-amber-300">{delivery.totalNheSorting.toLocaleString()}</td>
                {/* Settable Total */}
                <td className="px-2 py-2 text-right font-mono font-black text-emerald-300 bg-emerald-950">
                  {delivery.totalSettableEggs.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Bottom Section: Containers & Cold Chain Logistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          
          {/* Packaging / Containers Breakdown */}
          <div className="bg-slate-50 border border-slate-300 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center gap-2 font-bold text-slate-900 border-b border-slate-200 pb-2">
              <Package className="w-4 h-4 text-emerald-700" />
              <span className="uppercase tracking-wider text-[10px]">Packaging & Containers Accounting</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 bg-white p-2.5 rounded-lg border border-slate-200">
                <div className="text-[10px] font-bold text-slate-500 uppercase">Plastic Crates</div>
                <div className="flex justify-between text-slate-700">
                  <span>Green Crates:</span>
                  <span className="font-mono font-bold text-slate-900">{delivery.cratesGreen}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Red Crates:</span>
                  <span className="font-mono font-bold text-slate-900">{delivery.cratesRed}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-950 border-t border-slate-200 pt-1">
                  <span>Total Crates:</span>
                  <span className="font-mono text-emerald-800">{delivery.totalCrates}</span>
                </div>
              </div>

              <div className="space-y-1.5 bg-white p-2.5 rounded-lg border border-slate-200">
                <div className="text-[10px] font-bold text-slate-500 uppercase">Setting Trays</div>
                <div className="flex justify-between text-slate-700">
                  <span>Orange Trays:</span>
                  <span className="font-mono font-bold text-slate-900">{delivery.traysOrange.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Yellow Trays:</span>
                  <span className="font-mono font-bold text-slate-900">{delivery.traysYellow.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Green Trays:</span>
                  <span className="font-mono font-bold text-slate-900">{(delivery.traysGreen || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Red Trays:</span>
                  <span className="font-mono font-bold text-slate-900">{(delivery.traysRed || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-950 border-t border-slate-200 pt-1">
                  <span>Total Trays:</span>
                  <span className="font-mono text-emerald-800">{delivery.totalTrays.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Cold Chain & Vehicle Logistics */}
          <div className="bg-slate-50 border border-slate-300 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center gap-2 font-bold text-slate-900 border-b border-slate-200 pb-2">
              <Truck className="w-4 h-4 text-emerald-700" />
              <span className="uppercase tracking-wider text-[10px]">Cold Chain Transit & Vehicle Dispatch</span>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-white p-3 rounded-lg border border-slate-200">
              <div className="space-y-1 text-slate-700">
                <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase">
                  <Clock className="w-3 h-3" /> Time Arrival:
                </div>
                <div className="font-bold text-slate-900 text-sm font-mono">{delivery.timeArrival || '14:00'}</div>
                <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase pt-1">
                  <Clock className="w-3 h-3" /> Time Received:
                </div>
                <div className="font-bold text-slate-900 text-sm font-mono">{delivery.timeReceived || '15:13'}</div>
              </div>

              <div className="space-y-1 text-slate-700">
                <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase">
                  <Thermometer className="w-3 h-3 text-rose-500" /> Shell Temp:
                </div>
                <div className="font-bold text-rose-900 text-sm font-mono">{delivery.eggShellTemperature}°C</div>
                <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase pt-1">
                  <Truck className="w-3 h-3" /> Plate No:
                </div>
                <div className="font-bold text-slate-900 text-sm font-mono uppercase">{delivery.plateNumber}</div>
              </div>
            </div>

            {delivery.notes && (
              <p className="text-[11px] text-slate-600 italic bg-white p-2 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-800 not-italic">Notes:</span> {delivery.notes}
              </p>
            )}
          </div>

        </div>

        {/* Signatures & Official Sign-off Matrix */}
        <div className="border border-slate-300 rounded-xl p-4 bg-slate-50">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-4 text-center">
            Official Accountability & Verification Signatories
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
            
            {/* Prepared By */}
            <div className="space-y-1">
              <div className="h-10 border-b border-slate-400 flex items-end justify-center pb-1">
                <span className="text-[11px] font-bold text-slate-900 uppercase">{delivery.preparedBy}</span>
              </div>
              <span className="text-[10px] text-slate-500 font-semibold block uppercase">PREPARED BY (FARM)</span>
            </div>

            {/* Farm OIC */}
            <div className="space-y-1">
              <div className="h-10 border-b border-slate-400 flex items-end justify-center pb-1">
                <span className="text-[11px] font-bold text-slate-900 uppercase">{delivery.farmOic}</span>
              </div>
              <span className="text-[10px] text-slate-500 font-semibold block uppercase">FARM OIC / MANAGER</span>
            </div>

            {/* Checked By Farm */}
            <div className="space-y-1">
              <div className="h-10 border-b border-slate-400 flex items-end justify-center pb-1">
                <span className="text-[11px] font-bold text-slate-900 uppercase">{delivery.checkedByFarm}</span>
              </div>
              <span className="text-[10px] text-slate-500 font-semibold block uppercase">CHECKED BY (FARM)</span>
            </div>

            {/* Received By Hatchery */}
            <div className="space-y-1">
              <div className="h-10 border-b border-slate-400 flex items-end justify-center pb-1">
                <span className="text-[11px] font-bold text-slate-900 uppercase">{delivery.receivedByHatchery}</span>
              </div>
              <span className="text-[10px] text-slate-500 font-semibold block uppercase">RECEIVED BY (HATCHERY)</span>
            </div>

            {/* Checked By Hatchery */}
            <div className="space-y-1">
              <div className="h-10 border-b border-slate-400 flex items-end justify-center pb-1">
                <span className="text-[11px] font-bold text-slate-900 uppercase">{delivery.checkedByHatchery}</span>
              </div>
              <span className="text-[10px] text-slate-500 font-semibold block uppercase">CHECKED BY (HATCHERY QA)</span>
            </div>

          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-[10px] text-slate-400 pt-2 border-t border-slate-200">
          FarmFlow Pro Poultry OS &bull; San Miguel Foods, Inc. Standard ESRRR &bull; Document Verified Compliant
        </div>

      </div>
    </div>
  );
};
