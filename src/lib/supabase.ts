import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged as onFirebaseAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { Product, CartItem, Post, StoryContent, UserProfile } from '../types';
export type { StoryContent, UserProfile };
import { PRODUCTS as DEFAULT_PRODUCTS } from '../data/products';
import { SHOPEE_PRODUCT_FIO10 } from '../data/shopeeData';

// Retrieve credentials safely from Vite env or fallback
const metaEnv = (import.meta as any).env || {};
const SUPABASE_URL = (metaEnv.VITE_SUPABASE_URL || metaEnv.SUPABASE_URL || '').trim();
const SUPABASE_ANON_KEY = (metaEnv.VITE_SUPABASE_ANON_KEY || metaEnv.SUPABASE_ANON_KEY || '').trim();

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL && 
  SUPABASE_ANON_KEY && 
  !SUPABASE_URL.includes('MY_SUPABASE') &&
  SUPABASE_URL.startsWith('http')
);

// Supabase client instance
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

// Firebase Auth client instance for native Google Account Selection popup
const fbApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(fbApp);

// ==========================================
// USER AUTHENTICATION & PROFILES
// ==========================================
const ADMIN_EMAILS = [
  'admin@mundodapipa.com.br',
  'jeanpierreowner@gmail.com'
];

const LOCAL_AUTH_STORAGE_KEY = 'mundo_pipa_auth_session';

export const getStoredSession = (): UserProfile | null => {
  try {
    const raw = localStorage.getItem(LOCAL_AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setStoredSession = (user: UserProfile | null) => {
  try {
    if (user) {
      localStorage.setItem(LOCAL_AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(LOCAL_AUTH_STORAGE_KEY);
    }
  } catch {}
  notifyAuthListeners(user);
};

const authListeners: ((user: UserProfile | null) => void)[] = [];
const notifyAuthListeners = (user: UserProfile | null) => {
  authListeners.forEach((fn) => {
    try {
      fn(user);
    } catch (e) {
      console.warn('Auth listener error:', e);
    }
  });
};

export const loginUser = async (email: string, pass: string): Promise<UserProfile> => {
  const trimmedEmail = email.trim().toLowerCase();
  const isAdmin = ADMIN_EMAILS.includes(trimmedEmail);
  const role: 'admin' | 'customer' = isAdmin ? 'admin' : 'customer';

  if (supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password: pass,
    });

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
          email: trimmedEmail,
          password: pass,
          options: {
            data: { name: trimmedEmail.split('@')[0], role }
          }
        });
        if (!signUpErr && signUpData.user) {
          const profile: UserProfile = {
            uid: signUpData.user.id,
            email: trimmedEmail,
            name: (signUpData.user.user_metadata?.name as string) || (isAdmin ? 'Administrador' : trimmedEmail.split('@')[0]),
            role
          };
          setStoredSession(profile);
          syncUserProfileToSupabase(profile);
          return profile;
        }
      }
      throw new Error(error.message || 'Falha ao autenticar usuário no Supabase.');
    }

    if (data.user) {
      const profile: UserProfile = {
        uid: data.user.id,
        email: data.user.email || trimmedEmail,
        name: (data.user.user_metadata?.name as string) || (isAdmin ? 'Administrador' : trimmedEmail.split('@')[0]),
        role
      };
      setStoredSession(profile);
      syncUserProfileToSupabase(profile);
      return profile;
    }
  }

  // Fallback Local Auth
  const localProfile: UserProfile = {
    uid: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    email: trimmedEmail,
    name: isAdmin ? 'Administrador' : trimmedEmail.split('@')[0],
    role
  };
  setStoredSession(localProfile);
  return localProfile;
};

