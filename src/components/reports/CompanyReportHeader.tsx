import React from 'react';
import { useFarm } from '../../context/FarmContext';
import { Building2, Calendar, MapPin, Phone, Mail, FileText, ShieldCheck, Award, CheckCircle2, QrCode } from 'lucide-react';

interface CompanyReportHeaderProps {
  title: string;
  subtitle?: string;
  dateRangeText: string;
  houseFilterText?: string;
  categoryFilterText?: string;
  reportCode?: string;
}

export const CompanyReportHeader: React.FC<CompanyReportHeaderProps> = ({
  title,
  subtitle,
  dateRangeText,
  houseFilterText = 'All Houses (Farm-wide)',
  categoryFilterText,
  reportCode
}) => {
  const { farmProfile, currentUser } = useFarm();

  const generatedDateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const docCode = reportCode || `RPT-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

  return (
    <div className="bg-white border-2 border-slate-900 rounded-3xl p-6 sm:p-8 shadow-md print:border-2 print:border-black print:shadow-none print:p-6 print:m-0 mb-6 relative overflow-hidden">
      {/* Background Watermark Pattern for Authentic Corporate Paper Feel */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-forest-50/50 pointer-events-none print:hidden" />
      <div className="absolute top-2 right-4 text-[9px] font-mono text-slate-400 uppercase tracking-widest print:block">
        DOC REF: {docCode} &bull; OFFICIAL BREEDER RECORD
      </div>

      {/* Top Header Section: Farm Crest/Logo + Legal Farm Details */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b-2 border-slate-900 print:border-b-2 print:border-black">
        <div className="flex items-center gap-5">
          {/* Logo / Official Seal */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-white flex items-center justify-center shrink-0 border-2 border-slate-900 shadow-sm p-1.5 print:border-black">
            {farmProfile.logoUrl ? (
              <img
                src={farmProfile.logoUrl}
                alt={farmProfile.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain"
                crossOrigin="anonymous"
              />
            ) : (
              <div className="w-full h-full rounded-xl bg-forest-950 flex flex-col items-center justify-center text-mint-300 font-display">
                <Building2 className="w-8 h-8 text-mint-400 mb-0.5" />
                <span className="text-[9px] font-black uppercase tracking-wider">LP LIM</span>
              </div>
            )}
          </div>

          {/* Farm Legal Identity */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-extrabold text-white uppercase tracking-widest bg-forest-950 px-2.5 py-0.5 rounded-md print:bg-black print:text-white inline-flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-mint-400" />
                OFFICIAL POULTRY BREEDER RECORD
              </span>
              <span className="text-[10px] font-bold text-forest-800 uppercase tracking-wider bg-forest-50 px-2 py-0.5 rounded-md border border-forest-200 print:border-slate-400 print:text-black">
                GAP & ISO COMPLIANT
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight font-display uppercase print:text-2xl">
              {farmProfile.name || 'L.P. LIM CITY FAMILY FARM INC.'}
            </h1>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 font-medium print:text-slate-800">
              {farmProfile.address && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  {farmProfile.address}
                </span>
              )}
              {farmProfile.contactNumber && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  {farmProfile.contactNumber}
                </span>
              )}
              {farmProfile.email && (
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  {farmProfile.email}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Corporate Document Metadata Block */}
        <div className="bg-slate-50 border-2 border-slate-300 rounded-2xl p-4 text-xs space-y-1.5 min-w-[260px] w-full md:w-auto print:bg-white print:border-black print:p-3">
          <div className="flex items-center justify-between gap-4 text-slate-600 font-semibold text-[11px] pb-1 border-b border-slate-200 print:border-black">
            <span>Tracking Code:</span>
            <span className="font-mono text-slate-950 font-black">{docCode}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-600 font-medium">Generation Date:</span>
            <span className="font-bold text-slate-950">{generatedDateStr}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-600 font-medium">Prepared By:</span>
            <span className="font-bold text-slate-950">{currentUser?.fullName || 'Authorized Staff'}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-600 font-medium">Operating System:</span>
            <span className="font-bold text-forest-900 print:text-black">FarmFlow Pro Broiler-Breeder OS</span>
          </div>
        </div>
      </div>

      {/* Report Title & Active Parameters Banner */}
      <div className="pt-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-forest-900 text-mint-300 rounded-lg print:hidden">
              <FileText className="w-4 h-4" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight uppercase">
              {title}
            </h2>
          </div>
          {subtitle && (
            <p className="text-xs font-semibold text-slate-600 mt-1 max-w-2xl">
              {subtitle}
            </p>
          )}
        </div>

        {/* Operational Filter Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs shrink-0">
          <div className="px-3.5 py-1.5 bg-slate-100 border border-slate-300 rounded-xl text-slate-900 font-bold flex items-center gap-1.5 print:border-black">
            <Calendar className="w-3.5 h-3.5 text-forest-800 print:text-black" />
            <span>Period: <strong>{dateRangeText}</strong></span>
          </div>
          <div className="px-3.5 py-1.5 bg-slate-100 border border-slate-300 rounded-xl text-slate-900 font-bold print:border-black">
            <span>House Scope: <strong>{houseFilterText}</strong></span>
          </div>
          {categoryFilterText && (
            <div className="px-3.5 py-1.5 bg-forest-50 border border-forest-300 rounded-xl text-forest-900 font-bold print:border-black print:bg-transparent">
              <span>Filter: <strong>{categoryFilterText}</strong></span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const CompanyReportSignatures: React.FC = () => {
  const { farmProfile, currentUser } = useFarm();

  const formattedDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const animalHealthSpecialistName = farmProfile.animalHealthSpecialist || 'Dr. Roberto M. Santos, DVM';
  const executiveLeaderName = farmProfile.presidentCeo || farmProfile.farmOwners || 'Von L.P. Lim';

  return (
    <div className="mt-10 pt-8 border-t-2 border-slate-900 print:border-t-2 print:border-black print:mt-8 page-break-inside-avoid">
      <div className="mb-4">
        <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest text-center">
          OFFICIAL VERIFICATION, AUDIT & APPROVAL SIGN-OFF
        </h4>
        <p className="text-[10px] text-slate-500 text-center font-medium">
          By signing below, the undersigned verify that all recorded egg counts, mortality tallies, feed metrics, and veterinary treatments have been inspected and confirmed accurate according to corporate bio-security standards.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 text-center text-xs mt-6">
        {/* Signer 1: Prepared by */}
        <div className="bg-slate-50 border border-slate-300 rounded-2xl p-4 space-y-4 print:bg-white print:border-black">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Step 1: Data Entry & Formulation
          </div>
          <div className="h-12 flex flex-col justify-end items-center">
            <span className="font-bold text-sm text-slate-950">{currentUser?.fullName || 'Field Technician / Leadman'}</span>
            <span className="text-[10px] text-slate-500">{currentUser?.role || 'Leadman / Flockman'}</span>
          </div>
          <div className="border-t border-slate-400 pt-2 flex justify-between text-[10px] text-slate-600">
            <span className="font-bold uppercase text-slate-900">Prepared By</span>
            <span>Date: <strong>{formattedDate}</strong></span>
          </div>
        </div>

        {/* Signer 2: Verified by Animal Health Specialist / QA */}
        <div className="bg-slate-50 border border-slate-300 rounded-2xl p-4 space-y-4 print:bg-white print:border-black">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Step 2: Technical & Health Audit
          </div>
          <div className="h-12 flex flex-col justify-end items-center">
            <span className="font-serif italic text-slate-700 print:text-slate-800 text-xs font-bold">{animalHealthSpecialistName}</span>
            <span className="text-[10px] text-slate-500">Animal Health Specialist & QA Lead</span>
          </div>
          <div className="border-t border-slate-400 pt-2 flex justify-between text-[10px] text-slate-600">
            <span className="font-bold uppercase text-slate-900">Verified By</span>
            <span>Date: ________________</span>
          </div>
        </div>

        {/* Signer 3: Approved by President / CEO */}
        <div className="bg-slate-50 border border-slate-300 rounded-2xl p-4 space-y-4 print:bg-white print:border-black">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Step 3: Executive Approval
          </div>
          <div className="h-12 flex flex-col justify-end items-center">
            <span className="font-serif italic text-slate-700 print:text-slate-800 text-xs font-bold">{executiveLeaderName}</span>
            <span className="text-[10px] text-slate-500">President / CEO / Farm Operations</span>
          </div>
          <div className="border-t border-slate-400 pt-2 flex justify-between text-[10px] text-slate-600">
            <span className="font-bold uppercase text-slate-900">Approved By</span>
            <span>Date: ________________</span>
          </div>
        </div>
      </div>

      <div className="mt-8 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-500 print:border-slate-400 print:text-black">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 print:text-black" />
          <span>Proprietary & Confidential &bull; L.P. LIM CITY FAMILY FARM INC. &bull; All Rights Reserved</span>
        </div>
        <div className="font-mono">
          Page 1 of Document Dossier &bull; Printed from FarmFlow Pro
        </div>
      </div>
    </div>
  );
};

