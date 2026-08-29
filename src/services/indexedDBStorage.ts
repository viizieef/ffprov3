/**
 * FarmFlow Pro - IndexedDB Local Storage & Offline Caching Engine
 * Provides persistent asynchronous storage for offline farm operations,
 * queueing pending logs (egg collections, feed, mortality, biosecurity),
 * and automatic synchronization with local memory and server databases.
 */

export interface OfflineQueueItem {
  id: string;
  type: 'egg_production' | 'flockman' | 'feed' | 'mortality' | 'medicine' | 'body_weight' | 'biosecurity' | 'settings' | 'flock';
  action: string;
  payload: any;
  timestamp: string;
  status: 'pending' | 'synced' | 'failed';
  user: string;
  houseNumber?: string;
  error?: string;
}

export interface StorageQuotaInfo {
  usageMB: number;
  quotaMB: number;
  percentUsed: number;
  indexedDBAvailable: boolean;
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

const DB_NAME = 'FarmFlowPro_IndexedDB_v1';
const DB_VERSION = 1;

const STORES = {
  COLLECTIONS: 'collections',
  OFFLINE_QUEUE: 'offline_queue',
  SNAPSHOTS: 'snapshots',
  APP_METADATA: 'app_metadata'
} as const;

let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Initialize IndexedDB instance with required object stores
 */
export function openIndexedDB(): Promise<IDBDatabase> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.reject(new Error('IndexedDB is not supported in this environment.'));
  }

  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Object store for application state collections (key: collection name)
      if (!db.objectStoreNames.contains(STORES.COLLECTIONS)) {
        db.createObjectStore(STORES.COLLECTIONS, { keyPath: 'collectionName' });
      }

      // Object store for queued offline entries
      if (!db.objectStoreNames.contains(STORES.OFFLINE_QUEUE)) {
        const queueStore = db.createObjectStore(STORES.OFFLINE_QUEUE, { keyPath: 'id' });
        queueStore.createIndex('by_timestamp', 'timestamp', { unique: false });
        queueStore.createIndex('by_status', 'status', { unique: false });
        queueStore.createIndex('by_type', 'type', { unique: false });
      }

      // Object store for full offline snapshots / point-in-time recovery
      if (!db.objectStoreNames.contains(STORES.SNAPSHOTS)) {
        const snapStore = db.createObjectStore(STORES.SNAPSHOTS, { keyPath: 'id' });
        snapStore.createIndex('by_timestamp', 'timestamp', { unique: false });
      }

      // Metadata store
      if (!db.objectStoreNames.contains(STORES.APP_METADATA)) {
        db.createObjectStore(STORES.APP_METADATA, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      dbPromise = null;
      reject(request.error);
    };
  });

  return dbPromise;
}

/**
 * Generic helper to execute a transaction
 */
