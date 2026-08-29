import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import { MedProduct, ProductType } from '../../types';
import { 
  Syringe, 
  Plus, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  Package, 
  Clock, 
  Trash2, 
  Bell, 
  Pill, 
  ShieldCheck,
  Activity,
  FileSpreadsheet
} from 'lucide-react';
import { exportReportToExcel, ReportMetadata, SheetData } from '../../utils/reportExportUtils';
import { useToast } from '../common/ToastContainer';
import { HouseQuickBar } from '../common/HouseQuickBar';

export const MedicineVaccineView: React.FC = () => {
  const { 
    medProducts, 
    medAdministrations, 
    addMedProduct, 
    deleteMedProduct, 
    addMedAdministration, 
    deleteMedAdministration, 
    getUpcomingVaccineAlerts, 
    flocks, 
    farmProfile,
    currentUser,
    permissions 
  } = useFarm();

  const toast = useToast();
  const [selectedHouseFilter, setSelectedHouseFilter] = useState('All');
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Add Product Form State
  const [productName, setProductName] = useState('');
  const [productType, setProductType] = useState<ProductType>('Vaccine');
  const [currentStockUnits, setCurrentStockUnits] = useState<number>(10);
  const [manufacturer, setManufacturer] = useState('Boehringer Ingelheim / Zoetis');
  const [dosage, setDosage] = useState('1 dose/bird via Eye Drop');
  const [expirationDate, setExpirationDate] = useState('2027-08-30');
  const [unitType, setUnitType] = useState<'Vial' | 'bottle' | 'bag' | 'box' | 'piece'>('Vial');
  const [dosesPerUnit, setDosesPerUnit] = useState<number>(1000);

  // Administration Schedule Form State
  const [adminHouse, setAdminHouse] = useState('House 1');
  const [adminProductId, setAdminProductId] = useState('');
  const [adminDate, setAdminDate] = useState(new Date().toISOString().split('T')[0]);
  const [adminUnitsUsed, setAdminUnitsUsed] = useState<number>(10);
  const [adminMethod, setAdminMethod] = useState('Drinking Water');
  const [adminNotes, setAdminNotes] = useState('Scheduled booster administration');
  const [adminPeripherals, setAdminPeripherals] = useState('Automatic vaccinator, sterile needles, dye');

  const upcomingAlerts = getUpcomingVaccineAlerts();

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) return;

    addMedProduct({
      name: productName.trim(),
      type: productType,
      manufacturer: manufacturer.trim(),
      manufacturingDate: new Date().toISOString().split('T')[0],
      expirationDate,
      unitType,
      dosesPerUnit: Number(dosesPerUnit),
      currentStockUnits: Number(currentStockUnits),
      currentStock: Number(currentStockUnits),
      dosage: dosage.trim(),
      packaging: `${dosesPerUnit} doses / ${unitType}`
    });

    setShowAddProductModal(false);
    toast.success('Product Added', `${productName.trim()} registered to biological pharmacy.`);
    setProductName('');
  };

  const handleScheduleAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = medProducts.find(p => p.id === adminProductId) || medProducts[0];
    if (!prod) return;

    const totalDoses = Number(adminUnitsUsed) * (prod.dosesPerUnit || 1000);

    addMedAdministration({
      houseNumber: adminHouse,
      productId: prod.id,
      productName: prod.name,
      productType: prod.type,
      date: adminDate,
      method: adminMethod,
      unitsUsed: Number(adminUnitsUsed),
      totalDosesAdministered: totalDoses,
      peripheralsUsed: adminPeripherals,
      notes: adminNotes,
      status: 'completed'
    });

    toast.success(
      `Immunization Logged (${adminHouse})`,
      `${prod.name} • ${totalDoses.toLocaleString()} doses via ${adminMethod}`
    );

    setShowScheduleModal(false);
    setAdminNotes('');
  };

  const handleExportMedExcel = () => {
    const medData = medAdministrations.map(a => ({
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

    const totalUnits = medAdministrations.reduce((acc, a) => acc + (a.unitsUsed || 0), 0);
    const totalDoses = medAdministrations.reduce((acc, a) => acc + (a.totalDosesAdministered || (a.unitsUsed * 1000) || 0), 0);

    const meta: ReportMetadata = {
      companyName: farmProfile.name || 'L.P. LIM CITY FAMILY FARM INC',
      logoUrl: farmProfile.logoUrl,
      address: farmProfile.address,
      contactNumber: farmProfile.contactNumber,
      email: farmProfile.email,
      reportTitle: `Breeder Vaccination & Medication Health Record`,
      dateRange: `All Recorded Treatments`,
      houseFilter: 'All Houses',
      generatedBy: currentUser?.fullName || 'Authorized Staff',
      generatedAt: new Date().toLocaleString()
    };

    const sheet: SheetData = {
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
        houseNumber: `${medAdministrations.length} events`,
        unitsUsed: totalUnits,
        totalDoses: totalDoses
      }
    };

    exportReportToExcel(meta, [sheet], `${farmProfile.name ? farmProfile.name.replace(/[^a-zA-Z0-9]/g, '_') : 'Farm'}_Vaccine_Medicine_Report.xlsx`);
    toast.success('Excel Generated', 'Downloaded official vaccination and medication report');
  };

  const filteredAdministrations = medAdministrations.filter(a => {
    if (selectedHouseFilter !== 'All' && a.houseNumber !== selectedHouseFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-teal-700 text-xs font-bold uppercase tracking-wider mb-1">
            <Syringe className="w-4 h-4" />
            <span>Biosecurity & Veterinary Health</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Medicine & Vaccine Program</h2>
          <p className="text-xs text-slate-500 mt-1">
            Standard flock vaccination timelines, biological inventories, and scheduled administration logs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="export-med-excel-btn"
            onClick={handleExportMedExcel}
            className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            title="Export Excel with Company Header & Logo"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Excel</span>
          </button>

          {permissions.canManageMedicines && (
            <>
              <button
                id="add-med-product-btn"
                onClick={() => setShowAddProductModal(true)}
                className="px-4 py-2.5 bg-teal-950 hover:bg-teal-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-xs"
              >
                <Plus className="w-4 h-4 text-teal-400" />
                <span>Add New Health Item</span>
              </button>

              <button
                id="schedule-vaccine-btn"
                onClick={() => {
                  if (medProducts.length > 0) setAdminProductId(medProducts[0].id);
                  setShowScheduleModal(true);
                }}
                className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-xs"
              >
                <Calendar className="w-4 h-4" />
                <span>Log Administration</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Upcoming Vaccination & Health Alerts */}
      {upcomingAlerts.length > 0 && (
        <div className="bg-teal-50/60 border border-teal-200/80 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-teal-950 font-bold text-sm">
              <Bell className="w-4 h-4 text-teal-600 animate-bounce" />
              <span>Standard Vaccination Protocol Alerts</span>
            </div>
            <span className="text-xs font-bold bg-teal-200/80 text-teal-950 px-2.5 py-0.5 rounded-full">
              {upcomingAlerts.length} Active Immunizations
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {upcomingAlerts.map(alert => (
              <div
                key={alert.id}
                className="bg-white p-3.5 rounded-xl border border-teal-200/80 shadow-2xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-lg bg-teal-600 text-white font-bold text-xs">
                    {alert.houseNumber}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    alert.urgency === 'due_now' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {alert.urgency === 'due_now' ? 'DUE THIS WEEK' : 'UPCOMING'}
                  </span>
                </div>
                <h4 className="font-bold text-xs text-slate-900">{alert.productName}</h4>
                <p className="text-[11px] text-slate-600">Target: {alert.diseaseTarget} • Method: {alert.method}</p>
                <div className="pt-1 flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-100">
                  <span>Scheduled Wk: <strong>{alert.scheduledWeek}</strong></span>
                  <span>Flock Age: <strong>Wk {alert.flockAgeWeeks}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Biological & Medicine Inventory Cards */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Veterinary Products & Biologicals Inventory</h3>
            <p className="text-xs text-slate-500">Vaccines, antibiotics, vitamins, disinfectants, and application paraphernalias</p>
          </div>
          <span className="text-xs text-slate-500 font-medium">{medProducts.length} items registered</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {medProducts.map(prod => (
            <div
              key={prod.id}
              className="p-4 bg-slate-50 hover:bg-slate-100/70 border border-slate-200/80 rounded-2xl transition space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                  prod.type === 'Vaccine'
                    ? 'bg-teal-100 text-teal-900'
                    : prod.type === 'Antibiotic'
                    ? 'bg-rose-100 text-rose-900'
                    : prod.type === 'Supplement' || prod.type === 'Vitamins'
                    ? 'bg-emerald-100 text-emerald-900'
                    : 'bg-amber-100 text-amber-900'
                }`}>
                  {prod.type}
                </span>

                {permissions.canManageMedicines && (
                  <button
                    onClick={() => deleteMedProduct(prod.id)}
                    className="text-slate-400 hover:text-rose-600 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div>
                <h4 className="font-bold text-sm text-slate-900">{prod.name}</h4>
                <p className="text-xs text-slate-500 mt-0.5">Mfr: {prod.manufacturer}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] text-slate-400 block font-medium">Current Stock</span>
                  <span className="font-bold text-slate-900">
                    {prod.currentStockUnits || prod.currentStock || 0} {prod.unitType}s
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] text-slate-400 block font-medium">Doses / Unit</span>
                  <span className="font-bold text-teal-800">{prod.dosesPerUnit.toLocaleString()}</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200 flex justify-between">
                <span>Exp: {prod.expirationDate}</span>
                <span className="font-medium text-slate-700">{prod.dosage || 'Standard'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Administration History Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Administration & Immunization History</h3>
            <p className="text-xs text-slate-500">Record of all vaccines and supplements given to flocks</p>
          </div>
          <span className="text-xs text-slate-500 font-medium">{filteredAdministrations.length} of {medAdministrations.length} records</span>
        </div>

        <HouseQuickBar
          selectedHouse={selectedHouseFilter}
          onSelectHouse={setSelectedHouseFilter}
          showAllOption={true}
        />

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">House #</th>
                <th className="py-2.5 px-3">Product Name</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Method</th>
                <th className="py-2.5 px-3">Units & Total Doses</th>
                <th className="py-2.5 px-3">Peripherals / Tools</th>
                <th className="py-2.5 px-3">Logged By</th>
                {permissions.canDeleteRecord && <th className="py-2.5 px-3 text-right">Del</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAdministrations.map(admin => (
                <tr key={admin.id} className="hover:bg-slate-50 transition">
                  <td className="py-2.5 px-3 font-medium text-slate-700">{admin.date}</td>
                  <td className="py-2.5 px-3 font-bold text-slate-900">{admin.houseNumber}</td>
                  <td className="py-2.5 px-3 font-bold text-teal-950">{admin.productName}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                      {admin.productType}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-700">{admin.method}</td>
                  <td className="py-2.5 px-3 font-bold text-slate-900">
                    {admin.unitsUsed} units ({admin.totalDosesAdministered.toLocaleString()} doses)
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 max-w-xs truncate">{admin.peripheralsUsed || 'Standard equipment'}</td>
                  <td className="py-2.5 px-3 text-slate-500">{admin.loggedBy}</td>
                  {permissions.canDeleteRecord && (
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => deleteMedAdministration(admin.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
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
      </div>

      {/* Modal 1: Add Health Product */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="bg-teal-950 p-5 text-white flex items-center justify-between border-b border-teal-900/50">
              <div>
                <h3 className="font-bold text-base text-white">Add Biological / Medicine Item</h3>
                <p className="text-xs text-teal-300/80">Register new medical stock to farm inventory</p>
              </div>
              <button onClick={() => setShowAddProductModal(false)} className="text-teal-400 hover:text-white p-1 rounded-lg">
                &times;
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="p-6 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Product Trade Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Newcastle B1 + Bronchitis Mass"
                  value={productName}
                  onChange={e => setProductName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-hidden focus:outline-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category *</label>
                  <select
                    value={productType}
                    onChange={e => setProductType(e.target.value as ProductType)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white outline-hidden focus:outline-teal-500"
                  >
                    <option value="Vaccine">Vaccine</option>
                    <option value="Medicine">Medicine</option>
                    <option value="Antibiotic">Antibiotic</option>
                    <option value="Supplement">Supplement</option>
                    <option value="Vitamins">Vitamins</option>
                    <option value="Disinfectant">Disinfectant</option>
                    <option value="paraphernalias">Paraphernalias</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Packaging Unit *</label>
                  <select
                    value={unitType}
                    onChange={e => setUnitType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white outline-hidden focus:outline-teal-500"
                  >
                    <option value="Vial">Vial</option>
                    <option value="bottle">Bottle</option>
                    <option value="bag">Bag</option>
                    <option value="box">Box</option>
                    <option value="piece">Piece</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Doses per Unit *</label>
                  <input
                    type="number"
                    value={dosesPerUnit}
                    onChange={e => setDosesPerUnit(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-hidden focus:outline-teal-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Initial Stock Units *</label>
                  <input
                    type="number"
                    value={currentStockUnits}
                    onChange={e => setCurrentStockUnits(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-hidden focus:outline-teal-500 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Manufacturer</label>
                  <input
                    type="text"
                    value={manufacturer}
                    onChange={e => setManufacturer(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-hidden focus:outline-teal-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={expirationDate}
                    onChange={e => setExpirationDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-hidden focus:outline-teal-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Schedule & Log Administration */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="bg-teal-950 p-5 text-white flex items-center justify-between border-b border-teal-900/50">
              <div>
                <h3 className="font-bold text-base text-white">Log Medication / Vaccination</h3>
                <p className="text-xs text-teal-300/80">Record dosage and method for flock</p>
              </div>
              <button onClick={() => setShowScheduleModal(false)} className="text-teal-400 hover:text-white p-1 rounded-lg">
                &times;
              </button>
            </div>

            <form onSubmit={handleScheduleAdmin} className="p-6 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">House Number *</label>
                  <select
                    value={adminHouse}
                    onChange={e => setAdminHouse(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white outline-hidden focus:outline-teal-500"
                  >
                    {flocks.map(f => (
                      <option key={f.id} value={f.houseNumber}>{f.houseNumber}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={adminDate}
                    onChange={e => setAdminDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-hidden focus:outline-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Product Name *</label>
                <select
                  value={adminProductId}
                  onChange={e => setAdminProductId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white outline-hidden font-medium focus:outline-teal-500"
                >
                  {medProducts.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.currentStockUnits || p.currentStock || 0} in stock)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Units Consumed *</label>
                  <input
                    type="number"
                    min="1"
                    value={adminUnitsUsed}
                    onChange={e => setAdminUnitsUsed(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-hidden font-bold focus:outline-teal-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Application Method *</label>
                  <select
                    value={adminMethod}
                    onChange={e => setAdminMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white outline-hidden focus:outline-teal-500"
                  >
                    <option value="Drinking Water">Drinking Water</option>
                    <option value="Eye Drop">Eye Drop</option>
                    <option value="Wing Web">Wing Web</option>
                    <option value="Spray">Spray</option>
                    <option value="Subcutaneous Injection">Subcutaneous Injection</option>
                    <option value="Intramuscular Injection">Intramuscular Injection</option>
                    <option value="Feed Mix">Feed Mix</option>
                    <option value="Disinfection Spray">Disinfection Spray</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Equipment / Peripherals</label>
                <input
                  type="text"
                  value={adminPeripherals}
                  onChange={e => setAdminPeripherals(e.target.value)}
                  placeholder="e.g. Automatic vaccinator, 0.5ml needles, dye"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-hidden focus:outline-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes / Observations</label>
                <textarea
                  rows={2}
                  value={adminNotes}
                  onChange={e => setAdminNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-hidden resize-none focus:outline-teal-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                >
                  Record Administration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
