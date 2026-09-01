import React, { useRef } from 'react';
import { HatchingSummaryRecord } from '../../types';
import { 
  Printer, 
  FileSpreadsheet, 
  X, 
  CheckCircle2, 
  Calendar, 
  Egg, 
  Sparkles,
  Building2,
  Award,
  TrendingUp,
  FileText
} from 'lucide-react';
import { exportReportToExcel, ReportMetadata, SheetData } from '../../utils/reportExportUtils';
import { useToast } from '../common/ToastContainer';
import { useFarm } from '../../context/FarmContext';

interface HatchingSummaryPrintDocumentProps {
  summary: HatchingSummaryRecord;
  onClose?: () => void;
}

export const HatchingSummaryPrintDocument: React.FC<HatchingSummaryPrintDocumentProps> = ({
  summary,
  onClose
}) => {
  const { farmProfile } = useFarm();
  const toast = useToast();

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    const metadata: ReportMetadata = {
      companyName: farmProfile?.name || 'SAN MIGUEL FOODS, INC.',
      address: farmProfile?.address || 'Gen. Aguinaldo, Ramon, Isabela',
      contactNumber: 'LPL Farm Operations',
      email: 'von.lplimfarm@gmail.com',
      reportTitle: 'OFFICIAL HATCHING SUMMARY REPORT',
      subtitle: `House ${summary.houseNumber} | Breed: ${summary.breed} | Setting Date: ${summary.settingDate}`,
      dateRange: `Setting Date: ${summary.settingDate} | Pull-out Date: ${summary.pullOutDate}`,
      houseFilter: `House ${summary.houseNumber}`,
      generatedBy: summary.loggedBy || 'System Encoder',
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
      { header: 'HATCHERY', key: 'hatcheryName', width: 16 },
      { header: 'ESRRR REF', key: 'esrrrNumber', width: 14 },
      { header: 'REMARKS', key: 'notes', width: 30 }
    ];

    const data = [
      {
        settingDate: summary.settingDate,
        houseNumber: `House ${summary.houseNumber}`,
        breed: summary.breed,
        eggsSet: summary.eggsSet,
        pullOutDate: summary.pullOutDate,
        standardChicks: summary.standardChicks,
        gradeOut: summary.gradeOut,
        totalChicksPulled: summary.totalChicksPulled,
        totalHatchPct: `${summary.totalHatchPct.toFixed(2)}%`,
        saleableHatchPct: `${summary.saleableHatchPct.toFixed(2)}%`,
        hatcheryName: summary.hatcheryName || 'MJBJ Hatchery',
        esrrrNumber: summary.esrrrNumber || 'N/A',
        notes: summary.notes || ''
      }
    ];

    const sheets: SheetData[] = [
      {
        sheetName: `Hatch_H${summary.houseNumber}`,
        title: `Hatching Summary Voucher - House ${summary.houseNumber}`,
        columns,
        data
      }
    ];

    exportReportToExcel(metadata, sheets, `Hatching_Summary_H${summary.houseNumber}_${summary.settingDate}.xlsx`);
    toast.success(`Exported Hatching Summary for House ${summary.houseNumber} to Excel!`);
  };

  const isExcellent = summary.saleableHatchPct >= 87.0;
  const isStandard = summary.saleableHatchPct >= 85.0 && summary.saleableHatchPct < 87.0;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden text-slate-900 animate-fadeIn">
      
      {/* Top Action Bar */}
      <div className="p-4 sm:p-6 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
            <Egg className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black tracking-tight flex items-center gap-2">
              <span>Hatching Summary Document</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md font-mono">
                House {summary.houseNumber}
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Setting Date: {summary.settingDate} &bull; Pull-out: {summary.pullOutDate}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Excel (.xlsx)</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl transition shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Voucher</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Printable Sheet */}
      <div className="p-6 sm:p-10 space-y-6 max-w-4xl mx-auto print:p-0 print:space-y-4">
        
        {/* Document Header */}
        <div className="border-b-2 border-slate-900 pb-4 text-center space-y-1">
          <p className="text-[11px] font-black uppercase tracking-widest text-emerald-700">
            SAN MIGUEL FOODS, INC. • POULTRY & BREEDER OPERATIONS
          </p>
          <h1 className="text-xl sm:text-2xl font-black text-slate-950 font-display uppercase tracking-tight">
            Hatching Summary & Chick Yield Voucher
          </h1>
          <p className="text-xs font-semibold text-slate-600">
            {farmProfile?.name || 'L.P. LIM CITY FAMILY FARM INC'} &bull; {farmProfile?.address || 'San Jose Agro-Industrial Complex, Batangas / Isabela'}
          </p>
        </div>

        {/* Batch Metadata Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Facility / House</span>
            <span className="font-black text-slate-900 text-sm">House {summary.houseNumber}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Breed Line</span>
            <span className="font-black text-slate-900 text-sm">{summary.breed}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Setting Date</span>
            <span className="font-bold font-mono text-slate-900 text-sm">{summary.settingDate}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Pull-out Date</span>
            <span className="font-bold font-mono text-slate-900 text-sm">{summary.pullOutDate}</span>
          </div>
        </div>

        {/* Master Data Table */}
        <div className="border border-slate-300 rounded-2xl overflow-hidden shadow-2xs">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-bold uppercase text-[10px] tracking-wider">
                <th className="px-4 py-3">Metric Parameter</th>
                <th className="px-4 py-3 text-right">Quantity / Count</th>
                <th className="px-4 py-3 text-right">Yield Rate %</th>
                <th className="px-4 py-3">Technical Benchmark Standard</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              
              {/* Eggs Set */}
              <tr className="bg-slate-50/50">
                <td className="px-4 py-3 font-black text-slate-900">
                  # of Eggs Set in Setter
                </td>
                <td className="px-4 py-3 text-right font-mono font-black text-slate-900 text-sm">
                  {summary.eggsSet.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right font-mono font-bold text-slate-500">
                  100.00%
                </td>
                <td className="px-4 py-3 text-slate-600">
                  Base Setting Count (Setter Trays Loaded)
                </td>
              </tr>

              {/* Standard Chicks */}
              <tr className="bg-emerald-50/30">
                <td className="px-4 py-3 font-black text-emerald-950 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  <span>Standard Chicks (Saleable Grade A)</span>
                </td>
                <td className="px-4 py-3 text-right font-mono font-black text-emerald-900 text-sm">
                  {summary.standardChicks.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right font-mono font-black text-emerald-700 text-sm">
                  {summary.saleableHatchPct.toFixed(2)}%
                </td>
                <td className="px-4 py-3 font-semibold text-emerald-800">
                  Saleable Yield (Standard Target &ge; 85.0%)
                </td>
              </tr>

              {/* Grade Out */}
              <tr className="bg-amber-50/30">
                <td className="px-4 py-3 font-bold text-amber-950 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-600" />
                  <span>Grade out (Culls / Abnormal / Dead in Shell)</span>
                </td>
                <td className="px-4 py-3 text-right font-mono font-bold text-amber-900">
                  {summary.gradeOut.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right font-mono font-bold text-amber-700">
                  {((summary.gradeOut / (summary.eggsSet || 1)) * 100).toFixed(2)}%
                </td>
                <td className="px-4 py-3 text-slate-500">
                  Acceptable Grade out Threshold &le; 2.50%
                </td>
              </tr>

              {/* Total Chicks Pulled */}
              <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
                <td className="px-4 py-3 font-black text-slate-900">
                  Total Chicks Pulled (Standard + Grade out)
                </td>
                <td className="px-4 py-3 text-right font-mono font-black text-slate-900 text-base">
                  {summary.totalChicksPulled.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right font-mono font-black text-slate-900 text-base">
                  {summary.totalHatchPct.toFixed(2)}%
                </td>
                <td className="px-4 py-3 font-bold text-slate-800">
                  Total Hatchability (Breeder Target &ge; 88.0%)
                </td>
              </tr>

            </tbody>
          </table>
        </div>

        {/* Performance & Quality Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-emerald-600" />
              <span>Batch Performance Rating</span>
            </h3>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                isExcellent ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' :
                isStandard ? 'bg-sky-100 text-sky-900 border border-sky-300' :
                'bg-amber-100 text-amber-900 border border-amber-300'
              }`}>
                {isExcellent ? 'Excellent Yield (≥87%)' : isStandard ? 'Standard Benchmark (≥85%)' : 'Sub-Target (<85%)'}
              </span>
              <span className="text-xs font-bold text-slate-600">
                Saleable Rate: {summary.saleableHatchPct.toFixed(2)}%
              </span>
            </div>
            {summary.notes && (
              <p className="text-xs text-slate-600 italic bg-white p-2.5 rounded-xl border border-slate-200 mt-2">
                &ldquo;{summary.notes}&rdquo;
              </p>
            )}
          </div>

          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-sky-600" />
              <span>Hatchery Facility & Reference</span>
            </h3>
            <div className="text-xs space-y-1 text-slate-700">
              <p><strong className="font-semibold text-slate-900">Hatchery:</strong> {summary.hatcheryName || 'MJBJ Hatchery'}</p>
              <p><strong className="font-semibold text-slate-900">ESRRR Voucher Ref:</strong> {summary.esrrrNumber || 'Direct Dispatch'}</p>
              <p><strong className="font-semibold text-slate-900">Recorded By:</strong> {summary.loggedBy || 'Von Carlo S. Francisco'}</p>
            </div>
          </div>

        </div>

        {/* Signatures Section for Official Validation */}
        <div className="grid grid-cols-3 gap-6 pt-8 border-t border-slate-300 text-center">
          <div className="space-y-6">
            <div className="h-10 border-b border-slate-400 border-dashed" />
            <div>
              <p className="font-black text-xs text-slate-900">HATCHERY IN-CHARGE</p>
              <p className="text-[10px] text-slate-500">Pull-out & Counting</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="h-10 border-b border-slate-400 border-dashed" />
            <div>
              <p className="font-black text-xs text-slate-900">QA / BREEDER TECHNICIAN</p>
              <p className="text-[10px] text-slate-500">Chick Quality & Grading</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="h-10 border-b border-slate-400 border-dashed" />
            <div>
              <p className="font-black text-xs text-slate-900">FARM OIC / VETERINARIAN</p>
              <p className="text-[10px] text-slate-500">Verification & Acceptance</p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
