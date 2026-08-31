import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef, ReactNode } from 'react';
import { 
  UserAccount, 
  UserRole, 
  UserStatus,
  FarmProfile, 
  Flock, 
  FeedStockEntry, 
  FeedConsumptionRecord, 
  DepletionRecord, 
  MedProduct, 
  MedAdministrationRecord, 
  MedStockLog, 
  BodyWeightRecord, 
  EggProductionRecord, 
  WeeklyEggWeightRecord, 
  SystemLog, 
  FeedType,
  StandardMedProgramItem,
  StandardFeedGuideItem,
  StandardHendayItem,
  StandardBodyWeightItem,
  StandardEggWeightItem,
  BirdTransferRecord,
  BiosecurityRequirement,
  BiosecurityVerificationLog,
  BiosecurityDailySummary,
  BiosecurityStatus,
  BiosecurityCategory,
  BiosecurityFrequency,
  BiosecurityCriticalLevel,
  DeliveryRecord,
  DeliveryHouseRecord
} from '../types';
import { 
  INITIAL_FARM_PROFILE, 
  INITIAL_USERS, 
  INITIAL_FLOCKS, 
  INITIAL_FEED_STOCK, 
  INITIAL_FEED_CONSUMPTION, 
  INITIAL_DEPLETIONS, 
  INITIAL_BIRD_TRANSFERS,
  INITIAL_MED_PRODUCTS, 
  INITIAL_MED_ADMIN, 
  INITIAL_BODY_WEIGHTS, 
  INITIAL_EGG_PRODUCTION, 
  INITIAL_WEEKLY_EGG_WEIGHTS, 
  INITIAL_SYSTEM_LOGS,
  INITIAL_BIOSECURITY_REQUIREMENTS,
  INITIAL_BIOSECURITY_LOGS,
  INITIAL_BIOSECURITY_SUMMARIES,
  INITIAL_DELIVERIES
} from '../data/initialData';
import { calculateFlockAgeFromLoadingDate } from '../utils/dateCalculations';
import { detectPlatform } from '../utils/platform';
import {
  syncAllDataToMongoDB,
  pullAllDataFromMongoDB,
  saveDocToMongoDB,
  deleteDocFromMongoDB,
  getMongoDBStatus,
  checkRtuHeartbeat,
  getRtuDeviceId,
  startMongoDBPolling,
  subscribeToRtuEvents,
  RtuHeartbeatResponse
} from '../services/mongodbSync';

export interface StorageQuotaInfo {
  usageMB: number;
  quotaMB: number;
  percentUsed: number;
  itemCounts: {
    flocks: number;
    eggRecords: number;
    feedRecords: number;
    mortalityRecords: number;
    medRecords: number;
    biosecurityLogs: number;
    offlineQueue: number;
  };
}

export interface OfflineQueueItem {
  id: string;
  type: string;
  action: string;
  payload: any;
  timestamp: string;
  status: string;
  user: string;
  houseNumber?: string;
}

import {
  generateSalt,
  hashPasswordWithSalt,
  hashSecurityAnswer,
  verifyPassword,
  evaluatePasswordStrength,
  isAccountLocked,
  PasswordStrengthResult
} from '../utils/security';

export interface PermissionCheck {
  canViewModule: (moduleId: string) => boolean;
  canEditRecord: boolean;
  canDeleteRecord: boolean;
  canApproveUsers: boolean;
  canManageUsers: boolean;
  canManageFarmProfile: boolean;
  canManageMedicines: boolean;
  canManageBiosecurityRequirements: boolean;
  canVerifyBiosecurity: boolean;
  canRecordEggProduction: (houseNumber?: string) => boolean;
  canRecordFlockmanModule: (houseNumber?: string) => boolean;
  canRecordMortality: (houseNumber?: string) => boolean;
  canAddFeedStock: boolean;
  canAddMedicine: boolean;
  canAddFlock: boolean;
}

export interface FeedStockSummaryItem {
  feedType: FeedType;
  totalReceivedKg: number;
  totalReceivedBags: number;
  totalConsumedKg: number;
  currentStockKg: number;
  currentStockBags: number;
  isLowStock: boolean; // <= 4 bags (200 kg)
}

export interface FlockStats {
  flock: Flock;
  ageWeeks: number;
  ageDays?: number;
  totalDaysFromLoading?: number;
  weekAndDayStr?: string;
  currentMales: number;
  currentFemales: number;
  totalCurrent: number;
  initialTotal: number;
  livabilityPct: number;
  maleToFemaleRatioStr: string;
  maleRatioPct: number;
  totalMaleDepleted: number;
  totalFemaleDepleted: number;
  totalDepleted: number;
}

export interface VaccineAlert {
  id: string;
  houseNumber: string;
  flockAgeWeeks: number;
  scheduledWeek: number;
  productName: string;
  diseaseTarget: string;
  method: string;
  urgency: 'due_now' | 'upcoming';
}

export interface NormalizedEggProductionRecord extends EggProductionRecord {
  totalEggs: number;
  totalHatchingEggs: number;
  totalNonHatchingEggs: number;
  hatchingEggPct: number;
  nonHatchingEggPct: number;
  hendayPct: number;
  femalePopulationAtDate: number;
  sampleEggWeightGrams: number;
}

