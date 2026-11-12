import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc,
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  deleteField,
  onSnapshot,
  getDocFromServer,
  query,
  orderBy
} from 'firebase/firestore';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';

import firebaseConfig from '../../firebase-applet-config.json';
import { Product, CartItem, Post, Coupon, CategoryItem } from '../types';
import { PRODUCTS as DEFAULT_PRODUCTS } from '../data/products';
import { SHOPEE_PRODUCT_FIO10 } from '../data/shopeeData';
import { 
  cacheGet, 
  cacheGetStale, 
  cacheSet, 
  cacheInvalidate, 
  cacheInvalidateAll, 
  cacheGetTimestamp, 
  dedupeRequest, 
  TTL 
} from '../utils/firestoreCache';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);
export const auth = getAuth(app);
export { deleteField };

// Quota and connection state management
export let isFirestoreQuotaExhausted = false;
export const FIRESTORE_UPGRADE_URL = `https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore/databases/${firebaseConfig.firestoreDatabaseId || 'ai-studio-mundodapipa-66c6efda-c9a5-44bd-992b-f034f302f161'}/data?openUpgradeDialog=true`;

const quotaListeners: ((isExhausted: boolean) => void)[] = [];
export const subscribeToQuotaState = (fn: (isExhausted: boolean) => void) => {
  quotaListeners.push(fn);
  fn(isFirestoreQuotaExhausted);
  return () => {
    const idx = quotaListeners.indexOf(fn);
    if (idx >= 0) quotaListeners.splice(idx, 1);
  };
};

export const checkIsQuotaError = (err: any): boolean => {
  if (!err) return false;
  const code = err?.code || '';
  const msg = err?.message || String(err);
  return (
    code === 'resource-exhausted' ||
    msg.includes('resource-exhausted') ||
    msg.includes('Quota limit exceeded') ||
    msg.includes('Quota exceeded') ||
    msg.includes('Free daily read units') ||
    msg.includes('Free daily write units') ||
    msg.includes('quota')
  );
};

export const markQuotaExhausted = (err?: any) => {
  if (err && checkIsQuotaError(err)) {
    isFirestoreQuotaExhausted = true;
    quotaListeners.forEach(fn => {
      try { fn(true); } catch {}
    });
  }
};

// Skill requirement: Firestore Error Handling
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  markQuotaExhausted(error);
  const errMsg = error instanceof Error ? error.message : String(error);
  
  const errInfo: FirestoreErrorInfo = {
    error: errMsg,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };

  if (checkIsQuotaError(error)) {
    console.warn('[Firestore Quota Notice]: Limite de cota diária gratuita do Firebase atingido. O app continuará operando com segurança.', JSON.stringify(errInfo));
  } else {
    console.error('Firestore Error: ', JSON.stringify(errInfo));
  }
  
  throw new Error(JSON.stringify(errInfo));
}

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: 'admin' | 'customer';
}

export const DEFAULT_ADMIN_EMAILS = [
  'jeanpierreowner@gmail.com',
  'diegao.sock.bh1984@gmail.com',
  'admin@mundodapipa.com.br'
];

let activeAdminEmails: string[] = (() => {
  const cached = cacheGet<string[]>('admin_users', TTL.ADMIN_USERS);
  if (Array.isArray(cached) && cached.length > 0) {
    const set = new Set([
      ...DEFAULT_ADMIN_EMAILS.map(e => e.toLowerCase().trim()),
      ...cached.map(e => String(e).toLowerCase().trim())
    ]);
    return Array.from(set);
  }
  return [...DEFAULT_ADMIN_EMAILS];
})();

export const ADMIN_EMAILS: string[] = activeAdminEmails;

const adminEmailsListeners: ((emails: string[]) => void)[] = [];
export const notifyAdminEmailSubscribers = (emails: string[]) => {
  activeAdminEmails = emails;
  ADMIN_EMAILS.length = 0;
  ADMIN_EMAILS.push(...emails);
  adminEmailsListeners.forEach(fn => {
    try { fn(emails); } catch {}
  });
};

export const isAdminEmail = (email?: string | null): boolean => {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return (
    activeAdminEmails.some(e => e.toLowerCase() === clean) ||
    DEFAULT_ADMIN_EMAILS.some(e => e.toLowerCase() === clean)
  );
};

export const getAdminEmails = async (forceRefresh = false): Promise<string[]> => {
  if (!forceRefresh) {
    const cached = cacheGet<string[]>('admin_users', TTL.ADMIN_USERS);
    if (cached && Array.isArray(cached) && cached.length > 0) {
      const merged = Array.from(new Set([
        ...DEFAULT_ADMIN_EMAILS.map(e => e.toLowerCase().trim()),
        ...cached.map(e => String(e).toLowerCase().trim())
      ]));
      notifyAdminEmailSubscribers(merged);
      return merged;
    }
  }

  return dedupeRequest('admin_users', async () => {
    try {
      const docRef = doc(db, 'site_content', 'admin_users');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (Array.isArray(data.emails)) {
          const merged = Array.from(new Set([
            ...DEFAULT_ADMIN_EMAILS.map(e => e.toLowerCase().trim()),
            ...data.emails.map((e: string) => String(e).toLowerCase().trim())
          ]));
          cacheSet('admin_users', merged);
          notifyAdminEmailSubscribers(merged);
          return merged;
        }
      }
    } catch (err) {
      console.warn('Error reading admin emails from Firestore:', err);
    }
    cacheSet('admin_users', activeAdminEmails);
    return activeAdminEmails;
  });
};

export const addAdminEmail = async (newEmail: string, currentAdmin?: string): Promise<string[]> => {
  const cleanEmail = newEmail.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!cleanEmail || !emailRegex.test(cleanEmail)) {
    throw new Error('E-mail inválido. Por favor, digite um e-mail com formato válido (ex: nome@email.com).');
  }

  const currentList = Array.from(new Set([
    ...DEFAULT_ADMIN_EMAILS.map(e => e.toLowerCase().trim()),
    ...activeAdminEmails.map(e => e.toLowerCase().trim())
  ]));

  if (currentList.includes(cleanEmail)) {
    throw new Error(`O e-mail "${cleanEmail}" já está cadastrado na lista de administradores.`);
  }

  const updatedList = [...currentList, cleanEmail];
  cacheSet('admin_users', updatedList);
  notifyAdminEmailSubscribers(updatedList);

  try {
    const docRef = doc(db, 'site_content', 'admin_users');
    await setDoc(docRef, {
      emails: updatedList,
      updatedAt: new Date().toISOString(),
      updatedBy: currentAdmin || 'admin'
    }, { merge: true });
  } catch (err: any) {
    console.warn('Error syncing new admin email to Firestore cloud:', err);
  }

  return updatedList;
};

export const removeAdminEmail = async (emailToRemove: string, currentAdmin?: string): Promise<string[]> => {
  const cleanEmail = emailToRemove.trim().toLowerCase();
  if (cleanEmail === 'jeanpierreowner@gmail.com') {
    throw new Error('O e-mail do proprietário principal (jeanpierreowner@gmail.com) não pode ser removido.');
  }

  const currentList = Array.from(new Set([
    ...DEFAULT_ADMIN_EMAILS.map(e => e.toLowerCase().trim()),
    ...activeAdminEmails.map(e => e.toLowerCase().trim())
  ]));

  const updatedList = currentList.filter(e => e !== cleanEmail);
  if (!updatedList.includes('jeanpierreowner@gmail.com')) {
    updatedList.unshift('jeanpierreowner@gmail.com');
  }

  cacheSet('admin_users', updatedList);
  notifyAdminEmailSubscribers(updatedList);

  try {
    const docRef = doc(db, 'site_content', 'admin_users');
    await setDoc(docRef, {
      emails: updatedList,
      updatedAt: new Date().toISOString(),
      updatedBy: currentAdmin || 'admin'
    }, { merge: true });
  } catch (err: any) {
    console.warn('Error syncing admin email deletion to Firestore cloud:', err);
  }

  return updatedList;
};

