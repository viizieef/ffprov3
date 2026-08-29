import React from 'react';
import { EggProductionRecord, StandardHendayItem } from '../../types';
import { Egg, TrendingUp, Sparkles, CheckCircle2, AlertTriangle, Layers, Percent, ShieldCheck } from 'lucide-react';

interface EggProductionReportSectionProps {
  records: EggProductionRecord[];
  standardHenday: StandardHendayItem[];
  flocks: any[];
}

export const EggProductionReportSection: React.FC<EggProductionReportSectionProps> = ({
  records,
  standardHenday,
  flocks
}) => {
  // Compute aggregates
  const totalTEP = records.reduce((acc, r) => acc + (r.tep || 0), 0);
  const totalHENest = records.reduce((acc, r) => acc + (r.heNest || 0), 0);
  const totalHEFloor = records.reduce((acc, r) => acc + (r.heFloor || 0), 0);
  const totalHE = records.reduce((acc, r) => acc + (r.totalHE || 0), 0);
  const totalNHE = records.reduce((acc, r) => acc + (r.totalNHE || 0), 0);
  
  // Specific NHE categories
  const totalSmall = records.reduce((acc, r) => acc + (r.small || 0), 0);
  const totalThin = records.reduce((acc, r) => acc + (r.thinShell || 0), 0);
  const totalMisshape = records.reduce((acc, r) => acc + (r.misshape || 0), 0);
  const totalDY = records.reduce((acc, r) => acc + (r.doubleYolk || 0), 0);
  const totalBroken = records.reduce((acc, r) => acc + (r.broken || 0), 0);
  const totalSpoiled = records.reduce((acc, r) => acc + (r.spoiled || 0), 0);
  const totalOthers = records.reduce((acc, r) => acc + (r.others || 0), 0);

  const overallHEPct = totalTEP > 0 ? (totalHE / totalTEP) * 100 : 0;
  const overallNHEPct = totalTEP > 0 ? (totalNHE / totalTEP) * 100 : 0;
  const settableHEFloorRatio = totalHE > 0 ? (totalHEFloor / totalHE) * 100 : 0;

  const safePct = (part: number, total: number) => {
    if (!total || total <= 0) return '0.0';
    const val = (part / total) * 100;
    return isNaN(val) ? '0.0' : val.toFixed(1);
  };

  // Average Hen-day
  const recordsWithHD = records.filter(r => (r.hendayPct || 0) > 0);
  const avgHD = recordsWithHD.length > 0 
    ? recordsWithHD.reduce((acc, r) => acc + (r.hendayPct || 0), 0) / recordsWithHD.length 
    : 0;

  // Total female bird-days
  const totalFemalePop = records.reduce((acc, r) => acc + (r.femalePopulationAtDate || 0), 0);
  const avgDailyTEP = records.length > 0 ? Math.round(totalTEP / records.length) : 0;
  const totalTrays30 = Math.floor(totalTEP / 30);
  const remainingEggs = totalTEP % 30;

  return (
    <div className="space-y-6">
      {/* Executive KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4 print:gap-3">
        {/* Card 1: Total Eggs */}
        <div className="p-5 bg-white border-2 border-slate-900 rounded-3xl shadow-sm print:border-black print:p-4">
          <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1">
            <span>Total Production (TEP)</span>
            <span className="p-1 bg-amber-100 text-amber-900 rounded-lg print:hidden">
              <Egg className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-3xl font-black text-slate-950 font-display tracking-tight">
            {totalTEP.toLocaleString()} <span className="text-xs font-bold text-slate-500">Eggs</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-600 font-semibold print:border-slate-400">
            <span>{totalTrays30.toLocaleString()} Trays ({remainingEggs} pcs)</span>
            <span>~{avgDailyTEP.toLocaleString()} / day</span>
          </div>
        </div>

        {/* Card 2: Hatching Eggs */}
        <div className="p-5 bg-white border-2 border-emerald-900 rounded-3xl shadow-sm print:border-black print:p-4">
          <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-emerald-800 mb-1">
            <span>Settable Hatching Eggs</span>
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 rounded-md font-bold text-[10px]">
              {overallHEPct.toFixed(1)}% Yield
            </span>
          </div>
          <div className="text-3xl font-black text-emerald-950 font-display tracking-tight">
            {totalHE.toLocaleString()} <span className="text-xs font-bold text-emerald-700">HE</span>
          </div>
          <div className="mt-2 pt-2 border-t border-emerald-100 flex items-center justify-between text-[11px] text-emerald-900 font-semibold print:border-slate-400">
            <span>Nest: {totalHENest.toLocaleString()}</span>
            <span>Floor: {totalHEFloor.toLocaleString()} ({settableHEFloorRatio.toFixed(1)}%)</span>
          </div>
        </div>

        {/* Card 3: Non-Hatching Eggs */}
        <div className="p-5 bg-white border-2 border-rose-900 rounded-3xl shadow-sm print:border-black print:p-4">
          <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-rose-800 mb-1">
            <span>Commercial / NHE Discards</span>
            <span className="px-2 py-0.5 bg-rose-100 text-rose-900 rounded-md font-bold text-[10px]">
              {overallNHEPct.toFixed(1)}% Discard
            </span>
          </div>
          <div className="text-3xl font-black text-rose-950 font-display tracking-tight">
            {totalNHE.toLocaleString()} <span className="text-xs font-bold text-rose-700">NHE</span>
          </div>
          <div className="mt-2 pt-2 border-t border-rose-100 flex items-center justify-between text-[11px] text-rose-900 font-semibold print:border-slate-400">
            <span>Broken/Cracked: {totalBroken + totalThin}</span>
            <span>Spoiled/Dirty: {totalSpoiled}</span>
          </div>
        </div>

        {/* Card 4: Average Hen-Day */}
        <div className="p-5 bg-white border-2 border-forest-900 rounded-3xl shadow-sm print:border-black print:p-4">
          <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-forest-800 mb-1">
            <span>Average Laying Rate (HD%)</span>
            <span className="p-1 bg-forest-100 text-forest-900 rounded-lg print:hidden">
              <TrendingUp className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-3xl font-black text-forest-950 font-display tracking-tight">
            {avgHD.toFixed(1)}% <span className="text-xs font-bold text-forest-700">Hen-Day</span>
          </div>
          <div className="mt-2 pt-2 border-t border-forest-100 flex items-center justify-between text-[11px] text-forest-900 font-semibold print:border-slate-400">
            <span>Standard: <strong>~82.0% - 88.0%</strong></span>
            <span className={avgHD >= 80 ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
              {avgHD >= 80 ? 'Optimal Performance' : 'Monitoring Required'}
            </span>
          </div>
        </div>
      </div>

      {/* Visual Quality & Grading Distribution Bar */}
      {totalTEP > 0 && (
        <div className="bg-white border-2 border-slate-900 rounded-3xl p-5 shadow-xs print:border-black print:p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
            <span className="text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500 print:hidden" />
              Egg Quality Grading Distribution Ratio
            </span>
            <span className="text-slate-500 font-normal text-[11px]">
              Total Classified: <strong>{totalTEP.toLocaleString()} eggs</strong> ({records.length} production days)
            </span>
          </div>

          {/* Segmented Distribution Bar */}
          <div className="w-full h-5 rounded-full overflow-hidden flex bg-slate-200 border border-slate-300">
            {totalHENest > 0 && (
              <div 
                style={{ width: `${totalTEP > 0 ? (totalHENest / totalTEP) * 100 : 0}%` }} 
                className="bg-emerald-600 hover:opacity-90 transition-all h-full"
                title={`HE Nest: ${totalHENest.toLocaleString()} (${safePct(totalHENest, totalTEP)}%)`}
              />
            )}
            {totalHEFloor > 0 && (
              <div 
                style={{ width: `${totalTEP > 0 ? (totalHEFloor / totalTEP) * 100 : 0}%` }} 
                className="bg-teal-500 hover:opacity-90 transition-all h-full"
                title={`HE Floor: ${totalHEFloor.toLocaleString()} (${safePct(totalHEFloor, totalTEP)}%)`}
              />
            )}
            {totalSmall > 0 && (
              <div 
                style={{ width: `${totalTEP > 0 ? (totalSmall / totalTEP) * 100 : 0}%` }} 
                className="bg-sky-400 hover:opacity-90 transition-all h-full"
                title={`Small: ${totalSmall} (${safePct(totalSmall, totalTEP)}%)`}
              />
            )}
            {totalThin > 0 && (
              <div 
                style={{ width: `${totalTEP > 0 ? (totalThin / totalTEP) * 100 : 0}%` }} 
                className="bg-amber-400 hover:opacity-90 transition-all h-full"
                title={`Thin Shell: ${totalThin} (${safePct(totalThin, totalTEP)}%)`}
              />
            )}
            {totalDY > 0 && (
              <div 
                style={{ width: `${totalTEP > 0 ? (totalDY / totalTEP) * 100 : 0}%` }} 
                className="bg-orange-400 hover:opacity-90 transition-all h-full"
                title={`Double Yolk: ${totalDY} (${safePct(totalDY, totalTEP)}%)`}
              />
            )}
            {totalBroken > 0 && (
              <div 
                style={{ width: `${totalTEP > 0 ? (totalBroken / totalTEP) * 100 : 0}%` }} 
                className="bg-rose-500 hover:opacity-90 transition-all h-full"
                title={`Broken: ${totalBroken} (${safePct(totalBroken, totalTEP)}%)`}
              />
            )}
            {totalSpoiled > 0 && (
              <div 
                style={{ width: `${totalTEP > 0 ? (totalSpoiled / totalTEP) * 100 : 0}%` }} 
                className="bg-slate-700 hover:opacity-90 transition-all h-full"
                title={`Spoiled: ${totalSpoiled} (${safePct(totalSpoiled, totalTEP)}%)`}
              />
            )}
          </div>

          {/* Legend Items */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-700 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" />
              HE Nest: <strong>{safePct(totalHENest, totalTEP)}%</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500 shrink-0" />
              HE Floor: <strong>{safePct(totalHEFloor, totalTEP)}%</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shrink-0" />
              Small: <strong>{safePct(totalSmall, totalTEP)}%</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
              Thin Shell: <strong>{safePct(totalThin, totalTEP)}%</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-400 shrink-0" />
              Double Yolk: <strong>{safePct(totalDY, totalTEP)}%</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
              Broken: <strong>{safePct(totalBroken, totalTEP)}%</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-700 shrink-0" />
              Spoiled: <strong>{safePct(totalSpoiled, totalTEP)}%</strong>
            </span>
          </div>
        </div>
      )}

      {/* Main Tabular Report Table */}
      <div className="bg-white border-2 border-slate-900 rounded-3xl overflow-hidden shadow-sm print:border-black print:rounded-none">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between print:bg-black print:text-white">
          <div className="flex items-center gap-2">
            <Egg className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-black uppercase tracking-wider">
              Comprehensive Daily Egg Laying & Hatching Quality Register
            </h3>
          </div>
          <span className="text-xs text-slate-300 font-mono font-bold">
            {records.length} {records.length === 1 ? 'Record' : 'Records'} Logged
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-sans">
            <thead>
              {/* Group Super Header */}
              <tr className="bg-slate-200/90 text-slate-900 text-[10px] font-black uppercase tracking-wider border-b border-slate-300 print:bg-slate-300 print:border-black">
                <th colSpan={3} className="py-2 px-3 text-center border-r border-slate-300 print:border-black">Flock Reference</th>
                <th colSpan={4} className="py-2 px-3 text-center bg-emerald-100/70 text-emerald-950 border-r border-slate-300 print:border-black">Hatching Eggs (HE Settable)</th>
                <th colSpan={7} className="py-2 px-3 text-center bg-rose-100/70 text-rose-950 border-r border-slate-300 print:border-black">Non-Hatching Eggs (NHE Discards)</th>
                <th colSpan={4} className="py-2 px-3 text-center bg-amber-100/70 text-amber-950">Totals & Efficiency</th>
              </tr>

              {/* Sub Columns */}
              <tr className="bg-slate-100 text-slate-800 font-bold border-b-2 border-slate-400 print:bg-slate-200 print:border-black text-[11px]">
                <th className="py-2.5 px-3 whitespace-nowrap">Date</th>
                <th className="py-2.5 px-2.5 whitespace-nowrap">House</th>
                <th className="py-2.5 px-2.5 whitespace-nowrap text-right border-r border-slate-200 print:border-black">Females</th>
                
                {/* HE Columns */}
                <th className="py-2.5 px-2.5 whitespace-nowrap text-right text-emerald-900 font-bold bg-emerald-50/40">HE Nest</th>
                <th className="py-2.5 px-2.5 whitespace-nowrap text-right text-emerald-900 font-bold bg-emerald-50/40">HE Floor</th>
                <th className="py-2.5 px-2.5 whitespace-nowrap text-right text-emerald-950 font-black bg-emerald-100/80">Total HE</th>
                <th className="py-2.5 px-2.5 whitespace-nowrap text-right text-emerald-900 font-bold bg-emerald-50/40 border-r border-slate-200 print:border-black">HE %</th>
                
                {/* NHE Columns */}
                <th className="py-2.5 px-2 text-right text-slate-600 font-semibold">Small</th>
                <th className="py-2.5 px-2 text-right text-slate-600 font-semibold">Thin</th>
                <th className="py-2.5 px-2 text-right text-slate-600 font-semibold">Missh</th>
                <th className="py-2.5 px-2 text-right text-slate-600 font-semibold">D-Yolk</th>
                <th className="py-2.5 px-2 text-right text-slate-600 font-semibold">Broken</th>
                <th className="py-2.5 px-2 text-right text-slate-600 font-semibold">Spoiled</th>
                <th className="py-2.5 px-2.5 whitespace-nowrap text-right text-rose-950 font-black bg-rose-100/70 border-r border-slate-200 print:border-black">Total NHE</th>
                
                {/* Production Columns */}
                <th className="py-2.5 px-3 whitespace-nowrap text-right text-slate-950 font-black bg-amber-100/70">Total TEP</th>
                <th className="py-2.5 px-2.5 whitespace-nowrap text-right text-forest-950 font-black bg-forest-100/70">HD %</th>
                <th className="py-2.5 px-2.5 whitespace-nowrap text-right">Avg Wt</th>
                <th className="py-2.5 px-3 whitespace-nowrap text-slate-700">Logged By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 print:divide-slate-400">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={18} className="py-12 text-center text-slate-400 font-medium">
                    No egg production records match the selected date period and flock filters.
                  </td>
                </tr>
              ) : (
                records.map((r, idx) => {
                  const hePct = r.tep && r.tep > 0 ? ((r.totalHE || 0) / r.tep) * 100 : 0;
                  const nhePct = r.tep && r.tep > 0 ? ((r.totalNHE || 0) / r.tep) * 100 : 0;
                  const isEven = idx % 2 === 0;

                  return (
                    <tr 
                      key={r.id || idx} 
                      className={`transition print:hover:bg-transparent ${
                        isEven ? 'bg-white' : 'bg-slate-50/70 print:bg-white'
                      } hover:bg-emerald-50/40`}
                    >
                      <td className="py-2 px-3 font-semibold text-slate-950 whitespace-nowrap">
                        {r.date}
                      </td>
                      <td className="py-2 px-2.5 font-bold text-slate-900 whitespace-nowrap">
                        {r.houseNumber}
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono text-slate-600 border-r border-slate-200 print:border-black">
                        {r.femalePopulationAtDate ? r.femalePopulationAtDate.toLocaleString() : '-'}
                      </td>
                      
                      {/* HE Values */}
                      <td className="py-2 px-2.5 text-right font-mono text-emerald-900 bg-emerald-50/20">
                        {(r.heNest || 0).toLocaleString()}
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono text-emerald-900 bg-emerald-50/20">
                        {(r.heFloor || 0).toLocaleString()}
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono font-black text-emerald-950 bg-emerald-100/50">
                        {(r.totalHE || 0).toLocaleString()}
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono font-bold text-emerald-900 bg-emerald-50/20 border-r border-slate-200 print:border-black">
                        {typeof hePct === 'number' && !isNaN(hePct) ? hePct.toFixed(1) : '0.0'}%
                      </td>

                      {/* NHE Discards */}
                      <td className="py-2 px-2 text-right font-mono text-slate-600">{r.small || 0}</td>
                      <td className="py-2 px-2 text-right font-mono text-slate-600">{r.thinShell || 0}</td>
                      <td className="py-2 px-2 text-right font-mono text-slate-600">{r.misshape || 0}</td>
                      <td className="py-2 px-2 text-right font-mono text-slate-600">{r.doubleYolk || 0}</td>
                      <td className="py-2 px-2 text-right font-mono text-slate-600">{r.broken || 0}</td>
                      <td className="py-2 px-2 text-right font-mono text-slate-600">{r.spoiled || 0}</td>
                      <td className="py-2 px-2.5 text-right font-mono font-black text-rose-950 bg-rose-100/40 border-r border-slate-200 print:border-black">
                        {(r.totalNHE || 0).toLocaleString()}
                      </td>

                      {/* Production & Laying Totals */}
                      <td className="py-2 px-3 text-right font-mono font-black text-slate-950 bg-amber-100/50">
                        {(r.tep || 0).toLocaleString()}
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono font-black text-forest-950 bg-forest-100/50">
                        {typeof r.hendayPct === 'number' && !isNaN(r.hendayPct) ? `${r.hendayPct.toFixed(1)}%` : '-'}
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono text-slate-700">
                        {typeof r.sampleEggWeightGrams === 'number' && !isNaN(r.sampleEggWeightGrams) ? `${r.sampleEggWeightGrams.toFixed(1)}g` : '-'}
                      </td>
                      <td className="py-2 px-3 text-slate-700 truncate max-w-[120px] font-medium" title={r.loggedBy}>
                        {r.loggedBy || 'Flock Technician'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Table Grand Totals Row */}
            {records.length > 0 && (
              <tfoot>
                <tr className="bg-slate-950 text-white font-bold border-t-2 border-slate-950 print:bg-black print:text-white text-[11px]">
                  <td className="py-3 px-3 uppercase tracking-wider font-black" colSpan={2}>
                    Grand Totals ({records.length} records)
                  </td>
                  <td className="py-3 px-2.5 text-right font-mono text-slate-300 border-r border-slate-700">
                    {totalFemalePop > 0 ? Math.round(totalFemalePop / records.length).toLocaleString() : '-'}
                  </td>
                  <td className="py-3 px-2.5 text-right font-mono text-emerald-300">
                    {totalHENest.toLocaleString()}
                  </td>
                  <td className="py-3 px-2.5 text-right font-mono text-emerald-300">
                    {totalHEFloor.toLocaleString()}
                  </td>
                  <td className="py-3 px-2.5 text-right font-mono text-emerald-400 font-black">
                    {totalHE.toLocaleString()}
                  </td>
                  <td className="py-3 px-2.5 text-right font-mono text-emerald-300 border-r border-slate-700">
                    {typeof overallHEPct === 'number' && !isNaN(overallHEPct) ? overallHEPct.toFixed(1) : '0.0'}%
                  </td>
                  <td className="py-3 px-2 text-right font-mono text-slate-300">{totalSmall}</td>
                  <td className="py-3 px-2 text-right font-mono text-slate-300">{totalThin}</td>
                  <td className="py-3 px-2 text-right font-mono text-slate-300">{totalMisshape}</td>
                  <td className="py-3 px-2 text-right font-mono text-slate-300">{totalDY}</td>
                  <td className="py-3 px-2 text-right font-mono text-slate-300">{totalBroken}</td>
                  <td className="py-3 px-2 text-right font-mono text-slate-300">{totalSpoiled}</td>
                  <td className="py-3 px-2.5 text-right font-mono text-rose-300 font-black border-r border-slate-700">
                    {totalNHE.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-amber-300 font-black">
                    {totalTEP.toLocaleString()}
                  </td>
                  <td className="py-3 px-2.5 text-right font-mono text-mint-300 font-black">
                    {typeof avgHD === 'number' && !isNaN(avgHD) ? avgHD.toFixed(1) : '0.0'}%
                  </td>
                  <td className="py-3 px-2.5 text-right font-mono text-slate-300">-</td>
                  <td className="py-3 px-3 text-slate-400">All Operations Staff</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

