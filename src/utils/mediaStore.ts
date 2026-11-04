/**
 * Media & Video helper with IndexedDB local cache for device videos,
 * and Smart URL parser for YouTube / Shorts / Drive / Vimeo / Shopee / MP4 videos.
 */

const DB_NAME = 'mundo_da_pipa_media_db';
const DB_VERSION = 1;
const STORE_NAME = 'videos';

export function fileToDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

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
 * Robust YouTube video ID extractor supporting all formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://www.youtube.com/watch?feature=shared&v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://youtube.com/shorts/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/live/VIDEO_ID
 * - https://m.youtube.com/...
 */
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();

  // YouTube Shorts: /shorts/{id}
  const shortsMatch = trimmed.match(/(?:youtube\.com|youtu\.be)\/shorts\/([a-zA-Z0-9_-]{11})/i);
  if (shortsMatch) return shortsMatch[1];

  // Standard watch or embed or live or nocookie:
  const standardMatch = trimmed.match(/(?:youtube(?:-nocookie)?\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?|live)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
  if (standardMatch) return standardMatch[1];

  // Fallback: any query param v= followed by 11 chars
  const queryMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (queryMatch) return queryMatch[1];

  return null;
}

/**
 * Extract Google Drive file ID
 */
export function extractGoogleDriveId(url: string): string | null {
  if (!url) return null;
  const match = url.trim().match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

/**
 * Extract Vimeo video ID
 */
export function extractVimeoId(url: string): string | null {
  if (!url) return null;
  const match = url.trim().match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/[^\/]*\/videos\/|album\/(?:\d+\/)?video\/|video\/|)(\d+)/);
  return match ? match[1] : null;
}

/**
 * Formats video links into embeddable / playable URLs:
 * - YouTube: embeds via youtube-nocookie
 * - Google Drive: embeds via preview
 * - Vimeo: embeds via player
 * - Direct / Shopee / MP4 / Data URL / Blob URL
 */
export function getEmbedVideoInfo(url: string): { 
  type: 'youtube' | 'vimeo' | 'gdrive' | 'direct' | 'local' | 'unknown'; 
  embedUrl: string;
  originalUrl: string;
} {
  if (!url) return { type: 'unknown', embedUrl: '', originalUrl: '' };

  let trimmed = url.trim();

  // If protocol-relative url (e.g. //cvf.shopee.com.br/...)
  if (trimmed.startsWith('//')) {
    trimmed = `https:${trimmed}`;
  }

  // Local device video or blob URL
  if (trimmed.startsWith('local-video://') || trimmed.startsWith('blob:')) {
    return { type: 'local', embedUrl: trimmed, originalUrl: trimmed };
  }

  // YouTube
  const ytId = extractYouTubeId(trimmed);
  if (ytId) {
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=0&rel=0&playsinline=1&modestbranding=1`,
      originalUrl: `https://www.youtube.com/watch?v=${ytId}`
    };
  }

  // Google Drive
  const gdriveId = extractGoogleDriveId(trimmed);
  if (gdriveId) {
    return {
      type: 'gdrive',
      embedUrl: `https://drive.google.com/file/d/${gdriveId}/preview`,
      originalUrl: trimmed
    };
  }

  // Vimeo
  const vimeoId = extractVimeoId(trimmed);
  if (vimeoId) {
    return {
      type: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${vimeoId}?autoplay=0`,
      originalUrl: trimmed
    };
  }

  // Direct MP4 / WebM / Shopee / Data URL / Online video
  return { type: 'direct', embedUrl: trimmed, originalUrl: trimmed };
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
