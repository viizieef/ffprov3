import { MongoClient, Db } from 'mongodb';

export interface MongoStatus {
  connected: boolean;
  dbName: string;
  uriConfigured: boolean;
  serverInfo?: string;
  collections?: { name: string; count: number }[];
  lastSyncedAt?: string;
  error?: string | null;
}

let client: MongoClient | null = null;
let db: Db | null = null;
let lastSyncTime: string | null = null;
let lastConnectionAttempt: number = 0;
let connectionError: string | null = null;
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
    name.includes('ssl') ||
    name.includes('tls') ||
    msg.includes('pool') ||
    msg.includes('timed out') ||
    msg.includes('timeout') ||
    msg.includes('connection <monitor>') ||
    msg.includes('closed') ||
    msg.includes('econnreset') ||
    msg.includes('etimedout') ||
    msg.includes('socket') ||
    msg.includes('topology') ||
    msg.includes('server closed') ||
    msg.includes('ssl') ||
    msg.includes('tls') ||
    msg.includes('alert') ||
    msg.includes('handshake') ||
    msg.includes('openssl') ||
    msg.includes('certificate')
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
    connectionError = 'MONGODB_URI environment variable is not configured.';
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
        maxPoolSize: 20,
        minPoolSize: 1,
        maxIdleTimeMS: 30000,
        waitQueueTimeoutMS: 15000,
        retryWrites: true,
        retryReads: true,
        family: 4,
      };

      const newClient = new MongoClient(uri, mongoClientOptions);

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

      // Ensure indexes asynchronously
      if (!indexesEnsured) {
        indexesEnsured = true;
        ensureMongoIndexes(testDb).catch(() => {});
      }

      return db;
    } catch (err: any) {
      connectionError = err?.message || 'Failed to connect to MongoDB cluster';
      if (process.env.NODE_ENV !== 'production' || !isConnectionOrPoolError(err)) {
        console.warn(`🍃 [MongoDB] Connection notice: ${connectionError}`);
      }
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
 * Returns real-time MongoDB health, connection status and collection statistics
 */
export async function getMongoStatus(): Promise<MongoStatus> {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME || 'farmflow_db';
  const isUriConfigured = Boolean(uri);

  const database = await getMongoDb();

  if (!database) {
    return {
      connected: false,
      dbName,
      uriConfigured: isUriConfigured,
      serverInfo: isUriConfigured ? 'Connecting / Reconnecting to cluster' : 'MONGODB_URI not configured',
      collections: [],
      lastSyncedAt: lastSyncTime || undefined,
      error: connectionError || (isUriConfigured ? 'MongoDB is not connected' : 'MONGODB_URI environment variable is not configured'),
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
      serverInfo: 'MongoDB Production Cluster Active & Ready',
      collections: collectionStats,
      lastSyncedAt: lastSyncTime || new Date().toISOString(),
      error: null,
    };
  } catch (err: any) {
    connectionError = err?.message || 'Error querying cluster statistics';
    
    return {
      connected: false,
      dbName,
      uriConfigured: isUriConfigured,
      serverInfo: 'Error communicating with MongoDB cluster',
      collections: [],
      lastSyncedAt: lastSyncTime || undefined,
      error: connectionError,
    };
  }
}

/**
 * Retrieves a single document from MongoDB
 */
export async function getMongoDoc(collectionName: string, id: string): Promise<{ success: boolean; data: any | null; message?: string }> {
  const cleanId = String(id);
  const database = await getMongoDb();
  if (!database) {
    return { success: false, data: null, message: connectionError || 'MongoDB is not connected' };
  }

  try {
    const col = database.collection(collectionName);
    const doc = await col.findOne({ $or: [{ id: cleanId }, { _id: cleanId }] } as any);
    if (doc) {
      const { _id, ...rest } = doc;
      return { success: true, data: { ...rest, id: rest.id || _id || cleanId } };
    }
    return { success: false, data: null, message: 'Document not found' };
  } catch (e: any) {
    console.warn(`MongoDB findOne notice for ${collectionName}/${cleanId}:`, e?.message);
    return { success: false, data: null, message: e?.message || 'Error querying document' };
  }
}

/**
 * Saves or upserts a single document directly in MongoDB with auto-reconnect and retry
 */
export async function saveMongoDoc(
  collectionName: string,
  id: string,
  docData: any
): Promise<{ success: boolean; message: string; data?: any; doc?: any }> {
  const database = await getMongoDb();
  const cleanId = String(id || docData.id || docData._id || 'item_' + Date.now());
  const payload = { ...docData, id: cleanId, updatedAt: new Date().toISOString() };

  if (!database) {
    return {
      success: false,
      message: connectionError || 'MongoDB is not connected. Cannot persist document.',
    };
  }

  try {
    const col = database.collection(collectionName);
    const result: any = await col.findOneAndUpdate(
      { $or: [{ id: cleanId }, { _id: cleanId }] } as any,
      { $set: { ...payload, _id: cleanId } },
      { returnDocument: 'after', returnOriginal: false, upsert: true, new: true } as any
    );

    const rawDoc = result && typeof result === 'object' && 'value' in result ? result.value : result;
    let finalDoc = payload;
    if (rawDoc && typeof rawDoc === 'object') {
      const { _id, ...rest } = rawDoc;
      finalDoc = { ...payload, ...rest, id: rest.id || _id || cleanId };
    }
    lastSyncTime = new Date().toISOString();
    return {
      success: true,
      message: `Document ${cleanId} upserted in MongoDB ${collectionName}`,
      data: finalDoc,
      doc: finalDoc,
    };
  } catch (err: any) {
    if (isConnectionOrPoolError(err)) {
      resetMongoClient();
      // Retry once with a freshly initialized connection
      try {
        const freshDb = await getMongoDb(true);
        if (freshDb) {
          const retryCol = freshDb.collection(collectionName);
          const retryResult: any = await retryCol.findOneAndUpdate(
            { $or: [{ id: cleanId }, { _id: cleanId }] } as any,
            { $set: { ...payload, _id: cleanId } },
            { returnDocument: 'after', returnOriginal: false, upsert: true, new: true } as any
          );
          const retryRawDoc = retryResult && typeof retryResult === 'object' && 'value' in retryResult ? retryResult.value : retryResult;
          let finalDoc = payload;
          if (retryRawDoc && typeof retryRawDoc === 'object') {
            const { _id, ...rest } = retryRawDoc;
            finalDoc = { ...payload, ...rest, id: rest.id || _id || cleanId };
          }
          lastSyncTime = new Date().toISOString();
          return {
            success: true,
            message: `Document ${cleanId} upserted in MongoDB ${collectionName} after auto-reconnect`,
            data: finalDoc,
            doc: finalDoc,
          };
        }
      } catch (retryErr: any) {
        return {
          success: false,
          message: `Failed to save document in MongoDB: ${retryErr?.message || err?.message}`,
        };
      }
    }
    return {
      success: false,
      message: `Failed to save document in MongoDB: ${err?.message}`,
    };
  }
}

/**
 * Deletes a document from MongoDB with auto-reconnect and retry
 */
export async function deleteMongoDoc(collectionName: string, id: string): Promise<{ success: boolean; message: string }> {
  const database = await getMongoDb();
  const cleanId = String(id);

  if (!database) {
    return {
      success: false,
      message: connectionError || 'MongoDB is not connected. Cannot delete document.',
    };
  }

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
      } catch (retryErr: any) {
        return {
          success: false,
          message: `Failed to delete document from MongoDB: ${retryErr?.message || err?.message}`,
        };
      }
    }
    return { success: false, message: `Failed to delete document from MongoDB: ${err?.message}` };
  }
}