export const subscribeToAdminEmails = (callback: (emails: string[]) => void): (() => void) => {
  adminEmailsListeners.push(callback);
  callback(activeAdminEmails);

  // Background refresh if cache expired
  const cached = cacheGet<string[]>('admin_users', TTL.ADMIN_USERS);
  if (!cached && !isFirestoreQuotaExhausted) {
    getAdminEmails(true).catch(() => {});
  }

  return () => {
    const idx = adminEmailsListeners.indexOf(callback);
    if (idx >= 0) adminEmailsListeners.splice(idx, 1);
  };
};

const LOCAL_PRODUCTS_CACHE_KEY = 'mundo_pipa_products_cache';

const handleQuotaExhausted = (err: any) => {
  markQuotaExhausted(err);
};

// Local product storage helper
const getLocalProducts = (): Product[] => {
  const cached = cacheGet<Product[]>('products', TTL.PRODUCTS);
  if (cached && Array.isArray(cached) && cached.length > 0) {
    return cached;
  }
  const stale = cacheGetStale<Product[]>('products');
  if (stale && Array.isArray(stale) && stale.length > 0) {
    return stale;
  }
  try {
    const raw = localStorage.getItem(LOCAL_PRODUCTS_CACHE_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}
  return [SHOPEE_PRODUCT_FIO10, ...DEFAULT_PRODUCTS];
};

const setLocalProducts = (products: Product[]) => {
  cacheSet('products', products);
  try {
    localStorage.setItem(LOCAL_PRODUCTS_CACHE_KEY, JSON.stringify(products));
  } catch {}
  notifyProductSubscribers(products);
};

// Global broadcast to all active product listeners
const productListeners: ((products: Product[]) => void)[] = [];
const notifyProductSubscribers = (products: Product[]) => {
  productListeners.forEach(fn => {
    try {
      fn(products);
    } catch {}
  });
};

// Utility to recursively strip all undefined and null fields for Firestore safety
export const cleanFirestoreData = (obj: any): any => {
  if (obj === null || obj === undefined) return undefined;
  
  if (Array.isArray(obj)) {
    return obj
      .map(item => cleanFirestoreData(item))
      .filter(item => item !== undefined);
  }
  
  if (typeof obj === 'object') {
    // Preserve Firestore FieldValues (like deleteField() or serverTimestamp())
    if (
      obj._methodName ||
      (obj.constructor && obj.constructor.name?.includes('FieldValue')) ||
      (obj.constructor && obj.constructor.name?.includes('Delete')) ||
      '_delegate' in obj
    ) {
      return obj;
    }
    
    const cleaned: Record<string, any> = {};
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (val !== undefined && val !== null) {
        const cleanedVal = cleanFirestoreData(val);
        if (cleanedVal !== undefined) {
          cleaned[key] = cleanedVal;
        }
      }
    }
    return cleaned;
  }
  
  return obj;
};

/**
 * Ensures image URLs are always loaded directly from Firebase / remote host
 * and never served from stale browser cache or browser history.
 */
export function getFreshImageUrl(url?: string | null, updatedAt?: string | number): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  // Data URLs, Blobs and local bundled Vite assets do not use HTTP browser caching
  if (
    trimmed.startsWith('data:') || 
    trimmed.startsWith('blob:') || 
    trimmed.startsWith('/src/') || 
    trimmed.startsWith('./') ||
    trimmed.startsWith('assets/') ||
    trimmed.includes('/assets/') ||
    trimmed.includes('@fs/') ||
    (trimmed.startsWith('/') && !trimmed.startsWith('//'))
  ) {
    return trimmed;
  }

  // Only apply version query param if updatedAt is explicitly provided.
  // NEVER fallback to Date.now() as that invalidates image caches and unmounts elements on every React render.
  if (!updatedAt) {
    return trimmed;
  }

  try {
    // Strip any old cache buster query parameter to prevent accumulation
    const cleanUrl = trimmed.replace(/([?&])(_fb|_t|t|v)=[^&]*(&|$)/g, '$1').replace(/[?&]$/, '');
    const separator = cleanUrl.includes('?') ? '&' : '?';
    const version = encodeURIComponent(String(updatedAt));
    return `${cleanUrl}${separator}_fb=${version}`;
  } catch {
    return trimmed;
  }
}

export const parseFirestoreProduct = (id: string, data: any): Product => {
  const priceNum = Number(data.price) || 0;
  const origPriceNum = data.originalPrice != null && Number(data.originalPrice) > 0 ? Number(data.originalPrice) : undefined;
  const stockQtyNum = data.stockQuantity != null && !isNaN(Number(data.stockQuantity)) ? Number(data.stockQuantity) : undefined;
  const salesCountNum = data.salesCount != null && Number(data.salesCount) > 0 ? Number(data.salesCount) : undefined;

  // Fallback timestamp if createdAt is not stored
  let createdAtStr = data.createdAt;
  if (!createdAtStr) {
    if (id.startsWith('prod_')) {
      const parts = id.split('_');
      const timestamp = Number(parts[1]);
      if (!isNaN(timestamp) && timestamp > 1600000000000) {
        createdAtStr = new Date(timestamp).toISOString();
      }
    }
    if (!createdAtStr) {
      createdAtStr = '2024-01-01T00:00:00.000Z';
    }
  }

  const freshImage = getFreshImageUrl(
    data.image || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
    data.updatedAt || createdAtStr
  );

  const freshImages = Array.isArray(data.images) && data.images.length > 0 
    ? data.images.map((img: string) => getFreshImageUrl(img, data.updatedAt || createdAtStr))
    : (data.image ? [freshImage] : undefined);

  return {
    id,
    name: data.name || '',
    category: data.category || 'pipas',
    price: priceNum,
    originalPrice: origPriceNum,
    image: freshImage,
    images: freshImages,
    videoUrl: data.videoUrl || undefined,
    videos: Array.isArray(data.videos) ? data.videos : undefined,
    description: data.description || '',
    specs: Array.isArray(data.specs) ? data.specs : [],
    inStock: data.inStock !== false && (stockQtyNum === undefined || stockQtyNum > 0),
    stockQuantity: stockQtyNum,
    shopeeUrl: data.shopeeUrl || 'https://shopee.com.br/mundo_da_pipa',
    badge: data.badge || undefined,
    rating: Number(data.rating) || 5.0,
    salesCount: salesCountNum,
    reviews: Array.isArray(data.reviews) ? data.reviews : (SHOPEE_PRODUCT_FIO10.reviews || []),
    createdAt: createdAtStr,
    updatedAt: data.updatedAt || undefined
  };
};

// Direct Firestore fetch with cache and deduplication
export const getProductsFromFirestore = async (forceRefresh = false): Promise<Product[]> => {
  const path = 'products';
  if (!forceRefresh) {
    const cached = cacheGet<Product[]>('products', TTL.PRODUCTS);
    if (cached && Array.isArray(cached) && cached.length > 0) {
      return cached;
    }
  }

  if (isFirestoreQuotaExhausted) {
    return getLocalProducts();
  }

  return dedupeRequest('products', async () => {
    try {
      const productsRef = collection(db, path);
      const snapshot = await getDocs(productsRef);
      if (snapshot.empty) {
        return [];
      }
      const productsList: Product[] = [];
      snapshot.forEach((docSnap) => {
        productsList.push(parseFirestoreProduct(docSnap.id, docSnap.data()));
      });
      cacheSet('products', productsList);
      setLocalProducts(productsList);
      return productsList;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return getLocalProducts();
    }
  });
};