async function executeTransaction<T>(
  storeName: string,
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => Promise<T> | IDBRequest
): Promise<T> {
  const db = await openIndexedDB();
  return new Promise<T>((resolve, reject) => {
    try {
      const transaction = db.transaction(storeName, mode);
      const store = transaction.objectStore(storeName);

      const request = callback(store);

      if (request && 'onsuccess' in request) {
        (request as IDBRequest).onsuccess = () => resolve((request as IDBRequest).result);
        (request as IDBRequest).onerror = () => reject((request as IDBRequest).error);
      }

      transaction.oncomplete = () => {
        // Handled via request.onsuccess or explicit resolve
      };

      transaction.onerror = () => {
        reject(transaction.error);
      };
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Save single collection to IndexedDB
 */
export async function saveCollectionToIndexedDB(collectionName: string, data: any): Promise<void> {
  try {
    const db = await openIndexedDB();
    const transaction = db.transaction(STORES.COLLECTIONS, 'readwrite');
    const store = transaction.objectStore(STORES.COLLECTIONS);
    
    store.put({
      collectionName,
      data,
      updatedAt: new Date().toISOString()
    });

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (err) {
    console.warn(`Failed to save ${collectionName} to IndexedDB:`, err);
  }
}

/**
 * Load single collection from IndexedDB
 */
export async function loadCollectionFromIndexedDB<T>(collectionName: string): Promise<T | null> {
  try {
    const db = await openIndexedDB();
    return new Promise<T | null>((resolve, reject) => {
      const transaction = db.transaction(STORES.COLLECTIONS, 'readonly');
      const store = transaction.objectStore(STORES.COLLECTIONS);
      const request = store.get(collectionName);

      request.onsuccess = () => {
        if (request.result && request.result.data !== undefined) {
          resolve(request.result.data as T);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn(`Failed to load ${collectionName} from IndexedDB:`, err);
    return null;
  }
}

/**
 * Save all application state collections to IndexedDB in one atomic batch
 */
export async function saveAllCollectionsToIndexedDB(collections: Record<string, any>): Promise<void> {
  try {
    const db = await openIndexedDB();
    const transaction = db.transaction(STORES.COLLECTIONS, 'readwrite');
    const store = transaction.objectStore(STORES.COLLECTIONS);
    const now = new Date().toISOString();

    Object.entries(collections).forEach(([collectionName, data]) => {
      store.put({
        collectionName,
        data,
        updatedAt: now
      });
    });

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (err) {
    console.warn('Failed to batch save collections to IndexedDB:', err);
  }
}

/**
 * Load all stored collections from IndexedDB
 */
export async function loadAllCollectionsFromIndexedDB(): Promise<Record<string, any>> {
  try {
    const db = await openIndexedDB();
    return new Promise<Record<string, any>>((resolve, reject) => {
      const transaction = db.transaction(STORES.COLLECTIONS, 'readonly');
      const store = transaction.objectStore(STORES.COLLECTIONS);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result || [];
        const map: Record<string, any> = {};
        results.forEach((item: { collectionName: string; data: any }) => {
          map[item.collectionName] = item.data;
        });
        resolve(map);
      };

      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Failed to load all collections from IndexedDB:', err);
    return {};
  }
}

/**
 * Enqueue an offline action to IndexedDB
 */
export async function enqueueOfflineAction(
  type: OfflineQueueItem['type'],
  action: string,
  payload: any,
  user: string,
  houseNumber?: string
): Promise<OfflineQueueItem> {
  const item: OfflineQueueItem = {
    id: `offline_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    type,
    action,
    payload,
    timestamp: new Date().toISOString(),
    status: 'pending',
    user,
    houseNumber
  };

  try {
    const db = await openIndexedDB();
    const transaction = db.transaction(STORES.OFFLINE_QUEUE, 'readwrite');
    const store = transaction.objectStore(STORES.OFFLINE_QUEUE);
    store.put(item);

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve(item);
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (err) {
    console.warn('Failed to enqueue offline action in IndexedDB:', err);
    return item;
  }
}

/**
 * Get all queued offline items
 */
export async function getOfflineQueueFromIndexedDB(): Promise<OfflineQueueItem[]> {
  try {
    const db = await openIndexedDB();
    return new Promise<OfflineQueueItem[]>((resolve, reject) => {
      const transaction = db.transaction(STORES.OFFLINE_QUEUE, 'readonly');
      const store = transaction.objectStore(STORES.OFFLINE_QUEUE);
      const request = store.getAll();

      request.onsuccess = () => {
        const items: OfflineQueueItem[] = request.result || [];
        // Sort newest first
        items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        resolve(items);
      };

      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Failed to fetch offline queue from IndexedDB:', err);
    return [];
  }
}

/**
 * Remove an item from the offline queue
 */
export async function removeOfflineQueueItem(id: string): Promise<void> {
  try {
    const db = await openIndexedDB();
    const transaction = db.transaction(STORES.OFFLINE_QUEUE, 'readwrite');
    const store = transaction.objectStore(STORES.OFFLINE_QUEUE);
    store.delete(id);

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (err) {
    console.warn(`Failed to remove offline queue item ${id}:`, err);
  }
}

/**
 * Clear the entire offline queue
 */
export async function clearOfflineQueue(): Promise<void> {
  try {
    const db = await openIndexedDB();
    const transaction = db.transaction(STORES.OFFLINE_QUEUE, 'readwrite');
    const store = transaction.objectStore(STORES.OFFLINE_QUEUE);
    store.clear();

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (err) {
    console.warn('Failed to clear offline queue:', err);
  }
}

/**
 * Calculate storage quota and cached data counts
 */
export async function getStorageQuotaInfo(): Promise<StorageQuotaInfo> {
  const result: StorageQuotaInfo = {
    usageMB: 0,
    quotaMB: 0,
    percentUsed: 0,
    indexedDBAvailable: typeof window !== 'undefined' && 'indexedDB' in window,
    itemCounts: {
      flocks: 0,
      eggRecords: 0,
      feedRecords: 0,
      mortalityRecords: 0,
      medRecords: 0,
      biosecurityLogs: 0,
      offlineQueue: 0
    }
  };

  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      if (estimate.usage !== undefined && estimate.quota !== undefined) {
        result.usageMB = +(estimate.usage / (1024 * 1024)).toFixed(2);
        result.quotaMB = +(estimate.quota / (1024 * 1024)).toFixed(2);
        result.percentUsed = +((estimate.usage / estimate.quota) * 100).toFixed(2);
      }
    } catch {
      // Ignore quota estimate error
    }
  }

  try {
    const collections = await loadAllCollectionsFromIndexedDB();
    if (collections.flocks) result.itemCounts.flocks = collections.flocks.length || 0;
    if (collections.rawEggRecords) result.itemCounts.eggRecords = collections.rawEggRecords.length || 0;
    if (collections.feedConsumptionRecords) result.itemCounts.feedRecords = collections.feedConsumptionRecords.length || 0;
    if (collections.depletions) result.itemCounts.mortalityRecords = collections.depletions.length || 0;
    if (collections.medAdministrations) result.itemCounts.medRecords = collections.medAdministrations.length || 0;
    if (collections.biosecurityLogs) result.itemCounts.biosecurityLogs = collections.biosecurityLogs.length || 0;

    const queue = await getOfflineQueueFromIndexedDB();
    result.itemCounts.offlineQueue = queue.length;
  } catch {
    // Ignore count errors
  }

  return result;
}
