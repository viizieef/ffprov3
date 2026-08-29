export interface MongoSyncStatus {
  connected: boolean;
  dbName: string;
  uriConfigured: boolean;
  serverInfo?: string;
  collections?: { name: string; count: number }[];
  lastSyncedAt: string | null;
  error?: string | null;
  isSyncing?: boolean;
}

export interface MongoSubscriptions {
  onEggRecordsUpdate?: (records: any[]) => void;
  onFlocksUpdate?: (flocks: any[]) => void;
  onFeedRecordsUpdate?: (feedRecords: any[]) => void;
  onFeedStockUpdate?: (stock: any[]) => void;
  onDepletionsUpdate?: (depletions: any[]) => void;
  onTransfersUpdate?: (transfers: any[]) => void;
  onMedProductsUpdate?: (products: any[]) => void;
  onMedAdminsUpdate?: (medAdmins: any[]) => void;
  onBodyWeightsUpdate?: (bodyWeights: any[]) => void;
  onBiosecurityLogsUpdate?: (logs: any[]) => void;
  onDeliveriesUpdate?: (deliveries: any[]) => void;
  onUsersUpdate?: (users: any[]) => void;
  onFarmProfileUpdate?: (profile: any) => void;
  onError?: (err: any) => void;
}

/**
 * Query the MongoDB cluster health and connection state
 */
export async function getMongoDBStatus(): Promise<MongoSyncStatus> {
  try {
    const res = await fetch('/api/mongodb/status', {
      headers: { 'Cache-Control': 'no-cache' }
    });
    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}`);
    }
    const data = await res.json();
    return {
      connected: Boolean(data.connected),
      dbName: data.dbName || 'farmflow_db',
      uriConfigured: Boolean(data.uriConfigured),
      serverInfo: data.serverInfo,
      collections: data.collections || [],
      lastSyncedAt: data.lastSyncedAt || null,
      error: data.error || null,
    };
  } catch (err: any) {
    return {
      connected: false,
      dbName: 'farmflow_db',
      uriConfigured: false,
      serverInfo: 'Local Persistence (Offline)',
      collections: [],
      lastSyncedAt: null,
      error: err?.message || 'Failed to reach API server',
    };
  }
}

/**
 * Upload all current farm data into MongoDB
 */
export async function syncAllDataToMongoDB(data: {
  eggRecords: any[];
  flocks: any[];
  feedRecords: any[];
  feedStock?: any[];
  farmProfile: any;
  depletions: any[];
  transfers?: any[];
  medProducts?: any[];
  medAdmins: any[];
  bodyWeights: any[];
  biosecurityLogs: any[];
  deliveries?: any[];
  users: any[];
}): Promise<{ success: boolean; message: string; counts?: Record<string, number> }> {
  try {
    const res = await fetch('/api/mongodb/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
      throw new Error(errJson.message || `Server error ${res.status}`);
    }

    const result = await res.json();
    return {
      success: result.success,
      message: result.message || 'Successfully synced all records to MongoDB.',
      counts: result.counts,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Error syncing data to MongoDB.',
    };
  }
}

/**
 * Pull and hydrate all farm data from MongoDB
 */
export async function pullAllDataFromMongoDB(): Promise<{
  success: boolean;
  message: string;
  data?: Record<string, any[]>;
  farmProfile?: any;
}> {
  try {
    const res = await fetch('/api/mongodb/pull', {
      headers: { 'Cache-Control': 'no-cache' }
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
      throw new Error(errJson.message || `Server error ${res.status}`);
    }

    const result = await res.json();
    return {
      success: result.success,
      message: result.message || 'Successfully pulled records from MongoDB.',
      data: result.data || {},
      farmProfile: result.farmProfile || null,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Error fetching records from MongoDB.',
    };
  }
}

/**
 * Saves a single document to MongoDB in real time
 */
export async function saveDocToMongoDB(collectionName: string, id: string | number, data: any): Promise<boolean> {
  try {
    const cleanId = encodeURIComponent(String(id));
    const cleanCol = encodeURIComponent(collectionName);
    const res = await fetch(`/api/mongodb/doc/${cleanCol}/${cleanId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.ok;
  } catch (e) {
    console.warn(`[MongoDB Sync] Notice saving doc to ${collectionName}:`, e);
    return false;
  }
}

/**
 * Deletes a single document from MongoDB in real time
 */
export async function deleteDocFromMongoDB(collectionName: string, id: string | number): Promise<boolean> {
  try {
    const cleanId = encodeURIComponent(String(id));
    const cleanCol = encodeURIComponent(collectionName);
    const res = await fetch(`/api/mongodb/doc/${cleanCol}/${cleanId}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (e) {
    console.warn(`[MongoDB Sync] Notice deleting doc from ${collectionName}:`, e);
    return false;
  }
}

/**
 * Periodically polls for remote MongoDB changes or checks connection
 */
export function startMongoDBPolling(
  onUpdate: () => void,
  intervalMs = 30000
): () => void {
  const timer = setInterval(() => {
    onUpdate();
  }, intervalMs);

  return () => clearInterval(timer);
}
