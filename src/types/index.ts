export type UserRole = 
  | 'admin'
  | 'farm_manager'
  | 'flockman'
  | 'leadman'
  | 'egg_collector'
  | 'System Administrator'
  | 'Farm Manager'
  | 'Flockman'
  | 'Leadman'
  | 'Egg Collector';

export type UserStatus = 'pending' | 'active' | 'approved' | 'rejected' | 'suspended' | 'disabled';

export interface UserAccount {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  designatedHouses: string[]; // e.g. ['House 1', 'House 2']
  createdAt: string;
  registeredAt?: string;
  lastLogin?: string;
  securityQuestion: string;
  securityAnswer: string;
  securityAnswerHash?: string;
  securityAnswerSalt?: string;
  contactNumber?: string;
  // Enhanced Password & Account Security
  passwordHash?: string;
  passwordSalt?: string;
  failedLoginAttempts?: number;
  lockedUntil?: string | null;
  requirePasswordChange?: boolean;
  passwordChangedAt?: string;
}

export type User = UserAccount;

export type BreedType = 'Ross' | 'Cobb' | 'Ross 308' | 'Cobb 500' | 'Hubbard' | 'Arbor Acres' | 'All Breeds' | string;

export interface PenConfig {
  id: string;
  name: string; // e.g. "Pen L1"
  side: 'Left' | 'Right';
  males: number;
  females: number;
}

export interface Flock {
  id: string;
  houseNumber: string; // e.g. "House 1"
  breed: BreedType;
  loadingDateMale: string;
  loadingDateFemale: string;
  initialMales: number;
  initialFemales: number;
  currentMales: number;
  currentFemales: number;
  hatchDate?: string;
  status: 'active' | 'depleted' | 'culling';
  notes?: string;
  pens?: PenConfig[];
}

export type FeedType = 
  | 'CSC 1'
  | 'CSC 2'
  | 'CGC'
  | 'PDC'
  | 'BLC 1'
  | 'BLC 2'
  | 'BLC 3'
  | 'BMCC'
  | 'BMCR'
  | 'CBB';

export interface FeedStockEntry {
  id: string;
  feedType: FeedType;
  bags: number;
  kgPerBag: number; // default 50
  totalKg: number;
  date: string;
  batchNumber?: string;
  supplier?: string;
  notes?: string;
  createdAt: string;
}

export interface FeedConsumptionRecord {
  id: string;
  houseNumber: string;
  date: string;
  side?: 'Left' | 'Right' | 'All';
  penId?: string;
  
  // Female feeding specifications
  femaleFeedType?: FeedType;
  femaleQuantityKg?: number;
  femaleGramsPerBird?: number;
  
  // Male feeding specifications
  maleFeedType?: FeedType;
  maleQuantityKg?: number;
  maleGramsPerBird?: number;

  // General / Legacy / Total
  feedType: FeedType;
  quantityKg: number;
  targetKg?: number;
  loggedBy: string;
  notes?: string;
  createdAt: string;
}

export type DepletionReason = 'Mortality' | 'Spot Cull' | 'Missex' | 'Spent Cull';

export interface DepletionRecord {
  id: string;
  houseNumber: string;
  date: string;
  side: 'Left' | 'Right';
  penName?: string;
  category: DepletionReason;
  maleCount: number;
  femaleCount: number;
  sourceModule: 'flockman' | 'mortality_mgmt';
  reasonDetails?: string;
  loggedBy: string;
  createdAt: string;
}

export interface BirdTransferRecord {
  id: string;
  date: string;
  sourceHouse: string;
  sourceSide?: 'Left' | 'Right';
  sourcePenName?: string;
  destHouse: string;
  destSide?: 'Left' | 'Right';
  destPenName?: string;
  maleCount: number;
  femaleCount: number;
  reason?: string;
  loggedBy: string;
  createdAt: string;
}

export type ProductType = 
  | 'Vaccine'
  | 'Medicine'
  | 'Supplement'
  | 'Antibiotic'
  | 'Disinfectant'
  | 'paraphernalias'
  | 'Vitamins'
  | 'Dewormer';

export type MedProductType = ProductType;

export type UnitType = 'Vial' | 'bottle' | 'bag' | 'box' | 'piece';

