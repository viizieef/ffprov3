import { MongoClient, Db, ServerApiVersion } from 'mongodb';

export interface MongoStatus {
  connected: boolean;
  dbName: string;
  uriConfigured: boolean;
  serverInfo?: string;
  collections?: { name: string; count: number }[];
  lastSyncedAt?: string;
  error?: string | null;
  rtuRevision?: number;
  activeDevicesCount?: number;
}

let client: MongoClient | null = null;
let db: Db | null = null;
let lastSyncTime: string | null = null;
let lastConnectionAttempt: number = 0;
let connectionError: string | null = null;
let rtuRevision: number = 1;
let lastModifiedTime: string = new Date().toISOString();
const activeDeviceHeartbeats = new Map<string, number>();
const sseClients = new Set<(event: { type: string; revision: number; collection?: string; id?: string; timestamp: string }) => void>();

/**
 * Registers an SSE client for instantaneous real-time change events
 */
export function registerSseClient(callback: (event: { type: string; revision: number; collection?: string; id?: string; timestamp: string }) => void): () => void {
  sseClients.add(callback);
  return () => {
    sseClients.delete(callback);
  };
}

/**
 * Broadcasts real-time delta updates to all connected browser clients instantly
 */
export function broadcastChangeEvent(collection?: string, id?: string) {
  const payload = {
    type: 'DATA_CHANGED',
    revision: rtuRevision,
    collection,
    id,
    timestamp: lastModifiedTime,
  };
  sseClients.forEach(cb => {
    try {
      cb(payload);
    } catch {
      // ignore broken client pipe
    }
  });
}

/**
 * Registers an active device heartbeat in RTU mode
 */
export function registerDeviceHeartbeat(deviceId: string): { revision: number; lastModified: string; activeDevices: number } {
  const now = Date.now();
  if (deviceId) {
    activeDeviceHeartbeats.set(deviceId, now);
  }
  // Prune device heartbeats older than 45 seconds
  for (const [id, time] of activeDeviceHeartbeats.entries()) {
    if (now - time > 45000) {
      activeDeviceHeartbeats.delete(id);
    }
  }
  return {
    revision: rtuRevision,
    lastModified: lastModifiedTime,
    activeDevices: Math.max(1, activeDeviceHeartbeats.size),
  };
}

export function incrementRtuRevision(collection?: string, id?: string): number {
  rtuRevision += 1;
  lastModifiedTime = new Date().toISOString();
  lastSyncTime = lastModifiedTime;
  broadcastChangeEvent(collection, id);
  return rtuRevision;
}

// Baseline initial seeds import for server fallback persistence
import {
  INITIAL_FARM_PROFILE,
  INITIAL_FLOCKS,
  INITIAL_FEED_STOCK,
  INITIAL_FEED_CONSUMPTION,
  INITIAL_MED_PRODUCTS,
  INITIAL_MED_ADMIN,
  INITIAL_BODY_WEIGHTS,
  INITIAL_EGG_PRODUCTION,
  INITIAL_WEEKLY_EGG_WEIGHTS,
  INITIAL_USERS,
  INITIAL_DEPLETIONS,
  INITIAL_BIRD_TRANSFERS,
  INITIAL_BIOSECURITY_REQUIREMENTS,
  INITIAL_BIOSECURITY_LOGS,
  INITIAL_DELIVERIES,
  INITIAL_SYSTEM_LOGS
} from '../src/data/initialData.js';

// In-memory persistent fallback if MongoDB URI is not provided yet or server is starting
const localMemoryDb: Record<string, Map<string, any>> = {
  eggRecords: new Map(),
  flocks: new Map(),
  feedRecords: new Map(),
  feedStock: new Map(),
  depletions: new Map(),
  transfers: new Map(),
  medProducts: new Map(),
  medStockLogs: new Map(),
  medAdmins: new Map(),
  bodyWeights: new Map(),
  biosecurityLogs: new Map(),
  biosecurityRequirements: new Map(),
  biosecuritySummaries: new Map(),
  weeklyEggWeights: new Map(),
  deliveries: new Map(),
  users: new Map(),
  farmProfile: new Map(),
  auditLogs: new Map(),
  systemLogs: new Map(),
  settings: new Map(),
  standards: new Map(),
};