// Seed guard to prevent repeated requests
let hasAttemptedSeed = false;

export const initializeProductsSeed = async () => {
  if (hasAttemptedSeed || isFirestoreQuotaExhausted) return;
  hasAttemptedSeed = true;

  try {
    const cached = cacheGet<Product[]>('products', TTL.PRODUCTS);
    if (cached && cached.length > 0) return;

    const productsRef = collection(db, 'products');
    const snapshot = await getDocs(productsRef);
    if (snapshot.empty) {
      const docRef = doc(productsRef, SHOPEE_PRODUCT_FIO10.id);
      const sanitized = cleanFirestoreData({
        ...SHOPEE_PRODUCT_FIO10,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      await setDoc(docRef, sanitized);
    }
  } catch (error: any) {
    markQuotaExhausted(error);
    if (!checkIsQuotaError(error)) {
      console.warn('Firestore seed notice:', error?.message || error);
    }
  }
};

export const registerShopeeItemDirectly = async () => {
  // Update locally first
  const current = getLocalProducts();
  const index = current.findIndex(p => p.id === SHOPEE_PRODUCT_FIO10.id);
  if (index >= 0) {
    current[index] = { ...SHOPEE_PRODUCT_FIO10 };
  } else {
    current.unshift(SHOPEE_PRODUCT_FIO10);
  }
  setLocalProducts(current);

  // Sync to Firestore in background
  if (isFirestoreQuotaExhausted) return;
  try {
    const productsRef = collection(db, 'products');
    const docRef = doc(productsRef, SHOPEE_PRODUCT_FIO10.id);
    const sanitized = cleanFirestoreData({
      ...SHOPEE_PRODUCT_FIO10,
      updatedAt: new Date().toISOString()
    });
    await setDoc(docRef, sanitized, { merge: true });
  } catch (err: any) {
    markQuotaExhausted(err);
    if (!checkIsQuotaError(err)) {
      console.warn('Firestore sync note:', err?.message || err);
    }
  }
};

// Smart cache-first product subscriber (drastically reduces Firestore reads)
export const subscribeToProducts = (
  onData: (products: Product[]) => void,
  onError?: (err: Error) => void
) => {
  productListeners.push(onData);

  // 1. Immediately provide cached products (0ms, 0 Firestore reads)
  const cached = getLocalProducts();
  onData(cached);

  // 2. Fetch from Firestore cloud ONLY if cache is missing or older than TTL
  const hasValidCache = cacheGet<Product[]>('products', TTL.PRODUCTS) !== null;
  if (!hasValidCache && !isFirestoreQuotaExhausted) {
    getProductsFromFirestore().then((productsList) => {
      onData(productsList);
    }).catch((err) => {
      if (onError && !checkIsQuotaError(err)) {
        onError(err);
      }
    });
  }

  return () => {
    const idx = productListeners.indexOf(onData);
    if (idx >= 0) productListeners.splice(idx, 1);
  };
};

// Clear all products
export const clearAllProductsFromFirestore = async () => {
  setLocalProducts([]);

  try {
    const productsRef = collection(db, 'products');
    const snapshot = await getDocs(productsRef);
    const deletePromises = snapshot.docs.map(docSnap => deleteDoc(doc(db, 'products', docSnap.id)));
    await Promise.all(deletePromises);
  } catch (err: any) {
    if (err?.code !== 'resource-exhausted') {
      console.warn('Firestore clear error:', err?.message || err);
    }
  }
};

// Admin operations (Real-time Cloud + Immediate Multi-device Persistence)
export const addProductToFirestore = async (newProduct: Partial<Product> | Record<string, any>): Promise<string> => {
  const newId = newProduct.id || `prod_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const productToSave: Product = {
    id: newId,
    name: newProduct.name || 'Novo Produto',
    category: newProduct.category || 'pipas',
    price: Number(newProduct.price) || 0,
    originalPrice: newProduct.originalPrice ? Number(newProduct.originalPrice) : undefined,
    image: newProduct.image || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
    images: Array.isArray(newProduct.images) ? newProduct.images : undefined,
    videoUrl: newProduct.videoUrl || undefined,
    videos: Array.isArray(newProduct.videos) ? newProduct.videos : undefined,
    description: newProduct.description || '',
    specs: Array.isArray(newProduct.specs) ? newProduct.specs : [],
    inStock: newProduct.inStock !== false && (newProduct.stockQuantity === undefined || Number(newProduct.stockQuantity) > 0),
    stockQuantity: newProduct.stockQuantity != null && !isNaN(Number(newProduct.stockQuantity)) ? Number(newProduct.stockQuantity) : undefined,
    shopeeUrl: newProduct.shopeeUrl || 'https://shopee.com.br/mundo_da_pipa',
    badge: newProduct.badge || undefined,
    rating: Number(newProduct.rating) || 5.0,
    salesCount: newProduct.salesCount ? Number(newProduct.salesCount) : undefined,
    reviews: Array.isArray(newProduct.reviews) ? newProduct.reviews : [],
    createdAt: newProduct.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // 1. Immediately update local cache & notify UI
  const currentList = getLocalProducts();
  const updatedList = [productToSave, ...currentList.filter(p => p.id !== newId)];
  setLocalProducts(updatedList);

  // 2. Direct Firestore write (persisted in cloud for all devices)
  const path = `products/${newId}`;
  try {
    const docRef = doc(db, 'products', newId);
    const sanitized = cleanFirestoreData({
      ...productToSave
    });
    await setDoc(docRef, sanitized);
    return newId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    return newId;
  }
};

export const updateProductInFirestore = async (id: string, updates: Record<string, any>): Promise<void> => {
  // 1. Immediately update local cache & notify UI
  const currentList = getLocalProducts();
  const index = currentList.findIndex(p => p.id === id);
  let mergedProduct: any = {};
  
  if (index >= 0) {
    mergedProduct = { ...currentList[index] };
    Object.keys(updates).forEach(k => {
      if (
        updates[k] === undefined || 
        (updates[k] && (updates[k]._methodName === 'deleteField' || updates[k].constructor?.name?.includes('Delete')))
      ) {
        delete mergedProduct[k];
      } else {
        mergedProduct[k] = updates[k];
      }
    });
    currentList[index] = mergedProduct;
    setLocalProducts([...currentList]);
  } else {
    mergedProduct = { id, ...updates };
  }

  // 2. Direct Firestore write (public for all connected devices)
  const path = `products/${id}`;
  try {
    const docRef = doc(db, 'products', id);
    const sanitized = cleanFirestoreData({
      ...mergedProduct,
      updatedAt: new Date().toISOString()
    });
    await setDoc(docRef, sanitized);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const deleteProductFromFirestore = async (id: string): Promise<void> => {
  // 1. Immediately remove from local cache & notify UI
  const currentList = getLocalProducts();
  const filtered = currentList.filter(p => p.id !== id);
  setLocalProducts(filtered);

  // 2. Direct Firestore delete
  const path = `products/${id}`;
  try {
    const docRef = doc(db, 'products', id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

// User Shopping Cart Sync
export const saveUserCartToFirestore = async (userId: string, items: CartItem[]) => {
  if (!userId || isFirestoreQuotaExhausted) return;
  try {
    const cartDocRef = doc(db, 'carts', userId);
    await setDoc(cartDocRef, {
      items: items || [],
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err: any) {
    handleQuotaExhausted(err);
  }
};

export const subscribeToUserCart = (userId: string, onData: (items: CartItem[]) => void) => {
  if (!userId) return () => {};

  try {
    const cartDocRef = doc(db, 'carts', userId);
    return onSnapshot(
      cartDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (Array.isArray(data.items)) {
            onData(data.items);
          }
        }
      },
      () => {
        // Quota error fallback - silently ignore
      }
    );
  } catch {
    return () => {};
  }
};

const SESSION_KEY = 'mundo_pipa_user_session';
let authStateListeners: ((user: UserProfile | null) => void)[] = [];

const notifyAuthListeners = (user: UserProfile | null) => {
  authStateListeners.forEach(fn => {
    try {
      fn(user);
    } catch {}
  });
};

const getStoredSession = (): UserProfile | null => {
  try {
    const data = localStorage.getItem(SESSION_KEY);
    if (!data) return null;
    const user: UserProfile = JSON.parse(data);
    if (user && user.email && isAdminEmail(user.email)) {
      user.role = 'admin';
    }
    return user;
  } catch {
    return null;
  }
};

const setStoredSession = (user: UserProfile | null) => {
  try {
    if (user) {
      if (user.email && isAdminEmail(user.email)) {
        user.role = 'admin';
      }
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  } catch {}
  notifyAuthListeners(user);
};

// Auth helpers
export const registerUser = async (email: string, pass: string, name: string) => {
  const isEmailAdmin = isAdminEmail(email);
  const finalRole: 'admin' | 'customer' = isEmailAdmin ? 'admin' : 'customer';

  const credential = await createUserWithEmailAndPassword(auth, email, pass);
  try {
    await updateProfile(credential.user, { displayName: name });
  } catch {}

  const userProfile: UserProfile = {
    uid: credential.user.uid,
    email: credential.user.email || email,
    name: name || (finalRole === 'admin' ? 'Administrador' : 'Cliente'),
    role: finalRole
  };

  try {
    const userDocRef = doc(db, 'users', credential.user.uid);
    await setDoc(userDocRef, userProfile);
  } catch {}

  setStoredSession(userProfile);
  return userProfile;
};

export const loginUser = async (email: string, pass: string) => {
  const credential = await signInWithEmailAndPassword(auth, email, pass);
  const resolvedEmail = credential.user.email || email;
  const isEmailAdmin = isAdminEmail(resolvedEmail);
  let userRole: 'admin' | 'customer' = isEmailAdmin ? 'admin' : 'customer';
  let userName = credential.user.displayName || (userRole === 'admin' ? 'Administrador' : 'Cliente');

  try {
    const userDocRef = doc(db, 'users', credential.user.uid);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.role && !isEmailAdmin) userRole = data.role;
      if (data.name) userName = data.name;
    }
  } catch {}

  const userProfile: UserProfile = {
    uid: credential.user.uid,
    email: resolvedEmail,
    name: userName,
    role: isEmailAdmin ? 'admin' : userRole
  };

  try {
    const userDocRef = doc(db, 'users', credential.user.uid);
    await setDoc(userDocRef, userProfile, { merge: true });
  } catch {}

  setStoredSession(userProfile);
  return userProfile;
};

export const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  const credential = await signInWithPopup(auth, provider);
  const email = credential.user.email || '';
  const isEmailAdmin = isAdminEmail(email);
  let finalRole: 'admin' | 'customer' = isEmailAdmin ? 'admin' : 'customer';
  let userName = credential.user.displayName || (isEmailAdmin ? 'Administrador' : 'Cliente Google');

  try {
    const userDocRef = doc(db, 'users', credential.user.uid);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.role && !isEmailAdmin) finalRole = data.role;
      if (data.name) userName = data.name;
    }
  } catch {}

  const userProfile: UserProfile = {
    uid: credential.user.uid,
    email: email,
    name: userName,
    role: isEmailAdmin ? 'admin' : finalRole
  };

  try {
    const userDocRef = doc(db, 'users', credential.user.uid);
    await setDoc(userDocRef, userProfile, { merge: true });
  } catch {}

  setStoredSession(userProfile);
  return userProfile;
};

export const logoutAppUser = async () => {
  try {
    await signOut(auth);
  } catch {}
  setStoredSession(null);
};

export const listenAuthState = (onChange: (user: UserProfile | null) => void) => {
  authStateListeners.push(onChange);

  // Send initial state from stored session
  const storedUser = getStoredSession();
  if (storedUser) {
    onChange(storedUser);
  }

  const unsubscribeFirebase = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
    if (firebaseUser) {
      const email = firebaseUser.email || '';
      const isEmailAdmin = isAdminEmail(email);
      let role: 'admin' | 'customer' = isEmailAdmin ? 'admin' : 'customer';
      let name = firebaseUser.displayName || (role === 'admin' ? 'Administrador' : 'Cliente');

      try {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.role && !isEmailAdmin) role = data.role;
          if (data.name) name = data.name;
        }
      } catch {}

      const userProfile: UserProfile = {
        uid: firebaseUser.uid,
        email: email,
        name: name,
        role: isEmailAdmin ? 'admin' : role
      };

      setStoredSession(userProfile);
    } else if (!getStoredSession()) {
      onChange(null);
    }
  });

  return () => {
    authStateListeners = authStateListeners.filter(fn => fn !== onChange);
    try {
      unsubscribeFirebase();
    } catch {}
  };
};

export interface StoryContent {
  badge: string;
  title: string;
  paragraph1: string;
  paragraph2: string;
  stat1Value: string;
  stat1Label: string;
  stat2Value: string;
  stat2Label: string;
  value1Title: string;
  value1Desc: string;
  value2Title: string;
  value2Desc: string;
  value3Title: string;
  value3Desc: string;
}

export const DEFAULT_STORY_CONTENT: StoryContent = {
  badge: 'Nossa Arte e Compromisso',
  title: 'A Arte e a Paixão das Pipas no Sangue',
  paragraph1: 'Fundado em 1999, o Mundo da Pipa nasceu do amor pela tradição brasileira do festival de pipas e raias. O que começou como uma produção artesanal de bairro transformou-se em referência nacional de qualidade em armações, papel de seda e linhas.',
  paragraph2: 'Cada pipa produzida carrega um rigoroso processo de seleção: varetas de bambu alinhadas e tratadas contra umidade, curvatura testada e papéis com estampas vibrantes e cortes de precisão para garantir um vôo estável e ágil.',
  stat1Value: '25+',
  stat1Label: 'Anos de Paixão',
  stat2Value: '100k+',
  stat2Label: 'Pipas Produzidas',
  value1Title: 'Bambu & Fibra Selecionados',
  value1Desc: 'Matéria-prima de alta flexibilidade para excelente aerodinâmica e durabilidade no céu.',
  value2Title: 'Feito por Apaixonados por Pipas',
  value2Desc: 'Respeito total aos praticantes, garantindo pipas calibradas prontas para o alto.',
  value3Title: 'Entrega Nacional com Segurança',
  value3Desc: 'Embalagens reforçadas para que suas pipas cheguem perfeitamente intactas.'
};

const LOCAL_STORY_KEY = 'mundo_pipa_story_content';

export const getStoryContent = (): StoryContent => {
  try {
    const raw = localStorage.getItem(LOCAL_STORY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_STORY_CONTENT, ...parsed };
    }
  } catch {}
  return DEFAULT_STORY_CONTENT;
};

export const saveStoryContent = async (content: StoryContent) => {
  try {
    localStorage.setItem(LOCAL_STORY_KEY, JSON.stringify(content));
  } catch {}

  try {
    const storyRef = doc(db, 'site_content', 'about_history');
    await setDoc(storyRef, {
      ...cleanFirestoreData(content),
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err: any) {
    console.warn('Firestore story content sync notice:', err?.message || err);
  }
};

export const subscribeToStoryContent = (onData: (content: StoryContent) => void) => {
  // 1. Return cached data immediately (0 reads)
  const initial = cacheGet<StoryContent>('about_story', TTL.ABOUT_STORY) || getStoryContent();
  onData(initial);

  // 2. Fetch only if cache is missing or older than TTL
  const isCacheValid = cacheGet<StoryContent>('about_story', TTL.ABOUT_STORY) !== null;
  if (!isCacheValid && !isFirestoreQuotaExhausted) {
    dedupeRequest('about_story', async () => {
      try {
        const storyRef = doc(db, 'site_content', 'about_history');
        const docSnap = await getDoc(storyRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const merged = { ...DEFAULT_STORY_CONTENT, ...data };
          cacheSet('about_story', merged);
          try {
            localStorage.setItem(LOCAL_STORY_KEY, JSON.stringify(merged));
          } catch {}
          onData(merged);
          return merged;
        }
      } catch (err: any) {
        markQuotaExhausted(err);
      }
      return getStoryContent();
    });
  }

  return () => {};
};

// =========================================================
// Community & Public Posts System (Firebase Firestore + Cache)
// =========================================================

export const DEFAULT_POSTS: Post[] = [
  {
    id: 'post-festival-2026',
    title: 'Grande Festival Mundo da Pipa 2026! 🪁🔥',
    content: 'Preparem as carretilhas e as armações! No próximo domingo teremos o maior encontro de combate amador e revoada livre com sorteio de kits completos, carretilhas artesanais e pacotes de raias 40x40. Traga sua família para colorir o céu com a gente!',
    author: 'Jean Pierre (Mundo da Pipa)',
    authorId: 'admin',
    imageUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=k-V39b-e8pU',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString()
  },
  {
    id: 'post-dica-estirante',
    title: 'Dica Técnica: O segredo do estirante perfeito para ventos fortes e fracos',
    content: 'Muitos pipeiros erram no cabresto: para vento fraco, deixe o estirante superior 1 dedo mais curto para dar tração máxima à armação de bambu. Já para vento forte, curve levemente a vareta horizontal e aumente o estirante inferior para dar firmeza e evitar que a pipa desbie.',
    author: 'Equipe Técnica Mundo da Pipa',
    authorId: 'admin',
    imageUrl: 'https://images.unsplash.com/photo-1508615039623-a25605d2b022?auto=format&fit=crop&w=1200&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=0hB3u148J8A',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString()
  },
  {
    id: 'post-fio10-adamantium',
    title: 'Linha Fio 10 3000 Jardas 2 Passadas (Adamantium) já em estoque!',
    content: 'Nossa campeã de vendas na Shopee! Linha 100% algodão com acabamento emborrachado liso, toque suave que não corta a mão na largada e altíssima resistência na disputa aérea. Disponível para envio imediato com entrega rápida.',
    author: 'Mundo da Pipa Shopee Oficial',
    authorId: 'admin',
    imageUrl: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1200&q=80',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString()
  }
];

const LOCAL_POSTS_CACHE_KEY = 'mundo_pipa_posts_cache_v2';

export const getLocalPosts = (): Post[] => {
  try {
    const raw = localStorage.getItem(LOCAL_POSTS_CACHE_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}
  return DEFAULT_POSTS;
};

const postListeners: ((posts: Post[]) => void)[] = [];
export const setLocalPosts = (posts: Post[]) => {
  try {
    localStorage.setItem(LOCAL_POSTS_CACHE_KEY, JSON.stringify(posts));
  } catch {}
  postListeners.forEach(fn => {
    try { fn(posts); } catch {}
  });
};

/**
 * Fetch all posts from Firebase Firestore or fallback to local cache
 */
export const getPostsFromFirestore = async (forceRefresh = false): Promise<Post[]> => {
  const path = 'posts';
  if (!forceRefresh) {
    const cached = cacheGet<Post[]>('posts', TTL.POSTS);
    if (cached && Array.isArray(cached) && cached.length > 0) {
      return cached;
    }
  }

  if (isFirestoreQuotaExhausted) {
    return getLocalPosts();
  }

  return dedupeRequest('posts', async () => {
    try {
      const postsRef = collection(db, path);
      const snapshot = await getDocs(postsRef);
      if (!snapshot.empty) {
        const postsList: Post[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          postsList.push({
            id: docSnap.id,
            title: data.title || '',
            content: data.content || '',
            author: data.author || 'Mundo da Pipa',
            authorId: data.authorId || '',
            imageUrl: getFreshImageUrl(data.imageUrl, data.updatedAt || data.createdAt),
            videoUrl: data.videoUrl || '',
            createdAt: data.createdAt || new Date().toISOString()
          });
        });
        postsList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        cacheSet('posts', postsList);
        setLocalPosts(postsList);
        return postsList;
      }
    } catch (error) {
      markQuotaExhausted(error);
      console.warn('Posts Firestore read notice (using resilient local cache):', error);
    }
    return getLocalPosts();
  });
};

/**
 * Add a new post to Firebase Firestore and update local storage immediately
 */
export const addPostToFirestore = async (newPost: Partial<Post>): Promise<string> => {
  const id = newPost.id || `post_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const postData: Post = {
    id,
    title: newPost.title?.trim() || '',
    content: newPost.content?.trim() || '',
    author: newPost.author?.trim() || 'Mundo da Pipa',
    authorId: newPost.authorId || auth.currentUser?.uid || 'admin',
    imageUrl: newPost.imageUrl?.trim() || '',
    videoUrl: newPost.videoUrl?.trim() || '',
    createdAt: newPost.createdAt || new Date().toISOString()
  };

  // 1. Immediately update local storage and notify all subscribers
  const current = getLocalPosts();
  const updated = [postData, ...current.filter(p => p.id !== id)];
  setLocalPosts(updated);

  // 2. Direct Firestore persistence
  const path = `posts/${id}`;
  try {
    const postRef = doc(db, 'posts', id);
    await setDoc(postRef, cleanFirestoreData(postData), { merge: true });
    return id;
  } catch (error) {
    markQuotaExhausted(error);
    console.warn('Could not sync post to Firestore cloud immediately, preserved locally:', error);
    return id;
  }
};

/**
 * Update an existing post in Firebase Firestore and local cache
 */
export const updatePostInFirestore = async (postId: string, updates: Partial<Post>): Promise<void> => {
  // Update local cache immediately
  const current = getLocalPosts();
  const updated = current.map(p => p.id === postId ? { ...p, ...updates } : p);
  setLocalPosts(updated);

  const path = `posts/${postId}`;
  try {
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, cleanFirestoreData(updates));
  } catch (error) {
    markQuotaExhausted(error);
    console.warn('Could not update post in Firestore cloud, updated locally:', error);
  }
};

/**
 * Delete a post from Firebase Firestore and local cache
 */
export const deletePostFromFirestore = async (postId: string): Promise<void> => {
  // Update local cache immediately
  const current = getLocalPosts();
  const filtered = current.filter(p => p.id !== postId);
  setLocalPosts(filtered);

  const path = `posts/${postId}`;
  try {
    const postRef = doc(db, 'posts', postId);
    await deleteDoc(postRef);
  } catch (error) {
    markQuotaExhausted(error);
    console.warn('Could not delete post from Firestore cloud, removed locally:', error);
  }
};

/**
 * Subscribe to posts in real-time from Firebase Firestore with instant local cache delivery
 */
export const subscribeToPosts = (
  onData: (posts: Post[]) => void,
  onError?: (err: Error) => void
) => {
  postListeners.push(onData);

  // 1. Immediately deliver local/cached posts (0ms, 0 reads)
  const cached = cacheGet<Post[]>('posts', TTL.POSTS) || getLocalPosts();
  onData(cached);

  // 2. Fetch only if cache missing or expired
  const isCacheValid = cacheGet<Post[]>('posts', TTL.POSTS) !== null;
  if (!isCacheValid && !isFirestoreQuotaExhausted) {
    getPostsFromFirestore().then((postsList) => {
      onData(postsList);
    }).catch((err) => {
      if (onError && !checkIsQuotaError(err)) {
        onError(err);
      }
    });
  }

  return () => {
    const idx = postListeners.indexOf(onData);
    if (idx >= 0) postListeners.splice(idx, 1);
  };
};

/**
 * Catalog Settings: Default sorting configuration (toggleable by admin)
 */
export interface CatalogSettings {
  defaultSortNewest: boolean;
  defaultSortOption: 'newest' | 'relevance' | 'sales' | 'price-asc' | 'price-desc' | 'rating';
  updatedAt?: string;
  updatedBy?: string;
}

export const DEFAULT_CATALOG_SETTINGS: CatalogSettings = {
  defaultSortNewest: true, // Default to "Mais novos primeiro"
  defaultSortOption: 'newest'
};

const LOCAL_CATALOG_SETTINGS_KEY = 'mundo_pipa_catalog_settings';

export const getLocalCatalogSettings = (): CatalogSettings => {
  try {
    const raw = localStorage.getItem(LOCAL_CATALOG_SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed.defaultSortNewest === 'boolean') {
        return parsed;
      }
    }
  } catch {}
  return DEFAULT_CATALOG_SETTINGS;
};