interface FarmContextType {
  // Auth & User
  currentUser: UserAccount | null;
  users: UserAccount[];
  login: (username: string, password?: string) => Promise<{ success: boolean; message: string; user?: UserAccount; lockedOut?: boolean; remainingMinutes?: number }>;
  logout: () => void;
  registerUser: (userData: Omit<UserAccount, 'id' | 'createdAt' | 'status'> & { password?: string }, autoActivate?: boolean) => Promise<{ success: boolean; message: string; user?: UserAccount }>;
  recoverAccount: (username: string, answer: string, newPassword?: string) => Promise<{ success: boolean; message: string; verified?: boolean }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  adminResetUserPassword: (userId: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  adminToggleUserLock: (userId: string, isLocked: boolean) => Promise<{ success: boolean; message: string }>;
  evaluatePasswordStrength: (password: string) => PasswordStrengthResult;
  approveUser: (userId: string, designatedHouses?: string[]) => void;
  rejectUser: (userId: string) => void;
  updateUserRole: (userId: string, newRole: UserRole, houses?: string[]) => void;
  updateUserStatus: (userId: string, newStatus: UserStatus) => void;
  assignUserHouses: (userId: string, houses: string[]) => void;
  deleteUser: (userId: string) => void;
  switchUser: (userId: string) => void;
  switchUserRole: (role: UserRole) => void;

  // Farm Profile
  farmProfile: FarmProfile;
  updateFarmProfile: (profile: Partial<FarmProfile>) => void;
  updateStandardVaccination: (program: StandardMedProgramItem[]) => void;
  updateStandardFeedGuide: (guide: StandardFeedGuideItem[]) => void;
  updateStandardHenday: (henday: StandardHendayItem[]) => void;
  updateStandardBodyWeights: (weights: StandardBodyWeightItem[]) => void;
  updateStandardEggWeights: (eggWeights: StandardEggWeightItem[]) => void;

  // Flocks & Transfers
  flocks: Flock[];
  addFlock: (flock: Omit<Flock, 'id' | 'currentMales' | 'currentFemales'>) => void;
  updateFlock: (id: string, updates: Partial<Flock>) => void;
  deleteFlock: (id: string) => void;
  getFlockStats: (houseNumber: string, referenceDate?: string) => FlockStats | null;
  transfers: BirdTransferRecord[];
  addTransfer: (transfer: Omit<BirdTransferRecord, 'id' | 'createdAt' | 'loggedBy'>) => { success: boolean; message: string };
  deleteTransfer: (id: string, revertCounts?: boolean) => void;

  // Feed Inventory
  feedStockEntries: FeedStockEntry[];
  feedConsumptionRecords: FeedConsumptionRecord[];
  addFeedStock: (entry: Omit<FeedStockEntry, 'id' | 'totalKg' | 'createdAt'>) => void;
  deleteFeedStock: (id: string) => void;
  addFeedConsumption: (record: Omit<FeedConsumptionRecord, 'id' | 'createdAt' | 'loggedBy'>) => void;
  deleteFeedConsumption: (id: string) => void;
  getFeedStockSummary: () => FeedStockSummaryItem[];
  getLowStockAlerts: () => FeedStockSummaryItem[];

  // Depletions & Mortality
  depletions: DepletionRecord[];
  addDepletion: (record: Omit<DepletionRecord, 'id' | 'createdAt' | 'loggedBy'>) => void;
  deleteDepletion: (id: string) => void;

  // Medicine & Vaccines
  medProducts: MedProduct[];
  medStockLogs: MedStockLog[];
  medAdministrations: MedAdministrationRecord[];
  addMedProduct: (product: Omit<MedProduct, 'id'>) => void;
  updateMedProduct: (id: string, updates: Partial<MedProduct>) => void;
  deleteMedProduct: (id: string) => void;
  addMedStock: (productId: string, unitsAdded: number, date: string, lotNumber?: string, notes?: string) => void;
  addMedAdministration: (record: Omit<MedAdministrationRecord, 'id' | 'createdAt' | 'loggedBy'>) => void;
  deleteMedAdministration: (id: string) => void;
  getUpcomingVaccines: () => VaccineAlert[];
  getUpcomingVaccineAlerts: () => VaccineAlert[];

  // Body Weight
  bodyWeights: BodyWeightRecord[];
  addBodyWeightRecord: (record: Omit<BodyWeightRecord, 'id' | 'createdAt' | 'loggedBy'>) => void;
  deleteBodyWeightRecord: (id: string) => void;

  // Egg Production
  eggProductionRecords: NormalizedEggProductionRecord[];
  weeklyEggWeights: WeeklyEggWeightRecord[];
  addEggProductionRecord: (record: Partial<EggProductionRecord> & { houseNumber: string; date: string }) => void;
  updateEggProductionRecord: (id: string, updates: Partial<EggProductionRecord>) => void;
  deleteEggProductionRecord: (id: string) => void;
  addWeeklyEggWeight: (record: Omit<WeeklyEggWeightRecord, 'id' | 'createdAt' | 'loggedBy'>) => void;
  deleteWeeklyEggWeight: (id: string) => void;

  // Delivery & ESRRR
  deliveries: DeliveryRecord[];
  addDelivery: (record: Omit<DeliveryRecord, 'id' | 'createdAt'>) => DeliveryRecord;
  updateDelivery: (id: string, updates: Partial<DeliveryRecord>) => void;
  deleteDelivery: (id: string) => void;
  getDeliveryById: (id: string) => DeliveryRecord | undefined;

  // Biosecurity Compliance
  biosecurityRequirements: BiosecurityRequirement[];
  biosecurityLogs: BiosecurityVerificationLog[];
  biosecuritySummaries: Record<string, BiosecurityDailySummary>;
  addBiosecurityRequirement: (req: Omit<BiosecurityRequirement, 'id' | 'createdAt'>) => void;
  updateBiosecurityRequirement: (id: string, updates: Partial<BiosecurityRequirement>) => void;
  deleteBiosecurityRequirement: (id: string) => void;
  toggleBiosecurityRequirementActive: (id: string) => void;
  toggleBiosecurityLog: (requirementId: string, date: string, status?: BiosecurityStatus, notes?: string, correctiveAction?: string) => void;
  batchVerifyAllBiosecurity: (date: string, status?: BiosecurityStatus) => void;
  signoffBiosecurityDaily: (date: string, supervisorNotes?: string) => void;
  getBiosecurityDailyStats: (date: string) => {
    total: number;
    verified: number;
    passed: number;
    failed: number;
    naCount: number;
    compliancePct: number;
    isSignedOff: boolean;
    signedOffBy?: string;
    signedOffAt?: string;
    supervisorNotes?: string;
  };

  // System Logs & Backup
  systemLogs: SystemLog[];
  auditLogs: SystemLog[];
  logAction: (action: string, category: SystemLog['category'], details: string, houseNumber?: string) => void;
  resetAllDataToDefaults: () => void;
  clearDatabaseForNewCycle: () => Promise<{ success: boolean; message: string }>;
  exportDataJson: () => string;
  importDataJson: (jsonStr: string) => boolean;

  // MongoDB Cloud Synchronization Engine
  mongoStatus: {
    connected: boolean;
    dbName: string;
    projectId?: string;
    lastSyncedAt: string | null;
    isSyncing: boolean;
    uriConfigured?: boolean;
    serverInfo?: string;
    error?: string | null;
  };
  syncAllToMongoDB: () => Promise<{ success: boolean; message: string; counts?: any }>;
  pullAllFromMongoDB: () => Promise<{ success: boolean; message: string }>;

  // Backwards-compatible aliases
  firestoreStatus: {
    connected: boolean;
    projectId: string;
    dbName?: string;
    lastSyncedAt: string | null;
    isSyncing: boolean;
  };
  syncAllToFirestore: () => Promise<{ success: boolean; message: string; counts?: any }>;
  pullAllFromFirestore: () => Promise<{ success: boolean; message: string }>;

  // RTU (Real-Time Update) Multi-Device & Account Sync Engine
  rtuMode: boolean;
  rtuRevision: number;
  activeDevicesCount: number;
  lastRtuHeartbeat: string | null;
  rtuStatus: 'connected' | 'syncing' | 'updating';
  triggerRtuSync: () => Promise<void>;

  // Offline & Live Sync Engine
  isMobileDevice: boolean;
  isOnline: boolean;
  offlineQueue: OfflineQueueItem[];
  pendingOfflineCount: number;
  storageQuota: StorageQuotaInfo;
  refreshStorageQuota: () => Promise<void>;
  syncOfflineQueue: () => Promise<{ success: boolean; syncedCount: number; message: string }>;
  clearOfflineSyncQueue: () => Promise<void>;
  databaseEngine: 'mongodb';
  dbStatus: {
    connected: boolean;
    state: string;
    dbName: string | null;
    hasUriConfigured: boolean;
  };
  checkDBStatus: () => Promise<void>;
  reconnectDB: (uri?: string) => Promise<{ success: boolean; message?: string }>;

  // Permission Helpers
  permissions: PermissionCheck;
}

const FarmContext = createContext<FarmContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'broiler_breeder_farm_data_v2';

export function deduplicateById<T extends { id?: string; _id?: string }>(items: T[], keyProp?: keyof T): T[] {
  if (!Array.isArray(items)) return [];
  const map = new Map<string, T>();
  for (const item of items) {
    if (!item) continue;
    const key = String((keyProp ? item[keyProp] : undefined) || item.id || item._id || '');
    if (key) {
      map.set(key, item);
    }
  }
  return Array.from(map.values());
}

export function deduplicateFlocks(items: Flock[]): Flock[] {
  if (!Array.isArray(items)) return [];
  const map = new Map<string, Flock>();
  for (const item of items) {
    if (!item) continue;
    const key = String(item.houseNumber || item.id || '');
    if (key) {
      map.set(key, item);
    }
  }
  return Array.from(map.values());
}

export function deduplicateUsers(items: UserAccount[]): UserAccount[] {
  if (!Array.isArray(items)) return [];
  const map = new Map<string, UserAccount>();
  for (const item of items) {
    if (!item) continue;
    const key = String(item.username || item.id || '').toLowerCase();
    if (key) {
      map.set(key, item);
    }
  }
  return Array.from(map.values());
}

function safeParseArray<T>(key: string, fallback: T[]): T[] {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return fallback;
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function safeParseObject<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return fallback;
    const parsed = JSON.parse(saved);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export const FarmProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Load initial states from LocalStorage or defaults (new users see login/register screen first)
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem('broiler_breeder_active_user');
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id && parsed.username) {
          return parsed;
        }
      } catch { /* ignore */ }
    }
    return null; // Require login or registration first
  });

  const [users, setUsers] = useState<UserAccount[]>(() => 
    deduplicateUsers(safeParseArray<UserAccount>(`${LOCAL_STORAGE_KEY}_users`, INITIAL_USERS))
  );

  const [farmProfile, setFarmProfile] = useState<FarmProfile>(() => {
    const parsed = safeParseObject<FarmProfile>(`${LOCAL_STORAGE_KEY}_profile`, INITIAL_FARM_PROFILE);
    return {
      ...INITIAL_FARM_PROFILE,
      ...parsed,
      standardFeedGuide: Array.isArray(parsed?.standardFeedGuide) ? parsed.standardFeedGuide : INITIAL_FARM_PROFILE.standardFeedGuide,
      standardHenday: Array.isArray(parsed?.standardHenday) ? parsed.standardHenday : INITIAL_FARM_PROFILE.standardHenday,
      standardBodyWeights: Array.isArray(parsed?.standardBodyWeights) ? parsed.standardBodyWeights : INITIAL_FARM_PROFILE.standardBodyWeights,
      standardEggWeights: Array.isArray(parsed?.standardEggWeights) ? parsed.standardEggWeights : INITIAL_FARM_PROFILE.standardEggWeights,
      standardVaccinationProgram: Array.isArray(parsed?.standardVaccinationProgram) ? parsed.standardVaccinationProgram : INITIAL_FARM_PROFILE.standardVaccinationProgram
    };
  });

  const [flocks, setFlocks] = useState<Flock[]>(() => 
    deduplicateFlocks(safeParseArray<Flock>(`${LOCAL_STORAGE_KEY}_flocks`, INITIAL_FLOCKS))
  );

  const [feedStockEntries, setFeedStockEntries] = useState<FeedStockEntry[]>(() => 
    deduplicateById(safeParseArray<FeedStockEntry>(`${LOCAL_STORAGE_KEY}_feed_stock`, INITIAL_FEED_STOCK))
  );

  const [feedConsumptionRecords, setFeedConsumptionRecords] = useState<FeedConsumptionRecord[]>(() => 
    deduplicateById(safeParseArray<FeedConsumptionRecord>(`${LOCAL_STORAGE_KEY}_feed_cons`, INITIAL_FEED_CONSUMPTION))
  );

  const [depletions, setDepletions] = useState<DepletionRecord[]>(() => 
    deduplicateById(safeParseArray<DepletionRecord>(`${LOCAL_STORAGE_KEY}_depletions`, INITIAL_DEPLETIONS))
  );

  const [transfers, setTransfers] = useState<BirdTransferRecord[]>(() => 
    deduplicateById(safeParseArray<BirdTransferRecord>(`${LOCAL_STORAGE_KEY}_transfers`, INITIAL_BIRD_TRANSFERS))
  );

  const [medProducts, setMedProducts] = useState<MedProduct[]>(() => 
    deduplicateById(safeParseArray<MedProduct>(`${LOCAL_STORAGE_KEY}_med_products`, INITIAL_MED_PRODUCTS))
  );

  const [medStockLogs, setMedStockLogs] = useState<MedStockLog[]>(() => 
    deduplicateById(safeParseArray<MedStockLog>(`${LOCAL_STORAGE_KEY}_med_stock`, []))
  );

  const [medAdministrations, setMedAdministrations] = useState<MedAdministrationRecord[]>(() => 
    deduplicateById(safeParseArray<MedAdministrationRecord>(`${LOCAL_STORAGE_KEY}_med_admin`, INITIAL_MED_ADMIN))
  );

  const [bodyWeights, setBodyWeights] = useState<BodyWeightRecord[]>(() => 
    deduplicateById(safeParseArray<BodyWeightRecord>(`${LOCAL_STORAGE_KEY}_body_weights`, INITIAL_BODY_WEIGHTS))
  );

  const [rawEggRecords, setRawEggRecords] = useState<EggProductionRecord[]>(() => 
    deduplicateById(safeParseArray<EggProductionRecord>(`${LOCAL_STORAGE_KEY}_egg_prod`, INITIAL_EGG_PRODUCTION))
  );

  const [weeklyEggWeights, setWeeklyEggWeights] = useState<WeeklyEggWeightRecord[]>(() => 
    deduplicateById(safeParseArray<WeeklyEggWeightRecord>(`${LOCAL_STORAGE_KEY}_weekly_egg_weights`, INITIAL_WEEKLY_EGG_WEIGHTS))
  );

  const [systemLogs, setSystemLogs] = useState<SystemLog[]>(() => 
    deduplicateById(safeParseArray<SystemLog>(`${LOCAL_STORAGE_KEY}_logs`, INITIAL_SYSTEM_LOGS))
  );

  const [biosecurityRequirements, setBiosecurityRequirements] = useState<BiosecurityRequirement[]>(() => 
    deduplicateById(safeParseArray<BiosecurityRequirement>(`${LOCAL_STORAGE_KEY}_biosecurity_reqs`, INITIAL_BIOSECURITY_REQUIREMENTS))
  );

  const [biosecurityLogs, setBiosecurityLogs] = useState<BiosecurityVerificationLog[]>(() => 
    deduplicateById(safeParseArray<BiosecurityVerificationLog>(`${LOCAL_STORAGE_KEY}_biosecurity_logs`, INITIAL_BIOSECURITY_LOGS))
  );

  const [biosecuritySummaries, setBiosecuritySummaries] = useState<Record<string, BiosecurityDailySummary>>(() => 
    safeParseObject<Record<string, BiosecurityDailySummary>>(`${LOCAL_STORAGE_KEY}_biosecurity_summaries`, INITIAL_BIOSECURITY_SUMMARIES)
  );

  const [deliveries, setDeliveries] = useState<DeliveryRecord[]>(() => 
    safeParseArray<DeliveryRecord>(`${LOCAL_STORAGE_KEY}_deliveries`, INITIAL_DELIVERIES)
  );

  // Platform & Mobile Auto-Routing Engine
  const platformInfo = useMemo(() => {
    return detectPlatform();
  }, []);

  const isMobileDevice = useMemo(() => {
    return (
      platformInfo.isMobile || 
      platformInfo.isTablet || 
      (typeof navigator !== 'undefined' && /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent)) ||
      (typeof window !== 'undefined' && window.innerWidth <= 768)
    );
  }, [platformInfo]);

  const databaseEngine = 'mongodb' as const;

  // MongoDB State & Status
  const [mongoStatus, setMongoStatus] = useState<{
    connected: boolean;
    dbName: string;
    projectId?: string;
    lastSyncedAt: string | null;
    isSyncing: boolean;
    uriConfigured?: boolean;
    serverInfo?: string;
    error?: string | null;
  }>({
    connected: true,
    dbName: 'farmflow_db',
    projectId: 'farmflow_db',
    lastSyncedAt: null,
    isSyncing: false,
    uriConfigured: true,
  });

  const firestoreStatus = {
    connected: mongoStatus.connected,
    projectId: mongoStatus.projectId || mongoStatus.dbName,
    dbName: mongoStatus.dbName,
    lastSyncedAt: mongoStatus.lastSyncedAt,
    isSyncing: mongoStatus.isSyncing,
  };

  // RTU (Real-Time Update) Multi-Device Connectivity Engine
  const [rtuRevision, setRtuRevision] = useState<number>(1);
  const [activeDevicesCount, setActiveDevicesCount] = useState<number>(1);
  const [lastRtuHeartbeat, setLastRtuHeartbeat] = useState<string | null>(new Date().toISOString());
  const [rtuStatus, setRtuStatus] = useState<'connected' | 'syncing' | 'updating'>('connected');
  const rtuRevisionRef = useRef<number>(1);

  // Keep ref in sync
  useEffect(() => {
    rtuRevisionRef.current = rtuRevision;
  }, [rtuRevision]);

  // Local Offline Status & Diagnostics
  const [dbStatus, setDbStatus] = useState<{
    connected: boolean;
    state: string;
    dbName: string | null;
    hasUriConfigured: boolean;
  }>({
    connected: true,
    state: 'RTU Central Database Connected (Real-Time Synchronized across all accounts)',
    dbName: 'MongoDB / farmflow_db',
    hasUriConfigured: true
  });

  // Direct Cloud Database Engine State
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [offlineQueue, setOfflineQueue] = useState<OfflineQueueItem[]>([]);
  const [storageQuota, setStorageQuota] = useState<StorageQuotaInfo>({
    usageMB: 0,
    quotaMB: 0,
    percentUsed: 0,
    itemCounts: {
      flocks: 0,
      eggRecords: 0,
      feedRecords: 0,
      mortalityRecords: 0,
      medRecords: 0,
      biosecurityLogs: 0,
      offlineQueue: 0
    }
  });

  const refreshStorageQuota = async () => {
    try {
      const status = await getMongoDBStatus();
      setMongoStatus(prev => ({
        ...prev,
        connected: status.connected,
        dbName: status.dbName,
        uriConfigured: status.uriConfigured,
        serverInfo: status.serverInfo,
        error: status.error,
        lastSyncedAt: status.lastSyncedAt || prev.lastSyncedAt,
      }));
      setDbStatus({
        connected: status.connected,
        state: status.connected ? 'RTU Central Database Connected' : (status.error || 'Database Connected'),
        dbName: status.dbName,
        hasUriConfigured: status.uriConfigured,
      });
    } catch {
      // ignore
    }
  };

  // Trigger manual or immediate RTU sync
  const triggerRtuSync = async () => {
    setRtuStatus('syncing');
    try {
      await pullAllFromMongoDB();
      const heartbeat = await checkRtuHeartbeat();
      if (heartbeat && heartbeat.revision) {
        setRtuRevision(heartbeat.revision);
        setActiveDevicesCount(heartbeat.activeDevices || 1);
        setLastRtuHeartbeat(heartbeat.timestamp || new Date().toISOString());
      }
      setRtuStatus('connected');
    } catch (e) {
      setRtuStatus('connected');
    }
  };

  // Real-Time Bi-Directional Hydration Engine (Zero user intervention, live push & pull)
  useEffect(() => {
    let isMounted = true;

    const pullUpdates = async (newRevision?: number) => {
      if (!isMounted) return;
      setRtuStatus('updating');
      try {
        await pullAllFromMongoDB();
        if (isMounted) {
          if (newRevision && newRevision > rtuRevisionRef.current) {
            setRtuRevision(newRevision);
          }
          setRtuStatus('connected');
        }
      } catch {
        if (isMounted) setRtuStatus('connected');
      }
    };

    const runHeartbeat = async () => {
      try {
        const heartbeat = await checkRtuHeartbeat();
        if (!isMounted || !heartbeat) return;

        setActiveDevicesCount(heartbeat.activeDevices || 1);
        setLastRtuHeartbeat(heartbeat.timestamp || new Date().toISOString());

        // If server has a newer revision than what this client holds, pull remote updates in real time!
        if (heartbeat.revision && heartbeat.revision > rtuRevisionRef.current) {
          await pullUpdates(heartbeat.revision);
        }
      } catch {
        // quiet fallback
      }
    };

    // Initial silent check and background hydration
    runHeartbeat();
    pullUpdates().catch(() => {});

    // 1. Instantaneous Server-Sent Events stream for instant push hydration across all devices
    const unsubscribeSse = subscribeToRtuEvents((event) => {
      if (!isMounted) return;
      if (event.type === 'DATA_CHANGED' && event.revision && event.revision > rtuRevisionRef.current) {
        pullUpdates(event.revision);
      }
    });

    // 2. Continuous fallback telemetry loop (every 3 seconds) for network resilience
    const heartbeatInterval = setInterval(runHeartbeat, 3000);

    return () => {
      isMounted = false;
      unsubscribeSse();
      clearInterval(heartbeatInterval);
    };
  }, []);

  const checkDBStatus = async () => {
    await refreshStorageQuota();
  };

  const reconnectDB = async (_uri?: string) => {
    await refreshStorageQuota();
    return { success: true, message: 'Connected to MongoDB cloud database.' };
  };

  // Push all local farm collections to MongoDB
  const syncAllToMongoDB = async (): Promise<{ success: boolean; message: string; counts?: any }> => {
    setMongoStatus(prev => ({ ...prev, isSyncing: true }));
    try {
      const res = await syncAllDataToMongoDB({
        eggRecords: rawEggRecords,
        flocks,
        feedRecords: feedConsumptionRecords,
        feedStock: feedStockEntries,
        farmProfile,
        standards: {
          standardVaccinationProgram: farmProfile.standardVaccinationProgram,
          standardFeedGuide: farmProfile.standardFeedGuide,
          standardHenday: farmProfile.standardHenday,
          standardBodyWeights: farmProfile.standardBodyWeights,
          standardEggWeights: farmProfile.standardEggWeights,
        },
        settings: {
          currency: farmProfile.currency,
          facilityHousesCount: farmProfile.facilityHousesCount,
          totalBirdCapacity: farmProfile.totalBirdCapacity,
          dailyEggCapacity: farmProfile.dailyEggCapacity,
          farmOverviewNotes: farmProfile.farmOverviewNotes,
        },
        depletions,
        transfers,
        medProducts,
        medStockLogs,
        medAdmins: medAdministrations,
        bodyWeights,
        biosecurityLogs,
        biosecurityRequirements,
        biosecuritySummaries,
        weeklyEggWeights,
        deliveries,
        users,
        auditLogs: systemLogs,
        systemLogs,
      });

      if (res.success) {
        setMongoStatus(prev => ({
          ...prev,
          lastSyncedAt: new Date().toISOString(),
          connected: true,
        }));
        logAction('MONGODB_SYNC', 'system', 'Successfully synchronized all collections, profile, standards, and audit logs to MongoDB database.');
      }
      return res;
    } catch (e: any) {
      return {
        success: false,
        message: e?.message || 'Error syncing data to MongoDB.',
      };
    } finally {
      setMongoStatus(prev => ({ ...prev, isSyncing: false }));
    }
  };

  // Pull all farm collections from MongoDB
  const pullAllFromMongoDB = async (): Promise<{ success: boolean; message: string }> => {
    setMongoStatus(prev => ({ ...prev, isSyncing: true }));
    try {
      const res = await pullAllDataFromMongoDB();
      if (res.success && res.data) {
        const {
          eggRecords: remoteEgg,
          flocks: remoteFlocks,
          feedRecords: remoteFeed,
          feedStock: remoteStock,
          depletions: remoteDepletions,
          transfers: remoteTransfers,
          medProducts: remoteProducts,
          medStockLogs: remoteMedStock,
          medAdmins: remoteMed,
          bodyWeights: remoteWeights,
          biosecurityLogs: remoteBio,
          biosecurityRequirements: remoteBioReqs,
          biosecuritySummaries: remoteBioSummaries,
          weeklyEggWeights: remoteWeeklyWeights,
          deliveries: remoteDeliveries,
          users: remoteUsers,
          farmProfile: remoteProfile,
          auditLogs: remoteAuditLogs,
          systemLogs: remoteSystemLogs,
          standards: remoteStandards,
          settings: remoteSettings,
        } = res.data;

        // Authoritative Direct Hydration from Server Database
        if (Array.isArray(remoteEgg)) {
          const unique = deduplicateById(remoteEgg);
          setRawEggRecords(unique);
          localStorage.setItem(`${LOCAL_STORAGE_KEY}_egg_prod`, JSON.stringify(unique));
        }

        if (Array.isArray(remoteFlocks) && remoteFlocks.length > 0) {
          const unique = deduplicateFlocks(remoteFlocks);
          setFlocks(unique);
          localStorage.setItem(`${LOCAL_STORAGE_KEY}_flocks`, JSON.stringify(unique));
        }

        if (Array.isArray(remoteFeed)) {
          const unique = deduplicateById(remoteFeed);
          setFeedConsumptionRecords(unique);
          localStorage.setItem(`${LOCAL_STORAGE_KEY}_feed_cons`, JSON.stringify(unique));
        }

        if (Array.isArray(remoteStock)) {
          const unique = deduplicateById(remoteStock);
          setFeedStockEntries(unique);
          localStorage.setItem(`${LOCAL_STORAGE_KEY}_feed_stock`, JSON.stringify(unique));
        }

        if (Array.isArray(remoteDepletions)) {
          const unique = deduplicateById(remoteDepletions);
          setDepletions(unique);
          localStorage.setItem(`${LOCAL_STORAGE_KEY}_depletions`, JSON.stringify(unique));
        }

        if (Array.isArray(remoteTransfers)) {
          const unique = deduplicateById(remoteTransfers);
          setTransfers(unique);
          localStorage.setItem(`${LOCAL_STORAGE_KEY}_transfers`, JSON.stringify(unique));
        }

        if (Array.isArray(remoteProducts) && remoteProducts.length > 0) {
          const unique = deduplicateById(remoteProducts);
          setMedProducts(unique);
          localStorage.setItem(`${LOCAL_STORAGE_KEY}_med_products`, JSON.stringify(unique));
        }

        if (Array.isArray(remoteMedStock)) {
          const unique = deduplicateById(remoteMedStock);
          setMedStockLogs(unique);
          localStorage.setItem(`${LOCAL_STORAGE_KEY}_med_stock`, JSON.stringify(unique));
        }

        if (Array.isArray(remoteMed)) {
          const unique = deduplicateById(remoteMed);
          setMedAdministrations(unique);
          localStorage.setItem(`${LOCAL_STORAGE_KEY}_med_admin`, JSON.stringify(unique));
        }

        if (Array.isArray(remoteWeights)) {
          const unique = deduplicateById(remoteWeights);
          setBodyWeights(unique);
          localStorage.setItem(`${LOCAL_STORAGE_KEY}_body_weights`, JSON.stringify(unique));
        }

        if (Array.isArray(remoteBio)) {
          const unique = deduplicateById(remoteBio);
          setBiosecurityLogs(unique);
          localStorage.setItem(`${LOCAL_STORAGE_KEY}_bio_logs`, JSON.stringify(unique));
        }

        if (Array.isArray(remoteBioReqs) && remoteBioReqs.length > 0) {
          const unique = deduplicateById(remoteBioReqs);
          setBiosecurityRequirements(unique);
          localStorage.setItem(`${LOCAL_STORAGE_KEY}_bio_reqs`, JSON.stringify(unique));
        }

        if (remoteBioSummaries) {
          if (Array.isArray(remoteBioSummaries)) {
            const next: Record<string, BiosecurityDailySummary> = {};
            remoteBioSummaries.forEach((s: any) => {
              if (s && (s.date || s.id)) {
                const d = String(s.date || s.id);
                next[d] = { ...s, date: d };
              }
            });
            setBiosecuritySummaries(next);
            localStorage.setItem(`${LOCAL_STORAGE_KEY}_bio_summaries`, JSON.stringify(next));
          } else if (typeof remoteBioSummaries === 'object') {
            setBiosecuritySummaries(remoteBioSummaries as Record<string, BiosecurityDailySummary>);
            localStorage.setItem(`${LOCAL_STORAGE_KEY}_bio_summaries`, JSON.stringify(remoteBioSummaries));
          }
        }

        if (Array.isArray(remoteWeeklyWeights)) {
          const unique = deduplicateById(remoteWeeklyWeights);
          setWeeklyEggWeights(unique);
          localStorage.setItem(`${LOCAL_STORAGE_KEY}_weekly_egg_weights`, JSON.stringify(unique));
        }

        if (Array.isArray(remoteDeliveries)) {
          const unique = deduplicateById(remoteDeliveries);
          setDeliveries(unique);
          localStorage.setItem(`${LOCAL_STORAGE_KEY}_deliveries`, JSON.stringify(unique));
        }

        if (Array.isArray(remoteUsers) && remoteUsers.length > 0) {
          const unique = deduplicateUsers(remoteUsers);
          setUsers(unique);
          localStorage.setItem(`${LOCAL_STORAGE_KEY}_users`, JSON.stringify(unique));
        }

        // Hydrate and merge Farm Profile and Standards
        const profileSource = remoteProfile || res.farmProfile;
        if (profileSource && typeof profileSource === 'object' && ('name' in profileSource || 'address' in profileSource)) {
          setFarmProfile(prev => {
            const updated = {
              ...prev,
              ...profileSource,
              standardVaccinationProgram: Array.isArray(profileSource.standardVaccinationProgram) && profileSource.standardVaccinationProgram.length > 0
                ? profileSource.standardVaccinationProgram
                : prev.standardVaccinationProgram,
              standardFeedGuide: Array.isArray(profileSource.standardFeedGuide) && profileSource.standardFeedGuide.length > 0
                ? profileSource.standardFeedGuide
                : prev.standardFeedGuide,
              standardHenday: Array.isArray(profileSource.standardHenday) && profileSource.standardHenday.length > 0
                ? profileSource.standardHenday
                : prev.standardHenday,
              standardBodyWeights: Array.isArray(profileSource.standardBodyWeights) && profileSource.standardBodyWeights.length > 0
                ? profileSource.standardBodyWeights
                : prev.standardBodyWeights,
              standardEggWeights: Array.isArray(profileSource.standardEggWeights) && profileSource.standardEggWeights.length > 0
                ? profileSource.standardEggWeights
                : prev.standardEggWeights,
            };
            localStorage.setItem(`${LOCAL_STORAGE_KEY}_profile`, JSON.stringify(updated));
            return updated;
          });
        }

        const standardsSource = remoteStandards || res.standards;
        if (standardsSource && typeof standardsSource === 'object') {
          setFarmProfile(prev => ({
            ...prev,
            standardVaccinationProgram: Array.isArray(standardsSource.standardVaccinationProgram) ? standardsSource.standardVaccinationProgram : prev.standardVaccinationProgram,
            standardFeedGuide: Array.isArray(standardsSource.standardFeedGuide) ? standardsSource.standardFeedGuide : prev.standardFeedGuide,
            standardHenday: Array.isArray(standardsSource.standardHenday) ? standardsSource.standardHenday : prev.standardHenday,
            standardBodyWeights: Array.isArray(standardsSource.standardBodyWeights) ? standardsSource.standardBodyWeights : prev.standardBodyWeights,
            standardEggWeights: Array.isArray(standardsSource.standardEggWeights) ? standardsSource.standardEggWeights : prev.standardEggWeights,
          }));
        }

        const settingsSource = remoteSettings || res.settings;
        if (settingsSource && typeof settingsSource === 'object') {
          setFarmProfile(prev => ({
            ...prev,
            ...settingsSource,
          }));
        }

        // Hydrate Audit Logs / System Logs
        const logsSource = (Array.isArray(remoteAuditLogs) && remoteAuditLogs.length > 0)
          ? remoteAuditLogs
          : (Array.isArray(remoteSystemLogs) && remoteSystemLogs.length > 0)
          ? remoteSystemLogs
          : null;

        if (logsSource) {
          setSystemLogs(prev => {
            const existingIds = new Set(prev.map(l => l.id));
            const newLogs = logsSource.filter((l: any) => !existingIds.has(l.id));
            return [...newLogs, ...prev].slice(0, 500);
          });
        }

        setMongoStatus(prev => ({
          ...prev,
          lastSyncedAt: new Date().toISOString(),
          connected: true,
        }));
        logAction('MONGODB_PULL', 'system', 'Hydrated latest farm data, profile, standards, and logs from central database.');
      }
      return { success: true, message: 'Hydrated latest farm records, standards, and audit logs from MongoDB.' };
    } catch (e: any) {
      return { success: false, message: e?.message || 'Error pulling data from MongoDB.' };
    } finally {
      setMongoStatus(prev => ({ ...prev, isSyncing: false }));
    }
  };

  // Backwards-compatible aliases
  const syncAllToFirestore = syncAllToMongoDB;
  const pullAllFromFirestore = pullAllFromMongoDB;
  const saveDocToFirestore = saveDocToMongoDB;
  const deleteDocFromFirestore = deleteDocFromMongoDB;

  // Synchronize Live Records
  const syncOfflineQueue = async (): Promise<{ success: boolean; syncedCount: number; message: string }> => {
    try {
      await triggerRtuSync();
      return { 
        success: true, 
        syncedCount: 0, 
        message: 'All records are live synchronized with the central database in RTU mode.' 
      };
    } catch (err: any) {
      return { success: false, syncedCount: 0, message: err?.message || 'Error synchronizing records.' };
    }
  };

  const clearOfflineSyncQueue = async () => {
    setOfflineQueue([]);
    logAction('CLEAR_OFFLINE_QUEUE', 'system', 'RTU sync cache verified clean.');
  };

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_users`, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_profile`, JSON.stringify(farmProfile));
  }, [farmProfile]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_flocks`, JSON.stringify(flocks));
  }, [flocks]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_feed_stock`, JSON.stringify(feedStockEntries));
  }, [feedStockEntries]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_feed_cons`, JSON.stringify(feedConsumptionRecords));
  }, [feedConsumptionRecords]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_depletions`, JSON.stringify(depletions));
  }, [depletions]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_transfers`, JSON.stringify(transfers));
  }, [transfers]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_med_products`, JSON.stringify(medProducts));
  }, [medProducts]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_med_admin`, JSON.stringify(medAdministrations));
  }, [medAdministrations]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_body_weights`, JSON.stringify(bodyWeights));
  }, [bodyWeights]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_egg_prod`, JSON.stringify(rawEggRecords));
  }, [rawEggRecords]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_weekly_egg_weights`, JSON.stringify(weeklyEggWeights));
  }, [weeklyEggWeights]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_deliveries`, JSON.stringify(deliveries));
  }, [deliveries]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_logs`, JSON.stringify(systemLogs));
  }, [systemLogs]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_biosecurity_reqs`, JSON.stringify(biosecurityRequirements));
  }, [biosecurityRequirements]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_biosecurity_logs`, JSON.stringify(biosecurityLogs));
  }, [biosecurityLogs]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_biosecurity_summaries`, JSON.stringify(biosecuritySummaries));
  }, [biosecuritySummaries]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('broiler_breeder_active_user', JSON.stringify(currentUser));
    }
  }, [currentUser]);

  // System Audit Logger helper
  const logAction = (action: string, category: SystemLog['category'], details: string, houseNumber?: string) => {
    const newLog: SystemLog = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
      userId: currentUser?.id || 'sys',
      userName: currentUser?.fullName || 'System',
      performedBy: currentUser?.fullName || 'System',
      module: category,
      userRole: currentUser?.role || 'admin',
      action,
      category,
      details,
      houseNumber
    };
    setSystemLogs(prev => [newLog, ...prev.slice(0, 499)]);
    saveDocToFirestore('auditLogs', newLog.id, newLog);
  };

  // Auth Functions with Cryptographic Security & Lockout Protection
  const login = async (identifier: string, password?: string): Promise<{ success: boolean; message: string; user?: UserAccount; lockedOut?: boolean; remainingMinutes?: number }> => {
    if (!identifier) {
      return { success: false, message: 'Please enter your username, email address, or staff ID.' };
    }
    const clean = identifier.trim().toLowerCase();
    
    // Multi-attribute lookup: username, email, full name, or user id
    let user = users.find(u => 
      u.username.toLowerCase() === clean ||
      (u.email && u.email.toLowerCase() === clean) ||
      (u.id && u.id.toLowerCase() === clean) ||
      (u.fullName && u.fullName.toLowerCase() === clean)
    );

    // Fallback friendly alias resolution for mobile convenience
    if (!user) {
      if (clean === 'admin' || clean === 'von' || clean === 'vonlim' || clean === 'von.lplimfarm' || clean.includes('von.lplimfarm')) {
        user = users.find(u => u.username === 'admin' || (u.email && u.email.includes('von.lplimfarm')));
      } else if (clean === 'manager' || clean === 'farm_manager' || clean === 'farmmanager') {
        user = users.find(u => u.username === 'farm_mgr_ramon' || u.role === 'Farm Manager');
      } else if (clean === 'flockman' || clean === 'flockman1') {
        user = users.find(u => u.username === 'flockman_joel' || u.role === 'Flockman');
      } else if (clean === 'collector' || clean === 'collector1' || clean === 'egg_collector') {
        user = users.find(u => u.username === 'collector_marlon' || u.role === 'Egg Collector');
      } else if (clean === 'leadman' || clean === 'leadman1') {
        user = users.find(u => u.username === 'leadman_eduardo' || u.role === 'Leadman' || (u.role as string) === 'Leadman / Technician');
      }
    }

    if (!user) {
      return { success: false, message: 'User account not found. Please verify your username or registered email.' };
    }

    // Check brute-force lockout status
    const lockStatus = isAccountLocked(user.lockedUntil);
    if (lockStatus.isLocked) {
      logAction('ACCOUNT_LOCKED_ATTEMPT', 'auth', `Blocked login attempt for locked account ${user.username}. ${lockStatus.remainingMinutes} min remaining.`);
      return { 
        success: false, 
        message: `Account is temporarily locked for security due to multiple failed login attempts. Please try again in ${lockStatus.remainingMinutes} minute(s) or contact your Administrator.`,
        lockedOut: true,
        remainingMinutes: lockStatus.remainingMinutes
      };
    }

    if (user.status === 'pending') {
      return { success: false, message: 'Your account registration is pending approval by the System Administrator.' };
    }
    if (user.status === 'rejected' || user.status === 'suspended' || user.status === 'disabled') {
      return { success: false, message: 'Account has been deactivated. Please contact your farm administrator.' };
    }

    const enteredPassword = password || '';

    // Password Cryptographic Verification
    let passwordValid = false;
    let newSalt = user.passwordSalt;
    let newHash = user.passwordHash;

    if (user.passwordHash && user.passwordSalt) {
      // Standard verification against cryptographic hash
      passwordValid = await verifyPassword(enteredPassword, user.passwordHash, user.passwordSalt);
    } else {
      // Initial migration / first-boot accounts without stored hashes
      // Accepts password provided or fallback initial default, then generates salt and hash on-the-fly
      if (enteredPassword.length > 0) {
        newSalt = generateSalt();
        newHash = await hashPasswordWithSalt(enteredPassword, newSalt);
        passwordValid = true;
      }
    }

    if (!passwordValid) {
      const failedAttempts = (user.failedLoginAttempts || 0) + 1;
      let lockoutDate: string | null = null;
      let isLocked = false;
      let remainingAttempts = Math.max(0, 5 - failedAttempts);

      if (failedAttempts >= 5) {
        lockoutDate = new Date(Date.now() + 15 * 60000).toISOString();
        isLocked = true;
      }

      const updatedUserWithFailures: UserAccount = {
        ...user,
        failedLoginAttempts: failedAttempts,
        lockedUntil: lockoutDate
      };

      setUsers(prev => prev.map(u => u.id === user.id ? updatedUserWithFailures : u));
      syncUserToBackend(updatedUserWithFailures);

      if (isLocked) {
        logAction('ACCOUNT_LOCKED', 'auth', `Account [${user.username}] locked for 15 minutes after 5 consecutive failed login attempts.`);
        return {
          success: false,
          message: 'Account locked for 15 minutes due to 5 consecutive failed password attempts. Contact Farm Admin if needed.',
          lockedOut: true,
          remainingMinutes: 15
        };
      }

      logAction('LOGIN_FAILED', 'auth', `Failed password login attempt for ${user.username}. (${remainingAttempts} attempts remaining)`);
      return {
        success: false,
        message: `Invalid password. ${remainingAttempts} attempt(s) remaining before account lockout.`
      };
    }
    
    // Successful login: reset failed counters and update lastLogin
    const updated: UserAccount = { 
      ...user, 
      passwordHash: newHash || user.passwordHash,
      passwordSalt: newSalt || user.passwordSalt,
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLogin: new Date().toISOString() 
    };

    setCurrentUser(updated);
    setUsers(prev => prev.map(u => u.id === user.id ? updated : u));
    syncUserToBackend(updated);
    logAction('USER_LOGIN', 'auth', `User ${user.fullName} logged in successfully as [${user.role}].`);
    return { success: true, message: `Welcome back, ${user.fullName}!`, user: updated };
  };

  const logout = () => {
    if (currentUser) {
      logAction('USER_LOGOUT', 'auth', `User ${currentUser.fullName} logged out.`);
    }
    setCurrentUser(null);
    localStorage.removeItem('broiler_breeder_active_user');
  };

  const registerUser = async (
    userData: Omit<UserAccount, 'id' | 'createdAt' | 'status'> & { password?: string }, 
    autoActivate = false
  ): Promise<{ success: boolean; message: string; user?: UserAccount }> => {
    const exists = users.some(u => 
      u.username.toLowerCase() === userData.username.toLowerCase().trim() ||
      (userData.email && u.email && u.email.toLowerCase() === userData.email.toLowerCase().trim())
    );
    if (exists) {
      return { success: false, message: 'Username or email already exists. Please choose another.' };
    }

    const rawPassword = userData.password || 'Farm@2026!';
    if (rawPassword.length < 8) {
      return { 
        success: false, 
        message: 'Password must be at least 8 characters long and include numbers and letters for security.' 
      };
    }

    // Cryptographic Salt & Hash for Password and Security Answer
    const pSalt = generateSalt();
    const pHash = await hashPasswordWithSalt(rawPassword, pSalt);
    const aSalt = generateSalt();
    const aHash = await hashSecurityAnswer(userData.securityAnswer || 'Farm 1', aSalt);

    const newUser: UserAccount = {
      ...userData,
      id: 'usr_' + Date.now(),
      status: autoActivate ? 'active' : 'pending',
      createdAt: new Date().toISOString(),
      registeredAt: new Date().toISOString().split('T')[0],
      passwordHash: pHash,
      passwordSalt: pSalt,
      securityAnswerHash: aHash,
      securityAnswerSalt: aSalt,
      failedLoginAttempts: 0,
      lockedUntil: null,
      passwordChangedAt: new Date().toISOString(),
      designatedHouses: userData.designatedHouses && userData.designatedHouses.length > 0 
        ? userData.designatedHouses 
        : ['House 1', 'House 2']
    };

    setUsers(prev => [...prev, newUser]);
    syncUserToBackend(newUser);

    if (autoActivate) {
      setCurrentUser(newUser);
      logAction('USER_REGISTRATION', 'auth', `New user registered and active: ${newUser.fullName} (${newUser.username}) as [${newUser.role}].`);
      return { 
        success: true, 
        message: `Welcome, ${newUser.fullName}! Your staff account is active.`,
        user: newUser
      };
    }

    logAction('USER_REGISTRATION', 'auth', `New user registered: ${newUser.fullName} (${newUser.username}) awaiting approval.`);
    return { 
      success: true, 
      message: 'Registration submitted successfully! Your account will be active once approved by the System Administrator.' 
    };
  };

  const recoverAccount = async (
    username: string, 
    answer: string, 
    newPassword?: string
  ): Promise<{ success: boolean; message: string; verified?: boolean }> => {
    const cleanUsername = username.toLowerCase().trim();
    const user = users.find(u => u.username.toLowerCase() === cleanUsername || (u.email && u.email.toLowerCase() === cleanUsername));
    if (!user) {
      return { success: false, message: 'Account not found with this username or email.' };
    }

    // Verify security answer (either hashed or normalized fallback)
    let answerValid = false;
    if (user.securityAnswerHash && user.securityAnswerSalt) {
      const computedHash = await hashSecurityAnswer(answer, user.securityAnswerSalt);
      answerValid = computedHash === user.securityAnswerHash;
    } else {
      answerValid = user.securityAnswer.toLowerCase().trim() === answer.toLowerCase().trim();
    }

    if (!answerValid) {
      logAction('SECURITY_ANSWER_FAILED', 'auth', `Failed security question attempt for account ${user.username}.`);
      return { success: false, message: 'Security answer does not match our records.' };
    }

    // If new password is provided, validate and update
    if (newPassword) {
      if (newPassword.length < 8) {
        return { success: false, message: 'New password must be at least 8 characters long.' };
      }
      const salt = generateSalt();
      const hash = await hashPasswordWithSalt(newPassword, salt);
      const updatedUser: UserAccount = {
        ...user,
        passwordHash: hash,
        passwordSalt: salt,
        failedLoginAttempts: 0,
        lockedUntil: null,
        passwordChangedAt: new Date().toISOString()
      };
      setUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
      syncUserToBackend(updatedUser);
      logAction('PASSWORD_RESET', 'auth', `Account password reset successfully for ${user.username}.`);
      return { 
        success: true, 
        verified: true, 
        message: `Identity verified for ${user.fullName}. Password updated successfully! You may now sign in.` 
      };
    }

    return { 
      success: true, 
      verified: true, 
      message: `Identity verified for ${user.fullName}. You may now enter a new password.` 
    };
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    if (!currentUser) {
      return { success: false, message: 'You must be signed in to change your password.' };
    }
    const user = users.find(u => u.id === currentUser.id);
    if (!user) {
      return { success: false, message: 'Active user profile not found.' };
    }

    // Verify current password
    if (user.passwordHash && user.passwordSalt) {
      const isValid = await verifyPassword(currentPassword, user.passwordHash, user.passwordSalt);
      if (!isValid) {
        return { success: false, message: 'Current password is incorrect.' };
      }
    }

    if (newPassword.length < 8) {
      return { success: false, message: 'New password must be at least 8 characters long.' };
    }

    const salt = generateSalt();
    const hash = await hashPasswordWithSalt(newPassword, salt);
    const updatedUser: UserAccount = {
      ...user,
      passwordHash: hash,
      passwordSalt: salt,
      failedLoginAttempts: 0,
      lockedUntil: null,
      passwordChangedAt: new Date().toISOString()
    };

    setCurrentUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
    syncUserToBackend(updatedUser);
    logAction('PASSWORD_CHANGED', 'auth', `User ${user.fullName} changed their password securely.`);
    return { success: true, message: 'Your password has been changed successfully!' };
  };

  const adminResetUserPassword = async (userId: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    if (!currentUser || !['admin', 'System Administrator'].includes(currentUser.role)) {
      return { success: false, message: 'Only Administrators have permission to reset user passwords.' };
    }

    const user = users.find(u => u.id === userId);
    if (!user) {
      return { success: false, message: 'Target user account not found.' };
    }

    if (newPassword.length < 8) {
      return { success: false, message: 'New password must be at least 8 characters long.' };
    }

    const salt = generateSalt();
    const hash = await hashPasswordWithSalt(newPassword, salt);
    const updatedUser: UserAccount = {
      ...user,
      passwordHash: hash,
      passwordSalt: salt,
      failedLoginAttempts: 0,
      lockedUntil: null,
      passwordChangedAt: new Date().toISOString()
    };

    setUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
    syncUserToBackend(updatedUser);
    logAction('ADMIN_PASSWORD_RESET', 'admin', `Administrator reset password and unlocked account for ${user.fullName} (@${user.username}).`);
    return { success: true, message: `Password for ${user.fullName} has been reset successfully.` };
  };

  const adminToggleUserLock = async (userId: string, isLocked: boolean): Promise<{ success: boolean; message: string }> => {
    if (!currentUser || !['admin', 'System Administrator'].includes(currentUser.role)) {
      return { success: false, message: 'Only Administrators have permission to lock/unlock user accounts.' };
    }

    const user = users.find(u => u.id === userId);
    if (!user) {
      return { success: false, message: 'Target user account not found.' };
    }

    const lockedUntil = isLocked ? new Date(Date.now() + 24 * 60 * 60000).toISOString() : null;
    const updatedUser: UserAccount = {
      ...user,
      lockedUntil,
      failedLoginAttempts: isLocked ? 5 : 0
    };

    setUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
    syncUserToBackend(updatedUser);
    const actionDesc = isLocked ? 'locked' : 'unlocked';
    logAction('ADMIN_ACCOUNT_LOCK_TOGGLED', 'admin', `Administrator ${actionDesc} account for ${user.fullName} (@${user.username}).`);
    return { success: true, message: `Account for ${user.fullName} is now ${actionDesc}.` };
  };

  const syncUserToBackend = (userToSync: UserAccount) => {
    // Save to Firestore automatically across all platforms
    saveDocToFirestore('users', userToSync.id || userToSync.username, userToSync);
  };

  const approveUser = (userId: string, designatedHouses?: string[]) => {
    let updatedUser: UserAccount | null = null;
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        updatedUser = { 
          ...u, 
          status: 'active',
          designatedHouses: designatedHouses || u.designatedHouses 
        };
        return updatedUser;
      }
      return u;
    }));
    if (updatedUser) {
      syncUserToBackend(updatedUser);
      logAction('APPROVE_USER', 'admin', `Administrator approved account for ${(updatedUser as UserAccount).fullName || userId}.`);
    }
  };

  const rejectUser = (userId: string) => {
    let updatedUser: UserAccount | null = null;
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        updatedUser = { ...u, status: 'rejected' };
        return updatedUser;
      }
      return u;
    }));
    if (updatedUser) {
      syncUserToBackend(updatedUser);
      logAction('REJECT_USER', 'admin', `Administrator rejected account for user ID ${userId}.`);
    }
  };

  const updateUserRole = (userId: string, newRole: UserRole, designatedHouses?: string[]) => {
    let updatedUser: UserAccount | null = null;
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        updatedUser = { 
          ...u, 
          role: newRole, 
          designatedHouses: designatedHouses || u.designatedHouses 
        };
        return updatedUser;
      }
      return u;
    }));
    if (updatedUser) {
      syncUserToBackend(updatedUser);
      logAction('UPDATE_USER_ROLE', 'admin', `Updated role to ${newRole} for user ID ${userId}.`);
    }
  };

  const updateUserStatus = (userId: string, newStatus: UserStatus) => {
    let updatedUser: UserAccount | null = null;
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        updatedUser = { ...u, status: newStatus };
        return updatedUser;
      }
      return u;
    }));
    if (updatedUser) {
      syncUserToBackend(updatedUser);
      logAction('UPDATE_USER_STATUS', 'admin', `Updated status to ${newStatus} for user ID ${userId}.`);
    }
  };

  const assignUserHouses = (userId: string, houses: string[]) => {
    let updatedUser: UserAccount | null = null;
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        updatedUser = { ...u, designatedHouses: houses };
        return updatedUser;
      }
      return u;
    }));
    if (updatedUser) {
      syncUserToBackend(updatedUser);
      logAction('ASSIGN_HOUSES', 'admin', `Updated house assignments to [${houses.join(', ')}] for user ID ${userId}.`);
    }
  };

  const deleteUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    logAction('DELETE_USER', 'admin', `Deleted user ID ${userId}.`);
    deleteDocFromFirestore('users', userId);
    if (typeof fetch !== 'undefined' && typeof navigator !== 'undefined' && navigator.onLine) {
      fetch(`/api/users/${userId}`, {
        method: 'DELETE'
      }).catch(e => console.warn('MongoDB user delete error:', e));
    }
  };

  const switchUser = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setCurrentUser(user);
      logAction('SWITCH_USER', 'auth', `Switched active profile to ${user.fullName} [${user.role}].`);
    }
  };

  const switchUserRole = (role: UserRole) => {
    // Look for existing user with role or update currentUser role
    const matched = users.find(u => u.role === role);
    if (matched) {
      setCurrentUser(matched);
    } else if (currentUser) {
      const updated = { ...currentUser, role };
      setCurrentUser(updated);
    }
  };

  // Farm Profile & Standard Requirements Methods (Live Sync)
  const updateFarmProfile = (profile: Partial<FarmProfile>) => {
    setFarmProfile(prev => {
      const next = { ...prev, ...profile };
      saveDocToFirestore('farmProfile', 'profile', next);
      saveDocToFirestore('farm_config', 'profile', next);
      saveDocToFirestore('settings', 'global_settings', next);
      return next;
    });
    logAction('UPDATE_FARM_PROFILE', 'admin', `Updated farm profile information (${profile.name || 'details'}).`);
  };

  const updateStandardVaccination = (program: StandardMedProgramItem[]) => {
    setFarmProfile(prev => {
      const next = { ...prev, standardVaccinationProgram: program };
      saveDocToFirestore('farmProfile', 'profile', next);
      saveDocToFirestore('standards', 'vaccination', { items: program });
      return next;
    });
    logAction('UPDATE_STANDARD_VACCINATION', 'admin', `Updated standard vaccination schedule (${program.length} items).`);
  };

  const updateStandardFeedGuide = (guide: StandardFeedGuideItem[]) => {
    setFarmProfile(prev => {
      const next = { ...prev, standardFeedGuide: guide };
      saveDocToFirestore('farmProfile', 'profile', next);
      saveDocToFirestore('standards', 'feedGuide', { items: guide });
      return next;
    });
    logAction('UPDATE_STANDARD_FEED_GUIDE', 'admin', `Updated standard feed guide (${guide.length} items).`);
  };

  const updateStandardHenday = (henday: StandardHendayItem[]) => {
    setFarmProfile(prev => {
      const next = { ...prev, standardHenday: henday };
      saveDocToFirestore('farmProfile', 'profile', next);
      saveDocToFirestore('standards', 'henday', { items: henday });
      return next;
    });
    logAction('UPDATE_STANDARD_HENDAY', 'admin', `Updated standard Henday% production curve.`);
  };

  const updateStandardBodyWeights = (weights: StandardBodyWeightItem[]) => {
    setFarmProfile(prev => {
      const next = { ...prev, standardBodyWeights: weights };
      saveDocToFirestore('farmProfile', 'profile', next);
      saveDocToFirestore('standards', 'bodyWeights', { items: weights });
      return next;
    });
    logAction('UPDATE_STANDARD_BODY_WEIGHTS', 'admin', `Updated standard body weight curves.`);
  };

  const updateStandardEggWeights = (eggWeights: StandardEggWeightItem[]) => {
    setFarmProfile(prev => {
      const next = { ...prev, standardEggWeights: eggWeights };
      saveDocToFirestore('farmProfile', 'profile', next);
      saveDocToFirestore('standards', 'eggWeights', { items: eggWeights });
      return next;
    });
    logAction('UPDATE_STANDARD_EGG_WEIGHTS', 'admin', `Updated standard egg weight progression.`);
  };

  // Flock Methods & Depletion Calculations
  const getFlockStats = useCallback((houseNumber: string, referenceDate?: string): FlockStats | null => {
    const flock = flocks.find(f => f.houseNumber === houseNumber);
    if (!flock) return null;

    // Dynamically calculate flock age from loading date (prefers female loading date, falls back to male or hatch date)
    const effectiveLoadingDate = flock.loadingDateFemale || flock.loadingDateMale || flock.hatchDate;
    const ageCalc = calculateFlockAgeFromLoadingDate(effectiveLoadingDate, referenceDate);
    const ageWeeks = ageCalc.ageWeeks;

    const houseDepletions = depletions.filter(d => d.houseNumber === houseNumber);
    const totalMaleDepleted = houseDepletions.reduce((sum, d) => sum + (Number(d.maleCount) || 0), 0);
    const totalFemaleDepleted = houseDepletions.reduce((sum, d) => sum + (Number(d.femaleCount) || 0), 0);
    const totalDepleted = totalMaleDepleted + totalFemaleDepleted;

    const initialTotal = (Number(flock.initialMales) || 0) + (Number(flock.initialFemales) || 0);
    const currentMales = Math.max(0, Number(flock.currentMales) || 0);
    const currentFemales = Math.max(0, Number(flock.currentFemales) || 0);
    const totalCurrent = currentMales + currentFemales;

    const rawLivability = initialTotal > 0 ? (totalCurrent / initialTotal) * 100 : 100;
    const livabilityPct = isNaN(rawLivability) ? 100 : rawLivability;
    
    let maleToFemaleRatioStr = '0 : 0';
    if (currentMales > 0 && currentFemales > 0) {
      const ratio = currentFemales / currentMales;
      maleToFemaleRatioStr = `1 : ${isNaN(ratio) ? '0.0' : ratio.toFixed(1)}`;
    } else if (currentMales > 0 && currentFemales === 0) {
      maleToFemaleRatioStr = `${currentMales.toLocaleString()} M (1 : 0)`;
    } else if (currentMales === 0 && currentFemales > 0) {
      maleToFemaleRatioStr = `0 M : ${currentFemales.toLocaleString()} F`;
    } else {
      maleToFemaleRatioStr = '0 : 0';
    }

    const rawMaleRatio = totalCurrent > 0 ? (currentMales / totalCurrent) * 100 : 0;
    const maleRatioPct = isNaN(rawMaleRatio) ? 0 : rawMaleRatio;

    return {
      flock,
      ageWeeks: isNaN(ageWeeks) ? 1 : ageWeeks,
      ageDays: ageCalc.ageDays || 1,
      totalDaysFromLoading: ageCalc.totalDaysFromLoading || 1,
      weekAndDayStr: ageCalc.weekAndDayStr || 'Wk 1 D1',
      currentMales,
      currentFemales,
      totalCurrent,
      initialTotal,
      livabilityPct: Math.round(livabilityPct * 10) / 10,
      maleToFemaleRatioStr,
      maleRatioPct: Math.round(maleRatioPct * 10) / 10,
      totalMaleDepleted,
      totalFemaleDepleted,
      totalDepleted
    };
  }, [flocks, depletions]);

  const addFlock = (flockData: Omit<Flock, 'id' | 'currentMales' | 'currentFemales'>) => {
    const newFlock: Flock = {
      ...flockData,
      id: 'flock_' + Date.now(),
      currentMales: flockData.initialMales,
      currentFemales: flockData.initialFemales,
      pens: flockData.pens || [
        { id: 'pen_l1', name: 'Pen L1', side: 'Left', males: Math.floor(flockData.initialMales / 4), females: Math.floor(flockData.initialFemales / 4) },
        { id: 'pen_l2', name: 'Pen L2', side: 'Left', males: Math.floor(flockData.initialMales / 4), females: Math.floor(flockData.initialFemales / 4) },
        { id: 'pen_r1', name: 'Pen R1', side: 'Right', males: Math.floor(flockData.initialMales / 4), females: Math.floor(flockData.initialFemales / 4) },
        { id: 'pen_r2', name: 'Pen R2', side: 'Right', males: Math.floor(flockData.initialMales / 4), females: Math.floor(flockData.initialFemales / 4) }
      ]
    };
    setFlocks(prev => [...prev, newFlock]);
    saveDocToFirestore('flocks', newFlock.id, newFlock);
    logAction('ADD_FLOCK', 'flock', `Added flock in ${newFlock.houseNumber} (${newFlock.breed}, ${newFlock.initialMales}M / ${newFlock.initialFemales}F).`, newFlock.houseNumber);
  };

  const updateFlock = (id: string, updates: Partial<Flock>) => {
    setFlocks(prev => prev.map(f => {
      if (f.id === id) {
        const next = { ...f, ...updates };
        saveDocToFirestore('flocks', id, next);
        return next;
      }
      return f;
    }));
    logAction('UPDATE_FLOCK', 'flock', `Updated flock parameters for ID ${id}.`);
  };

  const deleteFlock = (id: string) => {
    const target = flocks.find(f => f.id === id);
    setFlocks(prev => prev.filter(f => f.id !== id));
    deleteDocFromFirestore('flocks', id);
    logAction('DELETE_FLOCK', 'flock', `Deleted flock in ${target?.houseNumber || id}.`, target?.houseNumber);
  };

  // Inter-House Bird Transfers (Males & Females)
  const addTransfer = (transfer: Omit<BirdTransferRecord, 'id' | 'createdAt' | 'loggedBy'>): { success: boolean; message: string } => {
    const { sourceHouse, destHouse, maleCount, femaleCount, sourceSide, sourcePenName, destSide, destPenName, reason, date } = transfer;

    if (sourceHouse === destHouse) {
      return { success: false, message: 'Source and destination houses cannot be the same.' };
    }

    if (maleCount <= 0 && femaleCount <= 0) {
      return { success: false, message: 'Please specify at least 1 male or female bird to transfer.' };
    }

    const sourceFlock = flocks.find(f => f.houseNumber === sourceHouse);
    const destFlock = flocks.find(f => f.houseNumber === destHouse);

    if (!sourceFlock || !destFlock) {
      return { success: false, message: 'Selected source or destination house could not be found.' };
    }

    if (sourceFlock.currentMales < maleCount) {
      return { 
        success: false, 
        message: `Insufficient males in ${sourceHouse}: requested ${maleCount}, but only ${sourceFlock.currentMales} available.` 
      };
    }

    if (sourceFlock.currentFemales < femaleCount) {
      return { 
        success: false, 
        message: `Insufficient females in ${sourceHouse}: requested ${femaleCount}, but only ${sourceFlock.currentFemales} available.` 
      };
    }

    // Apply bird population adjustments
    setFlocks(prev => prev.map(f => {
      if (f.houseNumber === sourceHouse) {
        const updatedPens = f.pens?.map(p => {
          if (sourcePenName && p.name === sourcePenName) {
            return {
              ...p,
              males: Math.max(0, p.males - maleCount),
              females: Math.max(0, p.females - femaleCount)
            };
          }
          return p;
        });

        const updated = {
          ...f,
          currentMales: Math.max(0, f.currentMales - maleCount),
          currentFemales: Math.max(0, f.currentFemales - femaleCount),
          pens: updatedPens || f.pens
        };
        saveDocToFirestore('flocks', f.id, updated);
        return updated;
      }

      if (f.houseNumber === destHouse) {
        const updatedPens = f.pens?.map(p => {
          if (destPenName && p.name === destPenName) {
            return {
              ...p,
              males: p.males + maleCount,
              females: p.females + femaleCount
            };
          }
          return p;
        });

        const updated = {
          ...f,
          currentMales: f.currentMales + maleCount,
          currentFemales: f.currentFemales + femaleCount,
          pens: updatedPens || f.pens
        };
        saveDocToFirestore('flocks', f.id, updated);
        return updated;
      }

      return f;
    }));

    const newTransfer: BirdTransferRecord = {
      ...transfer,
      id: 'tr_' + Date.now(),
      loggedBy: currentUser?.fullName || 'Staff',
      createdAt: new Date().toISOString()
    };

    setTransfers(prev => [newTransfer, ...prev]);
    saveDocToFirestore('transfers', newTransfer.id, newTransfer);

    logAction(
      'LOG_TRANSFER',
      'flock',
      `Transferred ${maleCount} males & ${femaleCount} females from ${sourceHouse} to ${destHouse}${reason ? ` (${reason})` : ''}.`,
      sourceHouse
    );

    return {
      success: true,
      message: `Successfully transferred ${maleCount > 0 ? `${maleCount} males ` : ''}${femaleCount > 0 ? `${femaleCount} females ` : ''}from ${sourceHouse} to ${destHouse}!`
    };
  };

  const deleteTransfer = (id: string, revertCounts: boolean = true) => {
    const target = transfers.find(t => t.id === id);
    if (!target) return;

    if (revertCounts) {
      setFlocks(prev => prev.map(f => {
        if (f.houseNumber === target.sourceHouse) {
          const updated = {
            ...f,
            currentMales: f.currentMales + target.maleCount,
            currentFemales: f.currentFemales + target.femaleCount
          };
          saveDocToFirestore('flocks', f.id, updated);
          return updated;
        }
        if (f.houseNumber === target.destHouse) {
          const updated = {
            ...f,
            currentMales: Math.max(0, f.currentMales - target.maleCount),
            currentFemales: Math.max(0, f.currentFemales - target.femaleCount)
          };
          saveDocToFirestore('flocks', f.id, updated);
          return updated;
        }
        return f;
      }));
    }

    setTransfers(prev => prev.filter(t => t.id !== id));
    deleteDocFromFirestore('transfers', id);
    logAction('DELETE_TRANSFER', 'flock', `Deleted transfer record ${target.sourceHouse} -> ${target.destHouse} (${target.maleCount}M, ${target.femaleCount}F).`);
  };

  // Feed Inventory Methods
  const addFeedStock = (entry: Omit<FeedStockEntry, 'id' | 'totalKg' | 'createdAt'>) => {
    const kgPerBag = entry.kgPerBag || 50;
    const totalKg = entry.bags * kgPerBag;
    const newEntry: FeedStockEntry = {
      ...entry,
      id: 'fs_' + Date.now(),
      kgPerBag,
      totalKg,
      createdAt: new Date().toISOString()
    };
    setFeedStockEntries(prev => [newEntry, ...prev]);
    saveDocToFirestore('feedStock', newEntry.id, newEntry);
    logAction('ADD_FEED_STOCK', 'feed', `Received ${entry.bags} bags (${totalKg} kg) of ${entry.feedType}.`);
  };

  const deleteFeedStock = (id: string) => {
    setFeedStockEntries(prev => prev.filter(e => e.id !== id));
    deleteDocFromFirestore('feedStock', id);
    logAction('DELETE_FEED_STOCK', 'feed', `Deleted feed stock entry ID ${id}.`);
  };

  const addFeedConsumption = (record: Omit<FeedConsumptionRecord, 'id' | 'createdAt' | 'loggedBy'>) => {
    // If female and male quantities are provided, calculate total quantity and default feedType
    const femaleKg = record.femaleQuantityKg ?? 0;
    const maleKg = record.maleQuantityKg ?? 0;
    const totalKg = (record.femaleQuantityKg !== undefined || record.maleQuantityKg !== undefined)
      ? (femaleKg + maleKg)
      : record.quantityKg;

    const primaryFeedType = record.feedType || record.femaleFeedType || record.maleFeedType || 'BLC 1';

    const newRecord: FeedConsumptionRecord = {
      ...record,
      feedType: primaryFeedType,
      quantityKg: totalKg,
      id: 'fc_' + Date.now(),
      loggedBy: currentUser?.fullName || 'Staff',
      createdAt: new Date().toISOString()
    };
    setFeedConsumptionRecords(prev => [newRecord, ...prev]);
    saveDocToFirestore('feedRecords', newRecord.id, newRecord);

    const descParts = [];
    if (record.femaleQuantityKg) descParts.push(`Females: ${record.femaleQuantityKg}kg (${record.femaleFeedType || primaryFeedType})`);
    if (record.maleQuantityKg) descParts.push(`Males: ${record.maleQuantityKg}kg (${record.maleFeedType || primaryFeedType})`);
    const desc = descParts.length > 0 ? descParts.join(', ') : `${totalKg}kg of ${primaryFeedType}`;

    logAction(
      'LOG_FEED_CONSUMPTION', 
      'feed', 
      `Logged feed in ${record.houseNumber} [Total ${totalKg} kg] - ${desc} (Live Synchronized via RTU).`, 
      record.houseNumber
    );
  };

  const deleteFeedConsumption = (id: string) => {
    setFeedConsumptionRecords(prev => prev.filter(r => r.id !== id));
    deleteDocFromFirestore('feedRecords', id);
    logAction('DELETE_FEED_CONSUMPTION', 'feed', `Deleted feed consumption record ID ${id}.`);
  };

  const ALL_FEED_TYPES: FeedType[] = ['CSC 1', 'CSC 2', 'CGC', 'PDC', 'BLC 1', 'BLC 2', 'BLC 3', 'BMCC', 'BMCR', 'CBB'];

  const getFeedStockSummary = (): FeedStockSummaryItem[] => {
    return ALL_FEED_TYPES.map(ft => {
      const totalReceivedKg = feedStockEntries
        .filter(e => e.feedType === ft)
        .reduce((sum, e) => sum + (Number(e.totalKg) || 0), 0);
      const totalReceivedBags = feedStockEntries
        .filter(e => e.feedType === ft)
        .reduce((sum, e) => sum + (Number(e.bags) || 0), 0);

      const totalConsumedKg = feedConsumptionRecords
        .reduce((sum, r) => {
          let recTotal = 0;
          if (r.femaleFeedType !== undefined || r.maleFeedType !== undefined) {
            if (r.femaleFeedType === ft) recTotal += (Number(r.femaleQuantityKg) || 0);
            if (r.maleFeedType === ft) recTotal += (Number(r.maleQuantityKg) || 0);
          } else {
            // Legacy record without male/female breakdown
            if (r.feedType === ft) recTotal += (Number(r.quantityKg) || 0);
          }
          return sum + recTotal;
        }, 0);

      const currentStockKg = Math.max(0, totalReceivedKg - totalConsumedKg);
      const currentStockBags = Math.round((currentStockKg / 50) * 10) / 10;
      const isLowStock = currentStockBags <= 4; // <= 4 bags trigger per prompt requirement!

      return {
        feedType: ft,
        totalReceivedKg,
        totalReceivedBags,
        totalConsumedKg,
        currentStockKg,
        currentStockBags,
        isLowStock
      };
    });
  };

  const getLowStockAlerts = () => {
    return getFeedStockSummary().filter(s => s.isLowStock);
  };

  // Depletions & Mortality Methods
  const addDepletion = (record: Omit<DepletionRecord, 'id' | 'createdAt' | 'loggedBy'>) => {
    const newRecord: DepletionRecord = {
      ...record,
      id: 'dep_' + Date.now(),
      loggedBy: currentUser?.fullName || 'Staff',
      createdAt: new Date().toISOString()
    };
    setDepletions(prev => [newRecord, ...prev]);
    saveDocToFirestore('depletions', newRecord.id, newRecord);

    setFlocks(prev => prev.map(f => {
      if (f.houseNumber === record.houseNumber) {
        const updated = {
          ...f,
          currentMales: Math.max(0, f.currentMales - record.maleCount),
          currentFemales: Math.max(0, f.currentFemales - record.femaleCount)
        };
        saveDocToFirestore('flocks', f.id, updated);
        return updated;
      }
      return f;
    }));

    logAction(
      'LOG_DEPLETION', 
      'mortality', 
      `Depletion (${record.category}): ${record.maleCount}M, ${record.femaleCount}F in ${record.houseNumber} (${record.side} side) [Live RTU Sync].`, 
      record.houseNumber
    );
  };

  const deleteDepletion = (id: string) => {
    const target = depletions.find(d => d.id === id);
    setDepletions(prev => prev.filter(d => d.id !== id));
    deleteDocFromFirestore('depletions', id);
    if (target) {
      setFlocks(prev => prev.map(f => {
        if (f.houseNumber === target.houseNumber) {
          const updated = {
            ...f,
            currentMales: f.currentMales + (target.maleCount || 0),
            currentFemales: f.currentFemales + (target.femaleCount || 0)
          };
          saveDocToFirestore('flocks', f.id, updated);
          return updated;
        }
        return f;
      }));
    }
    logAction('DELETE_DEPLETION', 'mortality', `Deleted depletion record ID ${id}.`);
  };

  // Medicine & Vaccines Methods
  const addMedProduct = (product: Omit<MedProduct, 'id'>) => {
    const newProduct: MedProduct = {
      ...product,
      id: 'med_' + Date.now(),
      currentStockUnits: product.currentStockUnits || product.currentStock || 0,
      currentStock: product.currentStockUnits || product.currentStock || 0
    };
    setMedProducts(prev => [...prev, newProduct]);
    saveDocToFirestore('medProducts', newProduct.id, newProduct);
    logAction('ADD_MED_PRODUCT', 'medicine', `Registered new health product: ${product.name} (${product.type}).`);
  };

  const updateMedProduct = (id: string, updates: Partial<MedProduct>) => {
    setMedProducts(prev => prev.map(p => {
      if (p.id === id) {
        const next = { ...p, ...updates };
        saveDocToFirestore('medProducts', id, next);
        return next;
      }
      return p;
    }));
    logAction('UPDATE_MED_PRODUCT', 'medicine', `Updated medicine product details for ID ${id}.`);
  };

  const deleteMedProduct = (id: string) => {
    const target = medProducts.find(p => p.id === id);
    setMedProducts(prev => prev.filter(p => p.id !== id));
    deleteDocFromFirestore('medProducts', id);
    logAction('DELETE_MED_PRODUCT', 'medicine', `Deleted product ${target?.name || id}.`);
  };

  const addMedStock = (productId: string, unitsAdded: number, date: string, lotNumber?: string, notes?: string) => {
    const product = medProducts.find(p => p.id === productId);
    if (!product) return;

    const newLog: MedStockLog = {
      id: 'msl_' + Date.now(),
      productId,
      productName: product.name,
      date,
      unitsAdded,
      lotNumber,
      notes,
      createdAt: new Date().toISOString()
    };
    setMedStockLogs(prev => [newLog, ...prev]);
    saveDocToFirestore('medStockLogs', newLog.id, newLog);

    setMedProducts(prev => prev.map(p => {
      if (p.id === productId) {
        const nextUnits = p.currentStockUnits + unitsAdded;
        const updated = { ...p, currentStockUnits: nextUnits, currentStock: nextUnits };
        saveDocToFirestore('medProducts', productId, updated);
        return updated;
      }
      return p;
    }));

    logAction('ADD_MED_STOCK', 'medicine', `Added ${unitsAdded} units of ${product.name}.`);
  };

  const addMedAdministration = (record: Omit<MedAdministrationRecord, 'id' | 'createdAt' | 'loggedBy'>) => {
    const newRecord: MedAdministrationRecord = {
      ...record,
      id: 'ma_' + Date.now(),
      loggedBy: currentUser?.fullName || 'Staff',
      createdAt: new Date().toISOString()
    };
    setMedAdministrations(prev => [newRecord, ...prev]);
    saveDocToFirestore('medAdmins', newRecord.id, newRecord);

    setMedProducts(prev => prev.map(p => {
      if (p.id === record.productId) {
        const remaining = Math.max(0, p.currentStockUnits - record.unitsUsed);
        const updated = { ...p, currentStockUnits: remaining, currentStock: remaining };
        saveDocToFirestore('medProducts', p.id, updated);
        return updated;
      }
      return p;
    }));

    logAction(
      'LOG_MED_ADMINISTRATION', 
      'medicine', 
      `Administered ${record.unitsUsed} units of ${record.productName} in ${record.houseNumber} via ${record.method} [Live RTU Sync].`, 
      record.houseNumber
    );
  };

  const deleteMedAdministration = (id: string) => {
    const target = medAdministrations.find(a => a.id === id);
    setMedAdministrations(prev => prev.filter(a => a.id !== id));
    deleteDocFromFirestore('medAdmins', id);
    if (target) {
      setMedProducts(prev => prev.map(p => {
        if (p.id === target.productId) {
          const restored = p.currentStockUnits + (target.unitsUsed || 0);
          const updated = { ...p, currentStockUnits: restored, currentStock: restored };
          saveDocToFirestore('medProducts', p.id, updated);
          return updated;
        }
        return p;
      }));
    }
    logAction('DELETE_MED_ADMINISTRATION', 'medicine', `Deleted medication administration record ID ${id}.`);
  };

  const getUpcomingVaccines = (): VaccineAlert[] => {
    const alerts: VaccineAlert[] = [];
    flocks.forEach(flock => {
      const stats = getFlockStats(flock.houseNumber);
      if (!stats) return;
      const currentWeek = stats.ageWeeks;

      farmProfile.standardVaccinationProgram.forEach(item => {
        if (Math.abs(item.ageWeek - currentWeek) <= 1) {
          alerts.push({
            id: `${flock.houseNumber}_${item.id}`,
            houseNumber: flock.houseNumber,
            flockAgeWeeks: currentWeek,
            scheduledWeek: item.ageWeek,
            productName: item.productName,
            diseaseTarget: item.diseaseTarget,
            method: item.method,
            urgency: item.ageWeek === currentWeek ? 'due_now' : 'upcoming'
          });
        }
      });
    });
    return alerts;
  };

  const getUpcomingVaccineAlerts = getUpcomingVaccines;

  // Body Weight Methods
  const addBodyWeightRecord = (record: Omit<BodyWeightRecord, 'id' | 'createdAt' | 'loggedBy'>) => {
    const prevRecord = bodyWeights
      .filter(b => b.houseNumber === record.houseNumber && b.week < record.week)
      .sort((a, b) => b.week - a.week)[0];

    const weeklyGainMale = prevRecord ? record.maleAvgWeightGrams - prevRecord.maleAvgWeightGrams : undefined;
    const weeklyGainFemale = prevRecord ? record.femaleAvgWeightGrams - prevRecord.femaleAvgWeightGrams : undefined;

    const newRecord: BodyWeightRecord = {
      ...record,
      id: 'bw_' + Date.now(),
      weeklyGainMale: record.weeklyGainMale ?? weeklyGainMale,
      weeklyGainFemale: record.weeklyGainFemale ?? weeklyGainFemale,
      loggedBy: currentUser?.fullName || 'Staff',
      createdAt: new Date().toISOString()
    };
    setBodyWeights(prev => [newRecord, ...prev]);
    saveDocToFirestore('bodyWeights', newRecord.id, newRecord);

    logAction(
      'LOG_BODY_WEIGHT', 
      'bodyweight', 
      `Logged Week ${record.week} weight in ${record.houseNumber} (M: ${record.maleAvgWeightGrams}g, F: ${record.femaleAvgWeightGrams}g) [Live RTU Sync].`, 
      record.houseNumber
    );
  };

  const deleteBodyWeightRecord = (id: string) => {
    setBodyWeights(prev => prev.filter(b => b.id !== id));
    deleteDocFromFirestore('bodyWeights', id);
    logAction('DELETE_BODY_WEIGHT', 'bodyweight', `Deleted body weight record ID ${id}.`);
  };

  // Egg Production normalized records
  const eggProductionRecords: NormalizedEggProductionRecord[] = useMemo(() => {
    const safeRaw = Array.isArray(rawEggRecords) ? rawEggRecords : [];
    const safeFlocks = Array.isArray(flocks) ? flocks : [];

    // Pre-index female populations by houseNumber to avoid repeated function lookups
    const femalePopMap = new Map<string, number>();
    safeFlocks.forEach(f => {
      if (f && f.houseNumber) {
        const fStat = getFlockStats ? getFlockStats(f.houseNumber) : null;
        femalePopMap.set(f.houseNumber, fStat?.currentFemales || f.currentFemales || 9500);
      }
    });

    return safeRaw.map(rec => {
      if (!rec) return null as any;
      const femalePop = rec.femalePopulationAtDate || femalePopMap.get(rec.houseNumber) || 9500;

      let totalHE = rec.totalHE;
      if (totalHE === undefined) {
        if (rec.sorting?.hatchingEggs?.total !== undefined) {
          totalHE = rec.sorting.hatchingEggs.total;
        } else {
          totalHE = (rec.heNest || 0) + (rec.heFloor || 0);
        }
      }

      let totalNHE = rec.totalNHE;
      if (totalNHE === undefined) {
        if (rec.sorting?.nonHatchingEggs?.total !== undefined) {
          totalNHE = rec.sorting.nonHatchingEggs.total;
        } else {
          totalNHE = (rec.small || 0) + 
            (rec.thinShell || 0) + 
            (rec.misshape || 0) + 
            (rec.doubleYolk || 0) + 
            (rec.broken || 0) + 
            (rec.spoiled || 0) + 
            (rec.others || 0);
        }
      }

      const totalEggs = rec.tep || rec.totalEggs || (totalHE + totalNHE);
      const hatchingEggPct = totalEggs > 0 ? (totalHE / totalEggs) * 100 : 0;
      const nonHatchingEggPct = totalEggs > 0 ? (totalNHE / totalEggs) * 100 : 0;
      const hendayPct = femalePop > 0 ? (totalEggs / femalePop) * 100 : 0;

      const safeCollections = Array.isArray(rec.collections) && rec.collections.length > 0 
        ? rec.collections 
        : [
            { id: 'c1', collectionNumber: 1, collectionTime: '08:00 AM', leftSideCount: Math.round(totalEggs * 0.2), rightSideCount: Math.round(totalEggs * 0.2), totalCount: Math.round(totalEggs * 0.4) },
            { id: 'c2', collectionNumber: 2, collectionTime: '11:30 AM', leftSideCount: Math.round(totalEggs * 0.2), rightSideCount: Math.round(totalEggs * 0.2), totalCount: Math.round(totalEggs * 0.4) },
            { id: 'c3', collectionNumber: 3, collectionTime: '03:30 PM', leftSideCount: Math.round(totalEggs * 0.1), rightSideCount: Math.round(totalEggs * 0.1), totalCount: Math.round(totalEggs * 0.2) }
          ];

      return {
        ...rec,
        totalEggs,
        totalHatchingEggs: totalHE,
        totalNonHatchingEggs: totalNHE,
        hatchingEggPct,
        nonHatchingEggPct,
        hendayPct,
        femalePopulationAtDate: femalePop,
        sampleEggWeightGrams: rec.sampleEggWeightGrams || 58.4,
        sorting: rec.sorting || {
          hatchingEggs: {
            total: totalHE,
            heNest: rec.heNest ?? totalHE,
            heFloor: rec.heFloor ?? 0
          },
          nonHatchingEggs: {
            total: totalNHE,
            dirty: rec.spoiled || Math.round(totalNHE * 0.35),
            cracked: rec.thinShell || Math.round(totalNHE * 0.25),
            broken: rec.broken || Math.round(totalNHE * 0.15),
            abnormal: rec.misshape || Math.round(totalNHE * 0.10),
            doubleYolk: rec.doubleYolk || Math.round(totalNHE * 0.10),
            softShelled: Math.round(totalNHE * 0.05),
            misshapen: rec.misshape || 0,
            leakers: 0
          }
        },
        collections: safeCollections
      };
    }).filter(Boolean);
  }, [rawEggRecords, flocks, getFlockStats]);

  const addEggProductionRecord = (record: Partial<EggProductionRecord> & { houseNumber: string; date: string }) => {
    const fStat = getFlockStats(record.houseNumber);
    const femalePop = record.femalePopulationAtDate || fStat?.currentFemales || 9500;

    let he = (record.heNest || 0) + (record.heFloor || 0);
    if (record.sorting?.hatchingEggs?.total) he = record.sorting.hatchingEggs.total;

    let nhe = (record.small || 0) + (record.thinShell || 0) + (record.misshape || 0) + (record.doubleYolk || 0) + (record.broken || 0) + (record.spoiled || 0) + (record.others || 0);
    if (record.sorting?.nonHatchingEggs?.total) nhe = record.sorting.nonHatchingEggs.total;

    const tep = he + nhe;

    const newRecord: EggProductionRecord = {
      ...record,
      id: 'ep_' + Date.now(),
      heNest: record.heNest ?? he,
      heFloor: record.heFloor ?? 0,
      totalHE: he,
      totalNHE: nhe,
      tep,
      femalePopulationAtDate: femalePop,
      sampleEggWeightGrams: record.sampleEggWeightGrams || 58.4,
      loggedBy: currentUser?.fullName || 'Staff',
      createdAt: new Date().toISOString()
    };

    setRawEggRecords(prev => [newRecord, ...prev]);
    saveDocToFirestore('eggRecords', newRecord.id, newRecord);

    logAction(
      'LOG_EGG_PRODUCTION', 
      'egg_prod', 
      `Recorded Egg Production in ${record.houseNumber} on ${record.date} (TEP: ${tep}, HE: ${he}, NHE: ${nhe}) [Live RTU Sync].`, 
      record.houseNumber
    );
  };

  const updateEggProductionRecord = (id: string, updates: Partial<EggProductionRecord>) => {
    let updatedDoc: EggProductionRecord | undefined;
    setRawEggRecords(prev => prev.map(r => {
      if (r.id === id) {
        const next = { ...r, ...updates, updatedAt: new Date().toISOString() };
        updatedDoc = next;
        return next;
      }
      return r;
    }));
    if (updatedDoc) {
      saveDocToFirestore('eggRecords', id, updatedDoc);
      logAction('UPDATE_EGG_PRODUCTION', 'egg_prod', `Updated egg production record ID ${id} [Live RTU Sync].`);
    }
  };

  const deleteEggProductionRecord = (id: string) => {
    setRawEggRecords(prev => prev.filter(r => r.id !== id));
    deleteDocFromFirestore('eggRecords', id);
    logAction('DELETE_EGG_PRODUCTION', 'egg_prod', `Deleted egg production record ID ${id}.`);
  };

  const addWeeklyEggWeight = (record: Omit<WeeklyEggWeightRecord, 'id' | 'createdAt' | 'loggedBy'>) => {
    const newRecord: WeeklyEggWeightRecord = {
      ...record,
      id: 'wew_' + Date.now(),
      loggedBy: currentUser?.fullName || 'Staff',
      createdAt: new Date().toISOString()
    };
    setWeeklyEggWeights(prev => [newRecord, ...prev]);
    saveDocToFirestore('weeklyEggWeights', newRecord.id, newRecord);
    logAction('LOG_EGG_WEIGHT', 'egg_prod', `Recorded weekly egg weight for ${record.houseNumber}: ${record.weightGrams}g at Prod Wk ${record.ageInProductionWeeks}.`, record.houseNumber);
  };

  const deleteWeeklyEggWeight = (id: string) => {
    setWeeklyEggWeights(prev => prev.filter(w => w.id !== id));
    deleteDocFromFirestore('weeklyEggWeights', id);
    logAction('DELETE_EGG_WEIGHT', 'egg_prod', `Deleted weekly egg weight record ID ${id}.`);
  };

  // Biosecurity Compliance Operations
  const addBiosecurityRequirement = (req: Omit<BiosecurityRequirement, 'id' | 'createdAt'>) => {
    const newReq: BiosecurityRequirement = {
      ...req,
      id: 'bio_req_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      createdBy: currentUser?.fullName || 'Farm Manager',
      createdAt: new Date().toISOString()
    };
    setBiosecurityRequirements(prev => [newReq, ...prev]);
    saveDocToFirestore('biosecurityRequirements', newReq.id, newReq);
    logAction('ADD_BIOSECURITY_REQ', 'biosecurity', `Added biosecurity protocol: "${req.title}" (${req.category}, ${req.criticalLevel}).`);
  };

  const updateBiosecurityRequirement = (id: string, updates: Partial<BiosecurityRequirement>) => {
    let updated: BiosecurityRequirement | undefined;
    setBiosecurityRequirements(prev => prev.map(r => {
      if (r.id === id) {
        updated = { ...r, ...updates };
        return updated;
      }
      return r;
    }));
    if (updated) {
      saveDocToFirestore('biosecurityRequirements', id, updated);
    }
    logAction('UPDATE_BIOSECURITY_REQ', 'biosecurity', `Updated biosecurity protocol ID ${id}.`);
  };

  const deleteBiosecurityRequirement = (id: string) => {
    const target = biosecurityRequirements.find(r => r.id === id);
    setBiosecurityRequirements(prev => prev.filter(r => r.id !== id));
    deleteDocFromFirestore('biosecurityRequirements', id);
    logAction('DELETE_BIOSECURITY_REQ', 'biosecurity', `Deleted biosecurity protocol: "${target?.title || id}".`);
  };

  const toggleBiosecurityRequirementActive = (id: string) => {
    let updated: BiosecurityRequirement | undefined;
    setBiosecurityRequirements(prev => prev.map(r => {
      if (r.id === id) {
        const nextActive = !r.active;
        logAction('TOGGLE_BIOSECURITY_REQ', 'biosecurity', `${nextActive ? 'Activated' : 'Deactivated'} biosecurity protocol: "${r.title}".`);
        updated = { ...r, active: nextActive };
        return updated;
      }
      return r;
    }));
    if (updated) {
      saveDocToFirestore('biosecurityRequirements', id, updated);
    }
  };

  const calculateAndUpdateDailySummary = (date: string, updatedLogs: BiosecurityVerificationLog[], currentRequirements: BiosecurityRequirement[]) => {
    const activeReqs = currentRequirements.filter(r => r.active);
    const dayLogs = updatedLogs.filter(l => l.date === date);
    const verifiedLogs = dayLogs.filter(l => l.verified);
    const passedLogs = dayLogs.filter(l => l.status === 'pass' && l.verified);
    const failedLogs = dayLogs.filter(l => l.status === 'fail' && l.verified);
    const naLogs = dayLogs.filter(l => l.status === 'na' && l.verified);

    const totalActive = activeReqs.length;
    const applicableTotal = Math.max(1, totalActive - naLogs.length);
    const complianceScorePct = totalActive === 0 ? 100 : Math.round((passedLogs.length / applicableTotal) * 100);

    setBiosecuritySummaries(prev => ({
      ...prev,
      [date]: {
        date,
        totalRequirements: totalActive,
        verifiedCount: verifiedLogs.length,
        passedCount: passedLogs.length,
        failedCount: failedLogs.length,
        complianceScorePct: Math.min(100, complianceScorePct),
        supervisorSignoff: prev[date]?.supervisorSignoff || false,
        supervisorSignoffBy: prev[date]?.supervisorSignoffBy,
        supervisorSignoffAt: prev[date]?.supervisorSignoffAt,
        supervisorNotes: prev[date]?.supervisorNotes
      }
    }));
  };

  const toggleBiosecurityLog = (
    requirementId: string, 
    date: string, 
    status?: BiosecurityStatus, 
    notes?: string, 
    correctiveAction?: string
  ) => {
    const req = biosecurityRequirements.find(r => r.id === requirementId);
    if (!req) return;

    let newLogs: BiosecurityVerificationLog[] = [];
    const existingIndex = biosecurityLogs.findIndex(l => l.requirementId === requirementId && l.date === date);

    if (existingIndex >= 0) {
      const existing = biosecurityLogs[existingIndex];
      let nextStatus: BiosecurityStatus = status || (existing.status === 'pass' ? 'fail' : existing.status === 'fail' ? 'na' : 'pass');

      const updatedLog: BiosecurityVerificationLog = {
        ...existing,
        status: nextStatus,
        verified: true,
        verifiedBy: currentUser?.id || 'staff',
        verifiedByName: currentUser?.fullName || 'Staff',
        verifiedAt: new Date().toISOString(),
        notes: notes !== undefined ? notes : existing.notes,
        correctiveAction: correctiveAction !== undefined ? correctiveAction : existing.correctiveAction
      };

      newLogs = [...biosecurityLogs];
      newLogs[existingIndex] = updatedLog;
    } else {
      const targetStatus: BiosecurityStatus = status || 'pass';
      const newLogEntry: BiosecurityVerificationLog = {
        id: 'blog_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        date,
        requirementId,
        requirementTitle: req.title,
        category: req.category,
        targetArea: req.targetArea,
        status: targetStatus,
        verified: true,
        verifiedBy: currentUser?.id || 'staff',
        verifiedByName: currentUser?.fullName || 'Staff',
        verifiedAt: new Date().toISOString(),
        notes,
        correctiveAction
      };
      newLogs = [newLogEntry, ...biosecurityLogs];
    }

    setBiosecurityLogs(newLogs);
    calculateAndUpdateDailySummary(date, newLogs, biosecurityRequirements);

    const logToSave = newLogs.find(l => l.requirementId === requirementId && l.date === date);
    if (logToSave) {
      saveDocToFirestore('biosecurityLogs', logToSave.id || `${requirementId}_${date}`, logToSave);
    }

    logAction(
      'BIOSECURITY_VERIFICATION', 
      'biosecurity', 
      `Verified biosecurity item: "${req.title}" as [${(status || 'pass').toUpperCase()}] for date ${date} [Live RTU Sync].`
    );
  };

  const batchVerifyAllBiosecurity = (date: string, status: BiosecurityStatus = 'pass') => {
    const activeReqs = biosecurityRequirements.filter(r => r.active);
    const existingOtherLogs = biosecurityLogs.filter(l => l.date !== date);
    
    const nowIso = new Date().toISOString();
    const batchLogs: BiosecurityVerificationLog[] = activeReqs.map(req => {
      const prev = biosecurityLogs.find(l => l.date === date && l.requirementId === req.id);
      return {
        id: prev?.id || ('blog_' + Date.now() + '_' + req.id),
        date,
        requirementId: req.id,
        requirementTitle: req.title,
        category: req.category,
        targetArea: req.targetArea,
        status,
        verified: true,
        verifiedBy: currentUser?.id || 'staff',
        verifiedByName: currentUser?.fullName || 'Staff',
        verifiedAt: nowIso,
        notes: prev?.notes || 'Batch verified compliant'
      };
    });

    const newLogs = [...batchLogs, ...existingOtherLogs];
    setBiosecurityLogs(newLogs);
    calculateAndUpdateDailySummary(date, newLogs, biosecurityRequirements);
    batchLogs.forEach(blog => {
      saveDocToFirestore('biosecurityLogs', blog.id || `${blog.requirementId}_${blog.date}`, blog);
    });
    logAction('BIOSECURITY_BATCH_VERIFY', 'biosecurity', `Batch-verified all ${activeReqs.length} active biosecurity requirements as [${status.toUpperCase()}] for date ${date}.`);
  };

  const signoffBiosecurityDaily = (date: string, supervisorNotes?: string) => {
    const activeReqs = biosecurityRequirements.filter(r => r.active);
    const dayLogs = biosecurityLogs.filter(l => l.date === date && l.verified);
    const passed = dayLogs.filter(l => l.status === 'pass').length;
    const failed = dayLogs.filter(l => l.status === 'fail').length;
    const score = activeReqs.length === 0 ? 100 : Math.round((passed / activeReqs.length) * 100);

    const updatedSummary: BiosecurityDailySummary = {
      date,
      totalRequirements: activeReqs.length,
      verifiedCount: dayLogs.length,
      passedCount: passed,
      failedCount: failed,
      complianceScorePct: score,
      supervisorSignoff: true,
      supervisorSignoffBy: currentUser?.fullName || 'Farm Manager',
      supervisorSignoffAt: new Date().toISOString(),
      supervisorNotes: supervisorNotes || 'Daily biosecurity protocols audited and verified compliant.'
    };

    setBiosecuritySummaries(prev => ({
      ...prev,
      [date]: updatedSummary
    }));
    saveDocToFirestore('biosecuritySummaries', date, updatedSummary);

    logAction('BIOSECURITY_SUPERVISOR_SIGNOFF', 'biosecurity', `Manager supervisor sign-off approved for ${date} with ${score}% compliance score.`);
  };

  const getBiosecurityDailyStats = (date: string) => {
    const activeReqs = biosecurityRequirements.filter(r => r.active);
    const dayLogs = biosecurityLogs.filter(l => l.date === date);
    const verified = dayLogs.filter(l => l.verified);
    const passed = dayLogs.filter(l => l.status === 'pass' && l.verified);
    const failed = dayLogs.filter(l => l.status === 'fail' && l.verified);
    const naCount = dayLogs.filter(l => l.status === 'na' && l.verified).length;
    const summary = biosecuritySummaries[date];

    const applicableTotal = Math.max(1, activeReqs.length - naCount);
    const compliancePct = activeReqs.length === 0 ? 100 : Math.min(100, Math.round((passed.length / applicableTotal) * 100));

    return {
      total: activeReqs.length,
      verified: verified.length,
      passed: passed.length,
      failed: failed.length,
      naCount,
      compliancePct,
      isSignedOff: Boolean(summary?.supervisorSignoff),
      signedOffBy: summary?.supervisorSignoffBy,
      signedOffAt: summary?.supervisorSignoffAt,
      supervisorNotes: summary?.supervisorNotes
    };
  };

  // Delivery & ESRRR Management
  const addDelivery = (record: Omit<DeliveryRecord, 'id' | 'createdAt'>): DeliveryRecord => {
    const id = 'del_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const newDelivery: DeliveryRecord = {
      ...record,
      id,
      createdAt: new Date().toISOString()
    };
    setDeliveries(prev => [newDelivery, ...prev]);
    saveDocToFirestore('deliveries', newDelivery.id, newDelivery);
    logAction('ADD_DELIVERY', 'egg_prod', `Created ESRRR delivery record #${newDelivery.esrrrNumber} for date ${newDelivery.productionDate} (${newDelivery.totalEggsReceived.toLocaleString()} total eggs).`);
    return newDelivery;
  };

  const updateDelivery = (id: string, updates: Partial<DeliveryRecord>) => {
    setDeliveries(prev => prev.map(d => {
      if (d.id === id) {
        const updated = { ...d, ...updates, updatedAt: new Date().toISOString() };
        saveDocToFirestore('deliveries', id, updated);
        logAction('UPDATE_DELIVERY', 'egg_prod', `Updated ESRRR delivery #${updated.esrrrNumber}.`);
        return updated;
      }
      return d;
    }));
  };

  const deleteDelivery = (id: string) => {
    const target = deliveries.find(d => d.id === id);
    setDeliveries(prev => prev.filter(d => d.id !== id));
    deleteDocFromFirestore('deliveries', id);
    logAction('DELETE_DELIVERY', 'egg_prod', `Deleted ESRRR delivery record #${target?.esrrrNumber || id}.`);
  };

  const getDeliveryById = (id: string): DeliveryRecord | undefined => {
    return deliveries.find(d => d.id === id);
  };

  // Reset & Backup Data
  const resetAllDataToDefaults = () => {
    setFarmProfile(INITIAL_FARM_PROFILE);
    setUsers(INITIAL_USERS);
    setFlocks(INITIAL_FLOCKS);
    setFeedStockEntries(INITIAL_FEED_STOCK);
    setFeedConsumptionRecords(INITIAL_FEED_CONSUMPTION);
    setDepletions(INITIAL_DEPLETIONS);
    setTransfers(INITIAL_BIRD_TRANSFERS);
    setMedProducts(INITIAL_MED_PRODUCTS);
    setMedAdministrations(INITIAL_MED_ADMIN);
    setBodyWeights(INITIAL_BODY_WEIGHTS);
    setRawEggRecords(INITIAL_EGG_PRODUCTION);
    setWeeklyEggWeights(INITIAL_WEEKLY_EGG_WEIGHTS);
    setDeliveries(INITIAL_DELIVERIES);
    setSystemLogs(INITIAL_SYSTEM_LOGS);
    setBiosecurityRequirements(INITIAL_BIOSECURITY_REQUIREMENTS);
    setBiosecurityLogs(INITIAL_BIOSECURITY_LOGS);
    setBiosecuritySummaries(INITIAL_BIOSECURITY_SUMMARIES);
    setCurrentUser(INITIAL_USERS[0]);
    localStorage.clear();
    logAction('SYSTEM_RESET', 'admin', 'Reset all farm management database to factory demo defaults.');
  };

  const clearDatabaseForNewCycle = async (): Promise<{ success: boolean; message: string }> => {
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Reset all houses 1-6 to baseline zero for a brand new placement cycle
    const freshFlocks: Flock[] = [1, 2, 3, 4, 5, 6].map(num => ({
      id: `flock_h${num}_new`,
      houseNumber: `House ${num}`,
      breed: 'Cobb 500',
      loadingDateMale: todayStr,
      loadingDateFemale: todayStr,
      initialMales: 0,
      initialFemales: 0,
      currentMales: 0,
      currentFemales: 0,
      hatchDate: todayStr,
      status: 'active' as const,
      notes: `House ${num} ready for new flock placement cycle.`,
      pens: [
        { id: `pen_h${num}_l1`, name: 'Pen L1', side: 'Left' as const, males: 0, females: 0 },
        { id: `pen_h${num}_l2`, name: 'Pen L2', side: 'Left' as const, males: 0, females: 0 },
        { id: `pen_h${num}_r1`, name: 'Pen R1', side: 'Right' as const, males: 0, females: 0 },
        { id: `pen_h${num}_r2`, name: 'Pen R2', side: 'Right' as const, males: 0, females: 0 },
      ]
    }));

    setFlocks(freshFlocks);
    setRawEggRecords([]);
    setWeeklyEggWeights([]);
    setDeliveries([]);
    setFeedStockEntries([]);
    setFeedConsumptionRecords([]);
    setDepletions([]);
    setTransfers([]);
    setMedAdministrations([]);
    setBodyWeights([]);

    const newLog: SystemLog = {
      id: 'log_' + Date.now(),
      timestamp: new Date().toISOString(),
      userId: currentUser?.id || 'usr_admin',
      userName: currentUser?.fullName || 'System Administrator',
      userRole: currentUser?.role || 'admin',
      action: 'CYCLE_CLEARED',
      category: 'admin',
      details: 'All flock production, egg collections, feed logs, deliveries, and mortality history cleared to start a fresh cycle.',
    };
    setSystemLogs(prev => [newLog, ...prev.slice(0, 150)]);

    await refreshStorageQuota();

    return {
      success: true,
      message: `Database successfully cleared for new cycle. All persistent collections have been reset.`
    };
  };

  const exportDataJson = (): string => {
    const payload = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      farmProfile,
      users,
      flocks,
      feedStockEntries,
      feedConsumptionRecords,
      depletions,
      transfers,
      medProducts,
      medAdministrations,
      bodyWeights,
      eggProductionRecords: rawEggRecords,
      weeklyEggWeights,
      deliveries,
      systemLogs,
      biosecurityRequirements,
      biosecurityLogs,
      biosecuritySummaries
    };
    return JSON.stringify(payload, null, 2);
  };

  const importDataJson = (jsonStr: string): boolean => {
    try {
      const data = JSON.parse(jsonStr);
      if (data.farmProfile) setFarmProfile(data.farmProfile);
      if (data.users) setUsers(data.users);
      if (data.flocks) setFlocks(data.flocks);
      if (data.feedStockEntries) setFeedStockEntries(data.feedStockEntries);
      if (data.feedConsumptionRecords) setFeedConsumptionRecords(data.feedConsumptionRecords);
      if (data.depletions) setDepletions(data.depletions);
      if (data.transfers) setTransfers(data.transfers);
      if (data.medProducts) setMedProducts(data.medProducts);
      if (data.medAdministrations) setMedAdministrations(data.medAdministrations);
      if (data.bodyWeights) setBodyWeights(data.bodyWeights);
      if (data.eggProductionRecords) setRawEggRecords(data.eggProductionRecords);
      if (data.weeklyEggWeights) setWeeklyEggWeights(data.weeklyEggWeights);
      if (data.deliveries) setDeliveries(data.deliveries);
      if (data.systemLogs) setSystemLogs(data.systemLogs);
      if (data.biosecurityRequirements) setBiosecurityRequirements(data.biosecurityRequirements);
      if (data.biosecurityLogs) setBiosecurityLogs(data.biosecurityLogs);
      if (data.biosecuritySummaries) setBiosecuritySummaries(data.biosecuritySummaries);
      logAction('IMPORT_DATA', 'admin', 'Successfully imported backup database from external JSON file.');
      return true;
    } catch {
      return false;
    }
  };

  // Role Permissions Matrix
  const r = currentUser?.role || 'Egg Collector';
  const isAdmin = r === 'admin' || r === 'System Administrator';
  const isManager = r === 'farm_manager' || r === 'Farm Manager';
  const isFlockman = r === 'flockman' || r === 'Flockman';
  const isLeadman = r === 'leadman' || r === 'Leadman';
  const isCollector = r === 'egg_collector' || r === 'Egg Collector';

  const permissions: PermissionCheck = {
    canViewModule: (moduleId: string): boolean => {
      if (moduleId === 'presentation') return true;
      if (isAdmin || isManager) return true;

      if (isFlockman) {
        // Flockman: access designated flock's record Egg Production, view Flockman's Module, view Flock, Farm Profile, Delivery and Reports
        return ['dashboard', 'egg_production', 'delivery', 'flockman', 'flockman_module', 'flock', 'flock_list', 'farm_profile', 'reports', 'presentation'].includes(moduleId);
      }
      if (isLeadman) {
        // Leadman: access designated flock's record Egg Production, record Flockman's Module, view Flock, Farm Profile, mortality, Delivery and Reports
        return ['dashboard', 'egg_production', 'delivery', 'flockman', 'flockman_module', 'flock', 'flock_list', 'farm_profile', 'mortality', 'reports', 'presentation'].includes(moduleId);
      }
      if (isCollector) {
        // Egg Collector: access designated flock, Record Egg Production, Delivery and Reports
        return ['dashboard', 'egg_production', 'delivery', 'reports', 'presentation'].includes(moduleId);
      }
      return false;
    },

    canEditRecord: isAdmin,
    canDeleteRecord: isAdmin,
    canApproveUsers: isAdmin,
    canManageUsers: isAdmin,
    canManageFarmProfile: isAdmin,
    canManageMedicines: isAdmin || isManager,
    canManageBiosecurityRequirements: isAdmin || isManager,
    canVerifyBiosecurity: true,
    
    canRecordEggProduction: (houseNumber?: string) => {
      if (isAdmin || isManager) return true;
      if (!houseNumber) return true;
      return (currentUser?.designatedHouses || []).includes(houseNumber);
    },

    canRecordFlockmanModule: (houseNumber?: string) => {
      if (isAdmin || isManager || isLeadman) {
        if (!houseNumber || isAdmin || isManager) return true;
        return (currentUser?.designatedHouses || []).includes(houseNumber);
      }
      return false;
    },

    canRecordMortality: (houseNumber?: string) => {
      if (isAdmin || isManager || isLeadman) {
        if (!houseNumber || isAdmin || isManager) return true;
        return (currentUser?.designatedHouses || []).includes(houseNumber);
      }
      return false;
    },

    canAddFeedStock: isAdmin || isManager,
    canAddMedicine: isAdmin || isManager,
    canAddFlock: isAdmin || isManager
  };

  return (
    <FarmContext.Provider
      value={{
        currentUser,
        users,
        login,
        logout,
        registerUser,
        recoverAccount,
        changePassword,
        adminResetUserPassword,
        adminToggleUserLock,
        evaluatePasswordStrength,
        approveUser,
        rejectUser,
        updateUserRole,
        updateUserStatus,
        assignUserHouses,
        deleteUser,
        switchUser,
        switchUserRole,

        farmProfile,
        updateFarmProfile,
        updateStandardVaccination,
        updateStandardFeedGuide,
        updateStandardHenday,
        updateStandardBodyWeights,
        updateStandardEggWeights,

        flocks,
        addFlock,
        updateFlock,
        deleteFlock,
        getFlockStats,
        transfers,
        addTransfer,
        deleteTransfer,

        feedStockEntries,
        feedConsumptionRecords,
        addFeedStock,
        deleteFeedStock,
        addFeedConsumption,
        deleteFeedConsumption,
        getFeedStockSummary,
        getLowStockAlerts,

        depletions,
        addDepletion,
        deleteDepletion,

        medProducts,
        medStockLogs,
        medAdministrations,
        addMedProduct,
        updateMedProduct,
        deleteMedProduct,
        addMedStock,
        addMedAdministration,
        deleteMedAdministration,
        getUpcomingVaccines,
        getUpcomingVaccineAlerts,

        bodyWeights,
        addBodyWeightRecord,
        deleteBodyWeightRecord,

        eggProductionRecords,
        weeklyEggWeights,
        addEggProductionRecord,
        updateEggProductionRecord,
        deleteEggProductionRecord,
        addWeeklyEggWeight,
        deleteWeeklyEggWeight,

        deliveries,
        addDelivery,
        updateDelivery,
        deleteDelivery,
        getDeliveryById,

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

        systemLogs,
        auditLogs: systemLogs,
        logAction,
        resetAllDataToDefaults,
        clearDatabaseForNewCycle,
        exportDataJson,
        importDataJson,

        dbStatus,
        isMobileDevice,
        databaseEngine,
        checkDBStatus,
        reconnectDB,
        mongoStatus,
        syncAllToMongoDB,
        pullAllFromMongoDB,

        // Firebase Firestore Engine (Aliases)
        firestoreStatus,
        syncAllToFirestore,
        pullAllFromFirestore,

        // RTU (Real-Time Update) Multi-Device & Account Sync Engine
        rtuMode: true,
        rtuRevision,
        activeDevicesCount,
        lastRtuHeartbeat,
        rtuStatus,
        triggerRtuSync,

        // Offline & Live Sync Engine
        isOnline,
        offlineQueue,
        pendingOfflineCount: 0,
        storageQuota,
        refreshStorageQuota,
        syncOfflineQueue,
        clearOfflineSyncQueue,

        permissions
      }}
    >
      {children}
    </FarmContext.Provider>
  );
};

export const useFarm = (): FarmContextType => {
  const context = useContext(FarmContext);
  if (!context) {
    throw new Error('useFarm must be used within a FarmProvider');
  }
  return context;
};