/**
 * Prepopulates local memory fallback with baseline records
 */
function initializeServerSeed() {
  INITIAL_FLOCKS.forEach(f => localMemoryDb.flocks.set(f.houseNumber, f));
  INITIAL_EGG_PRODUCTION.forEach(e => localMemoryDb.eggRecords.set(e.id, e));
  INITIAL_FEED_CONSUMPTION.forEach(f => localMemoryDb.feedRecords.set(f.id, f));
  INITIAL_FEED_STOCK.forEach(s => localMemoryDb.feedStock.set(s.id, s));
  INITIAL_DEPLETIONS.forEach(d => localMemoryDb.depletions.set(d.id, d));
  INITIAL_BIRD_TRANSFERS.forEach(t => localMemoryDb.transfers.set(t.id, t));
  INITIAL_MED_PRODUCTS.forEach(p => localMemoryDb.medProducts.set(p.id, p));
  INITIAL_MED_ADMIN.forEach(m => localMemoryDb.medAdmins.set(m.id, m));
  INITIAL_BODY_WEIGHTS.forEach(b => localMemoryDb.bodyWeights.set(b.id, b));
  INITIAL_BIOSECURITY_REQUIREMENTS.forEach(r => localMemoryDb.biosecurityRequirements.set(r.id, r));
  INITIAL_BIOSECURITY_LOGS.forEach(l => localMemoryDb.biosecurityLogs.set(`${l.requirementId}_${l.date}`, l));
  INITIAL_WEEKLY_EGG_WEIGHTS.forEach(w => localMemoryDb.weeklyEggWeights.set(w.id, w));
  INITIAL_DELIVERIES.forEach(d => localMemoryDb.deliveries.set(d.id, d));
  INITIAL_USERS.forEach(u => localMemoryDb.users.set(u.username.toLowerCase(), u));
  localMemoryDb.farmProfile.set('profile', INITIAL_FARM_PROFILE);
  INITIAL_SYSTEM_LOGS.forEach(l => localMemoryDb.systemLogs.set(l.id, l));
  localMemoryDb.standards.set('breed_standards', {
    standardVaccinationProgram: INITIAL_FARM_PROFILE.standardVaccinationProgram,
    standardFeedGuide: INITIAL_FARM_PROFILE.standardFeedGuide,
    standardHenday: INITIAL_FARM_PROFILE.standardHenday,
    standardBodyWeights: INITIAL_FARM_PROFILE.standardBodyWeights,
    standardEggWeights: INITIAL_FARM_PROFILE.standardEggWeights,
  });
  localMemoryDb.settings.set('global_settings', {
    currency: INITIAL_FARM_PROFILE.currency,
    facilityHousesCount: INITIAL_FARM_PROFILE.facilityHousesCount,
    totalBirdCapacity: INITIAL_FARM_PROFILE.totalBirdCapacity,
    dailyEggCapacity: INITIAL_FARM_PROFILE.dailyEggCapacity,
    farmOverviewNotes: INITIAL_FARM_PROFILE.farmOverviewNotes,
  });
}

initializeServerSeed();

let connectingPromise: Promise<Db | null> | null = null;
let indexesEnsured = false;

/**
 * Resets cached client and database instances on socket or pool failure
 */
export function resetMongoClient() {
  const oldClient = client;
  client = null;
  db = null;
  connectingPromise = null;
  indexesEnsured = false;

  if (oldClient) {
    try {
      oldClient.close(false).catch(() => {});
    } catch {
      // ignore
    }
  }
}

/**
 * Initializes or returns the cached MongoDB database instance with single-flight mutex.
 */