export const setLocalCatalogSettings = (settings: CatalogSettings) => {
  try {
    localStorage.setItem(LOCAL_CATALOG_SETTINGS_KEY, JSON.stringify(settings));
  } catch {}
};

export const getCatalogSettingsFromFirestore = async (forceRefresh = false): Promise<CatalogSettings> => {
  if (!forceRefresh) {
    const cached = cacheGet<CatalogSettings>('catalog_settings', TTL.CATALOG_SETTINGS);
    if (cached) return cached;
  }

  if (isFirestoreQuotaExhausted) {
    return getLocalCatalogSettings();
  }

  return dedupeRequest('catalog_settings', async () => {
    try {
      const docRef = doc(db, 'site_content', 'catalog_settings');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const settings: CatalogSettings = {
          defaultSortNewest: data.defaultSortNewest !== undefined ? Boolean(data.defaultSortNewest) : true,
          defaultSortOption: data.defaultSortOption || 'newest',
          updatedAt: data.updatedAt,
          updatedBy: data.updatedBy
        };
        cacheSet('catalog_settings', settings);
        setLocalCatalogSettings(settings);
        return settings;
      }
    } catch (error) {
      console.warn('Error fetching catalog settings from Firestore:', error);
    }
    return getLocalCatalogSettings();
  });
};

