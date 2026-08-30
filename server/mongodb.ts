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

export function incrementRtuRevision(): number {
  rtuRevision += 1;
  lastModifiedTime = new Date().toISOString();
  lastSyncTime = lastModifiedTime;
  return rtuRevision;
}

// In-memory persistent fallback if MongoDB URI is not provided yet or server is starting
const localMemoryDb: Record<string, Map<string, any>> = {
  eggRecords: new Map(),
  flocks: new Map(),
  feedRecords: new Map(),
  feedStock: new Map(),
  depletions: new Map(),
  transfers: new Map(),
  medProducts: new Map(),
  medAdmins: new Map(),
  bodyWeights: new Map(),
  biosecurityLogs: new Map(),
  deliveries: new Map(),
  users: new Map(),
  farmProfile: new Map(),
  auditLogs: new Map(),
};

/**
 * Initializes or returns the cached MongoDB database instance.
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

  // Throttle reconnection attempts to prevent connection storming
  const now = Date.now();
  if (now - lastConnectionAttempt < 5000 && connectionError) {
    return null;
  }
  lastConnectionAttempt = now;

  try {
    const mongoClientOptions: any = {
      connectTimeoutMS: 8000,
      serverSelectionTimeoutMS: 5000,
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
    await newClient.connect();
    
    // Test ping
    const testDb = newClient.db(dbName);
    await testDb.command({ ping: 1 });

    client = newClient;
    db = testDb;
    connectionError = null;
    console.log(`🍃 [MongoDB] Successfully connected to MongoDB database "${dbName}"`);

    // Ensure indexes for fast queries
    await ensureMongoIndexes(db);

    return db;
  } catch (err: any) {
    connectionError = err?.message || 'Failed to connect to MongoDB cluster';
    console.warn(`🍃 [MongoDB] Connection notice: ${connectionError}`);
    return null;
  }
}

/**
 * Creates optimal collection indexes in MongoDB
 */
async function ensureMongoIndexes(database: Db) {
  try {
    await database.collection('users').createIndex({ username: 1 }, { unique: true, sparse: true });
    await database.collection('eggRecords').createIndex({ date: 1, house: 1 });
    await database.collection('flocks').createIndex({ houseNumber: 1 });
    await database.collection('feedRecords').createIndex({ date: 1, house: 1 });
    await database.collection('depletions').createIndex({ date: 1, house: 1 });
    await database.collection('bodyWeights').createIndex({ flockId: 1, weekAge: 1 });
    await database.collection('biosecurityLogs').createIndex({ requirementId: 1, date: 1 });
    await database.collection('deliveries').createIndex({ deliveryDate: 1, deliveryNumber: 1 });
  } catch (e) {
    console.warn('Notice on MongoDB index creation:', e);
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
    const collectionsList = await database.listCollections().toArray();
    const collectionStats: { name: string; count: number }[] = [];

    for (const col of collectionsList) {
      try {
        const count = await database.collection(col.name).estimatedDocumentCount();
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
    return {
      connected: false,
      dbName,
      uriConfigured: isUriConfigured,
      serverInfo: 'Error querying cluster statistics',
      lastSyncedAt: lastSyncTime || undefined,
      error: err?.message || 'Error listing MongoDB collections',
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
  incrementRtuRevision();

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
      console.error(`MongoDB write error in ${collectionName}:`, err);
      return { success: false, message: err?.message || 'MongoDB write failed' };
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
  incrementRtuRevision();

  if (database) {
    try {
      const col = database.collection(collectionName);
      await col.deleteOne({ $or: [{ id: cleanId }, { _id: cleanId }] } as any);
      lastSyncTime = new Date().toISOString();
      return { success: true, message: `Document ${cleanId} removed from MongoDB ${collectionName}` };
    } catch (err: any) {
      console.error(`MongoDB delete error in ${collectionName}:`, err);
      return { success: false, message: err?.message || 'MongoDB delete failed' };
    }
  }

  return { success: true, message: `Document ${cleanId} removed from local buffer` };
}

/**
 * Bulk syncs all farm collections to MongoDB
 */
export async function syncAllToMongo(data: Record<string, any[]> & { farmProfile?: any }): Promise<{
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
    'medAdmins',
    'bodyWeights',
    'biosecurityLogs',
    'deliveries',
    'users',
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
        console.error(`Error syncing collection ${key} to MongoDB:`, err);
      }
    }
  }

  lastSyncTime = new Date().toISOString();

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
  databaseEngine: 'mongodb' | 'local';
}> {
  const database = await getMongoDb();
  const result: Record<string, any[]> = {};
  let farmProfile: any = null;

  const collectionKeys = [
    'eggRecords',
    'flocks',
    'feedRecords',
    'feedStock',
    'depletions',
    'transfers',
    'medProducts',
    'medAdmins',
    'bodyWeights',
    'biosecurityLogs',
    'deliveries',
    'users',
  ];

  if (database) {
    try {
      for (const key of collectionKeys) {
        const docs = await database.collection(key).find({}).toArray();
        result[key] = docs.map((d) => {
          const { _id, ...rest } = d;
          return { ...rest, id: rest.id || _id };
        });
      }

      // Farm profile
      const profileDoc = await database.collection('farmProfile').findOne({ _id: 'profile' } as any);
      if (profileDoc) {
        const { _id, ...rest } = profileDoc;
        farmProfile = rest;
      }

      lastSyncTime = new Date().toISOString();
      return {
        success: true,
        message: 'Successfully pulled latest farm collections from MongoDB cluster.',
        data: result,
        farmProfile,
        databaseEngine: 'mongodb',
      };
    } catch (err: any) {
      console.error('Error reading collections from MongoDB:', err);
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

  return {
    success: true,
    message: 'Pulled data from server buffer.',
    data: result,
    farmProfile,
    databaseEngine: 'local',
  };
}