export const registerUser = async (email: string, pass: string, name: string): Promise<UserProfile> => {
  const trimmedEmail = email.trim().toLowerCase();
  const isAdmin = ADMIN_EMAILS.includes(trimmedEmail);
  const role: 'admin' | 'customer' = isAdmin ? 'admin' : 'customer';

  if (supabase) {
    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password: pass,
      options: {
        data: { name, role }
      }
    });

    if (error) {
      throw new Error(error.message || 'Erro ao registrar usuário.');
    }

    const uid = data.user?.id || `usr_${Date.now()}`;
    const profile: UserProfile = {
      uid,
      email: trimmedEmail,
      name: name || (isAdmin ? 'Administrador' : 'Cliente'),
      role
    };
    setStoredSession(profile);
    syncUserProfileToSupabase(profile);
    return profile;
  }

  const localProfile: UserProfile = {
    uid: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    email: trimmedEmail,
    name: name || (isAdmin ? 'Administrador' : 'Cliente'),
    role
  };
  setStoredSession(localProfile);
  return localProfile;
};

/**
 * Real Google Login opening the native Google Account Selector popup screen
 */
export const loginWithGoogle = async (): Promise<UserProfile> => {
  const provider = new GoogleAuthProvider();
  // Force Google to display the Account Chooser / Selector Screen
  provider.setCustomParameters({
    prompt: 'select_account'
  });

  try {
    const result = await signInWithPopup(firebaseAuth, provider);
    const fbUser = result.user;
    const email = (fbUser.email || '').trim().toLowerCase();
    const isAdmin = ADMIN_EMAILS.includes(email);
    const role: 'admin' | 'customer' = isAdmin ? 'admin' : 'customer';
    const displayName = fbUser.displayName || (isAdmin ? 'Jean Pierre (Admin)' : (email.split('@')[0] || 'Cliente'));

    const profile: UserProfile = {
      uid: fbUser.uid,
      email: fbUser.email || email,
      name: displayName,
      role,
      photoURL: fbUser.photoURL || undefined
    };

    setStoredSession(profile);
    syncUserProfileToSupabase(profile);
    return profile;
  } catch (err: any) {
    console.error('Google Sign-In Error:', err);
    if (err.code === 'auth/popup-closed-by-user') {
      throw new Error('A tela de seleção de conta Google foi fechada antes de concluir o login.');
    }
    if (err.code === 'auth/popup-blocked') {
      throw new Error('A janela do Google foi bloqueada pelo navegador. Por favor, permita popups neste site para entrar com o Google.');
    }
    if (err.code === 'auth/cancelled-popup-request') {
      throw new Error('Operação de login com o Google cancelada.');
    }
    throw new Error(err.message || 'Falha ao autenticar com a conta Google.');
  }
};

export const logoutAppUser = async () => {
  try {
    await firebaseSignOut(firebaseAuth);
  } catch (e) {
    console.warn('Firebase signout notice:', e);
  }
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Supabase signout notice:', e);
    }
  }
  setStoredSession(null);
};

export const listenAuthState = (callback: (user: UserProfile | null) => void) => {
  authListeners.push(callback);
  
  // Emit initial state from storage
  const current = getStoredSession();
  callback(current);

  // Listen to Firebase Auth state
  const unsubscribeFb = onFirebaseAuthStateChanged(firebaseAuth, (fbUser: FirebaseUser | null) => {
    if (fbUser) {
      const email = (fbUser.email || '').trim().toLowerCase();
      const isAdmin = ADMIN_EMAILS.includes(email);
      const role: 'admin' | 'customer' = isAdmin ? 'admin' : 'customer';
      const displayName = fbUser.displayName || (isAdmin ? 'Jean Pierre (Admin)' : (email.split('@')[0] || 'Cliente'));

      const profile: UserProfile = {
        uid: fbUser.uid,
        email: fbUser.email || email,
        name: displayName,
        role,
        photoURL: fbUser.photoURL || undefined
      };
      setStoredSession(profile);
      callback(profile);
    }
  });

  if (supabase) {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const email = session.user.email || '';
        const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase());
        const role: 'admin' | 'customer' = isAdmin ? 'admin' : 'customer';
        const profile: UserProfile = {
          uid: session.user.id,
          email,
          name: (session.user.user_metadata?.name as string) || (isAdmin ? 'Administrador' : 'Cliente'),
          role,
        };
        setStoredSession(profile);
        callback(profile);
      }
    });

    return () => {
      const idx = authListeners.indexOf(callback);
      if (idx >= 0) authListeners.splice(idx, 1);
      unsubscribeFb();
      authListener.subscription.unsubscribe();
    };
  }

  return () => {
    const idx = authListeners.indexOf(callback);
    if (idx >= 0) authListeners.splice(idx, 1);
    unsubscribeFb();
  };
};

