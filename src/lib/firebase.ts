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
  onSnapshot,
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
import { Product, CartItem } from '../types';
import { PRODUCTS as DEFAULT_PRODUCTS } from '../data/products';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);
export const auth = getAuth(app);

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

import { SHOPEE_PRODUCT_FIO10 } from '../data/shopeeData';

// Seed initial products only if requested or if empty
export const initializeProductsSeed = async () => {
  try {
    const productsRef = collection(db, 'products');
    const snapshot = await getDocs(productsRef);
    if (snapshot.empty) {
      console.log('Seeding official Shopee product Fio 10 3000y to Firestore...');
      const docRef = doc(productsRef, SHOPEE_PRODUCT_FIO10.id);
      await setDoc(docRef, {
        ...SHOPEE_PRODUCT_FIO10,
        createdAt: new Date().toISOString()
      });
    }
  } catch (error) {
    console.log('Firestore seed info:', error);
  }
};

export const registerShopeeItemDirectly = async () => {
  const productsRef = collection(db, 'products');
  const docRef = doc(productsRef, SHOPEE_PRODUCT_FIO10.id);
  await setDoc(docRef, {
    ...SHOPEE_PRODUCT_FIO10,
    updatedAt: new Date().toISOString()
  }, { merge: true });
};

// Listen to products in real-time
export const subscribeToProducts = (onData: (products: Product[]) => void) => {
  const productsRef = collection(db, 'products');

  // Seed default Shopee product if collection is empty
  initializeProductsSeed().catch(() => {});

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
    onData(productsList);
  }, (error) => {
    console.error('Error fetching real-time products:', error);
    onData([SHOPEE_PRODUCT_FIO10]);
  });
};


// Clear all products from Firestore
export const clearAllProductsFromFirestore = async () => {
  const productsRef = collection(db, 'products');
  const snapshot = await getDocs(productsRef);
  const deletePromises = snapshot.docs.map(docSnap => deleteDoc(doc(db, 'products', docSnap.id)));
  await Promise.all(deletePromises);
};

// Admin operations
export const addProductToFirestore = async (newProduct: Omit<Product, 'id'>) => {
  const productsRef = collection(db, 'products');
  const docRef = await addDoc(productsRef, {
    ...newProduct,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  return docRef.id;
};

export const updateProductInFirestore = async (id: string, updates: Partial<Product>) => {
  const docRef = doc(db, 'products', id);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: new Date().toISOString()
  });
};

export const deleteProductFromFirestore = async (id: string) => {
  const docRef = doc(db, 'products', id);
  await deleteDoc(docRef);
};

// User Shopping Cart Firestore Sync
export const saveUserCartToFirestore = async (userId: string, items: CartItem[]) => {
  if (!userId) return;
  try {
    const cartDocRef = doc(db, 'carts', userId);
    await setDoc(cartDocRef, {
      items: items || [],
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.error('Error saving user cart to Firestore:', err);
  }
};

export const subscribeToUserCart = (userId: string, onData: (items: CartItem[]) => void) => {
  if (!userId) return () => {};
  const cartDocRef = doc(db, 'carts', userId);
  return onSnapshot(cartDocRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (Array.isArray(data.items)) {
        onData(data.items);
      }
    }
  }, (err) => {
    console.error('Error subscribing to user cart:', err);
  });
};

const SESSION_KEY = 'mundo_pipa_user_session';
let authStateListeners: ((user: UserProfile | null) => void)[] = [];

const notifyAuthListeners = (user: UserProfile | null) => {
  if (user && user.role === 'admin') {
    initializeProductsSeed();
  }
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
  await updateProfile(credential.user, { displayName: name });

  const userProfile: UserProfile = {
    uid: credential.user.uid,
    email: credential.user.email || email,
    name: name || (finalRole === 'admin' ? 'Administrador' : 'Cliente'),
    role: finalRole
  };

  const userDocRef = doc(db, 'users', credential.user.uid);
  await setDoc(userDocRef, userProfile);
  setStoredSession(userProfile);

  return userProfile;
};

export const loginUser = async (email: string, pass: string) => {
  const credential = await signInWithEmailAndPassword(auth, email, pass);
  const userDocRef = doc(db, 'users', credential.user.uid);

  let userRole: 'admin' | 'customer' = ADMIN_EMAILS.includes((credential.user.email || email).toLowerCase()) ? 'admin' : 'customer';
  let userName = credential.user.displayName || (userRole === 'admin' ? 'Administrador' : 'Cliente');

  try {
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.role) userRole = data.role;
      if (data.name) userName = data.name;
    }
  } catch (e) {
    console.warn('Could not fetch user document:', e);
  }

  const userProfile: UserProfile = {
    uid: credential.user.uid,
    email: credential.user.email || email,
    name: userName,
    role: userRole
  };

  await setDoc(userDocRef, userProfile, { merge: true });
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

  const userDocRef = doc(db, 'users', credential.user.uid);
  try {
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.role) finalRole = data.role;
      if (data.name) userName = data.name;
    }
  } catch (e) {
    console.warn('Could not fetch user document:', e);
  }

  const userProfile: UserProfile = {
    uid: credential.user.uid,
    email: email,
    name: userName,
    role: finalRole
  };

  await setDoc(userDocRef, userProfile, { merge: true });
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
    unsubscribeFirebase();
  };
};
