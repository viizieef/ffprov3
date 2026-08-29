import React from 'react';
import { DepletionRecord, Flock } from '../../types';
import { Skull, TrendingDown, HeartHandshake, ShieldAlert, Activity, BarChart2, CheckCircle2 } from 'lucide-react';

interface MortalityReportSectionProps {
  depletions: DepletionRecord[];
  flocks: Flock[];
  getFlockStats: (houseNumber: string, targetDate?: string) => any;
}

export const MortalityReportSection: React.FC<MortalityReportSectionProps> = ({
  depletions,
  flocks,
  getFlockStats
}) => {
  // Aggregate counts
  const totalMales = depletions.reduce((acc, d) => acc + (d.maleCount || 0), 0);
  const totalFemales = depletions.reduce((acc, d) => acc + (d.femaleCount || 0), 0);
  const grandTotalDepletions = totalMales + totalFemales;

  // Breakdown by Category
  const naturalMortality = depletions
    .filter(d => d.category === 'Mortality')
    .reduce((acc, d) => acc + (Number(d.maleCount) || 0) + (Number(d.femaleCount) || 0), 0);

  const spotCulls = depletions
    .filter(d => d.category === 'Spot Cull')
    .reduce((acc, d) => acc + (Number(d.maleCount) || 0) + (Number(d.femaleCount) || 0), 0);

  const missex = depletions
    .filter(d => d.category === 'Missex')
    .reduce((acc, d) => acc + (Number(d.maleCount) || 0) + (Number(d.femaleCount) || 0), 0);

  const spentCull = depletions
    .filter(d => d.category === 'Spent Cull')
    .reduce((acc, d) => acc + (Number(d.maleCount) || 0) + (Number(d.femaleCount) || 0), 0);

  // Total current population across active flocks
  const totalActiveMales = flocks.reduce((acc, f) => acc + (f.currentMales || 0), 0);
  const totalActiveFemales = flocks.reduce((acc, f) => acc + (f.currentFemales || 0), 0);
  const totalActivePop = totalActiveMales + totalActiveFemales;

  const totalInitialMales = flocks.reduce((acc, f) => acc + (f.initialMales || 0), 0);
  const totalInitialFemales = flocks.reduce((acc, f) => acc + (f.initialFemales || 0), 0);
  const totalInitialPop = totalInitialMales + totalInitialFemales;

  const cumulativeLivability = totalInitialPop > 0 
    ? (totalActivePop / totalInitialPop) * 100 
    : 100;

  const safePct = (part: number, total: number) => {
    if (!total || total <= 0) return '0.0';
    const val = (part / total) * 100;
    return isNaN(val) ? '0.0' : val.toFixed(1);
  };

  return (
    <div className="space-y-6">
      {/* Executive KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4 print:gap-3">
        {/* Card 1: Total Depletions */}
        <div className="p-5 bg-white border-2 border-rose-900 rounded-3xl shadow-sm print:border-black print:p-4">
          <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-rose-800 mb-1">
            <span>Total Flock Depletions</span>
            <span className="p-1 bg-rose-100 text-rose-900 rounded-lg print:hidden">
              <Skull className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-3xl font-black text-rose-950 font-display tracking-tight">
            {grandTotalDepletions.toLocaleString()} <span className="text-xs font-bold text-rose-700">Birds</span>
          </div>
          <div className="mt-2 pt-2 border-t border-rose-100 flex items-center justify-between text-[11px] text-rose-900 font-semibold print:border-slate-400">
            <span>Females: <strong>{totalFemales.toLocaleString()}</strong></span>
            <span>Males: <strong>{totalMales.toLocaleString()}</strong></span>
          </div>
        </div>

        {/* Card 2: Natural Mortality */}
        <div className="p-5 bg-white border-2 border-slate-900 rounded-3xl shadow-sm print:border-black print:p-4">
          <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
            <span>Natural Mortality</span>
            <span className="px-2 py-0.5 bg-slate-100 text-slate-900 rounded-md font-bold text-[10px]">
              {safePct(naturalMortality, grandTotalDepletions)}% Ratio
            </span>
          </div>
          <div className="text-3xl font-black text-slate-950 font-display tracking-tight">
            {naturalMortality.toLocaleString()} <span className="text-xs font-bold text-slate-500">Dead</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-600 font-semibold print:border-slate-400">
            <span>Daily Average: ~{depletions.length > 0 ? (naturalMortality / Math.max(1, depletions.length)).toFixed(1) : '0.0'}</span>
            <span className="text-slate-800 font-bold">Unassisted Loss</span>
          </div>
        </div>

        {/* Card 3: Culls & Missex */}
        <div className="p-5 bg-white border-2 border-amber-900 rounded-3xl shadow-sm print:border-black print:p-4">
          <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-amber-800 mb-1">
            <span>Selection Culls & Missex</span>
            <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded-md font-bold text-[10px]">
              {safePct(spotCulls + missex + spentCull, grandTotalDepletions)}%
            </span>
          </div>
          <div className="text-3xl font-black text-amber-950 font-display tracking-tight">
            {(spotCulls + missex + spentCull).toLocaleString()} <span className="text-xs font-bold text-amber-700">Culled</span>
          </div>
          <div className="mt-2 pt-2 border-t border-amber-100 flex items-center justify-between text-[11px] text-amber-900 font-semibold print:border-slate-400">
            <span>Spot: {spotCulls}</span>
            <span>Missex: {missex} &bull; Spent: {spentCull}</span>
          </div>
        </div>

        {/* Card 4: Cumulative Livability */}
        <div className="p-5 bg-white border-2 border-emerald-900 rounded-3xl shadow-sm print:border-black print:p-4">
          <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-emerald-800 mb-1">
            <span>Cumulative Livability</span>
            <span className="p-1 bg-emerald-100 text-emerald-900 rounded-lg print:hidden">
              <Activity className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-3xl font-black text-emerald-950 font-display tracking-tight">
            {typeof cumulativeLivability === 'number' && !isNaN(cumulativeLivability) ? cumulativeLivability.toFixed(2) : '100.00'}% <span className="text-xs font-bold text-emerald-700">Live</span>
          </div>
          <div className="mt-2 pt-2 border-t border-emerald-100 flex items-center justify-between text-[11px] text-emerald-900 font-semibold print:border-slate-400">
            <span>Active: <strong>{totalActivePop.toLocaleString()}</strong> Birds</span>
            <span className="text-emerald-700 font-bold">Target &gt;95.0%</span>
          </div>
        </div>
      </div>

      {/* Visual Depletion Reason & Classification Bar */}
      {grandTotalDepletions > 0 && (
        <div className="bg-white border-2 border-slate-900 rounded-3xl p-5 shadow-xs print:border-black print:p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
            <span className="text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <BarChart2 className="w-4 h-4 text-rose-600 print:hidden" />
              Depletion Category Proportional Analysis
            </span>
            <span className="text-slate-500 font-normal text-[11px]">
              Total Classified: <strong>{grandTotalDepletions.toLocaleString()} birds</strong> ({depletions.length} events)
            </span>
          </div>

          {/* Segmented Bar */}
          <div className="w-full h-5 rounded-full overflow-hidden flex bg-slate-200 border border-slate-300">
            {naturalMortality > 0 && (
              <div 
                style={{ width: `${grandTotalDepletions > 0 ? (naturalMortality / grandTotalDepletions) * 100 : 0}%` }} 
                className="bg-rose-600 hover:opacity-90 transition-all h-full"
                title={`Natural Mortality: ${naturalMortality} (${safePct(naturalMortality, grandTotalDepletions)}%)`}
              />
            )}
            {spotCulls > 0 && (
              <div 
                style={{ width: `${grandTotalDepletions > 0 ? (spotCulls / grandTotalDepletions) * 100 : 0}%` }} 
                className="bg-amber-500 hover:opacity-90 transition-all h-full"
                title={`Spot Culls: ${spotCulls} (${safePct(spotCulls, grandTotalDepletions)}%)`}
              />
            )}
            {missex > 0 && (
              <div 
                style={{ width: `${grandTotalDepletions > 0 ? (missex / grandTotalDepletions) * 100 : 0}%` }} 
                className="bg-indigo-500 hover:opacity-90 transition-all h-full"
                title={`Missex: ${missex} (${safePct(missex, grandTotalDepletions)}%)`}
              />
            )}
            {spentCull > 0 && (
              <div 
                style={{ width: `${grandTotalDepletions > 0 ? (spentCull / grandTotalDepletions) * 100 : 0}%` }} 
                className="bg-slate-700 hover:opacity-90 transition-all h-full"
                title={`Spent Culls: ${spentCull} (${safePct(spentCull, grandTotalDepletions)}%)`}
              />
            )}
          </div>

          {/* Legend Items */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px] text-slate-700 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 shrink-0" />
              Natural Mortality: <strong>{naturalMortality} ({safePct(naturalMortality, grandTotalDepletions)}%)</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
              Spot Culls: <strong>{spotCulls} ({safePct(spotCulls, grandTotalDepletions)}%)</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0" />
              Missex Birds: <strong>{missex} ({safePct(missex, grandTotalDepletions)}%)</strong>
            </span>
            {spentCull > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-700 shrink-0" />
                Spent Flock Culls: <strong>{spentCull} ({safePct(spentCull, grandTotalDepletions)}%)</strong>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Main Depletions Table */}
      <div className="bg-white border-2 border-slate-900 rounded-3xl overflow-hidden shadow-sm print:border-black print:rounded-none">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between print:bg-black print:text-white">
          <div className="flex items-center gap-2">
            <Skull className="w-4 h-4 text-rose-400" />
            <h3 className="text-sm font-black uppercase tracking-wider">
              Comprehensive Mortality & Depletion Incident Audit Log
            </h3>
          </div>
          <span className="text-xs text-slate-300 font-mono font-bold">
            {depletions.length} {depletions.length === 1 ? 'Incident' : 'Incidents'} Recorded
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-sans">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-bold border-b-2 border-slate-400 print:bg-slate-200 print:border-black text-[11px]">
                <th className="py-3 px-3 whitespace-nowrap">Date</th>
                <th className="py-3 px-2.5 whitespace-nowrap">House</th>
                <th className="py-3 px-2.5 whitespace-nowrap">Side / Pen</th>
                <th className="py-3 px-3 whitespace-nowrap">Category</th>
                <th className="py-3 px-3 whitespace-nowrap text-right text-teal-950 font-black bg-teal-100/70">Males</th>
                <th className="py-3 px-3 whitespace-nowrap text-right text-rose-950 font-black bg-rose-100/70">Females</th>
                <th className="py-3 px-3.5 whitespace-nowrap text-right text-slate-950 font-black bg-slate-200/90">Total Depleted</th>
                <th className="py-3 px-4 whitespace-nowrap">Diagnosis / Clinical Symptoms</th>
                <th className="py-3 px-2.5 whitespace-nowrap">Source Module</th>
                <th className="py-3 px-3 whitespace-nowrap">Authorized Logger</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 print:divide-slate-400">
              {depletions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 font-medium">
                    No mortality or depletion incident logs found matching active filter parameters.
                  </td>
                </tr>
              ) : (
                depletions.map((d, idx) => {
                  const rowTotal = (d.maleCount || 0) + (d.femaleCount || 0);
                  const isMortality = d.category === 'Mortality';
                  const isEven = idx % 2 === 0;

                  return (
                    <tr 
                      key={d.id || idx} 
                      className={`transition print:hover:bg-transparent ${
                        isEven ? 'bg-white' : 'bg-slate-50/70 print:bg-white'
                      } hover:bg-rose-50/30`}
                    >
                      <td className="py-2.5 px-3 font-semibold text-slate-950 whitespace-nowrap">
                        {d.date}
                      </td>
                      <td className="py-2.5 px-2.5 font-bold text-slate-900 whitespace-nowrap">
                        {d.houseNumber}
                      </td>
                      <td className="py-2.5 px-2.5 text-slate-600 whitespace-nowrap font-medium">
                        {d.penName || d.side || 'Whole House'}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-md font-extrabold text-[10px] uppercase tracking-wider border print:border-black ${
                          isMortality 
                            ? 'bg-rose-100 text-rose-950 border-rose-300' 
                            : d.category === 'Spot Cull'
                            ? 'bg-amber-100 text-amber-950 border-amber-300'
                            : d.category === 'Missex'
                            ? 'bg-indigo-100 text-indigo-950 border-indigo-300'
                            : 'bg-slate-200 text-slate-950 border-slate-400'
                        }`}>
                          {d.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-teal-950 font-bold bg-teal-50/30">
                        {d.maleCount || 0}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-rose-950 font-bold bg-rose-50/30">
                        {d.femaleCount || 0}
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-mono font-black text-slate-950 bg-slate-100">
                        {rowTotal}
                      </td>
                      <td className="py-2.5 px-4 text-slate-800 max-w-sm truncate font-medium" title={d.reasonDetails}>
                        {d.reasonDetails || (isMortality ? 'Routine daily inspection mortality found in slat area' : 'Flock uniformity and conformation selection cull')}
                      </td>
                      <td className="py-2.5 px-2.5 text-[11px] text-slate-600 font-medium capitalize">
                        {d.sourceModule === 'flockman' ? "Flockman Daily" : 'Veterinary Log'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 truncate max-w-[120px] font-medium" title={d.loggedBy}>
                        {d.loggedBy || 'Authorized Leadman'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {depletions.length > 0 && (
              <tfoot>
                <tr className="bg-slate-950 text-white font-bold border-t-2 border-slate-950 print:bg-black print:text-white text-[11px]">
                  <td className="py-3 px-3 uppercase tracking-wider font-black" colSpan={4}>
                    Total Flock Depletions ({depletions.length} incident logs)
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-teal-300 font-black">
                    {totalMales.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-rose-300 font-black">
                    {totalFemales.toLocaleString()}
                  </td>
                  <td className="py-3 px-3.5 text-right font-mono text-amber-300 font-black">
                    {grandTotalDepletions.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-slate-300" colSpan={3}>
                    Breakdown: Natural Mortality = <strong>{naturalMortality}</strong> | Selection Culls = <strong>{spotCulls + spentCull}</strong> | Missex = <strong>{missex}</strong>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};