export async function getMongoDb(): Promise<Db | null> {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME || 'farmflow_db';

  if (!uri) {
    connectionError = 'MONGODB_URI environment variable is not configured. Using high-speed local persistence fallback.';
    return null;
  }

  // Reuse existing connected client
  if (db && client) {
    return db;
  }

  // Reuse in-flight connection promise to prevent race conditions
  if (connectingPromise) {
    return connectingPromise;
  }

  // Throttle reconnection attempts to prevent connection storming
  const now = Date.now();
  if (now - lastConnectionAttempt < 6000 && connectionError) {
    return null;
  }
  lastConnectionAttempt = now;

  connectingPromise = (async () => {
    try {
      const mongoClientOptions: any = {
        connectTimeoutMS: 10000,
        socketTimeoutMS: 20000,
        serverSelectionTimeoutMS: 5000,
        maxPoolSize: 10,
        minPoolSize: 1,
        maxIdleTimeMS: 45000,
        retryWrites: true,
        retryReads: true,
      };

      // Add ServerApi if using MongoDB Atlas SRV URI
      if (uri.startsWith('mongodb+srv://') || uri.includes('mongodb.net')) {
        mongoClientOptions.serverApi = {
          version: ServerApiVersion.v1,
          strict: false,
          deprecationErrors: true,
        };
      }

      const newClient = new MongoClient(uri, mongoClientOptions);

      newClient.on('error', () => {
        resetMongoClient();
      });
      newClient.on('timeout', () => {
        resetMongoClient();
      });
      newClient.on('close', () => {
        client = null;
        db = null;
        connectingPromise = null;
      });

      await newClient.connect();
      
      // Test ping
      const testDb = newClient.db(dbName);
      await testDb.command({ ping: 1 });

      client = newClient;
      db = testDb;
      connectionError = null;
      console.log(`🍃 [MongoDB] Successfully connected to MongoDB database "${dbName}"`);

      // Ensure indexes once per connection lifecycle
      if (!indexesEnsured) {
        indexesEnsured = true;
        ensureMongoIndexes(db).catch(() => {});
      }

      return db;
    } catch (err: any) {
      resetMongoClient();
      connectionError = err?.message || 'Failed to connect to MongoDB cluster';
      console.warn(`🍃 [MongoDB] Connection notice: ${connectionError}`);
      return null;
    } finally {
      connectingPromise = null;
    }
  })();

  return connectingPromise;
}

/**
 * Creates optimal collection indexes in MongoDB
 */
async function ensureMongoIndexes(database: Db) {
  try {
    if (!client || !db) return;
    const indexOpts = { background: true, maxTimeMS: 3000 } as any;
    await Promise.allSettled([
      database.collection('users').createIndex({ username: 1 }, { unique: true, sparse: true, ...indexOpts }),
      database.collection('eggRecords').createIndex({ date: 1, house: 1 }, indexOpts),
      database.collection('flocks').createIndex({ houseNumber: 1 }, indexOpts),
      database.collection('feedRecords').createIndex({ date: 1, house: 1 }, indexOpts),
      database.collection('depletions').createIndex({ date: 1, house: 1 }, indexOpts),
      database.collection('bodyWeights').createIndex({ flockId: 1, weekAge: 1 }, indexOpts),
      database.collection('biosecurityLogs').createIndex({ requirementId: 1, date: 1 }, indexOpts),
      database.collection('deliveries').createIndex({ deliveryDate: 1, deliveryNumber: 1 }, indexOpts),
    ]);
  } catch {
    // silently handle benign index creation timeouts during pool resets
  }
}

/**
 * Returns real-time MongoDB health, connection status and collection statistics
 */
export async function getMongoStatus(): Promise<MongoStatus> {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME || 'farmflow_db';
  const isUriConfigured = Boolean(uri);

  const database = await getMongoDb();

  if (!database) {
    // Return status with memory fallback stats
    const fallbackCollections = Object.keys(localMemoryDb).map((col) => ({
      name: col,
      count: localMemoryDb[col].size,
    }));

    return {
      connected: false,
      dbName,
      uriConfigured: isUriConfigured,
      serverInfo: isUriConfigured ? 'Connecting / Offline' : 'In-Memory / Local Cache Active',
      collections: fallbackCollections,
      lastSyncedAt: lastSyncTime || undefined,
      error: connectionError,
      rtuRevision,
      activeDevicesCount: Math.max(1, activeDeviceHeartbeats.size),
    };
  }

  try {
    const collectionsList = await database.listCollections({}, { maxTimeMS: 4000 } as any).toArray();
    const collectionStats: { name: string; count: number }[] = [];

    for (const col of collectionsList) {
      try {
        const count = await database.collection(col.name).estimatedDocumentCount({ maxTimeMS: 2000 } as any);
        collectionStats.push({ name: col.name, count });
      } catch {
        collectionStats.push({ name: col.name, count: 0 });
      }
    }

    return {
      connected: true,
      dbName: database.databaseName,
      uriConfigured: true,
      serverInfo: 'MongoDB Cluster Active & Ready (RTU Mode)',
      collections: collectionStats,
      lastSyncedAt: lastSyncTime || new Date().toISOString(),
      error: null,
      rtuRevision,
      activeDevicesCount: Math.max(1, activeDeviceHeartbeats.size),
    };
  } catch (err: any) {
    resetMongoClient();
    connectionError = err?.message || 'Error querying cluster statistics';
    
    const fallbackCollections = Object.keys(localMemoryDb).map((col) => ({
      name: col,
      count: localMemoryDb[col].size,
    }));

    return {
      connected: false,
      dbName,
      uriConfigured: isUriConfigured,
      serverInfo: 'Failing over to local buffer (MongoDB reconnecting)',
      collections: fallbackCollections,
      lastSyncedAt: lastSyncTime || undefined,
      error: connectionError,
      rtuRevision,
      activeDevicesCount: Math.max(1, activeDeviceHeartbeats.size),
    };
  }
}

