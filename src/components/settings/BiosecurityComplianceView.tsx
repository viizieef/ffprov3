import React, { useState, useMemo } from 'react';
import { useFarm } from '../../context/FarmContext';
import { 
  BiosecurityCategory, 
  BiosecurityFrequency, 
  BiosecurityCriticalLevel, 
  BiosecurityStatus, 
  BiosecurityRequirement 
} from '../../types';
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  Filter, 
  Calendar, 
  Printer, 
  UserCheck, 
  FileCheck, 
  Droplets, 
  Car, 
  DoorClosed, 
  Bug, 
  Egg, 
  Layers, 
  Check, 
  X, 
  HelpCircle,
  Clock,
  Sparkles,
  ClipboardList,
  SlidersHorizontal,
  History,
  AlertOctagon
} from 'lucide-react';

const CATEGORY_META: Record<BiosecurityCategory, { label: string; icon: React.FC<{ className?: string }>; color: string; bg: string }> = {
  site_access: {
    label: 'Site Access & Gate Security',
    icon: Car,
    color: 'text-sky-700',
    bg: 'bg-sky-50 border-sky-200'
  },
  sanitation: {
    label: 'Disinfection & Sanitation',
    icon: Droplets,
    color: 'text-teal-700',
    bg: 'bg-teal-50 border-teal-200'
  },
  personal_hygiene: {
    label: 'Personal Hygiene & PPE',
    icon: DoorClosed,
    color: 'text-indigo-700',
    bg: 'bg-indigo-50 border-indigo-200'
  },
  egg_room: {
    label: 'Egg Room & Packing Facility',
    icon: Egg,
    color: 'text-amber-700',
    bg: 'bg-amber-50 border-amber-200'
  },
  water_safety: {
    label: 'Water Sanitization & Lines',
    icon: Droplets,
    color: 'text-cyan-700',
    bg: 'bg-cyan-50 border-cyan-200'
  },
  pest_control: {
    label: 'Pest & Wild Bird Control',
    icon: Bug,
    color: 'text-rose-700',
    bg: 'bg-rose-50 border-rose-200'
  }
};

const CRITICALITY_META: Record<BiosecurityCriticalLevel, { label: string; badgeClass: string }> = {
  mandatory: {
    label: 'Mandatory',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-200'
  },
  high: {
    label: 'High Priority',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200'
  },
  standard: {
    label: 'Standard',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200'
  }
};

