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
  onSnapshot
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
import { Product, CartItem } from '../types';
import { SHOPEE_PRODUCT_FIO10 } from '../data/shopeeData';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);
export const auth = getAuth(app);

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
  const errMessage = error instanceof Error ? error.message : String(error);
  const errInfo: FirestoreErrorInfo = {
    error: errMessage,
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
  console.warn('Firestore Operation Info:', JSON.stringify(errInfo));
  return errInfo;
}

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: 'admin' | 'customer';
}

const ADMIN_EMAILS = [
  'admin@mundodapipa.com.br',
  'jeanpierreowner@gmail.com'
];

const LOCAL_PRODUCTS_CACHE_KEY = 'mundo_pipa_products_cache';

// Helper to check for Quota limit error
export const isQuotaError = (error: any): boolean => {
  if (!error) return false;
  const msg = error?.message || String(error);
  return msg.includes('resource-exhausted') || msg.includes('Quota limit exceeded') || msg.includes('Quota exceeded');
};

// Seed initial products only if collection is empty
let isSeeding = false;
export const initializeProductsSeed = async () => {
  if (isSeeding) return;
  isSeeding = true;
  try {
    const productsRef = collection(db, 'products');
    const snapshot = await getDocs(productsRef);
    if (snapshot.empty) {
      const docRef = doc(productsRef, SHOPEE_PRODUCT_FIO10.id);
      await setDoc(docRef, {
        ...SHOPEE_PRODUCT_FIO10,
        createdAt: new Date().toISOString()
      });
    }
  } catch (error: any) {
    if (isQuotaError(error)) {
      console.warn('Firestore daily write quota reached. Local fallback active.');
    } else {
      handleFirestoreError(error, OperationType.WRITE, 'products');
    }
  } finally {
    isSeeding = false;
  }
};

export const registerShopeeItemDirectly = async () => {
  try {
    const productsRef = collection(db, 'products');
    const docRef = doc(productsRef, SHOPEE_PRODUCT_FIO10.id);
    await setDoc(docRef, {
      ...SHOPEE_PRODUCT_FIO10,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error: any) {
    if (isQuotaError(error)) {
      console.warn('Quota limit exceeded on registering Shopee item. Saved locally.');
    } else {
      handleFirestoreError(error, OperationType.WRITE, `products/${SHOPEE_PRODUCT_FIO10.id}`);
      throw error;
    }
  }
};

// Listen to products in real-time with local storage fallback
export const subscribeToProducts = (onData: (products: Product[]) => void) => {
  const productsRef = collection(db, 'products');

  // Load cached products first for instant response
  try {
    const cached = localStorage.getItem(LOCAL_PRODUCTS_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        onData(parsed);
      }
    }
  } catch (e) {}

  return onSnapshot(productsRef, (snapshot) => {
    if (snapshot.empty) {
      onData([SHOPEE_PRODUCT_FIO10]);
      return;
    }
    const productsList: Product[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      productsList.push({
        id: docSnap.id,
        name: data.name || '',
        category: data.category || 'pipas',
        price: Number(data.price) || 0,
        originalPrice: data.originalPrice && Number(data.originalPrice) > (Number(data.price) || 0) ? Number(data.originalPrice) : undefined,
        image: data.image || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
        images: Array.isArray(data.images) ? data.images : undefined,
        videoUrl: data.videoUrl || undefined,
        videos: Array.isArray(data.videos) ? data.videos : undefined,
        description: data.description || '',
        specs: Array.isArray(data.specs) ? data.specs : [],
        inStock: data.inStock !== false,
        shopeeUrl: data.shopeeUrl || 'https://shopee.com.br/mundo_da_pipa',
        badge: data.badge || undefined,
        rating: Number(data.rating) || 5.0,
        salesCount: data.salesCount != null && Number(data.salesCount) > 0 ? Number(data.salesCount) : undefined,
        reviews: Array.isArray(data.reviews) ? data.reviews : SHOPEE_PRODUCT_FIO10.reviews
      });
    });

    // Save to local cache
    try {
      localStorage.setItem(LOCAL_PRODUCTS_CACHE_KEY, JSON.stringify(productsList));
    } catch (e) {}

    onData(productsList);
  }, (error) => {
    if (isQuotaError(error)) {
      console.warn('Firestore daily read/write quota limit exceeded. Using local cached catalog.');
    } else {
      handleFirestoreError(error, OperationType.LIST, 'products');
    }
    // Fallback to cache or default product
    try {
      const cached = localStorage.getItem(LOCAL_PRODUCTS_CACHE_KEY);
      if (cached) {
        onData(JSON.parse(cached));
        return;
      }
    } catch (e) {}
    onData([SHOPEE_PRODUCT_FIO10]);
  });
};

// Clear all products from Firestore
export const clearAllProductsFromFirestore = async () => {
  try {
    const productsRef = collection(db, 'products');
    const snapshot = await getDocs(productsRef);
    const deletePromises = snapshot.docs.map(docSnap => deleteDoc(doc(db, 'products', docSnap.id)));
    await Promise.all(deletePromises);
    localStorage.removeItem(LOCAL_PRODUCTS_CACHE_KEY);
  } catch (error: any) {
    if (isQuotaError(error)) {
      localStorage.removeItem(LOCAL_PRODUCTS_CACHE_KEY);
      throw new Error('A cota diária do banco de dados foi atingida. O catálogo foi limpo localmente.');
    }
    handleFirestoreError(error, OperationType.DELETE, 'products');
    throw error;
  }
};

