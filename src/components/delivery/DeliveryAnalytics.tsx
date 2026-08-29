import React, { useMemo } from 'react';
import { DeliveryRecord } from '../../types';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  BarChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  TrendingUp, 
  Percent, 
  AlertTriangle, 
  CheckCircle, 
  Package, 
  Truck, 
  Layers,
  Sparkles,
  PieChart as PieIcon
} from 'lucide-react';

interface DeliveryAnalyticsProps {
  deliveries: DeliveryRecord[];
}

const DEFECT_COLORS = [
  '#f59e0b', // Dirty - Amber
  '#ef4444', // Thin Shell - Red
  '#8b5cf6', // Mis-Shape - Purple
  '#3b82f6', // Off Size - Blue
  '#ec4899', // Crack - Pink
  '#6b7280', // Spoil - Slate
  '#10b981'  // JRS - Emerald
];

export const DeliveryAnalytics: React.FC<DeliveryAnalyticsProps> = ({ deliveries }) => {
  const safeDeliveries = useMemo(() => {
    return [...deliveries].sort((a, b) => new Date(a.productionDate).getTime() - new Date(b.productionDate).getTime());
  }, [deliveries]);

  // High-level aggregates
  const stats = useMemo(() => {
    if (safeDeliveries.length === 0) {
      return {
        totalDispatched: 0,
        totalNetHe: 0,
        totalSettable: 0,
        settabilityPct: 0,
        totalTransitLoss: 0,
        transitLossPct: 0,
        totalSortingDefects: 0
      };
    }

    const totalDispatched = safeDeliveries.reduce((sum, d) => sum + d.totalEggsReceived, 0);
    const totalNetHe = safeDeliveries.reduce((sum, d) => sum + d.totalNetHeReceived, 0);
    const totalSettable = safeDeliveries.reduce((sum, d) => sum + d.totalSettableEggs, 0);
    const totalTransitLoss = safeDeliveries.reduce((sum, d) => sum + (d.totalTransitBreakage + d.totalTransitHairline + d.totalTransitSpoils), 0);
    const totalSortingDefects = safeDeliveries.reduce((sum, d) => sum + d.totalNheSorting, 0);

    const settabilityPct = totalNetHe > 0 ? Number(((totalSettable / totalNetHe) * 100).toFixed(2)) : 0;
    const transitLossPct = totalNetHe > 0 ? Number(((totalTransitLoss / totalNetHe) * 100).toFixed(2)) : 0;

    return {
      totalDispatched,
      totalNetHe,
      totalSettable,
      settabilityPct,
      totalTransitLoss,
      transitLossPct,
      totalSortingDefects
    };
  }, [safeDeliveries]);

  // Batch-by-batch timeline data for charts
  const timelineData = useMemo(() => {
    return safeDeliveries.map(d => {
      const settablePct = d.totalNetHeReceived > 0 
        ? Number(((d.totalSettableEggs / d.totalNetHeReceived) * 100).toFixed(2))
        : 0;
      const transitPct = d.totalNetHeReceived > 0
        ? Number((((d.totalTransitBreakage + d.totalTransitHairline + d.totalTransitSpoils) / d.totalNetHeReceived) * 100).toFixed(2))
        : 0;

      return {
        date: d.productionDate.slice(5), // MM-DD
        fullDate: d.productionDate,
        controlNo: d.esrrrNumber,
        heReceived: d.totalNetHeReceived,
        settable: d.totalSettableEggs,
        transitLoss: d.totalTransitBreakage + d.totalTransitHairline + d.totalTransitSpoils,
        sortingDefects: d.totalNheSorting,
        settabilityPct: settablePct,
        transitLossPct: transitPct
      };
    });
  }, [safeDeliveries]);

  // Hatchery regrading sorting defect distribution across all deliveries
  const defectBreakdown = useMemo(() => {
    let dirty = 0, thin = 0, mis = 0, off = 0, crack = 0, spoil = 0, jrs = 0;

    safeDeliveries.forEach(d => {
      dirty += d.totalRegradingDirty;
      thin += d.totalRegradingThinShell;
      mis += d.totalRegradingMisShape;
      off += d.totalRegradingOffSize;
      crack += d.totalRegradingCrack;
      spoil += d.totalRegradingSpoil;
      jrs += d.totalRegradingJRS;
    });

    const total = dirty + thin + mis + off + crack + spoil + jrs || 1;

    return [
      { name: 'Dirty Eggs', count: dirty, percentage: Number(((dirty / total) * 100).toFixed(1)) },
      { name: 'Thin Shell', count: thin, percentage: Number(((thin / total) * 100).toFixed(1)) },
      { name: 'Mis-Shape', count: mis, percentage: Number(((mis / total) * 100).toFixed(1)) },
      { name: 'Off Size', count: off, percentage: Number(((off / total) * 100).toFixed(1)) },
      { name: 'Crack / Hairline', count: crack, percentage: Number(((crack / total) * 100).toFixed(1)) },
      { name: 'Spoil / Rotten', count: spoil, percentage: Number(((spoil / total) * 100).toFixed(1)) },
      { name: 'JRS (Jumbo/Round/Small)', count: jrs, percentage: Number(((jrs / total) * 100).toFixed(1)) }
    ].filter(i => i.count >= 0);
  }, [safeDeliveries]);

  // House-by-House Aggregate Comparison (Houses 1-6)
  const houseComparison = useMemo(() => {
    const houseMap: Record<string, { house: string; deliveredHe: number; settableEggs: number; defects: number }> = {
      '1': { house: 'H1', deliveredHe: 0, settableEggs: 0, defects: 0 },
      '2': { house: 'H2', deliveredHe: 0, settableEggs: 0, defects: 0 },
      '3': { house: 'H3', deliveredHe: 0, settableEggs: 0, defects: 0 },
      '4': { house: 'H4', deliveredHe: 0, settableEggs: 0, defects: 0 },
      '5': { house: 'H5', deliveredHe: 0, settableEggs: 0, defects: 0 },
      '6': { house: 'H6', deliveredHe: 0, settableEggs: 0, defects: 0 }
    };

    safeDeliveries.forEach(d => {
      d.items.forEach(item => {
        const num = item.houseNumber.replace(/\D/g, '') || item.houseNumber;
        if (houseMap[num]) {
          houseMap[num].deliveredHe += item.netHeReceived;
          houseMap[num].settableEggs += item.totalSettableEggs;
          houseMap[num].defects += item.totalNheSorting;
        }
      });
    });

    return Object.values(houseMap).map(h => ({
      ...h,
      settabilityPct: h.deliveredHe > 0 ? Number(((h.settableEggs / h.deliveredHe) * 100).toFixed(2)) : 0
    }));
  }, [safeDeliveries]);

  return (
    <div className="space-y-6">
      
      {/* Top 4 KPI metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Settable Eggs */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Total Settable Eggs</span>
            <div className="text-xl font-black text-slate-900 font-display">
              {stats.totalSettable.toLocaleString()}
            </div>
            <span className="text-[11px] font-semibold text-emerald-700">
              {stats.settabilityPct}% Hatchery Settability
            </span>
          </div>
        </div>

        {/* Total Dispatched Eggs */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-sky-50 text-sky-600 rounded-2xl border border-sky-100">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Total Dispatched Eggs</span>
            <div className="text-xl font-black text-slate-900 font-display">
              {stats.totalDispatched.toLocaleString()}
            </div>
            <span className="text-[11px] font-semibold text-sky-700">
              Across {safeDeliveries.length} ESRRR Batches
            </span>
          </div>
        </div>

        {/* Transit Damage Loss */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Transit Damage Loss</span>
            <div className="text-xl font-black text-slate-900 font-display">
              {stats.totalTransitLoss.toLocaleString()}
            </div>
            <span className="text-[11px] font-semibold text-rose-700">
              {stats.transitLossPct}% Breakage / Hairline
            </span>
          </div>
        </div>

        {/* Hatchery Sorting Defects */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Regrading Rejections</span>
            <div className="text-xl font-black text-slate-900 font-display">
              {stats.totalSortingDefects.toLocaleString()}
            </div>
            <span className="text-[11px] font-semibold text-amber-700">
              Non-Hatching removed at hatchery
            </span>
          </div>
        </div>

      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Settability & Volume Trend Over Deliveries */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Settable Eggs & Settability Rate (%) by Batch</span>
            </div>
            <span className="text-xs font-semibold text-slate-500">Target: ≥ 98%</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis yAxisId="right" orientation="right" domain={[90, 100]} tick={{ fontSize: 11, fill: '#10b981' }} unit="%" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px', border: 'none' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar yAxisId="left" dataKey="settable" name="Settable Eggs" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="left" dataKey="sortingDefects" name="Sorting Rejects" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="settabilityPct" name="Settability %" stroke="#059669" strokeWidth={3} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: House-by-House Settability Comparison */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>House Settability Comparison (Houses 1-6)</span>
            </div>
            <span className="text-xs font-semibold text-slate-500">Cumulative Delivery Quality</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={houseComparison} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="house" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px', border: 'none' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="settableEggs" name="Settable Eggs" fill="#059669" radius={[4, 4, 0, 0]} />
                <Bar dataKey="defects" name="Regrading Discards" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Defect Distribution Breakdown List & Donut */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
            <PieIcon className="w-4 h-4 text-amber-600" />
            <span>Hatchery Regrading Defect Distribution Breakdown</span>
          </div>
          <span className="text-xs text-slate-500 font-medium">Quality Assurance Diagnostics</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {defectBreakdown.map((item, idx) => (
            <div 
              key={idx}
              className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100/70 transition flex items-center justify-between"
            >
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">{item.name}</span>
                <div className="text-base font-black text-slate-900">{item.count.toLocaleString()} pcs</div>
              </div>
              <div className="text-right">
                <span className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 shadow-2xs">
                  {item.percentage}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
