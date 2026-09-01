import React, { useState, useMemo } from 'react';
import { useFarm } from '../../context/FarmContext';
import { DeliveryRecord, DeliveryStatus } from '../../types';
import { 
  Truck, 
  Plus, 
  Search, 
  Filter, 
  FileSpreadsheet, 
  Eye, 
  Edit3, 
  Trash2, 
  Share2, 
  Printer, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  AlertCircle,
  Building2,
  Package,
  Layers,
  TrendingUp,
  BarChart3,
  FileText,
  Egg,
  Sparkles
} from 'lucide-react';
import { DeliveryPrintDocument } from './DeliveryPrintDocument';
import { DeliveryFormModal } from './DeliveryFormModal';
import { DeliveryAnalytics } from './DeliveryAnalytics';
import { HatchingSummaryTab } from './HatchingSummaryTab';
import { HatchingSummaryFormModal } from './HatchingSummaryFormModal';
import { exportReportToExcel, ReportMetadata, SheetData } from '../../utils/reportExportUtils';
import { useToast } from '../common/ToastContainer';

export const DeliveryView: React.FC = () => {
  const { 
    deliveries = [], 
    hatchingSummaries = [],
    deleteDelivery, 
    currentUser, 
    farmProfile, 
    permissions 
  } = useFarm();
  const toast = useToast();

  const safeDeliveries = Array.isArray(deliveries) ? deliveries : [];
  const safeHatching = Array.isArray(hatchingSummaries) ? hatchingSummaries : [];

  // Tab State: 'hatching' | 'list' | 'analytics' | 'document'
  const [activeTab, setActiveTab] = useState<'hatching' | 'list' | 'analytics' | 'document'>('hatching');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  
  // Modals & Document Viewer
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryRecord | null>(() => safeDeliveries[0] || null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isHatchingFormModalOpen, setIsHatchingFormModalOpen] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState<DeliveryRecord | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Filtered Deliveries
  const filteredDeliveries = useMemo(() => {
    return safeDeliveries.filter(del => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || (
        del.esrrrNumber.toLowerCase().includes(q) ||
        del.hatcheryName.toLowerCase().includes(q) ||
        del.productionDate.includes(q) ||
        del.plateNumber.toLowerCase().includes(q) ||
        del.preparedBy.toLowerCase().includes(q)
      );

      const matchesStatus = statusFilter === 'All' || del.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [safeDeliveries, searchQuery, statusFilter]);

  const handleOpenCreateModal = () => {
    setEditingDelivery(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (del: DeliveryRecord) => {
    setEditingDelivery(del);
    setIsFormModalOpen(true);
  };

  const handleOpenViewDocument = (del: DeliveryRecord) => {
    setSelectedDelivery(del);
    setIsDetailModalOpen(true);
  };

  const handleDeleteDelivery = (id: string, esrrrNo: string) => {
    if (window.confirm(`Are you sure you want to delete ESRRR delivery record #${esrrrNo}?`)) {
      deleteDelivery(id);
      toast.success(`Deleted delivery record #${esrrrNo}`);
      if (selectedDelivery?.id === id) {
        setSelectedDelivery(safeDeliveries.find(d => d.id !== id) || null);
      }
    }
  };

  const handleExportAllToExcel = () => {
    if (safeDeliveries.length === 0) {
      toast.warning('No deliveries to export.');
      return;
    }

    const metadata: ReportMetadata = {
      companyName: farmProfile?.name || 'SAN MIGUEL FOODS, INC.',
      address: farmProfile?.address || 'Gen. Aguinaldo, Ramon, Isabela',
      contactNumber: 'LPL Farm Operations',
      email: 'von.lplimfarm@gmail.com',
      reportTitle: 'ALL DELIVERIES & ESRRR MASTER ARCHIVE',
      dateRange: 'All Recorded Delivery Cycles',
      houseFilter: 'All Houses (1 to 6)',
      generatedBy: currentUser?.fullName || 'Farm Admin',
      generatedAt: new Date().toLocaleString()
    };

    const columns = [
      { header: 'ESRRR NO.', key: 'esrrrNumber', width: 14 },
      { header: 'PROD DATE', key: 'productionDate', width: 14 },
      { header: 'DATE RECEIVED', key: 'dateReceived', width: 14 },
      { header: 'HATCHERY', key: 'hatcheryName', width: 16 },
      { header: 'STATUS', key: 'status', width: 12 },
      { header: 'HE DELIVERED', key: 'totalHeDelivered', width: 14 },
      { header: 'NHE DELIVERED', key: 'totalNheDelivered', width: 14 },
      { header: 'TOTAL RCVD', key: 'totalEggsReceived', width: 14 },
      { header: 'TRANSIT LOSS', key: 'transitLoss', width: 14 },
      { header: 'REGRADING DEFECTS', key: 'totalNheSorting', width: 16 },
      { header: 'SETTABLE EGGS', key: 'totalSettableEggs', width: 16 },
      { header: 'SETTABILITY %', key: 'settabilityPct', width: 14 },
      { header: 'PLATE NO', key: 'plateNumber', width: 12 },
      { header: 'TEMP (°C)', key: 'eggShellTemperature', width: 10 },
      { header: 'PREPARED BY', key: 'preparedBy', width: 20 },
      { header: 'FARM OIC', key: 'farmOic', width: 20 }
    ];

    const data = safeDeliveries.map(d => {
      const settablePct = d.totalNetHeReceived > 0
        ? ((d.totalSettableEggs / d.totalNetHeReceived) * 100).toFixed(2) + '%'
        : '0.00%';
      const loss = d.totalTransitBreakage + d.totalTransitHairline + d.totalTransitSpoils;

      return {
        esrrrNumber: d.esrrrNumber,
        productionDate: d.productionDate,
        dateReceived: d.dateReceived,
        hatcheryName: d.hatcheryName,
        status: d.status,
        totalHeDelivered: d.totalHeDelivered,
        totalNheDelivered: d.totalNheDelivered,
        totalEggsReceived: d.totalEggsReceived,
        transitLoss: loss,
        totalNheSorting: d.totalNheSorting,
        totalSettableEggs: d.totalSettableEggs,
        settabilityPct: settablePct,
        plateNumber: d.plateNumber,
        eggShellTemperature: d.eggShellTemperature,
        preparedBy: d.preparedBy,
        farmOic: d.farmOic
      };
    });

    const sheets: SheetData[] = [
      {
        sheetName: 'ESRRR_MASTER_DELIVERIES',
        title: 'Master Delivery Log & Regrading Records',
        columns,
        data
      }
    ];

    exportReportToExcel(metadata, sheets, `ESRRR_Master_Deliveries_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Downloaded ESRRR Master Deliveries Excel spreadsheet!');
  };

  // Cumulative totals for the active list
  const activeListTotals = useMemo(() => {
    return filteredDeliveries.reduce((acc, d) => ({
      totalDelivered: acc.totalDelivered + d.totalHeDelivered + d.totalNheDelivered,
      totalHe: acc.totalHe + d.totalHeDelivered,
      totalSettable: acc.totalSettable + d.totalSettableEggs,
      totalTransitLoss: acc.totalTransitLoss + (d.totalTransitBreakage + d.totalTransitHairline + d.totalTransitSpoils)
    }), { totalDelivered: 0, totalHe: 0, totalSettable: 0, totalTransitLoss: 0 });
  }, [filteredDeliveries]);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0 shadow-2xs">
            <Truck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Official San Miguel Foods, Inc. Standard
              </span>
              <span className="text-xs text-slate-400 font-bold">&bull; Delivery & Hatching Module</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-950 font-display tracking-tight mt-0.5">
              Egg Delivery & Hatching Management
            </h1>
            <p className="text-xs text-slate-600 max-w-2xl">
              Hatching Summaries (Setting Date, House, Breed, Eggs Set, Pull-out Date, Standard Chicks, Grade Out, Total Chicks Pulled, Total Hatch %, Saleable Hatch %), ESRRR dispatch accounting, and cold chain transit tracking.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={() => setIsHatchingFormModalOpen(true)}
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-slate-950 font-black text-xs rounded-xl transition shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Hatching Summary</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-bold text-xs rounded-xl transition shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New ESRRR Voucher</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('hatching')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
            activeTab === 'hatching'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Egg className="w-4 h-4 text-emerald-400" />
          <span>Hatching Summary ({safeHatching.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('list')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
            activeTab === 'list'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Delivery Records Archive ({safeDeliveries.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
            activeTab === 'analytics'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Settability & Transit Analytics</span>
        </button>

        {selectedDelivery && (
          <button
            onClick={() => setActiveTab('document')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
              activeTab === 'document'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>ESRRR Voucher #{selectedDelivery.esrrrNumber}</span>
          </button>
        )}
      </div>

      {/* Tab 0: Hatching Summary Dashboard */}
      {activeTab === 'hatching' && (
        <HatchingSummaryTab />
      )}

      {/* Tab 1: Delivery Records Table */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          
          {/* Filter / Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search ESRRR control no., hatchery, plate no, or date..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Status:</span>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              >
                <option value="All">All Statuses</option>
                <option value="Completed">Completed</option>
                <option value="Received">Received</option>
                <option value="Regraded">Regraded</option>
                <option value="Dispatched">Dispatched</option>
                <option value="Draft">Draft</option>
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <th className="px-4 py-3.5">ESRRR / Control No.</th>
                    <th className="px-4 py-3.5">Production Date</th>
                    <th className="px-4 py-3.5">Receiving Hatchery</th>
                    <th className="px-4 py-3.5 text-right">HE Delivered</th>
                    <th className="px-4 py-3.5 text-right">NHE Delivered</th>
                    <th className="px-4 py-3.5 text-right">Settable Eggs</th>
                    <th className="px-4 py-3.5 text-right">Settability %</th>
                    <th className="px-4 py-3.5 text-center">Containers</th>
                    <th className="px-4 py-3.5 text-center">Status</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredDeliveries.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-12 text-center text-slate-500">
                        <div className="max-w-xs mx-auto space-y-2">
                          <Truck className="w-8 h-8 mx-auto text-slate-300" />
                          <p className="font-bold text-slate-700">No delivery records found</p>
                          <p className="text-[11px] text-slate-400">Click &quot;New ESRRR Voucher&quot; to create the first delivery batch or adjust search filters.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredDeliveries.map((del) => {
                      const settablePct = del.totalNetHeReceived > 0
                        ? ((del.totalSettableEggs / del.totalNetHeReceived) * 100).toFixed(2)
                        : '0.00';

                      return (
                        <tr 
                          key={del.id}
                          className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                          onClick={() => {
                            setSelectedDelivery(del);
                            setActiveTab('document');
                          }}
                        >
                          {/* Control No */}
                          <td className="px-4 py-3 font-mono font-bold text-slate-900 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span>{del.esrrrNumber}</span>
                          </td>

                          {/* Production Date */}
                          <td className="px-4 py-3 font-medium text-slate-700">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>{del.productionDate}</span>
                            </div>
                          </td>

                          {/* Hatchery */}
                          <td className="px-4 py-3 text-slate-800 font-semibold">
                            <div className="flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-slate-400" />
                              <span>{del.hatcheryName}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono block">Plate: {del.plateNumber} &bull; {del.eggShellTemperature}°C</span>
                          </td>

                          {/* HE */}
                          <td className="px-4 py-3 text-right font-mono font-bold text-emerald-900">
                            {del.totalHeDelivered.toLocaleString()}
                          </td>

                          {/* NHE */}
                          <td className="px-4 py-3 text-right font-mono text-amber-900">
                            {del.totalNheDelivered.toLocaleString()}
                          </td>

                          {/* Settable */}
                          <td className="px-4 py-3 text-right font-mono font-black text-slate-900 bg-emerald-50/40">
                            {del.totalSettableEggs.toLocaleString()}
                          </td>

                          {/* Settability Rate */}
                          <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">
                            {settablePct}%
                          </td>

                          {/* Containers */}
                          <td 
                            className="px-4 py-3 text-center text-[11px] text-slate-600 font-mono"
                            title={`Crates: ${del.cratesGreen} Green, ${del.cratesRed} Red | Trays: ${del.traysOrange} Orange, ${del.traysYellow} Yellow${del.traysGreen ? `, ${del.traysGreen} Green` : ''}${del.traysRed ? `, ${del.traysRed} Red` : ''}`}
                          >
                            <div className="font-semibold text-slate-800">{del.totalCrates} Crates</div>
                            <div className="text-[10px] text-slate-500 font-medium">{del.totalTrays} Trays</div>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                              del.status === 'Completed' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                              del.status === 'Received' ? 'bg-sky-100 text-sky-800 border border-sky-200' :
                              del.status === 'Regraded' ? 'bg-teal-100 text-teal-800 border border-teal-200' :
                              del.status === 'Dispatched' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                              'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}>
                              {del.status}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenViewDocument(del)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                                title="View Printable Voucher"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => handleOpenEditModal(del)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition cursor-pointer"
                                title="Edit ESRRR Record"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => handleDeleteDelivery(del.id, del.esrrrNumber)}
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
        </div>
      )}

      {/* Tab 2: Analytics & Trends */}
      {activeTab === 'analytics' && (
        <DeliveryAnalytics deliveries={safeDeliveries} />
      )}

      {/* Tab 3: Detailed Document Viewer */}
      {activeTab === 'document' && selectedDelivery && (
        <DeliveryPrintDocument 
          delivery={selectedDelivery} 
          onClose={() => setActiveTab('list')}
        />
      )}

      {/* Pop-up Detail Modal if opened via action button */}
      {isDetailModalOpen && selectedDelivery && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
          <div className="w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <DeliveryPrintDocument
              delivery={selectedDelivery}
              onClose={() => setIsDetailModalOpen(false)}
            />
          </div>
        </div>
      )}

      {/* ESRRR Form Modal (Create / Edit) */}
      <DeliveryFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        initialData={editingDelivery}
        onSaved={(saved) => {
          setSelectedDelivery(saved);
        }}
      />

      {/* Hatching Summary Form Modal (Create / Edit) */}
      <HatchingSummaryFormModal
        isOpen={isHatchingFormModalOpen}
        onClose={() => setIsHatchingFormModalOpen(false)}
      />

    </div>
  );
};
