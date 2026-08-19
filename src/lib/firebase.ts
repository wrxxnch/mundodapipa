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
import { PRODUCTS as DEFAULT_PRODUCTS } from '../data/products';
import { SHOPEE_PRODUCT_FIO10 } from '../data/shopeeData';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);
export const auth = getAuth(app);
export { deleteField };

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

// Local product storage helper
const getLocalProducts = (): Product[] => {
  try {
    const raw = localStorage.getItem(LOCAL_PRODUCTS_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}
  return [SHOPEE_PRODUCT_FIO10, ...DEFAULT_PRODUCTS];
};

const setLocalProducts = (products: Product[]) => {
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

// Utility to recursively strip all undefined fields for Firestore safety
export const cleanFirestoreData = (obj: any): any => {
  if (obj === null || obj === undefined) return undefined;
  
  if (Array.isArray(obj)) {
    return obj
      .map(item => cleanFirestoreData(item))
      .filter(item => item !== undefined);
  }
  
  if (typeof obj === 'object') {
    // Keep Firestore FieldValues like deleteField() or serverTimestamp() intact
    if (obj._methodName || (obj.constructor && obj.constructor.name === 'FieldValue')) {
      return obj;
    }
    
    const cleaned: Record<string, any> = {};
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (val !== undefined) {
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

// Seed guard to prevent repeated requests
let hasAttemptedSeed = false;

export const initializeProductsSeed = async () => {
  if (hasAttemptedSeed) return;
  hasAttemptedSeed = true;

  try {
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
    // Gracefully ignore quota limit on free tier
    if (error?.code !== 'resource-exhausted') {
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
  try {
    const productsRef = collection(db, 'products');
    const docRef = doc(productsRef, SHOPEE_PRODUCT_FIO10.id);
    const sanitized = cleanFirestoreData({
      ...SHOPEE_PRODUCT_FIO10,
      updatedAt: new Date().toISOString()
    });
    await setDoc(docRef, sanitized, { merge: true });
  } catch (err: any) {
    if (err?.code !== 'resource-exhausted') {
      console.warn('Firestore sync note:', err?.message || err);
    }
  }
};

// Listen to products in real-time with resilient offline/quota fallback
export const subscribeToProducts = (onData: (products: Product[]) => void) => {
  productListeners.push(onData);

  // Immediately provide cached products
  const cached = getLocalProducts();
  onData(cached);

  // Background check for seed
  initializeProductsSeed().catch(() => {});

  let unsubscribeFirestore = () => {};

  try {
    const productsRef = collection(db, 'products');
    unsubscribeFirestore = onSnapshot(
      productsRef,
      (snapshot) => {
        if (snapshot.empty) {
          onData(cached);
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

        // Update local cache and notify
        try {
          localStorage.setItem(LOCAL_PRODUCTS_CACHE_KEY, JSON.stringify(productsList));
        } catch {}
        onData(productsList);
      },
      (error) => {
        // When quota is exhausted or offline, continue seamlessly with local cache
        const fallback = getLocalProducts();
        onData(fallback);
      }
    );
  } catch {
    onData(cached);
  }

  return () => {
    const idx = productListeners.indexOf(onData);
    if (idx >= 0) productListeners.splice(idx, 1);
    try {
      unsubscribeFirestore();
    } catch {}
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

// Admin operations (Hybrid Local-First + Firestore Sync)
export const addProductToFirestore = async (newProduct: Partial<Product> | Record<string, any>) => {
  const newId = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
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
    inStock: newProduct.inStock !== false,
    shopeeUrl: newProduct.shopeeUrl || 'https://shopee.com.br/mundo_da_pipa',
    badge: newProduct.badge || undefined,
    rating: Number(newProduct.rating) || 5.0,
    salesCount: newProduct.salesCount ? Number(newProduct.salesCount) : undefined,
    reviews: Array.isArray(newProduct.reviews) ? newProduct.reviews : []
  };

  // 1. Immediately update local cache & notify UI
  const currentList = getLocalProducts();
  const updatedList = [productToSave, ...currentList];
  setLocalProducts(updatedList);

  // 2. Try Firestore write
  try {
    const productsRef = collection(db, 'products');
    const docRef = doc(productsRef, newId);
    const sanitized = cleanFirestoreData({
      ...newProduct,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    await setDoc(docRef, sanitized);
  } catch (err: any) {
    if (err?.code !== 'resource-exhausted') {
      console.warn('Firestore add product notice:', err?.message || err);
    }
  }

  return newId;
};

export const updateProductInFirestore = async (id: string, updates: Record<string, any>) => {
  // 1. Immediately update local cache & notify UI
  const currentList = getLocalProducts();
  const index = currentList.findIndex(p => p.id === id);
  if (index >= 0) {
    const updated = { ...currentList[index], ...updates };
    // Handle deleteField cleanup locally
    Object.keys(updates).forEach(k => {
      if (updates[k] && updates[k]._methodName === 'deleteField') {
        delete (updated as any)[k];
      }
    });
    currentList[index] = updated;
    setLocalProducts([...currentList]);
  }

  // 2. Try Firestore update
  try {
    const docRef = doc(db, 'products', id);
    const sanitized = cleanFirestoreData({
      ...updates,
      updatedAt: new Date().toISOString()
    });
    await setDoc(docRef, sanitized, { merge: true });
  } catch (err: any) {
    if (err?.code !== 'resource-exhausted') {
      console.warn('Firestore update product notice:', err?.message || err);
    }
  }
};

export const deleteProductFromFirestore = async (id: string) => {
  // 1. Immediately remove from local cache & notify UI
  const currentList = getLocalProducts();
  const filtered = currentList.filter(p => p.id !== id);
  setLocalProducts(filtered);

  // 2. Try Firestore delete
  try {
    const docRef = doc(db, 'products', id);
    await deleteDoc(docRef);
  } catch (err: any) {
    if (err?.code !== 'resource-exhausted') {
      console.warn('Firestore delete product notice:', err?.message || err);
    }
  }
};

// User Shopping Cart Sync
export const saveUserCartToFirestore = async (userId: string, items: CartItem[]) => {
  if (!userId) return;
  try {
    const cartDocRef = doc(db, 'carts', userId);
    await setDoc(cartDocRef, {
      items: items || [],
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err: any) {
    // Gracefully ignore quota on cart sync
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

// Auth helpers
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
  } catch {}

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
  } catch {}

  const userProfile: UserProfile = {
    uid: credential.user.uid,
    email: credential.user.email || email,
    name: userName,
    role: userRole
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
  } catch {}

  const userProfile: UserProfile = {
    uid: credential.user.uid,
    email: email,
    name: userName,
    role: finalRole
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
      let isEmailAdmin = ADMIN_EMAILS.includes(email.toLowerCase());
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
    try {
      unsubscribeFirebase();
    } catch {}
  };
};