export interface MedProduct {
  id: string;
  name: string;
  type: ProductType;
  manufacturer: string;
  manufacturingDate: string;
  expirationDate: string;
  expiryDate?: string;
  unitType: UnitType;
  packaging?: string;
  supplier?: string;
  dosage?: string;
  dosesPerUnit: number;
  currentStockUnits: number; // in units (vials, bottles, bags)
  currentStock?: number;
  minAlertUnits?: number;
  notes?: string;
}

export interface MedStockLog {
  id: string;
  productId: string;
  productName: string;
  date: string;
  unitsAdded: number;
  lotNumber?: string;
  notes?: string;
  createdAt: string;
}

export interface MedAdministrationRecord {
  id: string;
  houseNumber: string;
  date: string;
  productId: string;
  productName: string;
  productType: ProductType;
  method: 'Drinking Water' | 'Eye Drop' | 'Wing Web' | 'Spray' | 'Subcutaneous Injection' | 'Intramuscular Injection' | 'Feed Mix' | 'Disinfection Spray' | 'Other' | string;
  unitsUsed: number;
  quantityDoses?: number;
  totalDosesAdministered: number;
  peripheralsUsed: string; // e.g. "Automatic vaccinator, 0.5ml needles, dye"
  administeredBy?: string;
  status?: 'completed' | 'scheduled' | 'cancelled';
  loggedBy: string;
  notes?: string;
  createdAt: string;
}

export interface StandardMedProgramItem {
  id: string;
  ageWeek: number;
  ageDays?: number;
  productName: string;
  productType: ProductType;
  diseaseTarget: string; // e.g. "ND + IB + IBD"
  method: string;
  mandatory: boolean;
  notes?: string;
}

export interface StandardFeedGuideItem {
  id: string;
  breedType?: string; // e.g. 'Cobb 500' | 'Ross 308' | 'Hubbard' | 'Arbor Acres' | 'All Breeds'
  ageWeek: number;
  productionPhase: string;
  femaleFeedType?: FeedType; // Feed type for female birds
  femaleGramsPerBird: number;
  maleFeedType?: FeedType; // Feed type for male birds
  maleGramsPerBird: number;
  recommendedFeedType?: FeedType; // Standard / general feed type
}

export interface StandardHendayItem {
  id: string;
  ageWeek: number;
  ageInProduction: number; // e.g. Week 1 of production = 24 weeks age
  standardHendayPct: number;
  standardHatchingPct: number;
}

export interface StandardBodyWeightItem {
  id: string;
  ageWeek: number;
  maleStandardGrams: number;
  femaleStandardGrams: number;
  toleranceMinGrams?: number;
  toleranceMaxGrams?: number;
}

export interface StandardEggWeightItem {
  id: string;
  ageWeek: number;
  ageInProduction: number;
  standardWeightGrams: number;
}

export interface BodyWeightRecord {
  id: string;
  houseNumber: string;
  week: number;
  date: string;
  maleAvgWeightGrams: number;
  femaleAvgWeightGrams: number;
  sampleSize?: number;
  uniformityPct?: number;
  weeklyGainMale?: number;
  weeklyGainFemale?: number;
  loggedBy: string;
  notes?: string;
  createdAt: string;
}

export interface EggCollectionEntry {
  id: string;
  collectionNumber: number;
  collectionTime: string;
  leftSideCount: number;
  rightSideCount: number;
  totalCount: number;
}

export interface EggSortingBreakdown {
  hatchingEggs: {
    total: number;
    heNest: number;
    heFloor: number;
    jumbo?: number;
    extraLarge?: number;
    large?: number;
    medium?: number;
    small?: number;
    peeWee?: number;
  };
  nonHatchingEggs: {
    total: number;
    dirty: number;
    cracked: number;
    broken: number;
    abnormal: number;
    doubleYolk: number;
    softShelled: number;
    misshapen: number;
    leakers: number;
    small?: number;
    thinShell?: number;
    others?: number;
  };
}

export interface EggProductionRecord {
  id: string;
  houseNumber: string; // e.g. "House 1"
  date: string; // YYYY-MM-DD
  
  // Standard egg fields
  heNest?: number;
  heFloor?: number;
  small?: number;
  thinShell?: number;
  misshape?: number;
  doubleYolk?: number;
  broken?: number;
  spoiled?: number;
  others?: number;
  
  // High-level computed properties
  totalHE?: number;
  totalNHE?: number;
  tep?: number;
  totalEggs?: number;
  totalHatchingEggs?: number;
  totalNonHatchingEggs?: number;
  hatchingEggPct?: number;
  nonHatchingEggPct?: number;
  hendayPct?: number;
  
