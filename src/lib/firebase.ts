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
import { Product, CartItem, Post } from '../types';
import { PRODUCTS as DEFAULT_PRODUCTS } from '../data/products';
import { SHOPEE_PRODUCT_FIO10 } from '../data/shopeeData';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);
export const auth = getAuth(app);
export { deleteField };

// Quota and connection state management
export let isFirestoreQuotaExhausted = false;

export const checkIsQuotaError = (err: any): boolean => {
  if (!err) return false;
  const code = err?.code || '';
  const msg = err?.message || String(err);
  return (
    code === 'resource-exhausted' ||
    msg.includes('resource-exhausted') ||
    msg.includes('Quota limit exceeded') ||
    msg.includes('Free daily write units')
  );
};

export const markQuotaExhausted = (err?: any) => {
  if (err && checkIsQuotaError(err)) {
    isFirestoreQuotaExhausted = true;
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

const ADMIN_EMAILS = [
  'admin@mundodapipa.com.br',
  'jeanpierreowner@gmail.com'
];

const LOCAL_PRODUCTS_CACHE_KEY = 'mundo_pipa_products_cache';

const handleQuotaExhausted = (err: any) => {
  markQuotaExhausted(err);
};

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
  if (hasAttemptedSeed || isFirestoreQuotaExhausted) return;
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

// Admin operations (Hybrid Local-First + Immediate Firestore Persistence)
export const addProductToFirestore = async (newProduct: Partial<Product> | Record<string, any>) => {
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
    reviews: Array.isArray(newProduct.reviews) ? newProduct.reviews : []
  };

  // 1. Immediately update local cache & notify UI
  const currentList = getLocalProducts();
  const updatedList = [productToSave, ...currentList.filter(p => p.id !== newId)];
  setLocalProducts(updatedList);

  // 2. Direct Firestore write (public for all users)
  try {
    const productsRef = collection(db, 'products');
    const docRef = doc(productsRef, newId);
    const sanitized = cleanFirestoreData({
      ...productToSave,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    await setDoc(docRef, sanitized, { merge: true });
  } catch (err: any) {
    console.warn('Firestore add product notice:', err?.message || err);
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

  // 2. Direct Firestore write (public for all users)
  try {
    const docRef = doc(db, 'products', id);
    const sanitized = cleanFirestoreData({
      ...updates,
      updatedAt: new Date().toISOString()
    });
    await setDoc(docRef, sanitized, { merge: true });
  } catch (err: any) {
    console.warn('Firestore update product notice:', err?.message || err);
  }
};

export const deleteProductFromFirestore = async (id: string) => {
  // 1. Immediately remove from local cache & notify UI
  const currentList = getLocalProducts();
  const filtered = currentList.filter(p => p.id !== id);
  setLocalProducts(filtered);

  // 2. Direct Firestore delete
  try {
    const docRef = doc(db, 'products', id);
    await deleteDoc(docRef);
  } catch (err: any) {
    console.warn('Firestore delete product notice:', err?.message || err);
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
  // Return local storage data immediately
  const initial = getStoryContent();
  onData(initial);

  try {
    const storyRef = doc(db, 'site_content', 'about_history');
    return onSnapshot(
      storyRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const merged = { ...DEFAULT_STORY_CONTENT, ...data };
          try {
            localStorage.setItem(LOCAL_STORY_KEY, JSON.stringify(merged));
          } catch {}
          onData(merged);
        }
      },
      (err) => {
        console.warn('Firestore story snapshot notice:', err?.message || err);
      }
    );
  } catch {
    return () => {};
  }
};

// =========================================================
// Community & Public Posts System (Pure Firebase Firestore)
// =========================================================

// Clean any legacy local storage posts key
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.removeItem('mundo_pipa_posts_cache');
  }
} catch {}

/**
 * Fetch all posts directly from Firebase Firestore
 */
export const getPostsFromFirestore = async (): Promise<Post[]> => {
  const path = 'posts';
  try {
    const postsRef = collection(db, path);
    const snapshot = await getDocs(postsRef);
    const postsList: Post[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      postsList.push({
        id: docSnap.id,
        title: data.title || '',
        content: data.content || '',
        author: data.author || 'Mundo da Pipa',
        authorId: data.authorId || '',
        imageUrl: data.imageUrl || '',
        videoUrl: data.videoUrl || '',
        createdAt: data.createdAt || new Date().toISOString()
      });
    });
    // Order latest first
    postsList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return postsList;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return [];
  }
};

/**
 * Add a new post directly to Firebase Firestore
 */
export const addPostToFirestore = async (newPost: Partial<Post>): Promise<string> => {
  const id = newPost.id || `post_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const postData: Post = {
    id,
    title: newPost.title?.trim() || '',
    content: newPost.content?.trim() || '',
    author: newPost.author?.trim() || 'Mundo da Pipa',
    authorId: newPost.authorId || auth.currentUser?.uid || '',
    imageUrl: newPost.imageUrl?.trim() || '',
    videoUrl: newPost.videoUrl?.trim() || '',
    createdAt: newPost.createdAt || new Date().toISOString()
  };

  const path = `posts/${id}`;
  try {
    const postRef = doc(db, 'posts', id);
    await setDoc(postRef, cleanFirestoreData(postData), { merge: true });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    return id;
  }
};

/**
 * Update an existing post directly in Firebase Firestore
 */
export const updatePostInFirestore = async (postId: string, updates: Partial<Post>): Promise<void> => {
  const path = `posts/${postId}`;
  try {
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, cleanFirestoreData(updates));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

/**
 * Delete a post directly from Firebase Firestore
 */
export const deletePostFromFirestore = async (postId: string): Promise<void> => {
  const path = `posts/${postId}`;
  try {
    const postRef = doc(db, 'posts', postId);
    await deleteDoc(postRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

/**
 * Subscribe to posts in real-time from Firebase Firestore without any local storage
 */
export const subscribeToPosts = (
  onData: (posts: Post[]) => void,
  onError?: (err: Error) => void
) => {
  const path = 'posts';
  try {
    const postsRef = collection(db, path);
    const unsubscribe = onSnapshot(
      postsRef,
      (snapshot) => {
        const postsList: Post[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          postsList.push({
            id: docSnap.id,
            title: data.title || '',
            content: data.content || '',
            author: data.author || 'Mundo da Pipa',
            authorId: data.authorId || '',
            imageUrl: data.imageUrl || '',
            videoUrl: data.videoUrl || '',
            createdAt: data.createdAt || new Date().toISOString()
          });
        });

        // Sort latest first
        postsList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        onData(postsList);
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.GET, path);
        } catch (wrappedErr: any) {
          if (onError) onError(wrappedErr);
        }
      }
    );

    return unsubscribe;
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.GET, path);
    } catch (wrappedErr: any) {
      if (onError) onError(wrappedErr);
    }
    return () => {};
  }
};

