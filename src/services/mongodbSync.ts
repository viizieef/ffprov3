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

export async function getMongoDBStatus(): Promise<MongoSyncStatus> {
  try {
    const res = await fetch('/api/mongodb/status', {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
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
      serverInfo: 'Central Database Synchronizing',
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
  standards?: any;
  settings?: any;
  depletions: any[];
  transfers?: any[];
  medProducts?: any[];
  medStockLogs?: any[];
  medAdmins: any[];
  bodyWeights: any[];
  biosecurityLogs: any[];
  biosecurityRequirements?: any[];
  biosecuritySummaries?: any;
  weeklyEggWeights?: any[];
  deliveries?: any[];
  hatchingSummaries?: any[];
  users: any[];
  auditLogs?: any[];
  systemLogs?: any[];
}): Promise<{ success: boolean; message: string; counts?: Record<string, number> }> {
  try {
    const res = await fetch('/api/mongodb/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
      throw new Error(errJson.message || `Server error ${res.status}`);
    }

    const result = await res.json();
    return {
      success: result.success,
      message: result.message || 'Successfully saved all records to MongoDB.',
      counts: result.counts,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Error saving data to MongoDB.',
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
  settings?: any;
  standards?: any;
}> {
  try {
    const res = await fetch('/api/mongodb/pull', {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
      throw new Error(errJson.message || `Server error ${res.status}`);
    }

    const result = await res.json();
    return {
      success: result.success,
      message: result.message || 'Successfully loaded records from MongoDB.',
      data: result.data || {},
      farmProfile: result.farmProfile || null,
      settings: result.settings || null,
      standards: result.standards || null,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Error loading records from MongoDB.',
    };
  }
}

/**
 * Saves a single document to MongoDB in real time and returns the updated document
 */
export async function saveDocToMongoDB(collectionName: string, id: string | number, data: any): Promise<{ success: boolean; data?: any }> {
  try {
    const cleanId = encodeURIComponent(String(id));
    const cleanCol = encodeURIComponent(collectionName);
    const res = await fetch(`/api/mongodb/doc/${cleanCol}/${cleanId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      return { success: false };
    }
    const json = await res.json().catch(() => ({}));
    return { success: true, data: json.data || json.doc || data };
  } catch (e) {
    console.warn(`[MongoDB Direct] Notice saving doc to ${collectionName}:`, e);
    return { success: false };
  }
}

/**
 * Retrieves the live farm profile & overview directly from MongoDB database
 */
export async function getFarmProfileFromMongoDB(): Promise<{ success: boolean; data?: any; message?: string }> {
  try {
    const res = await fetch('/api/farm-profile', {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
    });
    if (!res.ok) {
      return { success: false, message: `HTTP ${res.status}` };
    }
    const json = await res.json().catch(() => ({}));
    return {
      success: Boolean(json.success),
      data: json.data || null,
      message: json.message || 'Retrieved farm profile from MongoDB',
    };
  } catch (e: any) {
    console.warn('[MongoDB Direct] Notice fetching farm profile:', e);
    return { success: false, message: e?.message || 'Failed to fetch farm profile from database' };
  }
}

/**
 * Saves the entire farm profile & overview directly to MongoDB database
 */
export async function saveFarmProfileToMongoDB(profileData: any): Promise<{ success: boolean; data?: any; message?: string }> {
  try {
    const res = await fetch('/api/farm-profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
      body: JSON.stringify(profileData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, message: err.message || `HTTP ${res.status}` };
    }
    const json = await res.json().catch(() => ({}));
    return {
      success: Boolean(json.success),
      data: json.data || profileData,
      message: json.message || 'Farm profile saved to MongoDB database',
    };
  } catch (e: any) {
    console.warn('[MongoDB Direct] Notice saving farm profile to DB:', e);
    return { success: false, message: e?.message || 'Failed to save farm profile to database' };
  }
}

/**
 * Saves specific farm overview specifications directly to MongoDB database
 */
export async function saveOverviewToMongoDB(overviewData: any): Promise<{ success: boolean; data?: any; message?: string }> {
  try {
    const res = await fetch('/api/farm-profile/overview', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
      body: JSON.stringify(overviewData),
    });
    if (!res.ok) {
      return { success: false };
    }
    const json = await res.json().catch(() => ({}));
    return {
      success: Boolean(json.success),
      data: json.data || overviewData,
      message: json.message || 'Overview saved to MongoDB database',
    };
  } catch (e: any) {
    console.warn('[MongoDB Direct] Notice saving overview to DB:', e);
    return { success: false, message: e?.message || 'Failed to save overview to database' };
  }
}

/**
 * Retrieves a single fresh document from MongoDB in real time
 */
export async function getDocFromMongoDB(collectionName: string, id: string | number): Promise<any | null> {
  try {
    const cleanId = encodeURIComponent(String(id));
    const cleanCol = encodeURIComponent(collectionName);
    const res = await fetch(`/api/mongodb/doc/${cleanCol}/${cleanId}`, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
    });
    if (!res.ok) return null;
    const json = await res.json().catch(() => ({}));
    return json.data || null;
  } catch (e) {
    console.warn(`[MongoDB Direct] Notice fetching doc from ${collectionName}:`, e);
    return null;
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
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
    });
    return res.ok;
  } catch (e) {
    console.warn(`[MongoDB Direct] Notice deleting doc from ${collectionName}:`, e);
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