/**
 * Bulk syncs all farm collections to MongoDB
 */
export async function syncAllToMongo(data: Record<string, any[]> & { farmProfile?: any; settings?: any; standards?: any }): Promise<{
  success: boolean;
  message: string;
  counts: Record<string, number>;
  databaseEngine: 'mongodb';
}> {
  const database = await getMongoDb();
  const counts: Record<string, number> = {};

  if (!database) {
    return {
      success: false,
      message: connectionError || 'MongoDB is not connected. Cannot sync collections.',
      counts: {},
      databaseEngine: 'mongodb',
    };
  }

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

  // Update farmProfile
  if (data.farmProfile) {
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

  // Update settings doc if provided
  if (data.settings) {
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

  // Update standards doc if provided
  if (data.standards) {
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

  for (const key of collectionKeys) {
    const items = data[key] || [];
    counts[key] = items.length;

    if (items.length > 0) {
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

  return {
    success: true,
    message: 'All farm collections successfully written and synchronized to MongoDB database!',
    counts,
    databaseEngine: 'mongodb',
  };
}

/**
 * Hydrates and pulls all collections directly from MongoDB
 */
export async function pullAllFromMongo(): Promise<{
  success: boolean;
  message: string;
  data: Record<string, any[]>;
  farmProfile?: any;
  settings?: any;
  standards?: any;
  databaseEngine: 'mongodb';
}> {
  const database = await getMongoDb();
  const result: Record<string, any[]> = {};
  let farmProfile: any = null;
  let settings: any = null;
  let standards: any = null;

  if (!database) {
    return {
      success: false,
      message: connectionError || 'MongoDB is not connected. Cannot pull collections.',
      data: {},
      databaseEngine: 'mongodb',
    };
  }

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
          itemsMap.set(uniqueKey, item);
        });

        result[key] = Array.from(itemsMap.values());
      } catch (colErr: any) {
        console.warn(`🍃 [MongoDB] Notice reading collection ${key}:`, colErr?.message);
        result[key] = [];
      }
    });

    const singleDocPromises = [
      database.collection('farmProfile').findOne({ _id: 'profile' } as any).then(doc => {
        if (doc) {
          const { _id, ...rest } = doc;
          farmProfile = rest;
        }
      }).catch(() => {}),

      database.collection('settings').findOne({ _id: 'global_settings' } as any).then(doc => {
        if (doc) {
          const { _id, ...rest } = doc;
          settings = rest;
        }
      }).catch(() => {}),

      database.collection('standards').findOne({ _id: 'breed_standards' } as any).then(doc => {
        if (doc) {
          const { _id, ...rest } = doc;
          standards = rest;
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
    connectionError = err?.message;
    return {
      success: false,
      message: `Failed to pull collections from MongoDB: ${err?.message}`,
      data: {},
      databaseEngine: 'mongodb',
    };
  }
}