  // Extended fields
  collections?: EggCollectionEntry[];
  sorting?: EggSortingBreakdown;
  sampleEggWeightGrams?: number;
  femalePopulationAtDate?: number;
  
  loggedBy: string;
  notes?: string;
  createdAt: string;
}

export interface WeeklyEggWeightRecord {
  id: string;
  houseNumber: string;
  date: string;
  ageInProductionWeeks: number;
  weightGrams: number;
  sampleSize?: number;
  loggedBy: string;
  notes?: string;
  createdAt: string;
}

export interface FarmProfile {
  name: string;
  logoUrl?: string;
  address: string;
  contactNumber: string;
  email: string;
  establishedYear: string;
  currency: string;
  farmOwners?: string;
  presidentCeo?: string;
  cfo?: string;
  animalHealthSpecialist?: string;
  animalProductionSpecialist?: string;
  industrySector?: string;
  primaryBreeds?: string;
  facilityHousesCount?: string;
  totalBirdCapacity?: string;
  dailyEggCapacity?: string;
  farmOverviewNotes?: string;
  standardVaccinationProgram: StandardMedProgramItem[];
  standardFeedGuide: StandardFeedGuideItem[];
  standardHenday: StandardHendayItem[];
  standardBodyWeights: StandardBodyWeightItem[];
  standardEggWeights: StandardEggWeightItem[];
}

export type BiosecurityCategory = 
  | 'sanitation'
  | 'site_access'
  | 'personal_hygiene'
  | 'pest_control'
  | 'egg_room'
  | 'water_safety';

export type BiosecurityFrequency = 'daily' | 'per_entry' | 'weekly' | 'per_shift';
export type BiosecurityCriticalLevel = 'mandatory' | 'high' | 'standard';
export type BiosecurityStatus = 'pass' | 'fail' | 'na';

export interface BiosecurityRequirement {
  id: string;
  title: string;
  description: string;
  category: BiosecurityCategory;
  frequency: BiosecurityFrequency;
  targetArea: string;
  criticalLevel: BiosecurityCriticalLevel;
  active: boolean;
  createdBy?: string;
  createdAt: string;
}

export interface BiosecurityVerificationLog {
  id: string;
  date: string; // YYYY-MM-DD
  requirementId: string;
  requirementTitle: string;
  category: BiosecurityCategory;
  targetArea: string;
  status: BiosecurityStatus;
  verified: boolean;
  verifiedBy: string;
  verifiedByName: string;
  verifiedAt: string;
  notes?: string;
  correctiveAction?: string;
}

export interface BiosecurityDailySummary {
  date: string; // YYYY-MM-DD
  totalRequirements: number;
  verifiedCount: number;
  passedCount: number;
  failedCount: number;
  complianceScorePct: number;
  supervisorSignoff: boolean;
  supervisorSignoffBy?: string;
  supervisorSignoffAt?: string;
  supervisorNotes?: string;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  category: 'auth' | 'flock' | 'feed' | 'mortality' | 'medicine' | 'bodyweight' | 'egg_prod' | 'admin' | 'biosecurity' | 'system' | 'backup';
  module?: string;
  performedBy?: string;
  details: string;
  houseNumber?: string;
}

export interface DeliveryHouseRecord {
  houseNumber: string; // e.g. "1", "2", "3", "4", "5", "6" or "House 1"
  date5PercentHD?: string; // Date reached 5% HD lay
  nheDelivered: number; // Non-Hatching Eggs delivered
  nheShortOver: number; // Discrepancy (- for short, + for over)
  netNheReceived: number; // Net NHE received at hatchery (nheDelivered + nheShortOver)
  heDelivered: number; // Hatching Eggs delivered
  heShortOver: number; // Discrepancy (- for short, + for over)
  netHeReceived: number; // Net HE received at hatchery (heDelivered + heShortOver)
  totalEggsReceived: number; // netNheReceived + netHeReceived
  // Transit / Handling (HE)
  transitBreakage: number;
  transitHairline: number;
  transitSpoils: number;
  intactHeReceived: number; // netHeReceived - (transitBreakage + transitHairline + transitSpoils)
  // NHE Removed at Hatchery Sorting (Regrading)
  regradingDirty: number;
  regradingThinShell: number;
  regradingMisShape: number;
  regradingOffSize: number;
  regradingCrack: number;
  regradingSpoil: number;
  regradingJRS: number; // Jumbo/Round/Small
  totalNheSorting: number; // Sum of regrading defects
  totalSettableEggs: number; // intactHeReceived - totalNheSorting
}