export const syncUserProfileToSupabase = async (user: UserProfile) => {
  if (!supabase) return;
  try {
    const { error } = await supabase.from('users').upsert({
      id: user.uid,
      email: user.email,
      name: user.name || '',
      role: user.role || 'customer',
      updated_at: new Date().toISOString(),
    });
    if (error) {
      console.warn('Supabase user profile sync notice:', error.message);
    }
  } catch (e: any) {
    console.warn('Supabase user profile error:', e.message);
  }
};

// ==========================================
// LOCAL STORAGE CACHES FOR PRODUCTS
// ==========================================
const LOCAL_PRODUCTS_KEY = 'mundo_pipa_supabase_products';
const LOCAL_POSTS_KEY = 'mundo_pipa_supabase_posts';
const LOCAL_STORY_KEY = 'mundo_pipa_supabase_story';
const LOCAL_CART_KEY = 'mundo_pipa_cart';

const LEGACY_EXAMPLE_IDS = new Set([
  'raia-40x40',
  'linha-10-corrente',
  'pipa-combate-60',
  'carretilha-madeira-25',
  'kit-iniciante',
  'rabiola-fita-100m',
  'varetas-bambu-50',
  'kit-festival-master',
]);

export const getLocalProducts = (): Product[] => {
  try {
    const raw = localStorage.getItem(LOCAL_PRODUCTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Filter out any legacy example products
        const filtered = parsed.filter((p) => p && p.id && !LEGACY_EXAMPLE_IDS.has(p.id));
        if (filtered.length !== parsed.length) {
          localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(filtered));
        }
        return filtered;
      }
    }
  } catch (e) {
    console.warn('Error reading local products:', e);
  }

  return [];
};

export const setLocalProducts = (products: Product[]) => {
  try {
    localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(products));
  } catch {}
  notifyProductListeners(products);
};

const productListeners: ((products: Product[]) => void)[] = [];
const notifyProductListeners = (products: Product[]) => {
  productListeners.forEach((listener) => {
    try {
      listener(products);
    } catch (e) {
      console.warn('Listener notification error:', e);
    }
  });
};

// Helper: Map Database snake_case to Product camelCase
export const mapDbToProduct = (row: any): Product => {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    price: Number(row.price),
    originalPrice: row.original_price != null ? Number(row.original_price) : undefined,
    image: row.image || '',
    images: Array.isArray(row.images) ? row.images : row.images ? JSON.parse(row.images) : undefined,
    videoUrl: row.video_url || undefined,
    videos: Array.isArray(row.videos) ? row.videos : row.videos ? JSON.parse(row.videos) : undefined,
    description: row.description || '',
    specs: Array.isArray(row.specs) ? row.specs : row.specs ? JSON.parse(row.specs) : [],
    inStock: row.in_stock !== false,
    stockQuantity: row.stock_quantity != null ? Number(row.stock_quantity) : undefined,
    shopeeUrl: row.shopee_url || '',
    badge: row.badge || undefined,
    rating: row.rating != null ? Number(row.rating) : 5.0,
    salesCount: row.sales_count != null ? Number(row.sales_count) : undefined,
  };
};