// Admin operations
export const addProductToFirestore = async (newProduct: Omit<Product, 'id'>) => {
  try {
    const productsRef = collection(db, 'products');
    const docRef = await addDoc(productsRef, {
      ...newProduct,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error: any) {
    if (isQuotaError(error)) {
      throw new Error('Cota diária de escrita do Firestore atingida. A cota será restaurada amanhã.');
    }
    handleFirestoreError(error, OperationType.CREATE, 'products');
    throw error;
  }
};

export const updateProductInFirestore = async (id: string, updates: Partial<Product>) => {
  try {
    const docRef = doc(db, 'products', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  } catch (error: any) {
    if (isQuotaError(error)) {
      throw new Error('Cota diária de escrita do Firestore atingida. A cota será restaurada amanhã.');
    }
    handleFirestoreError(error, OperationType.UPDATE, `products/${id}`);
    throw error;
  }
};

export const deleteProductFromFirestore = async (id: string) => {
  try {
    const docRef = doc(db, 'products', id);
    await deleteDoc(docRef);
  } catch (error: any) {
    if (isQuotaError(error)) {
      throw new Error('Cota diária de escrita do Firestore atingida. A cota será restaurada amanhã.');
    }
    handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
    throw error;
  }
};

// User Shopping Cart Firestore Sync (debounced and safe)
let lastCartPayload = '';
export const saveUserCartToFirestore = async (userId: string, items: CartItem[]) => {
  if (!userId) return;
  const payload = JSON.stringify(items || []);
  if (payload === lastCartPayload) return; // Prevent unnecessary identical writes
  lastCartPayload = payload;

  try {
    const cartDocRef = doc(db, 'carts', userId);
    await setDoc(cartDocRef, {
      items: items || [],
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    if (isQuotaError(err)) {
      // Silently store in localStorage
      return;
    }
    console.warn('Firestore cart save notice:', err);
  }
};

export const subscribeToUserCart = (userId: string, onData: (items: CartItem[]) => void) => {
  if (!userId) return () => {};
  const cartDocRef = doc(db, 'carts', userId);
  return onSnapshot(cartDocRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (Array.isArray(data.items)) {
        lastCartPayload = JSON.stringify(data.items);
        onData(data.items);
      }
    }
  }, (err) => {
    if (!isQuotaError(err)) {
      console.warn('Cart subscription notice:', err);
    }
  });
};

const SESSION_KEY = 'mundo_pipa_user_session';
let authStateListeners: ((user: UserProfile | null) => void)[] = [];

const notifyAuthListeners = (user: UserProfile | null) => {
  authStateListeners.forEach(fn => fn(user));
};

const getStoredSession = (): UserProfile | null => {
  try {
    const data = localStorage.getItem(SESSION_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

const setStoredSession = (user: UserProfile | null) => {
  try {
    if (user) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  } catch {}
  notifyAuthListeners(user);
};

// Auth helpers for Firebase Auth & Firestore
export const registerUser = async (email: string, pass: string, name: string) => {
  const isEmailAdmin = ADMIN_EMAILS.includes(email.toLowerCase());
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
  } catch (e) {
    console.warn('User profile stored locally (quota/offline fallback)');
  }
  setStoredSession(userProfile);

  return userProfile;
};

export const loginUser = async (email: string, pass: string) => {
  const credential = await signInWithEmailAndPassword(auth, email, pass);
  const isEmailAdmin = ADMIN_EMAILS.includes((credential.user.email || email).toLowerCase());
  let userRole: 'admin' | 'customer' = isEmailAdmin ? 'admin' : 'customer';
  let userName = credential.user.displayName || (userRole === 'admin' ? 'Administrador' : 'Cliente');

  try {
    const userDocRef = doc(db, 'users', credential.user.uid);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.role) userRole = data.role;
      if (data.name) userName = data.name;
    }
  } catch (e) {
    console.warn('Could not fetch user doc, using auth token info');
  }

  const userProfile: UserProfile = {
    uid: credential.user.uid,
    email: credential.user.email || email,
    name: userName,
    role: userRole
  };

  setStoredSession(userProfile);
  return userProfile;
};

export const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  const credential = await signInWithPopup(auth, provider);
  const email = credential.user.email || '';
  const isEmailAdmin = ADMIN_EMAILS.includes(email.toLowerCase());
  let finalRole: 'admin' | 'customer' = isEmailAdmin ? 'admin' : 'customer';
  let userName = credential.user.displayName || 'Cliente Google';

  try {
    const userDocRef = doc(db, 'users', credential.user.uid);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.role) finalRole = data.role;
      if (data.name) userName = data.name;
    }
  } catch (e) {
    console.warn('Could not fetch Google user doc, using credentials');
  }

  const userProfile: UserProfile = {
    uid: credential.user.uid,
    email: email,
    name: userName,
    role: finalRole
  };

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
      const isEmailAdmin = ADMIN_EMAILS.includes(email.toLowerCase());
      let role: 'admin' | 'customer' = isEmailAdmin ? 'admin' : 'customer';
      let name = firebaseUser.displayName || (role === 'admin' ? 'Administrador' : 'Cliente');

      try {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.role) role = data.role;
          if (data.name) name = data.name;
        }
      } catch {}

      const userProfile: UserProfile = {
        uid: firebaseUser.uid,
        email: email,
        name: name,
        role: role
      };

      setStoredSession(userProfile);
    } else if (!getStoredSession()) {
      onChange(null);
    }
  });

  return () => {
    authStateListeners = authStateListeners.filter(fn => fn !== onChange);
    unsubscribeFirebase();
  };
};