export type DeliveryStatus = 'Draft' | 'Dispatched' | 'In-Transit' | 'Received' | 'Regraded' | 'Completed';

export interface DeliveryRecord {
  id: string;
  esrrrNumber: string; // e.g. "LPL20260809"
  companyName: string; // "SAN MIGUEL FOODS, INC."
  farmName: string; // "L. P. LIM CITY FAMILY FARM, INC."
  farmCode: string; // "LPL"
  farmAddress: string; // "GEN. AGUINALDO, RAMON, ISABELA"
  productionDate: string; // YYYY-MM-DD
  dateReceived: string; // YYYY-MM-DD
  dateRegraded?: string; // YYYY-MM-DD
  hatcheryName: string; // e.g. "MJBJ Hatchery" / "MJBJ"
  status: DeliveryStatus;

  // House-by-house line items
  items: DeliveryHouseRecord[];

  // Totals (computed / cached for summary and search)
  totalNheDelivered: number;
  totalNheShortOver: number;
  totalNetNheReceived: number;
  totalHeDelivered: number;
  totalHeShortOver: number;
  totalNetHeReceived: number;
  totalEggsReceived: number;
  totalTransitBreakage: number;
  totalTransitHairline: number;
  totalTransitSpoils: number;
  totalIntactHeReceived: number;
  totalRegradingDirty: number;
  totalRegradingThinShell: number;
  totalRegradingMisShape: number;
  totalRegradingOffSize: number;
  totalRegradingCrack: number;
  totalRegradingSpoil: number;
  totalRegradingJRS: number;
  totalNheSorting: number;
  totalSettableEggs: number;

  // Logistics & Container Breakdown
  cratesGreen: number; // e.g. 163
  cratesRed: number; // e.g. 4
  totalCrates: number; // 167
  traysOrange: number; // e.g. 2259
  traysYellow: number; // e.g. 44
  traysGreen?: number; // e.g. 0
  traysRed?: number; // e.g. 0
  totalTrays: number; // sum of trays
  timeArrival: string; // e.g. "14:00"
  timeReceived: string; // e.g. "15:13"
  eggShellTemperature: number; // e.g. 21.2 °C
  plateNumber: string; // e.g. "CAL 4567"
  driverName?: string;

  // Signatures & Signoffs
  preparedBy: string; // "VON CARLO S. FRANCISCO"
  farmOic: string; // "CHERYLE U. BAYDUA"
  checkedByFarm: string; // "MARK MARLON TIU"
  receivedByHatchery: string; // "G. ROMANO"
  checkedByHatchery: string; // "SC AGONIOR"

  notes?: string;
  loggedBy: string;
  createdAt: string;
  updatedAt?: string;
}

export interface HatchingSummaryRecord {
  id: string;
  settingDate: string; // Setting Date (YYYY-MM-DD)
  houseNumber: string; // House (e.g. "1", "2", "3", "4", "5", "6" or "House 1")
  breed: string; // Breed (e.g. "Cobb 500", "Ross 308")
  eggsSet: number; // # of Eggs set
  pullOutDate: string; // Pull-out Date (YYYY-MM-DD)
  standardChicks: number; // Standard Chicks
  gradeOut: number; // Grade out
  totalChicksPulled: number; // Total Chicks Pulled = standardChicks + gradeOut
  totalHatchPct: number; // Total Hatch % = (totalChicksPulled / eggsSet) * 100
  saleableHatchPct: number; // Saleable Hatch % = (standardChicks / eggsSet) * 100
  gradeOutPct?: number; // (gradeOut / eggsSet) * 100
  hatcheryName?: string; // e.g. "MJBJ Hatchery"
  deliveryId?: string; // Reference to ESRRR delivery batch
  esrrrNumber?: string; // Reference to ESRRR voucher number
  notes?: string;
  loggedBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export type ModuleType = 
  | 'dashboard'
  | 'farm_profile'
  | 'feed_inventory'
  | 'flock'
  | 'flock_list'
  | 'flockman'
  | 'flockman_module'
  | 'mortality'
  | 'medicine'
  | 'body_weight'
  | 'egg_production'
  | 'delivery'
  | 'reports'
  | 'settings';


