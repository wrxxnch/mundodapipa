/**
 * Media & Video helper with IndexedDB local cache for device videos,
 * and Smart URL parser for YouTube / Shorts / Drive / Vimeo / Shopee / MP4 videos.
 */

const DB_NAME = 'mundo_da_pipa_media_db';
const DB_VERSION = 1;
const STORE_NAME = 'videos';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save a device video file locally in browser's IndexedDB
 */
export async function saveLocalVideo(mediaId: string, blob: Blob): Promise<string> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(blob, mediaId);
      req.onsuccess = () => resolve(`local-video://${mediaId}`);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn('Failed to save to IndexedDB, fallback to object URL:', e);
    return URL.createObjectURL(blob);
  }
}

/**
 * Get video playback URL from local IndexedDB reference or regular URL
 */
const cachedBlobUrls = new Map<string, string>();

export async function resolveVideoUrl(videoUrlOrRef: string): Promise<string> {
  if (!videoUrlOrRef) return '';

  if (videoUrlOrRef.startsWith('local-video://')) {
    const mediaId = videoUrlOrRef.replace('local-video://', '');
    if (cachedBlobUrls.has(mediaId)) {
      return cachedBlobUrls.get(mediaId)!;
    }
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(mediaId);
        req.onsuccess = () => {
          if (req.result instanceof Blob) {
            const blobUrl = URL.createObjectURL(req.result);
            cachedBlobUrls.set(mediaId, blobUrl);
            resolve(blobUrl);
          } else {
            resolve('');
          }
        };
        req.onerror = () => resolve('');
      });
    } catch {
      return '';
    }
  }

  return videoUrlOrRef;
}

/**
 * Formats video links into embeddable / playable URLs:
 * - YouTube standard: youtube.com/watch?v=ID -> youtube.com/embed/ID
 * - YouTube Shorts: youtube.com/shorts/ID -> youtube.com/embed/ID
 * - YouTube short link: youtu.be/ID -> youtube.com/embed/ID
 * - Vimeo: vimeo.com/ID -> player.vimeo.com/video/ID
 * - Google Drive: drive.google.com/file/d/ID/view -> drive.google.com/file/d/ID/preview
 */
export function getEmbedVideoInfo(url: string): { type: 'youtube' | 'vimeo' | 'gdrive' | 'direct' | 'local' | 'unknown'; embedUrl: string } {
  if (!url) return { type: 'unknown', embedUrl: '' };

  const trimmed = url.trim();

  if (trimmed.startsWith('local-video://') || trimmed.startsWith('blob:')) {
    return { type: 'local', embedUrl: trimmed };
  }

  // YouTube Shorts
  const ytShortsMatch = trimmed.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/);
  if (ytShortsMatch) {
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${ytShortsMatch[1]}?autoplay=0&rel=0`
    };
  }

  // YouTube standard watch
  const ytWatchMatch = trimmed.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (ytWatchMatch) {
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${ytWatchMatch[1]}?autoplay=0&rel=0`
    };
  }

  // YouTube embed already
  if (trimmed.includes('youtube.com/embed/')) {
    return { type: 'youtube', embedUrl: trimmed };
  }

  // Vimeo
  const vimeoMatch = trimmed.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return {
      type: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`
    };
  }

  // Google Drive
  const gdriveMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (gdriveMatch) {
    return {
      type: 'gdrive',
      embedUrl: `https://drive.google.com/file/d/${gdriveMatch[1]}/preview`
    };
  }

  // Direct MP4 / WebM / Media
  return { type: 'direct', embedUrl: trimmed };
}

/**
 * Calculates byte size of a JS object as JSON
 */
export function calculatePayloadBytes(data: unknown): number {
  try {
    const json = JSON.stringify(data);
    return new Blob([json]).size;
  } catch {
    return 0;
  }
}

/**
 * Formats bytes into human readable KB / MB
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
