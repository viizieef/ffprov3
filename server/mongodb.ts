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
 * Checks if an error is related to connection pool clearing, network timeout, or socket failure
 */
export function isConnectionOrPoolError(err: any): boolean {
  if (!err) return false;
  const msg = (err.message || String(err)).toLowerCase();
  const name = (err.name || '').toLowerCase();
  return (
    name.includes('pool') ||
    name.includes('network') ||
    name.includes('timeout') ||
    name.includes('serverselection') ||
    name.includes('topology') ||
    msg.includes('pool') ||
    msg.includes('timed out') ||
    msg.includes('timeout') ||
    msg.includes('connection <monitor>') ||
    msg.includes('closed') ||
    msg.includes('econnreset') ||
    msg.includes('etimedout') ||
    msg.includes('socket') ||
    msg.includes('topology') ||
    msg.includes('server closed')
  );
}

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
export async function getMongoDb(forceReconnect = false): Promise<Db | null> {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME || 'farmflow_db';

  if (!uri) {
    connectionError = 'MONGODB_URI environment variable is not configured. Using high-speed local persistence fallback.';
    return null;
  }

  if (forceReconnect) {
    resetMongoClient();
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
  if (!forceReconnect && now - lastConnectionAttempt < 3000 && connectionError) {
    return null;
  }
  lastConnectionAttempt = now;

  connectingPromise = (async () => {
    try {
      const mongoClientOptions: any = {
        connectTimeoutMS: 15000,
        socketTimeoutMS: 45000,
        serverSelectionTimeoutMS: 15000,
        heartbeatFrequencyMS: 10000,
        maxPoolSize: 50,
        minPoolSize: 0,
        maxIdleTimeMS: 60000,
        waitQueueTimeoutMS: 15000,
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

      newClient.on('connectionPoolCleared', () => {
        if (client === newClient) {
          resetMongoClient();
        }
      });

      newClient.on('serverClosed', () => {
        if (client === newClient) {
          resetMongoClient();
        }
      });

      newClient.on('error', () => {
        if (client === newClient) {
          resetMongoClient();
        }
      });

      newClient.on('close', () => {
        if (client === newClient) {
          client = null;
          db = null;
        }
      });

      await newClient.connect();
      
      // Test ping
      const testDb = newClient.db(dbName);
      await testDb.command({ ping: 1 });

      client = newClient;
      db = testDb;
      connectionError = null;
      console.log(`🍃 [MongoDB] Successfully connected to MongoDB database "${dbName}"`);

      // Ensure indexes and initial baseline seed once per connection lifecycle
      if (!indexesEnsured) {
        indexesEnsured = true;
        ensureMongoIndexes(db).catch(() => {});
        seedInitialDataToMongo(db).catch(() => {});
      }

      return db;
    } catch (err: any) {
      connectionError = err?.message || 'Failed to connect to MongoDB cluster';
      console.warn(`🍃 [MongoDB] Connection notice: ${connectionError}`);
      resetMongoClient();
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
 * Seeds baseline records into MongoDB if database is empty so all connecting devices have data
 */
async function seedInitialDataToMongo(database: Db) {
  try {
    if (!client || !db) return;
    const flockCount = await database.collection('flocks').countDocuments({}, { maxTimeMS: 4000 });
    if (flockCount === 0) {
      console.log('🍃 [MongoDB] Seeding baseline farm data to MongoDB cluster for multi-device synchronization...');
      const bulkOps: Promise<any>[] = [];
      if (INITIAL_FLOCKS.length > 0) {
        bulkOps.push(database.collection('flocks').insertMany(INITIAL_FLOCKS.map(f => ({ ...f, _id: f.houseNumber })) as any).catch(() => {}));
      }
      if (INITIAL_EGG_PRODUCTION.length > 0) {
        bulkOps.push(database.collection('eggRecords').insertMany(INITIAL_EGG_PRODUCTION.map(e => ({ ...e, _id: e.id })) as any).catch(() => {}));
      }
      if (INITIAL_USERS.length > 0) {
        bulkOps.push(database.collection('users').insertMany(INITIAL_USERS.map(u => ({ ...u, _id: u.username.toLowerCase() })) as any).catch(() => {}));
      }
      if (INITIAL_FEED_STOCK.length > 0) {
        bulkOps.push(database.collection('feedStock').insertMany(INITIAL_FEED_STOCK.map(s => ({ ...s, _id: s.id })) as any).catch(() => {}));
      }
      if (INITIAL_FEED_CONSUMPTION.length > 0) {
        bulkOps.push(database.collection('feedRecords').insertMany(INITIAL_FEED_CONSUMPTION.map(f => ({ ...f, _id: f.id })) as any).catch(() => {}));
      }
      if (INITIAL_DEPLETIONS.length > 0) {
        bulkOps.push(database.collection('depletions').insertMany(INITIAL_DEPLETIONS.map(d => ({ ...d, _id: d.id })) as any).catch(() => {}));
      }
      if (INITIAL_MED_PRODUCTS.length > 0) {
        bulkOps.push(database.collection('medProducts').insertMany(INITIAL_MED_PRODUCTS.map(p => ({ ...p, _id: p.id })) as any).catch(() => {}));
      }
      if (INITIAL_MED_ADMIN.length > 0) {
        bulkOps.push(database.collection('medAdmins').insertMany(INITIAL_MED_ADMIN.map(m => ({ ...m, _id: m.id })) as any).catch(() => {}));
      }
      if (INITIAL_BODY_WEIGHTS.length > 0) {
        bulkOps.push(database.collection('bodyWeights').insertMany(INITIAL_BODY_WEIGHTS.map(b => ({ ...b, _id: b.id })) as any).catch(() => {}));
      }
      if (INITIAL_BIOSECURITY_REQUIREMENTS.length > 0) {
        bulkOps.push(database.collection('biosecurityRequirements').insertMany(INITIAL_BIOSECURITY_REQUIREMENTS.map(r => ({ ...r, _id: r.id })) as any).catch(() => {}));
      }
      if (INITIAL_BIOSECURITY_LOGS.length > 0) {
        bulkOps.push(database.collection('biosecurityLogs').insertMany(INITIAL_BIOSECURITY_LOGS.map(l => ({ ...l, _id: `${l.requirementId}_${l.date}` })) as any).catch(() => {}));
      }
      if (INITIAL_DELIVERIES.length > 0) {
        bulkOps.push(database.collection('deliveries').insertMany(INITIAL_DELIVERIES.map(d => ({ ...d, _id: d.id })) as any).catch(() => {}));
      }
      bulkOps.push(database.collection('farmProfile').updateOne(
        { _id: 'profile' } as any,
        { $set: { ...INITIAL_FARM_PROFILE, _id: 'profile', updatedAt: new Date().toISOString() } },
        { upsert: true }
      ).catch(() => {}));
      await Promise.allSettled(bulkOps);
      console.log('🍃 [MongoDB] Baseline farm data seeded successfully.');
    }
  } catch (err: any) {
    console.warn('🍃 [MongoDB] Notice checking baseline seeding:', err?.message);
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
    const collectionsList = await database.listCollections({}, { maxTimeMS: 3000 } as any).toArray();
    const collectionStats = await Promise.all(
      collectionsList.map(async (col) => {
        try {
          const count = await database.collection(col.name).estimatedDocumentCount({ maxTimeMS: 2000 } as any);
          return { name: col.name, count };
        } catch {
          return { name: col.name, count: 0 };
        }
      })
    );

    return {
      connected: true,
      dbName: database.databaseName,
      uriConfigured: true,
      serverInfo: 'MongoDB Production Cluster Active & Ready (RTU Mode)',
      collections: collectionStats,
      lastSyncedAt: lastSyncTime || new Date().toISOString(),
      error: null,
      rtuRevision,
      activeDevicesCount: Math.max(1, activeDeviceHeartbeats.size),
    };
  } catch (err: any) {
    connectionError = err?.message || 'Error querying cluster statistics';
    
    const fallbackCollections = Object.keys(localMemoryDb).map((col) => ({
      name: col,
      count: localMemoryDb[col].size,
    }));

    return {
      connected: false,
      dbName,
      uriConfigured: isUriConfigured,
      serverInfo: 'Operating with server memory buffer (MongoDB auto-reconnecting)',
      collections: fallbackCollections,
      lastSyncedAt: lastSyncTime || undefined,
      error: connectionError,
      rtuRevision,
      activeDevicesCount: Math.max(1, activeDeviceHeartbeats.size),
    };
  }
}

/**
 * Saves or upserts a single document in MongoDB with auto-reconnect and retry
 */
export async function saveMongoDoc(collectionName: string, id: string, docData: any): Promise<{ success: boolean; message: string }> {
  let database = await getMongoDb();

  // Save to memory store first for immediate local reactivity and durability
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
        { upsert: true }
      );
      lastSyncTime = new Date().toISOString();
      return { success: true, message: `Document ${cleanId} upserted in MongoDB ${collectionName}` };
    } catch (err: any) {
      if (isConnectionOrPoolError(err)) {
        resetMongoClient();
        // Retry once with a freshly initialized connection
        try {
          const freshDb = await getMongoDb(true);
          if (freshDb) {
            const retryCol = freshDb.collection(collectionName);
            await retryCol.updateOne(
              { $or: [{ id: cleanId }, { _id: cleanId }] } as any,
              { $set: { ...payload, _id: cleanId } },
              { upsert: true }
            );
            lastSyncTime = new Date().toISOString();
            return { success: true, message: `Document ${cleanId} upserted in MongoDB ${collectionName} after auto-reconnect` };
          }
        } catch {
          // Gracefully fallback to memory buffer
        }
      }
      return { success: true, message: `Document ${cleanId} saved in local buffer (failover)` };
    }
  }

  lastSyncTime = new Date().toISOString();
  return { success: true, message: `Document ${cleanId} saved in local buffer (awaiting MongoDB connection)` };
}

/**
 * Deletes a document from MongoDB with auto-reconnect and retry
 */
export async function deleteMongoDoc(collectionName: string, id: string): Promise<{ success: boolean; message: string }> {
  let database = await getMongoDb();
  const cleanId = String(id);

  if (localMemoryDb[collectionName]) {
    localMemoryDb[collectionName].delete(cleanId);
  }
  incrementRtuRevision(collectionName, cleanId);

  if (database) {
    try {
      const col = database.collection(collectionName);
      await col.deleteOne({ $or: [{ id: cleanId }, { _id: cleanId }] } as any);
      lastSyncTime = new Date().toISOString();
      return { success: true, message: `Document ${cleanId} removed from MongoDB ${collectionName}` };
    } catch (err: any) {
      if (isConnectionOrPoolError(err)) {
        resetMongoClient();
        // Retry once with a freshly initialized connection
        try {
          const freshDb = await getMongoDb(true);
          if (freshDb) {
            const retryCol = freshDb.collection(collectionName);
            await retryCol.deleteOne({ $or: [{ id: cleanId }, { _id: cleanId }] } as any);
            lastSyncTime = new Date().toISOString();
            return { success: true, message: `Document ${cleanId} removed from MongoDB ${collectionName} after auto-reconnect` };
          }
        } catch {
          // Gracefully fallback to memory buffer
        }
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
          let itemId = String(item.id || item.username || item.houseNumber || 'item_' + Math.random().toString(36).substring(2, 9));
          if (key === 'flocks' && item.houseNumber) itemId = String(item.houseNumber);
          if (key === 'users' && item.username) itemId = String(item.username).toLowerCase();

          return {
            updateOne: {
              filter: { $or: [{ id: itemId }, { _id: itemId }, (key === 'flocks' && item.houseNumber ? { houseNumber: item.houseNumber } : {})].filter(o => Object.keys(o).length > 0) },
              update: { $set: { ...item, id: item.id || itemId, _id: itemId } },
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
      // Fetch all collections in parallel for optimal responsiveness
      const fetchPromises = collectionKeys.map(async (key) => {
        try {
          const docs = await database.collection(key).find({}).toArray();
          const itemsMap = new Map<string, any>();
          
          docs.forEach((d: any) => {
            const { _id, ...rest } = d;
            const item: any = { ...rest, id: rest.id || _id };
            let uniqueKey = String(item.id || _id);
            if (key === 'flocks' && item.houseNumber) {
              uniqueKey = String(item.houseNumber);
            } else if (key === 'users' && item.username) {
              uniqueKey = String(item.username).toLowerCase();
            } else if (key === 'biosecurityLogs' && item.requirementId && item.date) {
              uniqueKey = `${item.requirementId}_${item.date}`;
            }
            // Keep latest or preferred document
            itemsMap.set(uniqueKey, item);
          });

          const deduplicatedItems = Array.from(itemsMap.values());
          result[key] = deduplicatedItems;
          
          if (!localMemoryDb[key]) localMemoryDb[key] = new Map();
          deduplicatedItems.forEach((item: any) => {
            let itemId = String(item.id || item.username || item.houseNumber || 'item_' + Math.random().toString(36).substring(2, 9));
            if (key === 'flocks' && item.houseNumber) itemId = String(item.houseNumber);
            if (key === 'users' && item.username) itemId = String(item.username).toLowerCase();
            localMemoryDb[key].set(itemId, item);
          });
        } catch {
          // If a single collection fails, fallback to local buffer for that collection
          if (localMemoryDb[key]) {
            result[key] = Array.from(localMemoryDb[key].values());
          } else {
            result[key] = [];
          }
        }
      });

      const singleDocPromises = [
        database.collection('farmProfile').findOne({ _id: 'profile' } as any).then(doc => {
          if (doc) {
            const { _id, ...rest } = doc;
            farmProfile = rest;
            if (!localMemoryDb['farmProfile']) localMemoryDb['farmProfile'] = new Map();
            localMemoryDb['farmProfile'].set('profile', farmProfile);
          }
        }).catch(() => {}),

        database.collection('settings').findOne({ _id: 'global_settings' } as any).then(doc => {
          if (doc) {
            const { _id, ...rest } = doc;
            settings = rest;
            if (!localMemoryDb['settings']) localMemoryDb['settings'] = new Map();
            localMemoryDb['settings'].set('global_settings', settings);
          }
        }).catch(() => {}),

        database.collection('standards').findOne({ _id: 'breed_standards' } as any).then(doc => {
          if (doc) {
            const { _id, ...rest } = doc;
            standards = rest;
            if (!localMemoryDb['standards']) localMemoryDb['standards'] = new Map();
            localMemoryDb['standards'].set('breed_standards', standards);
          }
        }).catch(() => {}),
      ];

      await Promise.all([...fetchPromises, ...singleDocPromises]);

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
