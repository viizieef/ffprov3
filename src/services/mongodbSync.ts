export interface MongoSyncStatus {
  connected: boolean;
  dbName: string;
  uriConfigured: boolean;
  serverInfo?: string;
  collections?: { name: string; count: number }[];
  lastSyncedAt: string | null;
  error?: string | null;
  isSyncing?: boolean;
  rtuRevision?: number;
  activeDevicesCount?: number;
}

export interface RtuHeartbeatResponse {
  status: 'active' | 'offline';
  mode: string;
  revision: number;
  lastModified: string;
  activeDevices: number;
  timestamp: string;
}

/**
 * Gets or creates a persistent device ID for RTU multi-device tracking
 */
export function getRtuDeviceId(): string {
  if (typeof window === 'undefined') return 'device_node_server';
  let deviceId = localStorage.getItem('farmflow_rtu_device_id');
  if (!deviceId) {
    const isMobile = /android|iphone|ipad|mobile/i.test(navigator.userAgent);
    const prefix = isMobile ? 'dev_mobile' : 'dev_workstation';
    deviceId = `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    localStorage.setItem('farmflow_rtu_device_id', deviceId);
  }
  return deviceId;
}

/**
 * Query RTU mode heartbeat to check if server revision has updated
 */
export async function checkRtuHeartbeat(): Promise<RtuHeartbeatResponse | null> {
  try {
    const deviceId = getRtuDeviceId();
    const res = await fetch(`/api/rtu/heartbeat?deviceId=${encodeURIComponent(deviceId)}`, {
      headers: {
        'Cache-Control': 'no-cache',
        'x-device-id': deviceId,
      },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Subscribes to real-time live push events via SSE
 */
export function subscribeToRtuEvents(onEvent: (event: { type: string; revision?: number; collection?: string; id?: string }) => void): () => void {
  if (typeof window === 'undefined' || typeof EventSource === 'undefined') {
    return () => {};
  }

  let eventSource: EventSource | null = null;
  let isClosed = false;

  const connect = () => {
    if (isClosed) return;
    try {
      const deviceId = getRtuDeviceId();
      eventSource = new EventSource(`/api/rtu/events?deviceId=${encodeURIComponent(deviceId)}`);

      eventSource.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          onEvent(data);
        } catch {
          // ignore non-json
        }
      };

      eventSource.onerror = () => {
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        if (!isClosed) {
          setTimeout(connect, 3000);
        }
      };
    } catch {
      if (!isClosed) {
        setTimeout(connect, 4000);
      }
    }
  };

  connect();

  return () => {
    isClosed = true;
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  };
}
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
      rtuRevision: data.rtuRevision,
      activeDevicesCount: data.activeDevicesCount,
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
      rtuRevision: 0,
      activeDevicesCount: 1,
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
  users: any[];
  auditLogs?: any[];
  systemLogs?: any[];
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
  settings?: any;
  standards?: any;
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
      settings: result.settings || null,
      standards: result.standards || null,
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