/**
 * Saves or upserts a single document in MongoDB
 */
export async function saveMongoDoc(collectionName: string, id: string, docData: any): Promise<{ success: boolean; message: string }> {
  const database = await getMongoDb();

  // Save to memory store first for immediate local reactivity
  if (!localMemoryDb[collectionName]) {
    localMemoryDb[collectionName] = new Map();
  }
  const cleanId = String(id || docData.id || docData._id || 'item_' + Date.now());
  const payload = { ...docData, id: cleanId, updatedAt: new Date().toISOString() };
  localMemoryDb[collectionName].set(cleanId, payload);
  incrementRtuRevision(collectionName, cleanId);

  if (database) {
    try {
      const col = database.collection(collectionName);
      await col.updateOne(
        { $or: [{ id: cleanId }, { _id: cleanId }] } as any,
        { $set: { ...payload, _id: cleanId } },
        { upsert: true, maxTimeMS: 4000 } as any
      );
      lastSyncTime = new Date().toISOString();
      return { success: true, message: `Document ${cleanId} upserted in MongoDB ${collectionName}` };
    } catch (err: any) {
      console.warn(`MongoDB write notice in ${collectionName}:`, err?.message);
      if (err?.name?.includes('Mongo') || err?.message?.includes('timeout') || err?.message?.includes('PoolCleared') || err?.message?.includes('topology')) {
        resetMongoClient();
      }
      return { success: true, message: `Document ${cleanId} saved in local buffer (failover)` };
    }
  }

  lastSyncTime = new Date().toISOString();
  return { success: true, message: `Document ${cleanId} saved in local buffer (awaiting MongoDB connection)` };
}

/**
 * Deletes a document from MongoDB
 */
export async function deleteMongoDoc(collectionName: string, id: string): Promise<{ success: boolean; message: string }> {
  const database = await getMongoDb();
  const cleanId = String(id);

  if (localMemoryDb[collectionName]) {
    localMemoryDb[collectionName].delete(cleanId);
  }
  incrementRtuRevision(collectionName, cleanId);

  if (database) {
    try {
      const col = database.collection(collectionName);
      await col.deleteOne({ $or: [{ id: cleanId }, { _id: cleanId }] } as any, { maxTimeMS: 4000 } as any);
      lastSyncTime = new Date().toISOString();
      return { success: true, message: `Document ${cleanId} removed from MongoDB ${collectionName}` };
    } catch (err: any) {
      console.warn(`MongoDB delete notice in ${collectionName}:`, err?.message);
      if (err?.name?.includes('Mongo') || err?.message?.includes('timeout') || err?.message?.includes('PoolCleared') || err?.message?.includes('topology')) {
        resetMongoClient();
      }
      return { success: true, message: `Document ${cleanId} removed from local buffer (failover)` };
    }
  }

  return { success: true, message: `Document ${cleanId} removed from local buffer` };
}

/**
 * Bulk syncs all farm collections to MongoDB
 */