export const BiosecurityComplianceView: React.FC = () => {
  const { 
    biosecurityRequirements, 
    biosecurityLogs, 
    biosecuritySummaries,
    addBiosecurityRequirement,
    updateBiosecurityRequirement,
    deleteBiosecurityRequirement,
    toggleBiosecurityRequirementActive,
    toggleBiosecurityLog,
    batchVerifyAllBiosecurity,
    signoffBiosecurityDaily,
    getBiosecurityDailyStats,
    permissions,
    currentUser
  } = useFarm();

  // Date selection (default today YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [activeSubTab, setActiveSubTab] = useState<'checklist' | 'protocols' | 'history'>('checklist');
  
  // Filtering & Search
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'pending' | 'pass' | 'fail'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Requirement Modal state (Add / Edit)
  const [showReqModal, setShowReqModal] = useState(false);
  const [editingReqId, setEditingReqId] = useState<string | null>(null);
  const [reqForm, setReqForm] = useState<{
    title: string;
    description: string;
    category: BiosecurityCategory;
    frequency: BiosecurityFrequency;
    targetArea: string;
    criticalLevel: BiosecurityCriticalLevel;
    active: boolean;
  }>({
    title: '',
    description: '',
    category: 'sanitation',
    frequency: 'daily',
    targetArea: '',
    criticalLevel: 'mandatory',
    active: true
  });

  // Note / Corrective Action Modal
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [activeReqForNote, setActiveReqForNote] = useState<BiosecurityRequirement | null>(null);
  const [noteText, setNoteText] = useState('');
  const [correctiveText, setCorrectiveText] = useState('');

  // Supervisor Sign-off Modal
  const [showSignoffModal, setShowSignoffModal] = useState(false);
  const [supervisorNotesInput, setSupervisorNotesInput] = useState('');

  // Stats for the selected date
  const dateStats = useMemo(() => {
    return getBiosecurityDailyStats(selectedDate);
  }, [getBiosecurityDailyStats, selectedDate, biosecurityLogs, biosecurityRequirements, biosecuritySummaries]);

  // Active requirements list
  const activeRequirements = useMemo(() => {
    return biosecurityRequirements.filter(r => r.active);
  }, [biosecurityRequirements]);

  // Filtered requirements for daily checklist
  const filteredChecklist = useMemo(() => {
    return biosecurityRequirements.filter(req => {
      // Must be active unless viewing all protocols
      if (!req.active && activeSubTab === 'checklist') return false;

      // Category filter
      if (categoryFilter !== 'all' && req.category !== categoryFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = req.title.toLowerCase().includes(q);
        const matchDesc = req.description.toLowerCase().includes(q);
        const matchArea = req.targetArea.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchArea) return false;
      }

      // Status filter in checklist mode
      if (activeSubTab === 'checklist' && statusFilter !== 'all') {
        const log = biosecurityLogs.find(l => l.requirementId === req.id && l.date === selectedDate);
        if (statusFilter === 'verified' && (!log || !log.verified)) return false;
        if (statusFilter === 'pending' && (log && log.verified)) return false;
        if (statusFilter === 'pass' && (!log || log.status !== 'pass')) return false;
        if (statusFilter === 'fail' && (!log || log.status !== 'fail')) return false;
      }

      return true;
    });
  }, [biosecurityRequirements, biosecurityLogs, selectedDate, categoryFilter, statusFilter, searchQuery, activeSubTab]);

  // Open modal to add requirement
  const handleOpenAddModal = () => {
    setEditingReqId(null);
    setReqForm({
      title: '',
      description: '',
      category: 'sanitation',
      frequency: 'daily',
      targetArea: 'House Airlocks / Farm Perimeter',
      criticalLevel: 'mandatory',
      active: true
    });
    setShowReqModal(true);
  };

  // Open modal to edit requirement
  const handleOpenEditModal = (req: BiosecurityRequirement) => {
    setEditingReqId(req.id);
    setReqForm({
      title: req.title,
      description: req.description,
      category: req.category,
      frequency: req.frequency,
      targetArea: req.targetArea,
      criticalLevel: req.criticalLevel,
      active: req.active
    });
    setShowReqModal(true);
  };

  // Save requirement
  const handleSaveRequirement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqForm.title.trim()) return;

    if (editingReqId) {
      updateBiosecurityRequirement(editingReqId, reqForm);
    } else {
      addBiosecurityRequirement(reqForm);
    }
    setShowReqModal(false);
  };

  // Open note modal
  const handleOpenNoteModal = (req: BiosecurityRequirement) => {
    setActiveReqForNote(req);
    const existingLog = biosecurityLogs.find(l => l.requirementId === req.id && l.date === selectedDate);
    setNoteText(existingLog?.notes || '');
    setCorrectiveText(existingLog?.correctiveAction || '');
    setShowNoteModal(true);
  };

  // Save note
  const handleSaveNote = () => {
    if (!activeReqForNote) return;
    const existingLog = biosecurityLogs.find(l => l.requirementId === activeReqForNote.id && l.date === selectedDate);
    const currentStatus = existingLog?.status || 'pass';
    toggleBiosecurityLog(activeReqForNote.id, selectedDate, currentStatus, noteText, correctiveText);
    setShowNoteModal(false);
  };

  // Handle supervisor sign-off submission
  const handleConfirmSignoff = () => {
    signoffBiosecurityDaily(selectedDate, supervisorNotesInput);
    setShowSignoffModal(false);
  };

  // Print function
  const handlePrintChecklist = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Date Selector */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 md:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-2xl bg-teal-950 text-emerald-400 shadow-xs inline-flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <div>
                <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                  Biosecurity Management
                </span>
                <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">
                  Biosecurity Compliance & Sanitation Standards
                </h2>
              </div>
            </div>
            <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
              Define mandatory site entry protocols, vehicle spray disinfection, personal shower & boot exchange gates, 
              and maintain daily audit logs with supervisor sign-off verification.
            </p>
          </div>

          {/* Date Selector & Primary Quick Actions */}
          <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
              <Calendar className="w-4 h-4 text-teal-700" />
              <label htmlFor="bio-date" className="text-[11px] font-bold text-slate-600 sr-only">Verification Date:</label>
              <input
                id="bio-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
              />
            </div>

            <button
              id="btn-quick-verify-all"
              onClick={() => batchVerifyAllBiosecurity(selectedDate, 'pass')}
              className="px-3.5 py-1.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-98"
              title="Mark all active requirements as passed for this date"
            >
              <Check className="w-3.5 h-3.5 text-emerald-300" />
              <span>Verify All Pass</span>
            </button>

            <button
              id="btn-print-biosecurity"
              onClick={handlePrintChecklist}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 transition flex items-center gap-1.5 cursor-pointer"
              title="Print Biosecurity Inspection Record"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Print Log</span>
            </button>
          </div>
        </div>

        {/* Scorecard Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100">
          {/* 1. Overall Score */}
          <div className="bg-gradient-to-br from-teal-950 to-emerald-950 text-white rounded-2xl p-4 flex items-center justify-between shadow-xs">
            <div>
              <p className="text-[11px] font-semibold text-teal-200 uppercase tracking-wider">Daily Compliance</p>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl font-black text-white">{dateStats.compliancePct}%</span>
                <span className="text-[11px] text-teal-300">Rating</span>
              </div>
              <p className="text-[10px] text-teal-300/80 mt-1">
                {dateStats.passed} of {dateStats.total} protocols passed
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-xs border border-white/10">
              <ShieldCheck className={`w-6 h-6 ${dateStats.compliancePct === 100 ? 'text-emerald-400' : dateStats.compliancePct >= 80 ? 'text-amber-400' : 'text-rose-400'}`} />
            </div>
          </div>

          {/* 2. Verification Progress */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Checked Items</p>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl font-black text-slate-900">{dateStats.verified}</span>
                <span className="text-xs font-bold text-slate-500">/ {dateStats.total}</span>
              </div>
              <div className="w-24 bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
                <div 
                  className="bg-teal-600 h-full rounded-full transition-all"
                  style={{ width: `${dateStats.total > 0 ? (dateStats.verified / dateStats.total) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-teal-100/60 flex items-center justify-center text-teal-800">
              <ClipboardList className="w-5 h-5" />
            </div>
          </div>

          {/* 3. Failures & Corrective Actions */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Deviations / Fails</p>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className={`text-2xl font-black ${dateStats.failed > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {dateStats.failed}
                </span>
                <span className="text-[11px] font-bold text-slate-500">
                  {dateStats.failed === 0 ? 'Zero Defects' : 'Action Required'}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                {dateStats.failed > 0 ? 'Requires immediate sanitation remedy' : 'All critical checkpoints clear'}
              </p>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${dateStats.failed > 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
              {dateStats.failed > 0 ? <AlertOctagon className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            </div>
          </div>

          {/* 4. Manager Sign-off Status */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Supervisor Stamp</p>
              {dateStats.isSignedOff ? (
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-full flex items-center gap-1 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" /> Signed
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-extrabold rounded-full flex items-center gap-1 border border-amber-200">
                  <Clock className="w-3 h-3" /> Pending
                </span>
              )}
            </div>
            
            <div className="mt-2">
              {dateStats.isSignedOff ? (
                <div>
                  <p className="text-xs font-bold text-slate-900 truncate">{dateStats.signedOffBy}</p>
                  <p className="text-[10px] text-slate-500">
                    {dateStats.signedOffAt ? new Date(dateStats.signedOffAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </p>
                </div>
              ) : (
                <button
                  id="btn-open-signoff-modal"
                  onClick={() => {
                    setSupervisorNotesInput(dateStats.supervisorNotes || `Daily biosecurity verified with ${dateStats.compliancePct}% compliance on ${selectedDate}.`);
                    setShowSignoffModal(true);
                  }}
                  className="w-full py-1.5 px-2.5 rounded-xl bg-teal-950 hover:bg-teal-900 text-white text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Sign-Off Today</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200/80">
          <button
            id="tab-daily-checklist"
            onClick={() => setActiveSubTab('checklist')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'checklist' 
                ? 'bg-teal-950 text-white shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5 text-emerald-400" />
            <span>Daily Checklist ({activeRequirements.length})</span>
          </button>

          <button
            id="tab-protocol-definitions"
            onClick={() => setActiveSubTab('protocols')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'protocols' 
                ? 'bg-teal-950 text-white shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
            <span>Requirement Standards ({biosecurityRequirements.length})</span>
          </button>

          <button
            id="tab-compliance-history"
            onClick={() => setActiveSubTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'history' 
                ? 'bg-teal-950 text-white shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5 text-emerald-400" />
            <span>Audit & Sign-off History</span>
          </button>
        </div>

        {activeSubTab === 'protocols' && permissions.canManageBiosecurityRequirements && (
          <button
            id="btn-add-new-protocol"
            onClick={handleOpenAddModal}
            className="px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-300" />
            <span>Define New Protocol</span>
          </button>
        )}
      </div>

      {/* VIEW 1: DAILY CHECKLIST & LOGGING */}
      {activeSubTab === 'checklist' && (
        <div className="space-y-4">
          {/* Filtering Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[220px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search checklist item, area, keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/30"
                />
              </div>

              {/* Category Select */}
              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs">
                <Filter className="w-3 h-3 text-slate-500" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Biosecurity Categories</option>
                  <option value="site_access">Site Access & Gate</option>
                  <option value="sanitation">Disinfection & Sanitation</option>
                  <option value="personal_hygiene">Personal Hygiene & PPE</option>
                  <option value="egg_room">Egg Room & Packing</option>
                  <option value="water_safety">Water Sanitization</option>
                  <option value="pest_control">Pest & Bird Control</option>
                </select>
              </div>

              {/* Status Select */}
              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs">
                <span className="text-slate-500">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="verified">Verified Only</option>
                  <option value="pending">Pending Verification</option>
                  <option value="pass">Passed (Compliant)</option>
                  <option value="fail">Failed (Non-Compliant)</option>
                </select>
              </div>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Showing <span className="font-bold text-slate-800">{filteredChecklist.length}</span> verification items for <span className="font-bold text-teal-800">{selectedDate}</span>
            </div>
          </div>

          {/* Checklist Table */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-teal-950 text-white font-semibold">
                    <th className="py-3 px-4 w-28 text-center">Status</th>
                    <th className="py-3 px-4 min-w-[280px]">Checklist Requirement & SOP</th>
                    <th className="py-3 px-3">Target Location</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Priority</th>
                    <th className="py-3 px-4">Verification Audit</th>
                    <th className="py-3 px-3 text-right">Remarks / Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredChecklist.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <ShieldCheck className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                        <p className="font-bold text-slate-600">No checklist items match the filter criteria.</p>
                        <p className="text-xs text-slate-400 mt-1">Try clearing your search query or category filter.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredChecklist.map((req) => {
                      const log = biosecurityLogs.find(l => l.requirementId === req.id && l.date === selectedDate);
                      const isVerified = Boolean(log?.verified);
                      const status: BiosecurityStatus = log?.status || 'pass';
                      const CatMeta = CATEGORY_META[req.category];
                      const Icon = CatMeta?.icon || ShieldCheck;
                      const CritMeta = CRITICALITY_META[req.criticalLevel];

                      return (
                        <tr 
                          key={req.id} 
                          className={`hover:bg-slate-50/80 transition-colors ${
                            !isVerified ? 'bg-amber-50/20' : status === 'fail' ? 'bg-rose-50/30' : ''
                          }`}
                        >
                          {/* 1. Status & Interactive Toggle */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="inline-flex items-center justify-center gap-1.5">
                              {/* Primary PASS Button */}
                              <button
                                id={`btn-pass-${req.id}`}
                                onClick={() => toggleBiosecurityLog(req.id, selectedDate, 'pass')}
                                className={`w-8 h-8 rounded-xl flex items-center justify-center transition cursor-pointer ${
                                  isVerified && status === 'pass'
                                    ? 'bg-emerald-600 text-white shadow-xs font-bold'
                                    : 'bg-slate-100 hover:bg-emerald-100 text-slate-400 hover:text-emerald-700'
                                }`}
                                title="Mark Pass / Compliant"
                              >
                                <Check className="w-4 h-4" />
                              </button>

                              {/* FAIL Button */}
                              <button
                                id={`btn-fail-${req.id}`}
                                onClick={() => toggleBiosecurityLog(req.id, selectedDate, 'fail')}
                                className={`w-8 h-8 rounded-xl flex items-center justify-center transition cursor-pointer ${
                                  isVerified && status === 'fail'
                                    ? 'bg-rose-600 text-white shadow-xs font-bold'
                                    : 'bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-700'
                                }`}
                                title="Mark Fail / Non-Compliant"
                              >
                                <X className="w-4 h-4" />
                              </button>

                              {/* N/A Button */}
                              <button
                                id={`btn-na-${req.id}`}
                                onClick={() => toggleBiosecurityLog(req.id, selectedDate, 'na')}
                                className={`w-7 h-8 rounded-xl text-[10px] font-bold flex items-center justify-center transition cursor-pointer ${
                                  isVerified && status === 'na'
                                    ? 'bg-slate-700 text-white shadow-xs'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-400'
                                }`}
                                title="Mark Not Applicable"
                              >
                                N/A
                              </button>
                            </div>
                          </td>

                          {/* 2. Requirement Title & SOP Details */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 text-xs">
                              {req.title}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 max-w-xl leading-relaxed">
                              {req.description}
                            </p>
                            {log?.notes && (
                              <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200/80 text-[10px] text-teal-900 font-medium">
                                <Sparkles className="w-3 h-3 text-teal-600" />
                                <span>Note: {log.notes}</span>
                              </div>
                            )}
                            {log?.correctiveAction && (
                              <div className="mt-1 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200/80 text-[10px] text-rose-900 font-medium ml-2">
                                <AlertTriangle className="w-3 h-3 text-rose-600" />
                                <span>Action: {log.correctiveAction}</span>
                              </div>
                            )}
                          </td>

                          {/* 3. Target Location */}
                          <td className="py-3.5 px-3">
                            <span className="font-medium text-slate-700 text-[11px] bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 whitespace-nowrap">
                              {req.targetArea}
                            </span>
                          </td>

                          {/* 4. Category Pill */}
                          <td className="py-3.5 px-3">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${CatMeta?.bg} ${CatMeta?.color}`}>
                              <Icon className="w-3 h-3" />
                              <span>{CatMeta?.label.split(' ')[0]}</span>
                            </span>
                          </td>

                          {/* 5. Priority Level */}
                          <td className="py-3.5 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${CritMeta?.badgeClass}`}>
                              {CritMeta?.label}
                            </span>
                          </td>

                          {/* 6. Verification Details */}
                          <td className="py-3.5 px-4">
                            {isVerified ? (
                              <div>
                                <div className="flex items-center gap-1 text-slate-900 font-bold text-[11px]">
                                  {status === 'pass' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                                  {status === 'fail' && <XCircle className="w-3.5 h-3.5 text-rose-600" />}
                                  {status === 'na' && <HelpCircle className="w-3.5 h-3.5 text-slate-500" />}
                                  <span className="truncate max-w-[130px]">{log?.verifiedByName}</span>
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  {log?.verifiedAt ? new Date(log.verifiedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                </div>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200">
                                <Clock className="w-3 h-3" /> Unverified
                              </span>
                            )}
                          </td>

                          {/* 7. Note Action */}
                          <td className="py-3.5 px-3 text-right">
                            <button
                              id={`btn-note-${req.id}`}
                              onClick={() => handleOpenNoteModal(req)}
                              className="px-2.5 py-1 rounded-lg text-slate-600 hover:text-teal-900 hover:bg-teal-50 border border-slate-200 text-[11px] font-medium transition cursor-pointer"
                            >
                              {log?.notes ? 'Edit Note' : '+ Note'}
                            </button>
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

      {/* VIEW 2: REQUIREMENT & PROTOCOL STANDARDS MANAGER */}
      {activeSubTab === 'protocols' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Configured Biosecurity Standard Operating Procedures</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Define sanitation thresholds, vehicle dip frequencies, visitor clearance rules, and chemical PPM requirements.
              </p>
            </div>
            {permissions.canManageBiosecurityRequirements && (
              <button
                onClick={handleOpenAddModal}
                className="px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer self-start"
              >
                <Plus className="w-4 h-4 text-emerald-300" />
                <span>Add Standard SOP</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {biosecurityRequirements.map((req) => {
              const CatMeta = CATEGORY_META[req.category];
              const Icon = CatMeta?.icon || ShieldCheck;
              const CritMeta = CRITICALITY_META[req.criticalLevel];

              return (
                <div 
                  key={req.id}
                  className={`bg-white rounded-2xl border p-5 transition shadow-2xs hover:shadow-xs flex flex-col justify-between ${
                    req.active ? 'border-slate-200/90' : 'border-slate-200 bg-slate-50/50 opacity-60'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className={`p-2 rounded-xl border ${CatMeta?.bg} ${CatMeta?.color}`}>
                          <Icon className="w-4 h-4" />
                        </span>
                        <div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${CritMeta?.badgeClass}`}>
                            {CritMeta?.label}
                          </span>
                          <span className="text-[10px] text-slate-400 ml-2 uppercase tracking-wider font-semibold">
                            {req.frequency.replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                      {/* Active Status Switch */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleBiosecurityRequirementActive(req.id)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold transition cursor-pointer border ${
                            req.active 
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                              : 'bg-slate-200 text-slate-600 border-slate-300'
                          }`}
                          title="Toggle active status"
                        >
                          {req.active ? 'Active Standard' : 'Inactive'}
                        </button>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{req.title}</h4>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{req.description}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-1.5 font-medium">
                        <span className="text-slate-400">Target Area:</span>
                        <span className="text-slate-800 font-bold">{req.targetArea}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {permissions.canManageBiosecurityRequirements && (
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenEditModal(req)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit SOP</span>
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to delete the protocol "${req.title}"?`)) {
                            deleteBiosecurityRequirement(req.id);
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 3: COMPLIANCE HISTORY & AUDIT */}
      {activeSubTab === 'history' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <h3 className="text-sm font-extrabold text-slate-900">Historical Biosecurity Verification Logs & Supervisor Sign-Offs</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Daily inspection compliance tracking, supervisor verification signatures, and sanitation notes.
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-teal-950 text-white font-semibold">
                  <th className="py-3 px-4">Audit Date</th>
                  <th className="py-3 px-4">Compliance Rating</th>
                  <th className="py-3 px-4">Checklist Count</th>
                  <th className="py-3 px-4">Pass / Fail Breakdown</th>
                  <th className="py-3 px-4">Supervisor Sign-Off</th>
                  <th className="py-3 px-4">Inspector Remarks</th>
                  <th className="py-3 px-4 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.keys(biosecuritySummaries)
                  .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
                  .map((dateKey) => {
                    const summary = biosecuritySummaries[dateKey];
                    return (
                      <tr key={dateKey} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4 font-extrabold text-slate-900 flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-teal-700" />
                          <span>{dateKey}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-black border ${
                            summary.complianceScorePct === 100 
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                              : summary.complianceScorePct >= 85 
                              ? 'bg-amber-100 text-amber-800 border-amber-200' 
                              : 'bg-rose-100 text-rose-800 border-rose-200'
                          }`}>
                            {summary.complianceScorePct}%
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-700">
                          {summary.verifiedCount} / {summary.totalRequirements} items
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-emerald-700 font-bold">{summary.passedCount} Pass</span>
                          {summary.failedCount > 0 && (
                            <span className="text-rose-700 font-bold ml-2">• {summary.failedCount} Fail</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {summary.supervisorSignoff ? (
                            <div>
                              <span className="font-bold text-slate-900">{summary.supervisorSignoffBy}</span>
                              <p className="text-[10px] text-slate-400">
                                {summary.supervisorSignoffAt ? new Date(summary.supervisorSignoffAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                              </p>
                            </div>
                          ) : (
                            <span className="text-amber-700 text-xs font-bold">Pending Sign-off</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 text-xs max-w-xs truncate">
                          {summary.supervisorNotes || 'No specific remarks entered.'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedDate(dateKey);
                              setActiveSubTab('checklist');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-900 text-xs font-bold border border-teal-200 transition cursor-pointer"
                          >
                            Inspect Log
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD / EDIT REQUIREMENT */}
      {showReqModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-teal-100 text-teal-800">
                  <ShieldCheck className="w-5 h-5" />
                </span>
                <h3 className="text-base font-extrabold text-slate-900">
                  {editingReqId ? 'Edit Biosecurity Protocol' : 'Define New Biosecurity Requirement'}
                </h3>
              </div>
              <button
                onClick={() => setShowReqModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRequirement} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Requirement Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Footbath Solution Chlorine Titration & Replenishment"
                  value={reqForm.title}
                  onChange={(e) => setReqForm({ ...reqForm, title: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 font-semibold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Biosecurity Category</label>
                  <select
                    value={reqForm.category}
                    onChange={(e) => setReqForm({ ...reqForm, category: e.target.value as BiosecurityCategory })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600"
                  >
                    <option value="site_access">Site Access & Gate Security</option>
                    <option value="sanitation">Disinfection & Sanitation</option>
                    <option value="personal_hygiene">Personal Hygiene & PPE</option>
                    <option value="egg_room">Egg Room & Packing Facility</option>
                    <option value="water_safety">Water Sanitization & Lines</option>
                    <option value="pest_control">Pest & Wild Bird Control</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Area / Facility</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Main Gate Arch / House Entrances"
                    value={reqForm.targetArea}
                    onChange={(e) => setReqForm({ ...reqForm, targetArea: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 font-medium text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Verification Frequency</label>
                  <select
                    value={reqForm.frequency}
                    onChange={(e) => setReqForm({ ...reqForm, frequency: e.target.value as BiosecurityFrequency })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600"
                  >
                    <option value="daily">Daily Inspection</option>
                    <option value="per_entry">Per Vehicle / Visitor Entry</option>
                    <option value="per_shift">Per Shift Handover</option>
                    <option value="weekly">Weekly Deep Audit</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Priority / Critical Level</label>
                  <select
                    value={reqForm.criticalLevel}
                    onChange={(e) => setReqForm({ ...reqForm, criticalLevel: e.target.value as BiosecurityCriticalLevel })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600"
                  >
                    <option value="mandatory">Mandatory (Zero Tolerance)</option>
                    <option value="high">High Priority</option>
                    <option value="standard">Standard Requirement</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Standard Operating Procedure / Inspection Instructions</label>
                <textarea
                  rows={3}
                  placeholder="Describe the exact chemical concentration, process, or steps the flockman/guard must perform..."
                  value={reqForm.description}
                  onChange={(e) => setReqForm({ ...reqForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 text-slate-800 text-xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  id="active-checkbox"
                  type="checkbox"
                  checked={reqForm.active}
                  onChange={(e) => setReqForm({ ...reqForm, active: e.target.checked })}
                  className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                />
                <label htmlFor="active-checkbox" className="font-bold text-slate-700 cursor-pointer">
                  Activate this protocol in daily checklist immediately
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowReqModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-950 hover:bg-teal-900 text-white font-bold transition shadow-xs cursor-pointer"
                >
                  {editingReqId ? 'Update Protocol' : 'Save Protocol'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD NOTE & CORRECTIVE ACTION */}
      {showNoteModal && activeReqForNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Inspection Remarks & Corrective Action</h3>
                <p className="text-xs text-slate-500 truncate max-w-xs">{activeReqForNote.title}</p>
              </div>
              <button
                onClick={() => setShowNoteModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Inspector Observations / Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Free chlorine tested at 3.5 ppm at farthest nipple drinker..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-rose-800 mb-1">Corrective Action (if non-compliant / failed)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Chlorine solution refilled immediately; re-tested 200 ppm."
                  value={correctiveText}
                  onChange={(e) => setCorrectiveText(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-600 text-slate-900 bg-rose-50/20"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowNoteModal(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveNote}
                className="px-4 py-2 rounded-xl bg-teal-950 hover:bg-teal-900 text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                Save Remarks
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: SUPERVISOR SIGN-OFF */}
      {showSignoffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-teal-100 text-teal-800">
                  <UserCheck className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Official Manager Sign-off</h3>
                  <p className="text-xs text-slate-500">Date: {selectedDate}</p>
                </div>
              </div>
              <button
                onClick={() => setShowSignoffModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Supervisor:</span>
                <span className="font-bold text-slate-900">{currentUser?.fullName} ({currentUser?.role})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Compliance Rating:</span>
                <span className="font-extrabold text-teal-800">{dateStats.compliancePct}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Checked Checkpoints:</span>
                <span className="font-bold text-slate-800">{dateStats.passed} Passed / {dateStats.failed} Failed</span>
              </div>
            </div>

            <div className="text-xs">
              <label className="block font-bold text-slate-700 mb-1">Supervisor Audit Comments</label>
              <textarea
                rows={3}
                value={supervisorNotesInput}
                onChange={(e) => setSupervisorNotesInput(e.target.value)}
                placeholder="Enter summary remarks on site disinfection, gate compliance, and any actions taken..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 text-slate-900"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowSignoffModal(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSignoff}
                className="px-5 py-2 rounded-xl bg-teal-950 hover:bg-teal-900 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <span>Stamp & Approve Sign-Off</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
