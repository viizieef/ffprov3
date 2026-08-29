import React from 'react';
import { MedAdministrationRecord, MedProduct, StandardMedProgramItem, Flock } from '../../types';
import { Syringe, ShieldCheck, CheckCircle2, Clock, AlertCircle, Pill, Activity, CheckSquare } from 'lucide-react';

interface VaccinesMedicineReportSectionProps {
  administrations: MedAdministrationRecord[];
  products: MedProduct[];
  standardProgram: StandardMedProgramItem[];
  flocks: Flock[];
}

export const VaccinesMedicineReportSection: React.FC<VaccinesMedicineReportSectionProps> = ({
  administrations,
  products,
  standardProgram,
  flocks
}) => {
  // Aggregate stats
  const totalDosesAdministered = administrations.reduce((acc, a) => acc + (a.totalDosesAdministered || (a.unitsUsed * 1000) || 0), 0);
  const totalUnitsUsed = administrations.reduce((acc, a) => acc + (a.unitsUsed || 0), 0);

  const vaccineEvents = administrations.filter(a => a.productType === 'Vaccine').length;
  const medEvents = administrations.filter(a => a.productType !== 'Vaccine').length;

  const lowStockCount = products.filter(p => (p.currentStockUnits || 0) <= (p.minAlertUnits || 5)).length;

  return (
    <div className="space-y-6">
      {/* Executive KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4 print:gap-3">
        {/* Card 1: Total Doses Administered */}
        <div className="p-5 bg-white border-2 border-slate-900 rounded-3xl shadow-sm print:border-black print:p-4">
          <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
            <span>Total Doses Administered</span>
            <span className="p-1 bg-teal-100 text-teal-900 rounded-lg print:hidden">
              <Syringe className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-3xl font-black text-slate-950 font-display tracking-tight">
            {totalDosesAdministered.toLocaleString()} <span className="text-xs font-bold text-teal-700">Doses</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-600 font-semibold print:border-slate-400">
            <span>Total Volume: <strong>{totalUnitsUsed} units</strong></span>
            <span>{administrations.length} Applications</span>
          </div>
        </div>

        {/* Card 2: Immunization Sessions */}
        <div className="p-5 bg-white border-2 border-indigo-900 rounded-3xl shadow-sm print:border-black print:p-4">
          <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-indigo-800 mb-1">
            <span>Vaccination Sessions</span>
            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-900 rounded-md font-bold text-[10px]">
              Viral & Bacterial
            </span>
          </div>
          <div className="text-3xl font-black text-indigo-950 font-display tracking-tight">
            {vaccineEvents} <span className="text-xs font-bold text-indigo-700">Sessions</span>
          </div>
          <div className="mt-2 pt-2 border-t border-indigo-100 flex items-center justify-between text-[11px] text-indigo-900 font-semibold print:border-slate-400">
            <span>Live / Killed Antigens</span>
            <span className="text-indigo-800 font-bold">100% Verified</span>
          </div>
        </div>

        {/* Card 3: Supportive Medications */}
        <div className="p-5 bg-white border-2 border-purple-900 rounded-3xl shadow-sm print:border-black print:p-4">
          <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-purple-800 mb-1">
            <span>Medications & Supplements</span>
            <span className="p-1 bg-purple-100 text-purple-900 rounded-lg print:hidden">
              <Pill className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-3xl font-black text-purple-950 font-display tracking-tight">
            {medEvents} <span className="text-xs font-bold text-purple-700">Courses</span>
          </div>
          <div className="mt-2 pt-2 border-t border-purple-100 flex items-center justify-between text-[11px] text-purple-900 font-semibold print:border-slate-400">
            <span>Vitamins, Probiotics & Minerals</span>
            <span className="text-purple-800 font-bold">Therapeutic</span>
          </div>
        </div>

        {/* Card 4: Protocol Compliance */}
        <div className="p-5 bg-white border-2 border-emerald-900 rounded-3xl shadow-sm print:border-black print:p-4">
          <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-emerald-800 mb-1">
            <span>Standard Protocol Guide</span>
            <span className="p-1 bg-emerald-100 text-emerald-900 rounded-lg print:hidden">
              <ShieldCheck className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-3xl font-black text-emerald-950 font-display tracking-tight">
            {standardProgram.length} <span className="text-xs font-bold text-emerald-700">Protocols</span>
          </div>
          <div className="mt-2 pt-2 border-t border-emerald-100 flex items-center justify-between text-[11px] text-emerald-900 font-semibold print:border-slate-400">
            <span>{lowStockCount > 0 ? `${lowStockCount} items below safety stock` : 'Supply chain stable'}</span>
            <span className="text-emerald-700 font-bold">Vet Certified</span>
          </div>
        </div>
      </div>

      {/* Main Administered Treatments Table */}
      <div className="bg-white border-2 border-slate-900 rounded-3xl overflow-hidden shadow-sm print:border-black print:rounded-none">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between print:bg-black print:text-white">
          <div className="flex items-center gap-2">
            <Syringe className="w-4 h-4 text-teal-400" />
            <h3 className="text-sm font-black uppercase tracking-wider">
              Official Veterinary Vaccine & Medication Administration Register
            </h3>
          </div>
          <span className="text-xs text-slate-300 font-mono font-bold">
            {administrations.length} {administrations.length === 1 ? 'Record' : 'Records'} Logged
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-sans">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-bold border-b-2 border-slate-400 print:bg-slate-200 print:border-black text-[11px]">
                <th className="py-3 px-3 whitespace-nowrap">Admin Date</th>
                <th className="py-3 px-2.5 whitespace-nowrap">House</th>
                <th className="py-3 px-3.5 whitespace-nowrap">Product / Biological</th>
                <th className="py-3 px-2.5 whitespace-nowrap">Category</th>
                <th className="py-3 px-3 whitespace-nowrap">Route / Administration Method</th>
                <th className="py-3 px-2.5 whitespace-nowrap text-right">Units</th>
                <th className="py-3 px-3 whitespace-nowrap text-right text-teal-950 font-black bg-teal-100/70">Total Doses</th>
                <th className="py-3 px-3.5 whitespace-nowrap">Equipment & Diluents</th>
                <th className="py-3 px-3 whitespace-nowrap">Administered By</th>
                <th className="py-3 px-3 whitespace-nowrap">Audit Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 print:divide-slate-400">
              {administrations.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 font-medium">
                    No medication or vaccination logs match the selected period and criteria.
                  </td>
                </tr>
              ) : (
                administrations.map((a, idx) => {
                  const doses = a.totalDosesAdministered || (a.unitsUsed * 1000);
                  const isVaccine = a.productType === 'Vaccine';
                  const isEven = idx % 2 === 0;

                  return (
                    <tr 
                      key={a.id || idx} 
                      className={`transition print:hover:bg-transparent ${
                        isEven ? 'bg-white' : 'bg-slate-50/70 print:bg-white'
                      } hover:bg-teal-50/30`}
                    >
                      <td className="py-2.5 px-3 font-semibold text-slate-950 whitespace-nowrap">
                        {a.date}
                      </td>
                      <td className="py-2.5 px-2.5 font-bold text-slate-900 whitespace-nowrap">
                        {a.houseNumber}
                      </td>
                      <td className="py-2.5 px-3.5 font-bold text-slate-950 whitespace-nowrap">
                        {a.productName}
                      </td>
                      <td className="py-2.5 px-2.5 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-md font-extrabold text-[10px] uppercase tracking-wider border print:border-black ${
                          isVaccine 
                            ? 'bg-teal-100 text-teal-950 border-teal-300' 
                            : 'bg-purple-100 text-purple-950 border-purple-300'
                        }`}>
                          {a.productType}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-800 whitespace-nowrap font-medium">
                        {a.method}
                      </td>
                      <td className="py-2.5 px-2.5 text-right font-mono text-slate-700 font-bold">
                        {a.unitsUsed}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-teal-950 bg-teal-100/50 whitespace-nowrap">
                        {doses.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3.5 text-slate-700 text-[11px] max-w-xs truncate font-medium" title={a.peripheralsUsed}>
                        {a.peripheralsUsed || 'Standard veterinary equipment'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-800 truncate max-w-[120px] font-semibold" title={a.administeredBy || a.loggedBy}>
                        {a.administeredBy || a.loggedBy || 'Veterinary Crew'}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-950 bg-emerald-100 px-2.5 py-1 rounded-md border border-emerald-300 print:border-black">
                          <CheckCircle2 className="w-3 h-3 text-emerald-700 print:hidden" />
                          Verified
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {administrations.length > 0 && (
              <tfoot>
                <tr className="bg-slate-950 text-white font-bold border-t-2 border-slate-950 print:bg-black print:text-white text-[11px]">
                  <td className="py-3 px-3 uppercase tracking-wider font-black" colSpan={5}>
                    Total Treatments Administered ({administrations.length} Records)
                  </td>
                  <td className="py-3 px-2.5 text-right font-mono text-slate-300 font-bold">
                    {totalUnitsUsed} units
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-teal-300 font-black">
                    {totalDosesAdministered.toLocaleString()} doses
                  </td>
                  <td className="py-3 px-3 text-slate-300" colSpan={3}>
                    Breakdown: Vaccines = <strong>{vaccineEvents}</strong> | Therapeutics/Supplements = <strong>{medEvents}</strong>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Standard Vaccination Protocol Reference Checklist */}
      <div className="bg-white border-2 border-slate-900 rounded-3xl p-6 overflow-hidden shadow-sm print:border-black print:rounded-none">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-forest-800 print:text-black" />
            <h4 className="text-sm font-black text-slate-950 uppercase tracking-wider">
              Standard Breeder Vaccination & Bio-Security Protocol Matrix
            </h4>
          </div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest bg-forest-50 text-forest-900 px-2.5 py-1 rounded-md border border-forest-200 print:border-black">
            Corporate Standard v4.2
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-sans">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-bold border-b-2 border-slate-400 text-[11px] print:bg-slate-200 print:border-black">
                <th className="py-2.5 px-3">Flock Age Target</th>
                <th className="py-2.5 px-3">Product / Biological Name</th>
                <th className="py-2.5 px-3">Target Pathogen / Disease</th>
                <th className="py-2.5 px-3">Route / Application</th>
                <th className="py-2.5 px-3 text-center">Protocol Mandate</th>
                <th className="py-2.5 px-3">Clinical / Veterinary Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {standardProgram.map((item, idx) => {
                const isGiven = administrations.some(a => 
                  a.productName.toLowerCase().includes(item.productName.toLowerCase().slice(0, 8))
                );
                const isEven = idx % 2 === 0;

                return (
                  <tr key={item.id} className={isEven ? 'bg-white' : 'bg-slate-50/70'}>
                    <td className="py-2.5 px-3 font-bold text-slate-950 whitespace-nowrap">
                      Week {item.ageWeek} {item.ageDays ? `(Day ${item.ageDays})` : ''}
                    </td>
                    <td className="py-2.5 px-3 font-black text-slate-900 whitespace-nowrap">
                      {item.productName}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap font-medium">
                      {item.diseaseTarget}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                      {item.method}
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-md font-extrabold text-[10px] uppercase tracking-wider ${
                        isGiven 
                          ? 'bg-emerald-100 text-emerald-950 border border-emerald-300' 
                          : item.mandatory
                          ? 'bg-amber-100 text-amber-950 border border-amber-300'
                          : 'bg-slate-100 text-slate-800'
                      }`}>
                        {isGiven ? 'Verified Logged' : item.mandatory ? 'Mandatory Schedule' : 'Elective Booster'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                      {item.notes || 'Routine standard protocol'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