// Helper: Map Product camelCase to Database snake_case
export const mapProductToDb = (p: Partial<Product>) => {
  const row: Record<string, any> = {};
  if (p.id !== undefined) row.id = p.id;
  if (p.name !== undefined) row.name = p.name;
  if (p.category !== undefined) row.category = p.category;
  if (p.price !== undefined) row.price = p.price;
  if (p.originalPrice !== undefined) row.original_price = p.originalPrice;
  if (p.image !== undefined) row.image = p.image;
  if (p.images !== undefined) row.images = p.images;
  if (p.videoUrl !== undefined) row.video_url = p.videoUrl;
  if (p.videos !== undefined) row.videos = p.videos;
  if (p.description !== undefined) row.description = p.description;
  if (p.specs !== undefined) row.specs = p.specs;
  if (p.inStock !== undefined) row.in_stock = p.inStock;
  if (p.stockQuantity !== undefined) row.stock_quantity = p.stockQuantity;
  if (p.shopeeUrl !== undefined) row.shopee_url = p.shopeeUrl;
  if (p.badge !== undefined) row.badge = p.badge;
  if (p.rating !== undefined) row.rating = p.rating;
  if (p.salesCount !== undefined) row.sales_count = p.salesCount;
  row.updated_at = new Date().toISOString();
  return row;
};