export const saveCatalogSettingsToFirestore = async (settings: CatalogSettings, userEmail?: string): Promise<void> => {
  cacheSet('catalog_settings', settings);
  setLocalCatalogSettings(settings);
  try {
    const docRef = doc(db, 'site_content', 'catalog_settings');
    const dataToSave = cleanFirestoreData({
      ...settings,
      updatedAt: new Date().toISOString(),
      updatedBy: userEmail || 'admin'
    });
    await setDoc(docRef, dataToSave, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'site_content/catalog_settings');
  }
};

export const subscribeToCatalogSettings = (
  onData: (settings: CatalogSettings) => void
) => {
  // 1. Immediately provide cached settings (0ms, 0 reads)
  const cached = cacheGet<CatalogSettings>('catalog_settings', TTL.CATALOG_SETTINGS) || getLocalCatalogSettings();
  onData(cached);

  // 2. Fetch from Firestore ONLY if cache is missing or older than TTL
  const isCacheValid = cacheGet<CatalogSettings>('catalog_settings', TTL.CATALOG_SETTINGS) !== null;
  if (!isCacheValid && !isFirestoreQuotaExhausted) {
    getCatalogSettingsFromFirestore().then((settings) => {
      onData(settings);
    }).catch(() => {});
  }

  return () => {};
};

