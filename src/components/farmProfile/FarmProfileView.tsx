import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import { 
  Building2, 
  Syringe, 
  Wheat, 
  TrendingUp, 
  Scale, 
  Egg, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  Check, 
  Phone, 
  Mail, 
  MapPin, 
  ShieldAlert,
  Camera,
  Upload,
  Image as ImageIcon,
  Sparkles,
  Users,
  UserCheck,
  Briefcase,
  Stethoscope,
  Activity,
  DollarSign,
  ShieldCheck,
  Award,
  Layers,
  FileText,
  Warehouse,
  Info
} from 'lucide-react';
import { CompanyLogoUploadModal } from './CompanyLogoUploadModal';
import { 
  StandardMedProgramItem, 
  StandardFeedGuideItem, 
  StandardHendayItem, 
  StandardBodyWeightItem, 
  StandardEggWeightItem,
  FeedType
} from '../../types';

export const FarmProfileView: React.FC = () => {
  const { 
    farmProfile, 
    updateFarmProfile, 
    updateStandardVaccination, 
    updateStandardFeedGuide, 
    updateStandardHenday, 
    updateStandardBodyWeights, 
    updateStandardEggWeights,
    permissions 
  } = useFarm();

  const [activeTab, setActiveTab] = useState<'info' | 'vaccine' | 'feed' | 'henday' | 'bodyweight' | 'eggweight'>('info');
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [showLogoModal, setShowLogoModal] = useState(false);
  const [name, setName] = useState(farmProfile.name);
  const [address, setAddress] = useState(farmProfile.address);
  const [contactNumber, setContactNumber] = useState(farmProfile.contactNumber);
  const [email, setEmail] = useState(farmProfile.email);
  const [establishedYear, setEstablishedYear] = useState(farmProfile.establishedYear);
  const [farmOwners, setFarmOwners] = useState(farmProfile.farmOwners || '');
  const [presidentCeo, setPresidentCeo] = useState(farmProfile.presidentCeo || '');
  const [cfo, setCfo] = useState(farmProfile.cfo || '');
  const [animalHealthSpecialist, setAnimalHealthSpecialist] = useState(farmProfile.animalHealthSpecialist || '');
  const [animalProductionSpecialist, setAnimalProductionSpecialist] = useState(farmProfile.animalProductionSpecialist || '');
  const [industrySector, setIndustrySector] = useState(farmProfile.industrySector || 'Commercial Broiler-Breeder Parent Stock (PS)');
  const [primaryBreeds, setPrimaryBreeds] = useState(farmProfile.primaryBreeds || 'Cobb 500 & Ross 308 Parent Stock');
  const [facilityHousesCount, setFacilityHousesCount] = useState(farmProfile.facilityHousesCount || '6 Environmentally Controlled (EC)');
  const [totalBirdCapacity, setTotalBirdCapacity] = useState(farmProfile.totalBirdCapacity || '~60,000 Breeders');
  const [dailyEggCapacity, setDailyEggCapacity] = useState(farmProfile.dailyEggCapacity || '~50,000 Eggs/day');
  const [farmOverviewNotes, setFarmOverviewNotes] = useState(farmProfile.farmOverviewNotes || '');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync state on opening edit form
  const handleOpenEditInfo = () => {
    setName(farmProfile.name);
    setAddress(farmProfile.address);
    setContactNumber(farmProfile.contactNumber);
    setEmail(farmProfile.email);
    setEstablishedYear(farmProfile.establishedYear);
    setFarmOwners(farmProfile.farmOwners || '');
    setPresidentCeo(farmProfile.presidentCeo || '');
    setCfo(farmProfile.cfo || '');
    setAnimalHealthSpecialist(farmProfile.animalHealthSpecialist || '');
    setAnimalProductionSpecialist(farmProfile.animalProductionSpecialist || '');
    setIndustrySector(farmProfile.industrySector || 'Commercial Broiler-Breeder Parent Stock (PS)');
    setPrimaryBreeds(farmProfile.primaryBreeds || 'Cobb 500 & Ross 308 Parent Stock');
    setFacilityHousesCount(farmProfile.facilityHousesCount || '6 Environmentally Controlled (EC)');
    setTotalBirdCapacity(farmProfile.totalBirdCapacity || '~60,000 Breeders');
    setDailyEggCapacity(farmProfile.dailyEggCapacity || '~50,000 Eggs/day');
    setFarmOverviewNotes(farmProfile.farmOverviewNotes || '');
    setIsEditingInfo(true);
  };

  // Vaccine Modal
  const [showAddVaccine, setShowAddVaccine] = useState(false);
  const [newVacWeek, setNewVacWeek] = useState(1);
  const [newVacProduct, setNewVacProduct] = useState('');
  const [newVacDisease, setNewVacDisease] = useState('');
  const [newVacMethod, setNewVacMethod] = useState('Drinking Water');
  const [newVacType, setNewVacType] = useState<StandardMedProgramItem['productType']>('Vaccine');

  // Feed Guide Modal & State
  const [showAddFeedGuide, setShowAddFeedGuide] = useState(false);
  const [editingFgItem, setEditingFgItem] = useState<StandardFeedGuideItem | null>(null);
  const [fgBreedFilter, setFgBreedFilter] = useState<string>('All');
  const [newFgBreed, setNewFgBreed] = useState<string>('Cobb 500');
  const [newFgWeek, setNewFgWeek] = useState(1);
  const [newFgPhase, setNewFgPhase] = useState('Brooding / Starter');
  const [newFgFemaleType, setNewFgFemaleType] = useState<FeedType>('CSC 1');
  const [newFgFemale, setNewFgFemale] = useState(20);
  const [newFgMaleType, setNewFgMaleType] = useState<FeedType>('CSC 1');
  const [newFgMale, setNewFgMale] = useState(22);

  // Body weight modal
  const [showAddBw, setShowAddBw] = useState(false);
  const [newBwWeek, setNewBwWeek] = useState(1);
  const [newBwMale, setNewBwMale] = useState(150);
  const [newBwFemale, setNewBwFemale] = useState(140);

  // Henday Modal
  const [showAddHd, setShowAddHd] = useState(false);
  const [newHdWeek, setNewHdWeek] = useState(24);
  const [newHdProdWeek, setNewHdProdWeek] = useState(1);
  const [newHdPct, setNewHdPct] = useState(5.0);
  const [newHdHePct, setNewHdHePct] = useState(60.0);

  // Egg weight modal
  const [showAddEw, setShowAddEw] = useState(false);
  const [newEwWeek, setNewEwWeek] = useState(24);
  const [newEwProdWeek, setNewEwProdWeek] = useState(1);
  const [newEwGrams, setNewEwGrams] = useState(52.0);

  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault();
    updateFarmProfile({
      name,
      address,
      contactNumber,
      email,
      establishedYear,
      farmOwners,
      presidentCeo,
      cfo,
      animalHealthSpecialist,
      animalProductionSpecialist,
      industrySector,
      primaryBreeds,
      facilityHousesCount,
      totalBirdCapacity,
      dailyEggCapacity,
      farmOverviewNotes
    });
    setIsEditingInfo(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleSaveLogo = (newLogoUrl: string) => {
    updateFarmProfile({ logoUrl: newLogoUrl });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleRemoveLogo = () => {
    updateFarmProfile({ logoUrl: '' });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleAddVaccine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVacProduct) return;
    const newItem: StandardMedProgramItem = {
      id: 'vac_' + Date.now(),
      ageWeek: Number(newVacWeek),
      productName: newVacProduct,
      productType: newVacType,
      diseaseTarget: newVacDisease || 'General Immunity',
      method: newVacMethod,
      mandatory: true
    };
    const updated = [...farmProfile.standardVaccinationProgram, newItem].sort((a, b) => a.ageWeek - b.ageWeek);
    updateStandardVaccination(updated);
    setShowAddVaccine(false);
    setNewVacProduct('');
    setNewVacDisease('');
  };

  const handleDeleteVaccine = (id: string) => {
    const updated = farmProfile.standardVaccinationProgram.filter(item => item.id !== id);
    updateStandardVaccination(updated);
  };

  const handleOpenAddFeedGuide = () => {
    setEditingFgItem(null);
    setNewFgBreed(fgBreedFilter !== 'All' ? fgBreedFilter : 'Cobb 500');
    setNewFgWeek(1);
    setNewFgPhase('Brooding / Starter');
    setNewFgFemaleType('CSC 1');
    setNewFgFemale(20);
    setNewFgMaleType('CSC 1');
    setNewFgMale(22);
    setShowAddFeedGuide(true);
  };

  const handleOpenEditFeedGuide = (item: StandardFeedGuideItem) => {
    setEditingFgItem(item);
    setNewFgBreed(item.breedType || 'Cobb 500');
    setNewFgWeek(item.ageWeek);
    setNewFgPhase(item.productionPhase);
    setNewFgFemaleType(item.femaleFeedType || item.recommendedFeedType || 'BLC 1');
    setNewFgFemale(item.femaleGramsPerBird);
    setNewFgMaleType(item.maleFeedType || (item.ageWeek >= 20 ? 'BMCC' : (item.recommendedFeedType || 'BMCC')));
    setNewFgMale(item.maleGramsPerBird);
    setShowAddFeedGuide(true);
  };

  const handleSaveFeedGuide = (e: React.FormEvent) => {
    e.preventDefault();
    const itemToSave: StandardFeedGuideItem = {
      id: editingFgItem ? editingFgItem.id : 'fg_' + Date.now(),
      breedType: newFgBreed.trim() || 'All Breeds',
      ageWeek: Number(newFgWeek),
      productionPhase: newFgPhase.trim() || 'Standard Feeding',
      femaleFeedType: newFgFemaleType,
      femaleGramsPerBird: Number(newFgFemale) || 0,
      maleFeedType: newFgMaleType,
      maleGramsPerBird: Number(newFgMale) || 0,
      recommendedFeedType: newFgFemaleType
    };

    let updated: StandardFeedGuideItem[];
    if (editingFgItem) {
      updated = (farmProfile.standardFeedGuide || []).map(item => item.id === editingFgItem.id ? itemToSave : item);
    } else {
      updated = [...(farmProfile.standardFeedGuide || []), itemToSave];
    }

    updated.sort((a, b) => {
      if ((a.breedType || '') === (b.breedType || '')) {
        return a.ageWeek - b.ageWeek;
      }
      return (a.breedType || '').localeCompare(b.breedType || '');
    });

    updateStandardFeedGuide(updated);
    setShowAddFeedGuide(false);
    setEditingFgItem(null);
  };

  const handleDeleteFeedGuide = (id: string) => {
    const updated = (farmProfile.standardFeedGuide || []).filter(item => item.id !== id);
    updateStandardFeedGuide(updated);
  };

  const handleAddBodyWeight = (e: React.FormEvent) => {
    e.preventDefault();
    const newItem: StandardBodyWeightItem = {
      id: 'bw_' + Date.now(),
      ageWeek: Number(newBwWeek),
      maleStandardGrams: Number(newBwMale),
      femaleStandardGrams: Number(newBwFemale)
    };
    const updated = [...farmProfile.standardBodyWeights, newItem].sort((a, b) => a.ageWeek - b.ageWeek);
    updateStandardBodyWeights(updated);
    setShowAddBw(false);
  };

  const handleDeleteBodyWeight = (id: string) => {
    const updated = farmProfile.standardBodyWeights.filter(item => item.id !== id);
    updateStandardBodyWeights(updated);
  };

  const handleAddHenday = (e: React.FormEvent) => {
    e.preventDefault();
    const newItem: StandardHendayItem = {
      id: 'hd_' + Date.now(),
      ageWeek: Number(newHdWeek),
      ageInProduction: Number(newHdProdWeek),
      standardHendayPct: Number(newHdPct),
      standardHatchingPct: Number(newHdHePct)
    };
    const updated = [...farmProfile.standardHenday, newItem].sort((a, b) => a.ageWeek - b.ageWeek);
    updateStandardHenday(updated);
    setShowAddHd(false);
  };

  const handleDeleteHenday = (id: string) => {
    const updated = farmProfile.standardHenday.filter(item => item.id !== id);
    updateStandardHenday(updated);
  };

  const handleAddEggWeight = (e: React.FormEvent) => {
    e.preventDefault();
    const newItem: StandardEggWeightItem = {
      id: 'ew_' + Date.now(),
      ageWeek: Number(newEwWeek),
      ageInProduction: Number(newEwProdWeek),
      standardWeightGrams: Number(newEwGrams)
    };
    const updated = [...farmProfile.standardEggWeights, newItem].sort((a, b) => a.ageWeek - b.ageWeek);
    updateStandardEggWeights(updated);
    setShowAddEw(false);
  };

  const handleDeleteEggWeight = (id: string) => {
    const updated = farmProfile.standardEggWeights.filter(item => item.id !== id);
    updateStandardEggWeights(updated);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="w-16 h-16 rounded-2xl bg-forest-950 text-mint-400 flex items-center justify-center font-black text-2xl shadow-xs ring-4 ring-forest-50 overflow-hidden border border-forest-900">
              {farmProfile.logoUrl ? (
                <img
                  src={farmProfile.logoUrl}
                  alt={farmProfile.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain bg-white p-1"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <span>LP</span>
              )}
            </div>
            {permissions.canManageFarmProfile && (
              <button
                type="button"
                onClick={() => setShowLogoModal(true)}
                title="Change company logo"
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-mint-400 text-forest-950 flex items-center justify-center shadow-md hover:bg-mint-300 transition"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-slate-900">{farmProfile.name}</h2>
              {saveSuccess && (
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                  <Check className="w-3 h-3" /> Saved
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{farmProfile.address}</span>
            </p>
          </div>
        </div>

        {permissions.canManageFarmProfile && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              id="upload-farm-logo-btn"
              onClick={() => setShowLogoModal(true)}
              className="px-4 py-2.5 bg-forest-950 hover:bg-forest-900 text-mint-400 rounded-xl text-xs font-semibold flex items-center gap-2 transition shadow-xs border border-forest-800"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{farmProfile.logoUrl ? 'Change Company Logo' : 'Upload Company Logo'}</span>
            </button>

            {!isEditingInfo ? (
              <button
                id="edit-farm-profile-btn"
                onClick={handleOpenEditInfo}
                className="px-4 py-2.5 bg-mint-400 hover:bg-mint-300 text-forest-950 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition shadow-xs cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profile Info</span>
              </button>
            ) : (
              <button
                onClick={() => setIsEditingInfo(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>
        )}
      </div>

      {/* Profile Edit Form if active */}
      {isEditingInfo && (
        <form onSubmit={handleSaveInfo} className="bg-white rounded-2xl border border-forest-200/80 p-6 shadow-xs space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-forest-800" />
              <span>Update Farm Profile, Leadership & Technical Specialists</span>
            </h3>
            <span className="text-[11px] text-slate-500 font-medium">Official Registry Information</span>
          </div>

          {/* Logo preview and trigger in form */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden p-0.5 shrink-0">
                {farmProfile.logoUrl ? (
                  <img
                    src={farmProfile.logoUrl}
                    alt="Logo"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="font-black text-forest-950 text-sm">LP</span>
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Official Company Logo</p>
                <p className="text-[11px] text-slate-500">
                  {farmProfile.logoUrl ? 'Custom logo uploaded & active' : 'Default emblem currently displayed'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowLogoModal(true)}
              className="px-3 py-1.5 bg-forest-950 hover:bg-forest-900 text-mint-400 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{farmProfile.logoUrl ? 'Change Logo' : 'Upload Logo'}</span>
            </button>
          </div>

          {/* Section 1: Enterprise & Contact Info */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-200">
              <Building2 className="w-3.5 h-3.5 text-forest-700" />
              <span>1. Enterprise & Contact Details</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Farm Enterprise Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. L.P. LIM CITY FAMILY FARM INC"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-mint-500 focus:border-mint-500 outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Address / Complex</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="e.g. San Jose Agro-Industrial Complex, Batangas"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-mint-500 focus:border-mint-500 outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={contactNumber}
                  onChange={e => setContactNumber(e.target.value)}
                  placeholder="+63 917 555 2473"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-mint-500 focus:border-mint-500 outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Official Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="von.lplimfarm@gmail.com"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-mint-500 focus:border-mint-500 outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Est. Year</label>
                <input
                  type="text"
                  value={establishedYear}
                  onChange={e => setEstablishedYear(e.target.value)}
                  placeholder="2012"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-mint-500 focus:border-mint-500 outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Farm Overview & Operational Specifications */}
          <div className="space-y-4 pt-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-200">
              <Layers className="w-3.5 h-3.5 text-forest-700" />
              <span>2. Farm Overview & Facility Specifications</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Industry Sector</label>
                <input
                  type="text"
                  value={industrySector}
                  onChange={e => setIndustrySector(e.target.value)}
                  placeholder="e.g. Commercial Broiler-Breeder Parent Stock (PS)"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-mint-500 focus:border-mint-500 outline-hidden"
                />
                <span className="text-[10px] text-slate-400">Primary agricultural sub-sector / production classification</span>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Breeds</label>
                <input
                  type="text"
                  value={primaryBreeds}
                  onChange={e => setPrimaryBreeds(e.target.value)}
                  placeholder="e.g. Cobb 500 & Ross 308 Parent Stock"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-mint-500 focus:border-mint-500 outline-hidden"
                />
                <span className="text-[10px] text-slate-400">Genetics strains & breeder lines raised</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Active Houses / Facility Type</label>
                <input
                  type="text"
                  value={facilityHousesCount}
                  onChange={e => setFacilityHousesCount(e.target.value)}
                  placeholder="e.g. 6 Environmentally Controlled (EC)"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-mint-500 focus:border-mint-500 outline-hidden"
                />
                <span className="text-[10px] text-slate-400">Number of active sheds & technology</span>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Total Bird Capacity</label>
                <input
                  type="text"
                  value={totalBirdCapacity}
                  onChange={e => setTotalBirdCapacity(e.target.value)}
                  placeholder="e.g. ~60,000 Breeders"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-mint-500 focus:border-mint-500 outline-hidden"
                />
                <span className="text-[10px] text-slate-400">Max standing breeder flock volume</span>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Daily Egg Capacity</label>
                <input
                  type="text"
                  value={dailyEggCapacity}
                  onChange={e => setDailyEggCapacity(e.target.value)}
                  placeholder="e.g. ~50,000 Eggs/day"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-mint-500 focus:border-mint-500 outline-hidden"
                />
                <span className="text-[10px] text-slate-400">Peak hatching egg daily collection</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Farm Overview / Mission & Background Notes</label>
              <textarea
                rows={2}
                value={farmOverviewNotes}
                onChange={e => setFarmOverviewNotes(e.target.value)}
                placeholder="State-of-the-art closed-tunnel ventilated poultry breeder facility operating under strict biosecurity and animal welfare compliance standards..."
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-mint-500 focus:border-mint-500 outline-hidden resize-none"
              />
              <span className="text-[10px] text-slate-400">Facility profile, ventilation standards, and operational commitment</span>
            </div>
          </div>

          {/* Section 3: Executive Leadership & Corporate Officers */}
          <div className="space-y-4 pt-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-200">
              <Briefcase className="w-3.5 h-3.5 text-forest-700" />
              <span>3. Executive Leadership & Corporate Officers</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Farm Owner/s</label>
                <input
                  type="text"
                  value={farmOwners}
                  onChange={e => setFarmOwners(e.target.value)}
                  placeholder="e.g. L.P. Lim & Family"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-mint-500 focus:border-mint-500 outline-hidden"
                />
                <span className="text-[10px] text-slate-400">Principal owner(s) / Proprietors</span>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">President / CEO</label>
                <input
                  type="text"
                  value={presidentCeo}
                  onChange={e => setPresidentCeo(e.target.value)}
                  placeholder="e.g. Von L.P. Lim"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-mint-500 focus:border-mint-500 outline-hidden"
                />
                <span className="text-[10px] text-slate-400">Chief Executive Officer</span>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Chief Financial Officer (CFO)</label>
                <input
                  type="text"
                  value={cfo}
                  onChange={e => setCfo(e.target.value)}
                  placeholder="e.g. Patricia C. Lim, CPA"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-mint-500 focus:border-mint-500 outline-hidden"
                />
                <span className="text-[10px] text-slate-400">Financial administration & audit</span>
              </div>
            </div>
          </div>

          {/* Section 4: Technical & Animal Health Specialists */}
          <div className="space-y-4 pt-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-200">
              <Stethoscope className="w-3.5 h-3.5 text-forest-700" />
              <span>4. Key Technical & Animal Specialists</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Animal Health Specialist Name</label>
                <input
                  type="text"
                  value={animalHealthSpecialist}
                  onChange={e => setAnimalHealthSpecialist(e.target.value)}
                  placeholder="e.g. Dr. Roberto M. Santos, DVM"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-mint-500 focus:border-mint-500 outline-hidden"
                />
                <span className="text-[10px] text-slate-400">Veterinarian & flock biosecurity lead</span>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Animal Production Specialist</label>
                <input
                  type="text"
                  value={animalProductionSpecialist}
                  onChange={e => setAnimalProductionSpecialist(e.target.value)}
                  placeholder="e.g. Engr. Gabriel S. Mendoza, PAS"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-mint-500 focus:border-mint-500 outline-hidden"
                />
                <span className="text-[10px] text-slate-400">Breeder nutrition & production specialist</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditingInfo(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-mint-400 hover:bg-mint-300 text-forest-950 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Farm Overview & Profile</span>
            </button>
          </div>
        </form>
      )}

      {/* Tabs for standard programs */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200/80 pb-2 scrollbar-none">
        <button
          onClick={() => setActiveTab('info')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition shrink-0 ${
            activeTab === 'info'
              ? 'bg-teal-950 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Farm Info</span>
        </button>

        <button
          onClick={() => setActiveTab('vaccine')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition shrink-0 ${
            activeTab === 'vaccine'
              ? 'bg-teal-950 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80'
          }`}
        >
          <Syringe className="w-4 h-4" />
          <span>Standard Vaccination ({farmProfile.standardVaccinationProgram.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('feed')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition shrink-0 ${
            activeTab === 'feed'
              ? 'bg-teal-950 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80'
          }`}
        >
          <Wheat className="w-4 h-4" />
          <span>Standard Feed Guide ({farmProfile.standardFeedGuide.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('henday')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition shrink-0 ${
            activeTab === 'henday'
              ? 'bg-teal-950 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Standard Henday %</span>
        </button>

        <button
          onClick={() => setActiveTab('bodyweight')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition shrink-0 ${
            activeTab === 'bodyweight'
              ? 'bg-teal-950 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>Standard Body Weight</span>
        </button>

        <button
          onClick={() => setActiveTab('eggweight')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition shrink-0 ${
            activeTab === 'eggweight'
              ? 'bg-teal-950 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80'
          }`}
        >
          <Egg className="w-4 h-4" />
          <span>Standard Egg Weight</span>
        </button>
      </div>

      {/* Tab 1: General Info */}
      {activeTab === 'info' && (
        <div className="space-y-6">
          {/* Top Row: Basic Info & Facilities */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: Company Logo & Identity */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Company Logo</h4>
                  {farmProfile.logoUrl ? (
                    <span className="text-[10px] bg-mint-50 text-forest-900 border border-mint-200 font-bold px-2 py-0.5 rounded-full">
                      Active Logo
                    </span>
                  ) : (
                    <span className="text-[10px] bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded-full">
                      Default Emblem
                    </span>
                  )}
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden p-1 shrink-0">
                    {farmProfile.logoUrl ? (
                      <img
                        src={farmProfile.logoUrl}
                        alt="Farm Logo"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <span className="font-black text-forest-950 text-lg">LP</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">Official Brand Crest</p>
                    <p className="text-[10px] text-slate-500">
                      {farmProfile.logoUrl ? 'Custom PNG/SVG Logo' : 'Default text monogram'}
                    </p>
                  </div>
                </div>
              </div>

              {permissions.canManageFarmProfile && (
                <div className="pt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowLogoModal(true)}
                    className="flex-1 px-3 py-2 bg-forest-950 hover:bg-forest-900 text-mint-400 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{farmProfile.logoUrl ? 'Update Logo' : 'Upload Logo'}</span>
                  </button>
                  {farmProfile.logoUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      title="Remove logo"
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition border border-slate-200 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Card 2: Farm Overview */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-forest-700" />
                    <span>Farm Overview</span>
                  </h4>
                  {permissions.canManageFarmProfile && (
                    <button
                      type="button"
                      onClick={handleOpenEditInfo}
                      className="text-[11px] font-bold text-forest-800 hover:text-forest-950 flex items-center gap-1 hover:underline cursor-pointer"
                      title="Edit Farm Overview"
                    >
                      <Edit3 className="w-3 h-3 text-mint-600" />
                      <span>Edit</span>
                    </button>
                  )}
                </div>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-xs text-slate-500">Enterprise</p>
                    <p className="font-semibold text-slate-900">{farmProfile.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Industry Sector</p>
                    <p className="font-semibold text-slate-900">{farmProfile.industrySector || 'Commercial Broiler-Breeder Parent Stock (PS)'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Established</p>
                    <p className="font-semibold text-slate-900">
                      {farmProfile.establishedYear} 
                      {(() => {
                        const yr = parseInt(farmProfile.establishedYear, 10);
                        const cur = new Date().getFullYear();
                        return !isNaN(yr) && yr <= cur ? ` (${cur - yr} Years of Operation)` : '';
                      })()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Primary Breeds</p>
                    <p className="font-semibold text-slate-900">{farmProfile.primaryBreeds || 'Cobb 500 & Ross 308 Parent Stock'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Contact & Logistics */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-forest-700" />
                    <span>Contact & Logistics</span>
                  </h4>
                  {permissions.canManageFarmProfile && (
                    <button
                      type="button"
                      onClick={handleOpenEditInfo}
                      className="text-[11px] font-bold text-forest-800 hover:text-forest-950 flex items-center gap-1 hover:underline cursor-pointer"
                      title="Edit Contact Info"
                    >
                      <Edit3 className="w-3 h-3 text-mint-600" />
                      <span>Edit</span>
                    </button>
                  )}
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="text-slate-800 font-medium truncate">{farmProfile.contactNumber}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="text-slate-800 font-medium truncate">{farmProfile.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="text-slate-800 font-medium line-clamp-2">{farmProfile.address}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4: Facility Capacity */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Warehouse className="w-3.5 h-3.5 text-forest-700" />
                    <span>Facility Capacity</span>
                  </h4>
                  {permissions.canManageFarmProfile && (
                    <button
                      type="button"
                      onClick={handleOpenEditInfo}
                      className="text-[11px] font-bold text-forest-800 hover:text-forest-950 flex items-center gap-1 hover:underline cursor-pointer"
                      title="Edit Facility Capacity"
                    >
                      <Edit3 className="w-3 h-3 text-mint-600" />
                      <span>Edit</span>
                    </button>
                  )}
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Active Houses:</span>
                    <span className="font-bold text-slate-900">{farmProfile.facilityHousesCount || '6 Environmentally Controlled (EC)'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Total Bird Capacity:</span>
                    <span className="font-bold text-slate-900">{farmProfile.totalBirdCapacity || '~60,000 Breeders'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Daily Egg Capacity:</span>
                    <span className="font-bold text-slate-900">{farmProfile.dailyEggCapacity || '~50,000 Eggs/day'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Farm Operational Profile Narrative Banner */}
          {(farmProfile.farmOverviewNotes || permissions.canManageFarmProfile) && (
            <div className="bg-gradient-to-br from-forest-950 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-sm border border-forest-800 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-forest-900/80 text-mint-400 border border-mint-500/20">
                    <FileText className="w-4 h-4" />
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>Farm Operational Profile & Facility Standards</span>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-mint-400/20 text-mint-300 border border-mint-400/30">
                        OFFICIAL RECORD
                      </span>
                    </h4>
                    <p className="text-xs text-slate-300">Operational commitment, climate automation & biosecurity protocols</p>
                  </div>
                </div>
                {permissions.canManageFarmProfile && (
                  <button
                    type="button"
                    onClick={handleOpenEditInfo}
                    className="px-3 py-1.5 bg-mint-400 hover:bg-mint-300 text-forest-950 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Overview</span>
                  </button>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal bg-white/5 rounded-xl p-4 border border-white/10">
                {farmProfile.farmOverviewNotes || 'State-of-the-art closed-tunnel ventilated poultry breeder facility operating under strict biosecurity and animal welfare compliance standards.'}
              </p>
            </div>
          )}

          {/* Section: Executive Leadership & Corporate Governance */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-forest-950 text-mint-300">
                  <Briefcase className="w-4 h-4 text-mint-400" />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Executive Leadership & Farm Ownership</h4>
                  <p className="text-xs text-slate-500">Corporate governance, executive authority, and financial administration</p>
                </div>
              </div>
              <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-forest-50 text-forest-800 border border-forest-200 self-start">
                GOVERNANCE & OFFICERS
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Farm Owner/s */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-amber-700" />
                    Farm Owner / Owners
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                    Ownership
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-base font-black text-slate-900">
                    {farmProfile.farmOwners || 'Not Specified'}
                  </p>
                  <p className="text-xs text-slate-500">
                    Proprietor & Primary Asset Holding
                  </p>
                </div>
              </div>

              {/* President / CEO */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-forest-800" />
                    President / CEO
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-forest-50 text-forest-900 border border-forest-200">
                    Executive
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-base font-black text-slate-900">
                    {farmProfile.presidentCeo || 'Not Specified'}
                  </p>
                  <p className="text-xs text-slate-500">
                    Strategic Leadership & Operations Head
                  </p>
                </div>
              </div>

              {/* CFO */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-700" />
                    Chief Financial Officer (CFO)
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-900 border border-emerald-200">
                    Finance
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-base font-black text-slate-900">
                    {farmProfile.cfo || 'Not Specified'}
                  </p>
                  <p className="text-xs text-slate-500">
                    Financial Planning & Corporate Audit
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Key Technical Specialists & Animal Care */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-forest-950 text-mint-300">
                  <Stethoscope className="w-4 h-4 text-mint-400" />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Key Technical Specialists & Flock Care</h4>
                  <p className="text-xs text-slate-500">Veterinary health surveillance, vaccination protocols, and production yield optimization</p>
                </div>
              </div>
              <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200 self-start">
                TECHNICAL DIRECTORS
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Animal Health Specialist */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5 text-teal-700" />
                    Animal Health Specialist Name
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 text-teal-900 border border-teal-200">
                    Veterinary Lead (DVM)
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-base font-black text-slate-900">
                    {farmProfile.animalHealthSpecialist || 'Not Specified'}
                  </p>
                  <p className="text-xs text-slate-500">
                    Biosecurity Programs, Veterinary Medication, Mortality Audits & Immunization Compliance
                  </p>
                </div>
              </div>

              {/* Animal Production Specialist */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-indigo-700" />
                    Animal Production Specialist
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-900 border border-indigo-200">
                    Production Lead
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-base font-black text-slate-900">
                    {farmProfile.animalProductionSpecialist || 'Not Specified'}
                  </p>
                  <p className="text-xs text-slate-500">
                    Breeder Nutrition Formulas, Hen-Day Yield Benchmarks, Feed Guide Standards & Hatching Target Delivery
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Standard Vaccination Program */}
      {activeTab === 'vaccine' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Standard Vaccination & Medication Program</h3>
              <p className="text-xs text-slate-500">Benchmark immunization schedule per age in weeks</p>
            </div>
            {permissions.canManageFarmProfile && (
              <button
                onClick={() => setShowAddVaccine(true)}
                className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition self-start shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Standard Vaccine</span>
              </button>
            )}
          </div>

          {showAddVaccine && (
            <form onSubmit={handleAddVaccine} className="p-4 bg-teal-50/70 border border-teal-200/80 rounded-2xl space-y-3 animate-fadeIn">
              <p className="text-xs font-bold text-teal-950">Add Vaccination Standard Rule</p>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Age in Weeks *</label>
                  <input
                    type="number"
                    min="1"
                    max="70"
                    required
                    value={newVacWeek}
                    onChange={e => setNewVacWeek(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-teal-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Product / Vaccine *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Newcastle Clone 30"
                    value={newVacProduct}
                    onChange={e => setNewVacProduct(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-teal-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Target Disease *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ND + IB"
                    value={newVacDisease}
                    onChange={e => setNewVacDisease(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-teal-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Method *</label>
                  <select
                    value={newVacMethod}
                    onChange={e => setNewVacMethod(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-teal-500 outline-hidden"
                  >
                    <option value="Drinking Water">Drinking Water</option>
                    <option value="Eye Drop">Eye Drop</option>
                    <option value="Wing Web">Wing Web</option>
                    <option value="Spray">Spray</option>
                    <option value="Subcutaneous Injection">Subcutaneous Injection</option>
                    <option value="Intramuscular Injection">Intramuscular Injection</option>
                    <option value="Feed Mix">Feed Mix</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddVaccine(false)}
                  className="px-3 py-1 bg-white border border-slate-200 text-slate-700 text-xs rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-teal-600 text-white text-xs rounded-lg font-semibold hover:bg-teal-700 shadow-xs"
                >
                  Add Rule
                </button>
              </div>
            </form>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200/80">
                  <th className="py-2.5 px-3">Age (Wks)</th>
                  <th className="py-2.5 px-3">Product Name</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Target Disease</th>
                  <th className="py-2.5 px-3">Administration Method</th>
                  <th className="py-2.5 px-3">Notes</th>
                  {permissions.canDeleteRecord && <th className="py-2.5 px-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {farmProfile.standardVaccinationProgram.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3 font-bold text-slate-800">Week {item.ageWeek}</td>
                    <td className="py-2.5 px-3 font-semibold text-teal-950">{item.productName}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-700 font-medium">
                        {item.productType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">{item.diseaseTarget}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">{item.method}</td>
                    <td className="py-2.5 px-3 text-slate-500">{item.notes || '—'}</td>
                    {permissions.canDeleteRecord && (
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => handleDeleteVaccine(item.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                          title="Delete rule"
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
      )}

      {/* Tab 3: Standard Feed Guide */}
      {activeTab === 'feed' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Wheat className="w-4 h-4 text-teal-600" />
                <span>Standard Feed Guide by Breed & Age</span>
              </h3>
              <p className="text-xs text-slate-500">
                Grams per bird per day (g/bird/day) and specific feed type targets for female and male breeder flocks
              </p>
            </div>
            {permissions.canManageFarmProfile && (
              <button
                onClick={handleOpenAddFeedGuide}
                className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition self-start shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Feed Guideline</span>
              </button>
            )}
          </div>

          {/* Breed Filter Navigation Bar */}
          <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100/80 rounded-xl border border-slate-200/70 text-xs">
            <span className="text-[11px] font-bold text-slate-500 px-2 uppercase tracking-wider">
              Breed Filter:
            </span>
            {['All', 'Cobb 500', 'Ross 308', 'Hubbard', 'Arbor Acres'].map((breed) => {
              const count = (farmProfile.standardFeedGuide || []).filter(item => {
                if (breed === 'All') return true;
                return (item.breedType || 'Cobb 500').toLowerCase().includes(breed.toLowerCase());
              }).length;

              const isSelected = fgBreedFilter === breed;
              return (
                <button
                  key={breed}
                  onClick={() => setFgBreedFilter(breed)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'bg-white/80 text-slate-700 hover:bg-white hover:text-slate-900 border border-slate-200/50'
                  }`}
                >
                  <span>{breed === 'All' ? 'All Breeds' : breed}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isSelected ? 'bg-teal-800 text-teal-100' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Add / Edit Feed Guide Modal Form */}
          {showAddFeedGuide && (
            <form onSubmit={handleSaveFeedGuide} className="p-5 bg-teal-50/70 border border-teal-200/80 rounded-2xl space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-teal-200/60 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-lg bg-teal-700 text-white">
                    {editingFgItem ? <Edit3 className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  </span>
                  <p className="text-xs font-bold text-teal-950">
                    {editingFgItem ? 'Edit Standard Feed Guideline' : 'Add Standard Feed Guideline Entry'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setShowAddFeedGuide(false); setEditingFgItem(null); }}
                  className="text-slate-400 hover:text-slate-700 text-xs font-bold"
                >
                  ✕ Close
                </button>
              </div>

              {/* Row 1: Breed, Age, and Phase */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Breed Type *</label>
                  <div className="space-y-1.5">
                    <select
                      value={['Cobb 500', 'Ross 308', 'Hubbard', 'Arbor Acres', 'All Breeds'].includes(newFgBreed) ? newFgBreed : 'Other'}
                      onChange={e => {
                        if (e.target.value !== 'Other') setNewFgBreed(e.target.value);
                      }}
                      className="w-full px-2.5 py-1.5 text-xs font-bold border border-slate-200 rounded-lg bg-white focus:outline-teal-500"
                    >
                      <option value="Cobb 500">Cobb 500</option>
                      <option value="Ross 308">Ross 308</option>
                      <option value="Hubbard">Hubbard</option>
                      <option value="Arbor Acres">Arbor Acres</option>
                      <option value="All Breeds">All Breeds / General</option>
                      <option value="Other">Custom Breed...</option>
                    </select>
                    {(!['Cobb 500', 'Ross 308', 'Hubbard', 'Arbor Acres', 'All Breeds'].includes(newFgBreed)) && (
                      <input
                        type="text"
                        placeholder="Enter breed name"
                        value={newFgBreed}
                        onChange={e => setNewFgBreed(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-teal-300 rounded-lg bg-white focus:outline-teal-500"
                      />
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Age in Weeks *</label>
                  <input
                    type="number"
                    min="1"
                    max="80"
                    required
                    value={newFgWeek}
                    onChange={e => setNewFgWeek(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs font-bold border border-slate-200 rounded-lg bg-white focus:outline-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Production Phase *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Peak Production, Pre-Lay, Growing"
                    value={newFgPhase}
                    onChange={e => setNewFgPhase(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-teal-500"
                  />
                </div>
              </div>

              {/* Row 2: Split Female & Male Feed Guides */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Female Feeding Specification Card */}
                <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-950 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                      Female Feeding Standard (♀)
                    </span>
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md">
                      Hen Ration
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Female Feed Type *</label>
                      <select
                        value={newFgFemaleType}
                        onChange={e => setNewFgFemaleType(e.target.value as FeedType)}
                        className="w-full px-2.5 py-1.5 text-xs font-bold border border-rose-200 rounded-lg bg-white focus:outline-rose-500 text-rose-950"
                      >
                        {['CSC 1', 'CSC 2', 'CGC', 'PDC', 'BLC 1', 'BLC 2', 'BLC 3', 'BMCC', 'BMCR', 'CBB'].map(ft => (
                          <option key={ft} value={ft}>{ft}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Female Daily Intake *</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          required
                          value={newFgFemale}
                          onChange={e => setNewFgFemale(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 text-xs font-bold border border-rose-200 rounded-lg bg-white focus:outline-rose-500 text-rose-950 pr-14"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-rose-600">
                          g/bird
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Male Feeding Specification Card */}
                <div className="p-3.5 bg-teal-50/70 border border-teal-200 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                      Male Feeding Standard (♂)
                    </span>
                    <span className="text-[10px] font-bold text-teal-700 bg-teal-100 px-2 py-0.5 rounded-md">
                      Rooster Ration
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Male Feed Type *</label>
                      <select
                        value={newFgMaleType}
                        onChange={e => setNewFgMaleType(e.target.value as FeedType)}
                        className="w-full px-2.5 py-1.5 text-xs font-bold border border-teal-200 rounded-lg bg-white focus:outline-teal-500 text-teal-950"
                      >
                        {['BMCC', 'BMCR', 'CSC 1', 'CSC 2', 'CGC', 'PDC', 'BLC 1', 'BLC 2', 'BLC 3', 'CBB'].map(ft => (
                          <option key={ft} value={ft}>{ft}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Male Daily Intake *</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          required
                          value={newFgMale}
                          onChange={e => setNewFgMale(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 text-xs font-bold border border-teal-200 rounded-lg bg-white focus:outline-teal-500 text-teal-950 pr-14"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-teal-600">
                          g/bird
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-1 border-t border-teal-200/50">
                <button
                  type="button"
                  onClick={() => { setShowAddFeedGuide(false); setEditingFgItem(null); }}
                  className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs rounded-xl font-medium cursor-pointer hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-teal-600 text-white text-xs rounded-xl font-bold hover:bg-teal-700 shadow-xs cursor-pointer transition flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editingFgItem ? 'Update Guideline' : 'Save Guideline'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Guidelines Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200/80">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200/80">
                  <th className="py-2.5 px-3">Age (Wks)</th>
                  <th className="py-2.5 px-3">Breed Type</th>
                  <th className="py-2.5 px-3">Production Phase</th>
                  <th className="py-2.5 px-3">
                    <span className="flex items-center gap-1 text-rose-800">
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                      Female Guide (Feed Type • Intake)
                    </span>
                  </th>
                  <th className="py-2.5 px-3">
                    <span className="flex items-center gap-1 text-teal-800">
                      <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                      Male Guide (Feed Type • Intake)
                    </span>
                  </th>
                  {permissions.canManageFarmProfile && <th className="py-2.5 px-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(farmProfile.standardFeedGuide || [])
                  .filter(item => {
                    if (fgBreedFilter === 'All') return true;
                    return (item.breedType || 'Cobb 500').toLowerCase().includes(fgBreedFilter.toLowerCase());
                  })
                  .map((item) => {
                    const itemBreed = item.breedType || 'Cobb 500';
                    const isCobb = itemBreed.toLowerCase().includes('cobb');
                    const isRoss = itemBreed.toLowerCase().includes('ross');
                    const femaleType = item.femaleFeedType || item.recommendedFeedType || 'BLC 1';
                    const maleType = item.maleFeedType || (item.ageWeek >= 20 ? 'BMCC' : (item.recommendedFeedType || 'BMCC'));

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-2.5 px-3 font-bold text-slate-900 whitespace-nowrap">
                          Week {item.ageWeek}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${
                            isCobb
                              ? 'bg-sky-50 text-sky-800 border-sky-200'
                              : isRoss
                              ? 'bg-purple-50 text-purple-800 border-purple-200'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}>
                            {itemBreed}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-700">
                          {item.productionPhase}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 border border-rose-200 font-bold text-[11px]">
                              {femaleType}
                            </span>
                            <span className="font-bold text-slate-900">
                              {item.femaleGramsPerBird} g/bird
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200 font-bold text-[11px]">
                              {maleType}
                            </span>
                            <span className="font-bold text-slate-900">
                              {item.maleGramsPerBird} g/bird
                            </span>
                          </div>
                        </td>
                        {permissions.canManageFarmProfile && (
                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleOpenEditFeedGuide(item)}
                                className="p-1 text-slate-400 hover:text-teal-600 rounded transition cursor-pointer"
                                title="Edit guideline"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              {permissions.canDeleteRecord && (
                                <button
                                  onClick={() => handleDeleteFeedGuide(item.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                                  title="Delete guideline"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Standard Henday % */}
      {activeTab === 'henday' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Standard Henday % Production Curve</h3>
              <p className="text-xs text-slate-500">Expected lay curve and hatching egg % per production age</p>
            </div>
            {permissions.canManageFarmProfile && (
              <button
                onClick={() => setShowAddHd(true)}
                className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition self-start shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Henday Target</span>
              </button>
            )}
          </div>

          {showAddHd && (
            <form onSubmit={handleAddHenday} className="p-4 bg-teal-50/70 border border-teal-200/80 rounded-2xl space-y-3 animate-fadeIn">
              <p className="text-xs font-bold text-teal-950">Add Standard Henday Target</p>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Age (Wks)</label>
                  <input
                    type="number"
                    value={newHdWeek}
                    onChange={e => setNewHdWeek(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-teal-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Prod Week</label>
                  <input
                    type="number"
                    value={newHdProdWeek}
                    onChange={e => setNewHdProdWeek(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-teal-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Standard Henday % *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newHdPct}
                    onChange={e => setNewHdPct(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-teal-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Standard HE % *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newHdHePct}
                    onChange={e => setNewHdHePct(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-teal-500 outline-hidden"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddHd(false)}
                  className="px-3 py-1 bg-white border border-slate-200 text-slate-700 text-xs rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-teal-600 text-white text-xs rounded-lg font-semibold hover:bg-teal-700 shadow-xs"
                >
                  Add Target
                </button>
              </div>
            </form>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200/80">
                  <th className="py-2.5 px-3">Flock Age (Wks)</th>
                  <th className="py-2.5 px-3">Prod Week</th>
                  <th className="py-2.5 px-3">Standard Henday %</th>
                  <th className="py-2.5 px-3">Standard HE % (Hatchable)</th>
                  {permissions.canDeleteRecord && <th className="py-2.5 px-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(farmProfile.standardHenday || []).map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3 font-bold text-slate-800">Week {item.ageWeek}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-600">Week {item.ageInProduction} in Lay</td>
                    <td className="py-2.5 px-3 font-bold text-teal-700">
                      {typeof item.standardHendayPct === 'number' && !isNaN(item.standardHendayPct) ? item.standardHendayPct.toFixed(1) : '0.0'}%
                    </td>
                    <td className="py-2.5 px-3 font-bold text-teal-900">
                      {typeof item.standardHatchingPct === 'number' && !isNaN(item.standardHatchingPct) ? item.standardHatchingPct.toFixed(1) : '0.0'}%
                    </td>
                    {permissions.canDeleteRecord && (
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => handleDeleteHenday(item.id)}
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
      )}

      {/* Tab 5: Standard Body Weights */}
      {activeTab === 'bodyweight' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Standard Body Weight Curves</h3>
              <p className="text-xs text-slate-500">Benchmark weights in grams for Males and Females</p>
            </div>
            {permissions.canManageFarmProfile && (
              <button
                onClick={() => setShowAddBw(true)}
                className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition self-start shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Body Weight Standard</span>
              </button>
            )}
          </div>

          {showAddBw && (
            <form onSubmit={handleAddBodyWeight} className="p-4 bg-teal-50/70 border border-teal-200/80 rounded-2xl space-y-3 animate-fadeIn">
              <p className="text-xs font-bold text-teal-950">Add Standard Body Weight Target</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Age (Wks)</label>
                  <input
                    type="number"
                    value={newBwWeek}
                    onChange={e => setNewBwWeek(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-teal-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Male Target (g) *</label>
                  <input
                    type="number"
                    value={newBwMale}
                    onChange={e => setNewBwMale(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-teal-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Female Target (g) *</label>
                  <input
                    type="number"
                    value={newBwFemale}
                    onChange={e => setNewBwFemale(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-teal-500 outline-hidden"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddBw(false)}
                  className="px-3 py-1 bg-white border border-slate-200 text-slate-700 text-xs rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-teal-600 text-white text-xs rounded-lg font-semibold hover:bg-teal-700 shadow-xs"
                >
                  Save Standard
                </button>
              </div>
            </form>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200/80">
                  <th className="py-2.5 px-3">Age (Wks)</th>
                  <th className="py-2.5 px-3">Male Standard (g)</th>
                  <th className="py-2.5 px-3">Female Standard (g)</th>
                  <th className="py-2.5 px-3">Male / Female Ratio (g)</th>
                  {permissions.canDeleteRecord && <th className="py-2.5 px-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(farmProfile.standardBodyWeights || []).map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3 font-bold text-slate-800">Week {item.ageWeek}</td>
                    <td className="py-2.5 px-3 font-semibold text-teal-950">{(item.maleStandardGrams || 0).toLocaleString()} g</td>
                    <td className="py-2.5 px-3 font-semibold text-teal-700">{(item.femaleStandardGrams || 0).toLocaleString()} g</td>
                    <td className="py-2.5 px-3 text-slate-500 font-medium">
                      {(() => {
                        const m = item.maleStandardGrams || 0;
                        const f = item.femaleStandardGrams || 0;
                        const diff = m - f;
                        const ratio = f > 0 ? (m / f).toFixed(2) : '1.00';
                        return `+${isNaN(diff) ? 0 : diff} g (${ratio}x)`;
                      })()}
                    </td>
                    {permissions.canDeleteRecord && (
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => handleDeleteBodyWeight(item.id)}
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
      )}

      {/* Tab 6: Standard Egg Weights */}
      {activeTab === 'eggweight' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Standard Egg Weight Progression</h3>
              <p className="text-xs text-slate-500">Benchmark hatching egg weight in grams per production age</p>
            </div>
            {permissions.canManageFarmProfile && (
              <button
                onClick={() => setShowAddEw(true)}
                className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition self-start shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Egg Weight Target</span>
              </button>
            )}
          </div>

          {showAddEw && (
            <form onSubmit={handleAddEggWeight} className="p-4 bg-teal-50/70 border border-teal-200/80 rounded-2xl space-y-3 animate-fadeIn">
              <p className="text-xs font-bold text-teal-950">Add Standard Egg Weight Target</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Flock Age (Wks)</label>
                  <input
                    type="number"
                    value={newEwWeek}
                    onChange={e => setNewEwWeek(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-teal-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Production Week</label>
                  <input
                    type="number"
                    value={newEwProdWeek}
                    onChange={e => setNewEwProdWeek(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-teal-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Standard Weight (g) *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newEwGrams}
                    onChange={e => setNewEwGrams(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-teal-500 outline-hidden"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddEw(false)}
                  className="px-3 py-1 bg-white border border-slate-200 text-slate-700 text-xs rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-teal-600 text-white text-xs rounded-lg font-semibold hover:bg-teal-700 shadow-xs"
                >
                  Save Standard
                </button>
              </div>
            </form>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200/80">
                  <th className="py-2.5 px-3">Flock Age (Wks)</th>
                  <th className="py-2.5 px-3">Production Week</th>
                  <th className="py-2.5 px-3">Standard Egg Weight (g)</th>
                  {permissions.canDeleteRecord && <th className="py-2.5 px-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(farmProfile.standardEggWeights || []).map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3 font-bold text-slate-800">Week {item.ageWeek}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-600">Week {item.ageInProduction} of Lay</td>
                    <td className="py-2.5 px-3 font-bold text-teal-700">
                      {typeof item.standardWeightGrams === 'number' && !isNaN(item.standardWeightGrams) ? item.standardWeightGrams.toFixed(1) : '0.0'} g
                    </td>
                    {permissions.canDeleteRecord && (
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => handleDeleteEggWeight(item.id)}
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
      )}

      {/* Company Logo Upload Modal */}
      <CompanyLogoUploadModal
        isOpen={showLogoModal}
        onClose={() => setShowLogoModal(false)}
        currentLogoUrl={farmProfile.logoUrl}
        farmName={farmProfile.name}
        onSaveLogo={handleSaveLogo}
      />
    </div>
  );
};