// ==========================================
// PRODUCTS CRUD OPERATIONS
// ==========================================
export const addProductToSupabase = async (newProduct: Partial<Product>): Promise<string> => {
  const newId = newProduct.id || `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const productToSave: Product = {
    id: newId,
    name: newProduct.name || 'Novo Produto',
    category: newProduct.category || 'pipas',
    price: newProduct.price != null ? Number(newProduct.price) : 25.0,
    originalPrice: newProduct.originalPrice != null ? Number(newProduct.originalPrice) : undefined,
    image: newProduct.image || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=80&w=800',
    images: newProduct.images || (newProduct.image ? [newProduct.image] : []),
    videoUrl: newProduct.videoUrl || undefined,
    videos: newProduct.videos || (newProduct.videoUrl ? [newProduct.videoUrl] : []),
    description: newProduct.description || 'Produto de alta performance da Mundo da Pipa.',
    specs: newProduct.specs || ['Alta Durabilidade', 'Acabamento Reforçado', 'Testado por Pipoqueiros'],
    inStock: newProduct.inStock !== false,
    stockQuantity: newProduct.stockQuantity != null ? Number(newProduct.stockQuantity) : 50,
    shopeeUrl: newProduct.shopeeUrl || 'https://shopee.com.br/shop/mundodapipa',
    badge: newProduct.badge || undefined,
    rating: newProduct.rating != null ? Number(newProduct.rating) : 5.0,
    salesCount: newProduct.salesCount != null ? Number(newProduct.salesCount) : 0,
  };

  // 1. Update local cache immediately
  const current = getLocalProducts();
  const updated = [productToSave, ...current.filter((p) => p.id !== newId)];
  setLocalProducts(updated);

  // 2. Persist to Supabase
  if (supabase) {
    try {
      const dbRow = mapProductToDb(productToSave);
      dbRow.created_at = new Date().toISOString();
      const { error } = await supabase.from('products').upsert(dbRow);
      if (error) {
        console.warn('Supabase product add notice:', error.message);
      }
    } catch (e: any) {
      console.warn('Supabase add error:', e.message);
    }
  }

  return newId;
};

export const updateProductInSupabase = async (id: string, updates: Partial<Product>) => {
  // 1. Update local cache immediately
  const current = getLocalProducts();
  const index = current.findIndex((p) => p.id === id);
  if (index !== -1) {
    current[index] = { ...current[index], ...updates };
    setLocalProducts([...current]);
  }

  // 2. Persist to Supabase
  if (supabase) {
    try {
      const dbRow = mapProductToDb(updates);
      const { error } = await supabase.from('products').update(dbRow).eq('id', id);
      if (error) {
        console.warn('Supabase product update notice:', error.message);
      }
    } catch (e: any) {
      console.warn('Supabase update error:', e.message);
    }
  }
};

export const deleteProductFromSupabase = async (id: string) => {
  // 1. Remove from local cache immediately
  const current = getLocalProducts();
  const filtered = current.filter((p) => p.id !== id);
  setLocalProducts(filtered);

  // 2. Remove from Supabase
  if (supabase) {
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) {
        console.warn('Supabase product delete notice:', error.message);
      }
    } catch (e: any) {
      console.warn('Supabase delete error:', e.message);
    }
  }
};

export const clearAllProductsFromSupabase = async () => {
  setLocalProducts([]);
  if (supabase) {
    try {
      await supabase.from('products').delete().neq('id', '___non_existent___');
    } catch (e) {
      console.warn('Supabase clear products notice:', e);
    }
  }
};

export const registerShopeeItemDirectly = async () => {
  await addProductToSupabase(SHOPEE_PRODUCT_FIO10);
};

export const subscribeToSupabaseProducts = (onData: (products: Product[]) => void) => {
  productListeners.push(onData);

  // Send current local cached products immediately
  const initial = getLocalProducts();
  onData(initial);

  if (!supabase) {
    return () => {
      const idx = productListeners.indexOf(onData);
      if (idx >= 0) productListeners.splice(idx, 1);
    };
  }

  // Fetch initial state from Supabase
  const fetchFromDb = async () => {
    try {
      const { data, error } = await supabase!
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const mapped = data.map(mapDbToProduct);
        setLocalProducts(mapped);
        onData(mapped);
      }
    } catch (e) {
      console.warn('Supabase products fetch notice:', e);
    }
  };

  fetchFromDb();

  // Realtime subscription (Instant sync for all visitors worldwide)
  const channel = supabase
    .channel('public:products')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'products' },
      () => {
        fetchFromDb();
      }
    )
    .subscribe();

  return () => {
    const idx = productListeners.indexOf(onData);
    if (idx >= 0) productListeners.splice(idx, 1);
    try {
      supabase?.removeChannel(channel);
    } catch {}
  };
};

// Aliases for seamless migration
export const subscribeToProducts = subscribeToSupabaseProducts;
export const addProductToFirestore = addProductToSupabase;
export const updateProductInFirestore = updateProductInSupabase;
export const deleteProductFromFirestore = deleteProductFromSupabase;
export const clearAllProductsFromFirestore = clearAllProductsFromSupabase;
export const deleteField = () => null;

// ==========================================
// CART OPERATIONS
// ==========================================
export const saveUserCartToSupabase = async (userId: string, items: CartItem[]) => {
  if (!userId) return;
  try {
    localStorage.setItem(`${LOCAL_CART_KEY}_${userId}`, JSON.stringify(items));
  } catch {}

  if (supabase) {
    try {
      await supabase.from('carts').upsert({
        user_id: userId,
        items: JSON.stringify(items),
        updated_at: new Date().toISOString()
      });
    } catch (e) {
      console.warn('Supabase cart save notice:', e);
    }
  }
};

export const subscribeToUserCart = (userId: string, onData: (items: CartItem[]) => void) => {
  if (!userId) return () => {};

  try {
    const raw = localStorage.getItem(`${LOCAL_CART_KEY}_${userId}`);
    if (raw) {
      onData(JSON.parse(raw));
    }
  } catch {}

  if (!supabase) return () => {};

  const fetchCart = async () => {
    try {
      const { data, error } = await supabase!
        .from('carts')
        .select('items')
        .eq('user_id', userId)
        .single();

      if (!error && data?.items) {
        const parsed = Array.isArray(data.items) ? data.items : JSON.parse(data.items);
        onData(parsed);
      }
    } catch (e) {
      console.warn('Supabase cart fetch notice:', e);
    }
  };

  fetchCart();

  const channel = supabase
    .channel(`public:carts:${userId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'carts', filter: `user_id=eq.${userId}` },
      () => {
        fetchCart();
      }
    )
    .subscribe();

  return () => {
    try {
      supabase?.removeChannel(channel);
    } catch {}
  };
};

export const saveUserCartToFirestore = saveUserCartToSupabase;