// ==========================================
// PROMOTIONAL COUPONS MANAGEMENT
// ==========================================

const COUPONS_STORAGE_KEY = 'mundo_pipa_coupons';

const DEFAULT_COUPONS: Coupon[] = [];

export const getLocalCoupons = (): Coupon[] => {
  const cached = cacheGet<Coupon[]>('coupons', TTL.COUPONS);
  if (cached && Array.isArray(cached)) {
    return cached.filter((c) => c && c.id !== 'default-pipa10' && c.code !== 'PIPA10');
  }
  const stale = cacheGetStale<Coupon[]>('coupons');
  if (stale && Array.isArray(stale)) {
    return stale.filter((c) => c && c.id !== 'default-pipa10' && c.code !== 'PIPA10');
  }
  try {
    const stored = localStorage.getItem(COUPONS_STORAGE_KEY);
    if (stored !== null) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        const filtered = parsed.filter(
          (c) => c && c.id !== 'default-pipa10' && c.code !== 'PIPA10'
        );
        return filtered;
      }
    }
  } catch (e) {
    console.warn('Error reading local coupons:', e);
  }
  return [];
};

export const setLocalCoupons = (coupons: Coupon[]) => {
  try {
    const cleaned = coupons.filter(
      (c) => c && c.id !== 'default-pipa10' && c.code !== 'PIPA10'
    );
    cacheSet('coupons', cleaned);
    localStorage.setItem(COUPONS_STORAGE_KEY, JSON.stringify(cleaned));
  } catch (e) {
    console.warn('Error saving local coupons:', e);
  }
};

export const subscribeToCoupons = (
  onData: (coupons: Coupon[]) => void
): (() => void) => {
  // 1. Immediately provide cached/local coupons (0ms, 0 reads)
  const cached = getLocalCoupons();
  onData(cached);

  // 2. Fetch from Firestore ONLY if cache is missing or older than TTL
  const isCacheValid = cacheGet<Coupon[]>('coupons', TTL.COUPONS) !== null;
  if (!isCacheValid && !isFirestoreQuotaExhausted) {
    dedupeRequest('coupons', async () => {
      try {
        const couponsCol = collection(db, 'coupons');
        const snapshot = await getDocs(couponsCol);
        if (!snapshot.empty) {
          const remoteCoupons: Coupon[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const id = docSnap.id;
            const code = String(data.code || '').toUpperCase().trim();

            if (id === 'default-pipa10' || code === 'PIPA10') {
              try {
                deleteDoc(doc(db, 'coupons', id)).catch(() => {});
              } catch (_) {}
              return;
            }

            remoteCoupons.push({
              id,
              code,
              discountPercent: Number(data.discountPercent) || 0,
              description: data.description || '',
              active: data.active !== undefined ? Boolean(data.active) : true,
              showOnSite: data.showOnSite !== undefined ? Boolean(data.showOnSite) : true,
              appliesToAll: data.appliesToAll !== undefined ? Boolean(data.appliesToAll) : true,
              applicableProductIds: Array.isArray(data.applicableProductIds) ? data.applicableProductIds : [],
              createdAt: data.createdAt || new Date().toISOString(),
              updatedAt: data.updatedAt
            });
          });

          remoteCoupons.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
          setLocalCoupons(remoteCoupons);
          onData(remoteCoupons);
          return remoteCoupons;
        } else {
          setLocalCoupons([]);
          onData([]);
          return [];
        }
      } catch (error: any) {
        markQuotaExhausted(error);
        console.warn('Coupons Firestore sync error, using local cache:', error);
        onData(getLocalCoupons());
        return getLocalCoupons();
      }
    });
  }

  return () => {};
};