export async function syncAllToMongo(data: Record<string, any[]> & { farmProfile?: any; settings?: any; standards?: any }): Promise<{
  success: boolean;
  message: string;
  counts: Record<string, number>;
  databaseEngine: 'mongodb' | 'local';
}> {
  const database = await getMongoDb();
  const counts: Record<string, number> = {};
  incrementRtuRevision();

  const collectionKeys = [
    'eggRecords',
    'flocks',
    'feedRecords',
    'feedStock',
    'depletions',
    'transfers',
    'medProducts',
    'medStockLogs',
    'medAdmins',
    'bodyWeights',
    'biosecurityLogs',
    'biosecurityRequirements',
    'biosecuritySummaries',
    'weeklyEggWeights',
    'deliveries',
    'users',
    'auditLogs',
    'systemLogs',
    'standards',
    'settings',
  ];

  // Also update farmProfile
  if (data.farmProfile) {
    if (!localMemoryDb['farmProfile']) localMemoryDb['farmProfile'] = new Map();
    localMemoryDb['farmProfile'].set('profile', data.farmProfile);
    if (database) {
      try {
        await database.collection('farmProfile').updateOne(
          { _id: 'profile' } as any,
          { $set: { ...data.farmProfile, _id: 'profile', updatedAt: new Date().toISOString() } },
          { upsert: true }
        );
      } catch (e) {
        console.warn('MongoDB farmProfile sync notice:', e);
      }
    }
  }

  // Also update settings doc if provided separately
  if (data.settings) {
    if (!localMemoryDb['settings']) localMemoryDb['settings'] = new Map();
    localMemoryDb['settings'].set('global_settings', data.settings);
    if (database) {
      try {
        await database.collection('settings').updateOne(
          { _id: 'global_settings' } as any,
          { $set: { ...data.settings, _id: 'global_settings', updatedAt: new Date().toISOString() } },
          { upsert: true }
        );
      } catch (e) {
        console.warn('MongoDB settings sync notice:', e);
      }
    }
  }

  // Also update standards doc if provided separately
  if (data.standards) {
    if (!localMemoryDb['standards']) localMemoryDb['standards'] = new Map();
    localMemoryDb['standards'].set('breed_standards', data.standards);
    if (database) {
      try {
        await database.collection('standards').updateOne(
          { _id: 'breed_standards' } as any,
          { $set: { ...data.standards, _id: 'breed_standards', updatedAt: new Date().toISOString() } },
          { upsert: true }
        );
      } catch (e) {
        console.warn('MongoDB standards sync notice:', e);
      }
    }
  }

  for (const key of collectionKeys) {
    const items = data[key] || [];
    counts[key] = items.length;

    if (!localMemoryDb[key]) {
      localMemoryDb[key] = new Map();
    }

    // Populate local memory
    for (const item of items) {
      const itemId = String(item.id || item.username || item.houseNumber || 'item_' + Math.random().toString(36).substring(2, 9));
      localMemoryDb[key].set(itemId, { ...item, id: itemId });
    }

    // If MongoDB is connected, execute bulk upserts
    if (database && items.length > 0) {
      try {
        const col = database.collection(key);
        const operations = items.map((item) => {
          const itemId = String(item.id || item.username || item.houseNumber || 'item_' + Math.random().toString(36).substring(2, 9));
          return {
            updateOne: {
              filter: { $or: [{ id: itemId }, { _id: itemId }] },
              update: { $set: { ...item, id: itemId, _id: itemId } },
              upsert: true,
            },
          };
        });

        // Batch in operations of 500
        for (let i = 0; i < operations.length; i += 500) {
          const chunk = operations.slice(i, i + 500);
          await col.bulkWrite(chunk as any, { ordered: false });
        }
      } catch (err: any) {
        console.warn(`🍃 [MongoDB] Bulk write notice in ${key}:`, err?.message);
        if (err?.name?.includes('Mongo') || err?.message?.includes('timeout') || err?.message?.includes('PoolCleared') || err?.message?.includes('topology')) {
          resetMongoClient();
        }
      }
    }
  }

  lastSyncTime = new Date().toISOString();
  incrementRtuRevision('all', 'bulk_sync');

  return {
    success: true,
    message: database
      ? 'All farm collections successfully written and synchronized to MongoDB database!'
      : 'All farm collections synced to server local storage buffer (ready for MongoDB sync).',
    counts,
    databaseEngine: database ? 'mongodb' : 'local',
  };
}

/**
 * Hydrates and pulls all collections from MongoDB
 */