// ==========================================
// STORY & ABOUT CONTENT
// ==========================================
export const DEFAULT_STORY_CONTENT: StoryContent = {
  badge: 'Nossa História & Paixão',
  title: 'Dos Festivais de Quebrada ao Maior Empório de Pipas do Brasil',
  paragraph1: 'Fundada por apaixonados pela cultura do combate aéreo esportivo, a Mundo da Pipa nasceu nos campinhos e lajes de São Paulo. Começamos produzindo pipas artesanais de bambu selecionado e linhas com engomagem especial para os amigos do bairro.',
  paragraph2: 'Hoje, somos referência nacional em inovação e qualidade para pipeiros profissionais e amadores. Cada produto do nosso catálogo é testado em vento real antes de ser embalado, garantindo o melhor desempenho nas alturas.',
  stat1Value: '15+',
  stat1Label: 'Anos de Tradição',
  stat2Value: '50k+',
  stat2Label: 'Pipas no Ar',
  value1Title: 'Matéria-Prima Selecionada',
  value1Desc: 'Bambus de corte preciso e folhas de alta gramatura que não rasgam no combate.',
  value2Title: 'Paixão Pipeira',
  value2Desc: 'Cada detalhe pensado por quem realmente vive e respira a arte de empinar pipas.',
  value3Title: 'Envio Rápido & Seguro',
  value3Desc: 'Embalagens reforçadas para seus produtos chegarem 100% intactos à sua porta.',
};

export const getStoryContentFromSupabase = (): StoryContent => {
  try {
    const raw = localStorage.getItem(LOCAL_STORY_KEY);
    if (raw) return { ...DEFAULT_STORY_CONTENT, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_STORY_CONTENT;
};

export const saveStoryContentToSupabase = async (content: StoryContent) => {
  try {
    localStorage.setItem(LOCAL_STORY_KEY, JSON.stringify(content));
  } catch {}

  if (supabase) {
    try {
      const { error } = await supabase.from('site_content').upsert({
        id: 'about_history',
        badge: content.badge,
        title: content.title,
        paragraph1: content.paragraph1,
        paragraph2: content.paragraph2,
        stat1_value: content.stat1Value,
        stat1_label: content.stat1Label,
        stat2_value: content.stat2Value,
        stat2_label: content.stat2Label,
        value1_title: content.value1Title,
        value1_desc: content.value1Desc,
        value2_title: content.value2Title,
        value2_desc: content.value2Desc,
        value3_title: content.value3Title,
        value3_desc: content.value3Desc,
        updated_at: new Date().toISOString(),
      });
      if (error) console.warn('Supabase story save notice:', error.message);
    } catch (e: any) {
      console.warn('Supabase story error:', e.message);
    }
  }
};

export const subscribeToSupabaseStory = (onData: (content: StoryContent) => void) => {
  onData(getStoryContentFromSupabase());

  if (!supabase) return () => {};

  const fetchStory = async () => {
    try {
      const { data, error } = await supabase!
        .from('site_content')
        .select('*')
        .eq('id', 'about_history')
        .single();

      if (!error && data) {
        const parsed: StoryContent = {
          badge: data.badge || DEFAULT_STORY_CONTENT.badge,
          title: data.title || DEFAULT_STORY_CONTENT.title,
          paragraph1: data.paragraph1 || DEFAULT_STORY_CONTENT.paragraph1,
          paragraph2: data.paragraph2 || DEFAULT_STORY_CONTENT.paragraph2,
          stat1Value: data.stat1_value || DEFAULT_STORY_CONTENT.stat1Value,
          stat1Label: data.stat1_label || DEFAULT_STORY_CONTENT.stat1Label,
          stat2Value: data.stat2_value || DEFAULT_STORY_CONTENT.stat2Value,
          stat2Label: data.stat2_label || DEFAULT_STORY_CONTENT.stat2Label,
          value1Title: data.value1_title || DEFAULT_STORY_CONTENT.value1Title,
          value1Desc: data.value1_desc || DEFAULT_STORY_CONTENT.value1Desc,
          value2Title: data.value2_title || DEFAULT_STORY_CONTENT.value2Title,
          value2Desc: data.value2_desc || DEFAULT_STORY_CONTENT.value2Desc,
          value3Title: data.value3_title || DEFAULT_STORY_CONTENT.value3Title,
          value3Desc: data.value3_desc || DEFAULT_STORY_CONTENT.value3Desc,
        };
        try {
          localStorage.setItem(LOCAL_STORY_KEY, JSON.stringify(parsed));
        } catch {}
        onData(parsed);
      }
    } catch (e) {
      console.warn('Supabase story fetch notice:', e);
    }
  };

  fetchStory();

  const channel = supabase
    .channel('public:site_content')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'site_content' },
      () => {
        fetchStory();
      }
    )
    .subscribe();

  return () => {
    try {
      supabase?.removeChannel(channel);
    } catch {}
  };
};

