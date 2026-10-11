/**
 * IndexedDB Video Storage Engine for Felix
 * Stores candidate video responses locally in IndexedDB without localStorage quota limits.
 * Allows instant multimodal replay and timestamp-synchronized seeking.
 */

const DB_NAME = 'felix_video_vault_v1';
const STORE_NAME = 'response_videos';
const DB_VERSION = 1;

export interface StoredVideoRecord {
  id: string; // `${sessionId}_${responseIndex}`
  sessionId: string;
  responseIndex: number;
  videoBlob: Blob;
  durationMs: number;
  createdAt: string;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('sessionId', 'sessionId', { unique: false });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Save recorded video blob for a specific session response turn.
 */
export async function saveVideoBlob(
  sessionId: string,
  responseIndex: number,
  videoBlob: Blob,
  durationMs: number = 0
): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const record: StoredVideoRecord = {
        id: `${sessionId}_${responseIndex}`,
        sessionId,
        responseIndex,
        videoBlob,
        durationMs,
        createdAt: new Date().toISOString(),
      };

      const request = store.put(record);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Failed to save video to IndexedDB:', err);
  }
}

/**
 * Retrieve a stored video record for a specific turn.
 */
export async function getVideoRecord(
  sessionId: string,
  responseIndex: number
): Promise<StoredVideoRecord | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(`${sessionId}_${responseIndex}`);

      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Failed to read video from IndexedDB:', err);
    return null;
  }
}

/**
 * Get an object URL for playing the video in an HTML5 video tag.
 * Remember to call URL.revokeObjectURL when finished to free memory.
 */
export async function getVideoUrl(
  sessionId: string,
  responseIndex: number
): Promise<{ url: string; durationMs: number } | null> {
  const record = await getVideoRecord(sessionId, responseIndex);
  if (!record || !record.videoBlob) return null;

  try {
    const url = URL.createObjectURL(record.videoBlob);
    return { url, durationMs: record.durationMs };
  } catch (e) {
    return null;
  }
}

/**
 * Check if video exists for a specific turn.
 */
export async function hasVideo(sessionId: string, responseIndex: number): Promise<boolean> {
  const record = await getVideoRecord(sessionId, responseIndex);
  return Boolean(record && record.videoBlob && record.videoBlob.size > 0);
}

/**
 * Delete all stored videos for a session.
 */
export async function deleteSessionVideos(sessionId: string): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('sessionId');
      const request = index.getAllKeys(sessionId);

      request.onsuccess = () => {
        const keys = request.result;
        keys.forEach((key) => store.delete(key));
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Failed to delete videos from IndexedDB:', err);
  }
}