export async function pullAllFromMongo(): Promise<{
  success: boolean;
  message: string;
  data: Record<string, any[]>;
  farmProfile?: any;
  settings?: any;
  standards?: any;
  databaseEngine: 'mongodb' | 'local';
}> {
  const database = await getMongoDb();
  const result: Record<string, any[]> = {};
  let farmProfile: any = null;
  let settings: any = null;
  let standards: any = null;

  const collectionKeys = [
    'eggRecords',
    'flocks',
    'feedRecords',
    'feedStock',
    'depletions',
    'transfers',
    'medProducts',
    'medStockLogs',
    'medAdmins',
    'bodyWeights',
    'biosecurityLogs',
    'biosecurityRequirements',
    'biosecuritySummaries',
    'weeklyEggWeights',
    'deliveries',
    'users',
    'auditLogs',
    'systemLogs',
    'standards',
    'settings',
  ];

  if (database) {
    try {
      for (const key of collectionKeys) {
        const docs = await database.collection(key).find({}).maxTimeMS(4000).toArray();
        result[key] = docs.map((d) => {
          const { _id, ...rest } = d;
          return { ...rest, id: rest.id || _id };
        });
        // Keep in-memory store in sync
        if (!localMemoryDb[key]) localMemoryDb[key] = new Map();
        result[key].forEach(item => {
          const itemId = String(item.id || item.username || item.houseNumber || 'item_' + Math.random().toString(36).substring(2, 9));
          localMemoryDb[key].set(itemId, item);
        });
      }

      // Farm profile
      const profileDoc = await database.collection('farmProfile').findOne({ _id: 'profile' } as any, { maxTimeMS: 3000 } as any);
      if (profileDoc) {
        const { _id, ...rest } = profileDoc;
        farmProfile = rest;
        if (!localMemoryDb['farmProfile']) localMemoryDb['farmProfile'] = new Map();
        localMemoryDb['farmProfile'].set('profile', farmProfile);
      }

      // Global Settings
      const settingsDoc = await database.collection('settings').findOne({ _id: 'global_settings' } as any, { maxTimeMS: 3000 } as any);
      if (settingsDoc) {
        const { _id, ...rest } = settingsDoc;
        settings = rest;
        if (!localMemoryDb['settings']) localMemoryDb['settings'] = new Map();
        localMemoryDb['settings'].set('global_settings', settings);
      }

      // Breed Standards
      const standardsDoc = await database.collection('standards').findOne({ _id: 'breed_standards' } as any, { maxTimeMS: 3000 } as any);
      if (standardsDoc) {
        const { _id, ...rest } = standardsDoc;
        standards = rest;
        if (!localMemoryDb['standards']) localMemoryDb['standards'] = new Map();
        localMemoryDb['standards'].set('breed_standards', standards);
      }

      lastSyncTime = new Date().toISOString();
      return {
        success: true,
        message: 'Successfully pulled latest farm collections from MongoDB cluster.',
        data: result,
        farmProfile,
        settings,
        standards,
        databaseEngine: 'mongodb',
      };
    } catch (err: any) {
      console.warn('🍃 [MongoDB] Notice reading collections (failing over to local server buffer):', err?.message);
      if (err?.name?.includes('Mongo') || err?.message?.includes('timeout') || err?.message?.includes('PoolCleared') || err?.message?.includes('topology')) {
        resetMongoClient();
      }
      connectionError = err?.message;
    }
  }

  // Fallback to local memory buffer
  for (const key of collectionKeys) {
    if (localMemoryDb[key]) {
      result[key] = Array.from(localMemoryDb[key].values());
    } else {
      result[key] = [];
    }
  }

  if (localMemoryDb['farmProfile'] && localMemoryDb['farmProfile'].has('profile')) {
    farmProfile = localMemoryDb['farmProfile'].get('profile');
  }
  if (localMemoryDb['settings'] && localMemoryDb['settings'].has('global_settings')) {
    settings = localMemoryDb['settings'].get('global_settings');
  }
  if (localMemoryDb['standards'] && localMemoryDb['standards'].has('breed_standards')) {
    standards = localMemoryDb['standards'].get('breed_standards');
  }

  return {
    success: true,
    message: 'Pulled data from server buffer.',
    data: result,
    farmProfile,
    settings,
    standards,
    databaseEngine: 'local',
  };
}