export const saveCouponToFirestore = async (
  couponData: Omit<Coupon, 'id'> & { id?: string },
  userEmail?: string
): Promise<string> => {
  const normalizedCode = couponData.code.toUpperCase().trim();
  const id = couponData.id || `coupon_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  
  const newCoupon: Coupon = {
    id,
    code: normalizedCode,
    discountPercent: Math.min(100, Math.max(1, Number(couponData.discountPercent) || 10)),
    description: couponData.description?.trim() || '',
    active: couponData.active !== undefined ? couponData.active : true,
    showOnSite: couponData.showOnSite !== undefined ? Boolean(couponData.showOnSite) : true,
    appliesToAll: Boolean(couponData.appliesToAll),
    applicableProductIds: Array.isArray(couponData.applicableProductIds) ? couponData.applicableProductIds : [],
    createdAt: couponData.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Update local storage immediately for responsive UI
  const local = getLocalCoupons();
  const existingIdx = local.findIndex((c) => c.id === id || c.code === normalizedCode);
  let updatedList: Coupon[];
  if (existingIdx >= 0) {
    updatedList = [...local];
    updatedList[existingIdx] = newCoupon;
  } else {
    updatedList = [newCoupon, ...local];
  }
  setLocalCoupons(updatedList);

  // Sync to Firestore
  try {
    const docRef = doc(db, 'coupons', id);
    const dataToSave = cleanFirestoreData({
      ...newCoupon,
      updatedBy: userEmail || 'admin'
    });
    await setDoc(docRef, dataToSave, { merge: true });
    return id;
  } catch (error) {
    console.warn('Could not persist coupon to Firestore, saved locally:', error);
    return id;
  }
};

export const deleteCouponFromFirestore = async (couponId: string): Promise<void> => {
  // Update local storage immediately
  const local = getLocalCoupons();
  const filtered = local.filter((c) => c.id !== couponId);
  setLocalCoupons(filtered);

  // Delete from Firestore
  try {
    const docRef = doc(db, 'coupons', couponId);
    await deleteDoc(docRef);
  } catch (error) {
    console.warn('Could not delete coupon from Firestore, removed locally:', error);
  }
};

export const toggleCouponStatusInFirestore = async (
  couponId: string,
  currentStatus: boolean
): Promise<void> => {
  const newStatus = !currentStatus;
  
  // Update local storage immediately
  const local = getLocalCoupons();
  const updated = local.map((c) => (c.id === couponId ? { ...c, active: newStatus } : c));
  setLocalCoupons(updated);

  // Sync to Firestore
  try {
    const docRef = doc(db, 'coupons', couponId);
    await setDoc(docRef, { active: newStatus, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (error) {
    console.warn('Could not update coupon status in Firestore, updated locally:', error);
  }
};

export const toggleCouponShowOnSiteInFirestore = async (
  couponId: string,
  currentShowOnSite: boolean
): Promise<void> => {
  const newShowOnSite = !currentShowOnSite;
  
  // Update local storage immediately
  const local = getLocalCoupons();
  const updated = local.map((c) => (c.id === couponId ? { ...c, showOnSite: newShowOnSite } : c));
  setLocalCoupons(updated);

  // Sync to Firestore
  try {
    const docRef = doc(db, 'coupons', couponId);
    await setDoc(docRef, { showOnSite: newShowOnSite, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (error) {
    console.warn('Could not update coupon showOnSite in Firestore, updated locally:', error);
  }
};

// ==========================================
// DYNAMIC CATEGORIES MANAGEMENT
// ==========================================

export const DEFAULT_CATEGORIES: CategoryItem[] = [
  { id: 'pipas', label: 'Pipas & Raias', icon: '🪁', isDefault: true, order: 1 },
  { id: 'linhas', label: 'Linhas', icon: '🧵', isDefault: true, order: 2 },
  { id: 'rabiolas', label: 'Rabiolas & Fitas', icon: '🎗️', isDefault: true, order: 3 },
  { id: 'varetas', label: 'Varetas & Carretilhas', icon: '🪵', isDefault: true, order: 4 },
  { id: 'kits', label: 'Kits Promocionais', icon: '🎁', isDefault: true, order: 5 },
  { id: 'plastico-embalagens', label: 'Plástico e embalagens', icon: '🛍️', isDefault: true, order: 6 },
];

const CATEGORIES_KEY = 'mundo_pipa_categories_v2';

export const getLocalCategories = (): CategoryItem[] => {
  const cached = cacheGet<CategoryItem[]>('categories', TTL.CATEGORIES);
  if (cached && Array.isArray(cached) && cached.length > 0) {
    return cached;
  }
  const stale = cacheGetStale<CategoryItem[]>('categories');
  if (stale && Array.isArray(stale) && stale.length > 0) {
    return stale;
  }
  try {
    const raw = localStorage.getItem(CATEGORIES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT_CATEGORIES;
};

export const setLocalCategories = (categories: CategoryItem[]): void => {
  cacheSet('categories', categories);
  try {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
  } catch {}
};

export const subscribeToCategories = (callback: (categories: CategoryItem[]) => void): (() => void) => {
  // 1. Emit cached/local categories immediately (0ms, 0 reads)
  const cached = getLocalCategories();
  callback(cached);

  // 2. Fetch from Firestore ONLY if cache is missing or older than TTL
  const isCacheValid = cacheGet<CategoryItem[]>('categories', TTL.CATEGORIES) !== null;
  if (!isCacheValid && !isFirestoreQuotaExhausted) {
    dedupeRequest('categories', async () => {
      try {
        const categoriesCol = collection(db, 'categories');
        const snapshot = await getDocs(categoriesCol);
        if (!snapshot.empty) {
          const loaded: CategoryItem[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            loaded.push({
              id: docSnap.id,
              label: data.label || docSnap.id,
              icon: data.icon || '🏷️',
              order: typeof data.order === 'number' ? data.order : 99,
              isDefault: Boolean(data.isDefault),
              createdAt: data.createdAt,
              updatedAt: data.updatedAt
            });
          });
          loaded.sort((a, b) => (a.order || 99) - (b.order || 99));
          setLocalCategories(loaded);
          callback(loaded);
          return loaded;
        } else {
          setLocalCategories(DEFAULT_CATEGORIES);
          callback(DEFAULT_CATEGORIES);
          return DEFAULT_CATEGORIES;
        }
      } catch (error: any) {
        markQuotaExhausted(error);
        console.warn('Error reading categories from Firestore, using local:', error);
        callback(getLocalCategories());
        return getLocalCategories();
      }
    });
  }

  return () => {};
};

export const saveCategoryToFirestore = async (
  categoryData: { id?: string; label: string; icon?: string; order?: number }
): Promise<string> => {
  const cleanLabel = categoryData.label.trim();
  const rawId = categoryData.id?.trim() || cleanLabel
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const id = rawId || `cat-${Date.now()}`;

  const currentLocal = getLocalCategories();
  const existingIdx = currentLocal.findIndex((c) => c.id === id);
  const now = new Date().toISOString();

  const newCat: CategoryItem = {
    id,
    label: cleanLabel,
    icon: categoryData.icon || '🏷️',
    order: categoryData.order ?? (existingIdx >= 0 ? currentLocal[existingIdx].order : currentLocal.length + 1),
    isDefault: existingIdx >= 0 ? currentLocal[existingIdx].isDefault : false,
    createdAt: existingIdx >= 0 ? currentLocal[existingIdx].createdAt : now,
    updatedAt: now
  };

  const updatedList = existingIdx >= 0
    ? currentLocal.map((c, idx) => idx === existingIdx ? newCat : c)
    : [...currentLocal, newCat];

  setLocalCategories(updatedList);

  try {
    const docRef = doc(db, 'categories', id);
    await setDoc(docRef, {
      label: newCat.label,
      icon: newCat.icon,
      order: newCat.order,
      isDefault: newCat.isDefault || false,
      updatedAt: now,
      createdAt: newCat.createdAt || now
    }, { merge: true });
    return id;
  } catch (error) {
    console.warn('Could not save category to Firestore, saved locally:', error);
    return id;
  }
};

export const deleteCategoryFromFirestore = async (categoryId: string): Promise<void> => {
  const current = getLocalCategories();
  const filtered = current.filter((c) => c.id !== categoryId);
  setLocalCategories(filtered);

  try {
    const docRef = doc(db, 'categories', categoryId);
    await deleteDoc(docRef);
  } catch (error) {
    console.warn('Could not delete category from Firestore, removed locally:', error);
  }
};

// ==========================================
// CUSTOMER REVIEWS & DEPOIMENTOS SYSTEM
// ==========================================

export interface CustomerReviewItem {
  id: string | number;
  author: string;
  variation: string;
  rating: number;
  date: string;
  comment: string;
  badges: string[];
  sellerReply?: string;
}

export const DEFAULT_CUSTOMER_REVIEWS: CustomerReviewItem[] = [
  {
    id: 'rev-theus878',
    author: 'theus878',
    variation: 'Variação: 2P, Emborrachada',
    rating: 5,
    date: '2026-05-24',
    comment: 'linha lisa emborrachada de extrema qualidade, recomendo. comprarei mais vezes',
    badges: ['Custo-benefício: perfeito', 'Parecido c/ anúncio: sim', 'Segurança: ótima'],
    sellerReply: 'Muito obrigado pela preferência 😃 Deus abençoe 🙏🏻'
  },
  {
    id: 'rev-u45p9ldsxm',
    author: 'u45p9ldsxm',
    variation: 'Variação: 2P, Emborrachada',
    rating: 5,
    date: '2026-07-09',
    comment: 'sim linha lisinha de qualidade',
    badges: ['Custo-benefício: excelente', 'Parecido c/ anúncio: sim', 'Segurança: bom'],
    sellerReply: 'Muito obrigado pela preferência 😃'
  },
  {
    id: 'rev-ivanete1212',
    author: 'ivanete1212',
    variation: 'Variação: 2P, Meio termo',
    rating: 5,
    date: '2026-06-30',
    comment: 'Excelente produto! Chegou no prazo, bem embalado e pronto para uso.',
    badges: ['Entrega rápida', 'Qualidade Garantida'],
    sellerReply: 'Muito obrigado pela preferência 😃'
  },
  {
    id: 'rev-maianaigor',
    author: 'maianaigor',
    variation: 'Variação: 2P, Emborrachada',
    rating: 5,
    date: '2026-05-18',
    comment: 'Linha muito macia, resistente e de fácil manuseio. Recomendo muito a loja Mundo da Pipa!',
    badges: ['Qualidade Premium', 'Super Recomendo'],
    sellerReply: 'Muito obrigado pela preferência 😃'
  }
];

const LOCAL_REVIEWS_KEY = 'mundo_pipa_customer_reviews';

export const getLocalReviews = (): CustomerReviewItem[] => {
  const cached = cacheGet<CustomerReviewItem[]>('reviews', TTL.REVIEWS);
  if (cached && Array.isArray(cached) && cached.length > 0) {
    return cached;
  }
  const stale = cacheGetStale<CustomerReviewItem[]>('reviews');
  if (stale && Array.isArray(stale) && stale.length > 0) {
    return stale;
  }
  try {
    const raw = localStorage.getItem(LOCAL_REVIEWS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT_CUSTOMER_REVIEWS;
};

export const setLocalReviews = (reviews: CustomerReviewItem[]) => {
  cacheSet('reviews', reviews);
  try {
    localStorage.setItem(LOCAL_REVIEWS_KEY, JSON.stringify(reviews));
  } catch {}
};

export const subscribeToReviews = (onData: (reviews: CustomerReviewItem[]) => void) => {
  // 1. Immediately provide cached reviews (0ms, 0 reads)
  const cached = getLocalReviews();
  onData(cached);

  // 2. Fetch from Firestore ONLY if cache is missing or older than TTL
  const isCacheValid = cacheGet<CustomerReviewItem[]>('reviews', TTL.REVIEWS) !== null;
  if (!isCacheValid && !isFirestoreQuotaExhausted) {
    dedupeRequest('reviews', async () => {
      try {
        const reviewsCol = collection(db, 'reviews');
        const snapshot = await getDocs(reviewsCol);
        if (!snapshot.empty) {
          const loaded: CustomerReviewItem[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            loaded.push({
              id: docSnap.id,
              author: data.author || 'Cliente',
              variation: data.variation || 'Produto Mundo da Pipa',
              rating: Number(data.rating) || 5,
              date: data.date || new Date().toISOString().split('T')[0],
              comment: data.comment || '',
              badges: Array.isArray(data.badges) ? data.badges : [],
              sellerReply: data.sellerReply
            });
          });
          setLocalReviews(loaded);
          onData(loaded);
          return loaded;
        }
      } catch (error: any) {
        markQuotaExhausted(error);
      }
      return getLocalReviews();
    });
  }

  return () => {};
};

/**
 * Complete synchronization tool:
 * Invalidates all client caches and re-fetches latest cloud documents.
 */
export const forceSyncAllWithFirestore = async (): Promise<void> => {
  cacheInvalidateAll();
  await Promise.allSettled([
    getProductsFromFirestore(true),
    getAdminEmails(true),
    getPostsFromFirestore(true),
    getCatalogSettingsFromFirestore(true)
  ]);
};

/**
 * Compiles a snapshot of all collections and site configuration
 * for backup, export (.json/.db/.sql), and query exploration.
 */
export const getCompleteDatabaseBackup = async (exportedBy?: string) => {
  const [products, categories, coupons, posts, reviews, catalogSettings, storyContent, adminEmails] = await Promise.all([
    getProductsFromFirestore(false),
    Promise.resolve(getLocalCategories()),
    Promise.resolve(getLocalCoupons()),
    getPostsFromFirestore(false),
    Promise.resolve(getLocalReviews()),
    getCatalogSettingsFromFirestore(false),
    Promise.resolve(getStoryContent()),
    getAdminEmails(false)
  ]);

  const totalRecords =
    (products?.length || 0) +
    (categories?.length || 0) +
    (coupons?.length || 0) +
    (posts?.length || 0) +
    (reviews?.length || 0) +
    3;

  return {
    metadata: {
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
      appName: 'Mundo da Pipa',
      databaseId: firebaseConfig.firestoreDatabaseId || 'ai-studio-mundodapipa-66c6efda-c9a5-44bd-992b-f034f302f161',
      projectId: firebaseConfig.projectId || 'gen-lang-client-0927099826',
      totalRecords,
      exportedBy: exportedBy || 'jeanpierreowner@gmail.com'
    },
    collections: {
      products: products || [],
      categories: categories || [],
      coupons: coupons || [],
      posts: posts || [],
      reviews: reviews || [],
      site_content: {
        about_history: storyContent,
        catalog_settings: catalogSettings,
        admin_users: {
          emails: adminEmails || [],
          updatedAt: new Date().toISOString()
        }
      }
    }
  };
};

export const FIREBASE_PROJECT_INFO = {
  projectId: firebaseConfig.projectId || 'gen-lang-client-0927099826',
  databaseId: firebaseConfig.firestoreDatabaseId || 'ai-studio-mundodapipa-66c6efda-c9a5-44bd-992b-f034f302f161'
};