export const saveStoryContent = saveStoryContentToSupabase;
export const subscribeToStoryContent = subscribeToSupabaseStory;

// ==========================================
// POSTS & COMMUNITY FEED
// ==========================================
const postListeners: ((posts: Post[]) => void)[] = [];
export const getLocalPosts = (): Post[] => {
  try {
    const raw = localStorage.getItem(LOCAL_POSTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
};

export const setLocalPosts = (posts: Post[]) => {
  try {
    localStorage.setItem(LOCAL_POSTS_KEY, JSON.stringify(posts));
  } catch {}
  postListeners.forEach((fn) => {
    try {
      fn(posts);
    } catch {}
  });
};

export const addPostToSupabase = async (newPost: Partial<Post>): Promise<string> => {
  const id = newPost.id || `post_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const postData: Post = {
    id,
    title: newPost.title || '',
    content: newPost.content || '',
    author: newPost.author || 'Mundo da Pipa',
    authorId: newPost.authorId || '',
    imageUrl: newPost.imageUrl || '',
    videoUrl: newPost.videoUrl || '',
    createdAt: newPost.createdAt || new Date().toISOString(),
  };

  const current = getLocalPosts();
  const updated = [postData, ...current.filter((p) => p.id !== id)];
  setLocalPosts(updated);

  if (supabase) {
    try {
      const { error } = await supabase.from('posts').upsert({
        id: postData.id,
        title: postData.title,
        content: postData.content,
        author: postData.author,
        author_id: postData.authorId,
        image_url: postData.imageUrl,
        video_url: postData.videoUrl,
        created_at: postData.createdAt,
      });
      if (error) console.warn('Supabase post add notice:', error.message);
    } catch (e: any) {
      console.warn('Supabase post error:', e.message);
    }
  }

  return id;
};

export const deletePostFromSupabase = async (postId: string) => {
  const current = getLocalPosts();
  const updated = current.filter((p) => p.id !== postId);
  setLocalPosts(updated);

  if (supabase) {
    try {
      const { error } = await supabase.from('posts').delete().eq('id', postId);
      if (error) console.warn('Supabase post delete notice:', error.message);
    } catch (e: any) {
      console.warn('Supabase post delete error:', e.message);
    }
  }
};

export const subscribeToSupabasePosts = (onData: (posts: Post[]) => void) => {
  postListeners.push(onData);
  onData(getLocalPosts());

  if (!supabase) {
    return () => {
      const idx = postListeners.indexOf(onData);
      if (idx >= 0) postListeners.splice(idx, 1);
    };
  }

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase!
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const mapped: Post[] = data.map((d: any) => ({
          id: d.id,
          title: d.title || '',
          content: d.content || '',
          author: d.author || 'Mundo da Pipa',
          authorId: d.author_id || '',
          imageUrl: d.image_url || '',
          videoUrl: d.video_url || '',
          createdAt: d.created_at || new Date().toISOString(),
        }));
        setLocalPosts(mapped);
        onData(mapped);
      }
    } catch (e) {
      console.warn('Supabase posts fetch notice:', e);
    }
  };

  fetchPosts();

  const channel = supabase
    .channel('public:posts')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'posts' },
      () => {
        fetchPosts();
      }
    )
    .subscribe();

  return () => {
    const idx = postListeners.indexOf(onData);
    if (idx >= 0) postListeners.splice(idx, 1);
    try {
      supabase?.removeChannel(channel);
    } catch {}
  };
};

export const addPost = addPostToSupabase;
export const deletePost = deletePostFromSupabase;
export const subscribeToPosts = subscribeToSupabasePosts;
