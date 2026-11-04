import React, { useState, useMemo, useEffect } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ShopeeBanner } from './components/ShopeeBanner';
import { ProductCard } from './components/ProductCard';
import { ProductModal } from './components/ProductModal';
import { CartDrawer } from './components/CartDrawer';
import { AboutSection } from './components/AboutSection';
import { CommunityPostsSection } from './components/CommunityPostsSection';
import { ReviewsSection } from './components/ReviewsSection';
import { Footer } from './components/Footer';

import { AuthModal } from './components/AuthModal';
import { AdminProductModal } from './components/AdminProductModal';
import { EditPriceModal } from './components/EditPriceModal';
import { AdminSettingsModal } from './components/AdminSettingsModal';
import { ProductSortToolbar } from './components/ProductSortToolbar';

import { Category, Product, CartItem, SortOption, Coupon } from './types';
import { PRODUCTS as DEFAULT_PRODUCTS } from './data/products';
import { 
  subscribeToProducts, 
  getProductsFromFirestore,
  listenAuthState, 
  logoutAppUser, 
  deleteProductFromFirestore,
  clearAllProductsFromFirestore,
  registerShopeeItemDirectly,
  saveUserCartToFirestore,
  subscribeToUserCart,
  subscribeToCoupons,
  UserProfile,
  CatalogSettings,
  getLocalCatalogSettings,
  subscribeToCatalogSettings
} from './lib/firebase';
import { ShoppingBag } from 'lucide-react';

import { Filter, SlidersHorizontal, Sparkles, Plus, ShieldCheck, DollarSign, Lock, Trash2, PackagePlus, Settings } from 'lucide-react';

export default function App() {
  const [activeCategory, setActiveCategory] = useState<Category>('todos');
  const [searchQuery, setSearchQuery] = useState('');

  // Catalog Settings & Sorting State
  const [catalogSettings, setCatalogSettings] = useState<CatalogSettings>(() => getLocalCatalogSettings());
  const [sortBy, setSortBy] = useState<SortOption>(() => {
    const settings = getLocalCatalogSettings();
    return settings.defaultSortNewest ? 'newest' : (settings.defaultSortOption || 'newest');
  });
  const [isAdminSettingsOpen, setIsAdminSettingsOpen] = useState(false);

  // Firebase Real-time Products list (starts empty for fresh creation)
  const [products, setProducts] = useState<Product[]>([]);
  
  // Firebase Auth User State
  const [user, setUser] = useState<UserProfile | null>(null);

  // Coupons State (for promotion badges on products)
  const [coupons, setCoupons] = useState<Coupon[]>([]);

  // Deletion confirmation modal state (eliminates window.confirm)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);

  // Modals state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [productToEditPrice, setProductToEditPrice] = useState<Product | null>(null);
  
  // Cart state with localStorage persistence
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('mundo_pipa_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cartPrefillCoupon, setCartPrefillCoupon] = useState<string | null>(null);

  const handleOpenCartWithCoupon = (couponCode?: string) => {
    if (couponCode) {
      setCartPrefillCoupon(couponCode);
    }
    setIsCartOpen(true);
  };

  // Clear all products action with Admin email verification
  const handleClearAllProducts = async () => {
    if (!user || user.role !== 'admin') {
      alert('Acesso restrito ao administrador do sistema.');
      return;
    }

    const adminEmail = user.email || 'jeanpierreowner@gmail.com';
    const inputEmail = window.prompt(
      `ATENÇÃO: Ação irreversível!\n\nPara confirmar a exclusão de TODOS os produtos do catálogo, digite o e-mail do administrador (${adminEmail}):`
    );

    if (inputEmail === null) {
      return; // Canceled by user
    }

    if (inputEmail.trim().toLowerCase() !== adminEmail.trim().toLowerCase()) {
      alert('E-mail incorreto. A exclusão de todo o catálogo foi CANCELADA por segurança.');
      return;
    }

    if (window.confirm('Confirmação final: Tem certeza que deseja apagar permanentemente todos os produtos do catálogo?')) {
      try {
        await clearAllProductsFromFirestore();
        setProducts([]);
        alert('Catálogo limpo com sucesso! Você pode cadastrar novos itens.');
      } catch (err: any) {
        alert('Erro ao limpar produtos: ' + err.message);
      }
    }
  };

  // Subscribe to Firebase Firestore Products in Real-time
  useEffect(() => {
    const unsubscribe = subscribeToProducts((realtimeProducts) => {
      setProducts(realtimeProducts);
    });

    // Re-check Firestore whenever user returns to or focuses the tab/app
    const handleSyncOnFocus = () => {
      if (document.visibilityState === 'visible') {
        getProductsFromFirestore().then((items) => {
          if (items && items.length > 0) {
            setProducts(items);
          }
        }).catch(() => {});
      }
    };

    window.addEventListener('focus', handleSyncOnFocus);
    document.addEventListener('visibilitychange', handleSyncOnFocus);

    return () => {
      unsubscribe();
      window.removeEventListener('focus', handleSyncOnFocus);
      document.removeEventListener('visibilitychange', handleSyncOnFocus);
    };
  }, []);

  const handleRegisterShopeeItem = async () => {
    try {
      await registerShopeeItemDirectly();
    } catch (err: any) {
      alert('Erro ao registrar item Shopee: ' + err.message);
    }
  };


  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = listenAuthState((userProfile) => {
      setUser(userProfile);
    });
    return () => unsubscribe();
  }, []);

  // Listen to Catalog Settings (Default sorting configured by Admin)
  useEffect(() => {
    const unsubscribe = subscribeToCatalogSettings((settings) => {
      setCatalogSettings(settings);
    });
    return () => unsubscribe();
  }, []);

  // Real-time Coupons subscription (for promo discount tags on products)
  useEffect(() => {
    const unsubscribe = subscribeToCoupons((realtimeCoupons) => {
      setCoupons(realtimeCoupons);
    });
    return () => unsubscribe();
  }, []);

  // Real-time Firestore Cart Sync per User (or LocalStorage fallback for guests)
  const lastSyncedCartJson = React.useRef<string>('');
  const isUpdatingFromRemote = React.useRef<boolean>(false);

  useEffect(() => {
    if (!user?.uid) {
      // Guest mode: load guest cart from localStorage
      try {
        const savedGuest = localStorage.getItem('mundo_pipa_cart_guest') || localStorage.getItem('mundo_pipa_cart');
        if (savedGuest) {
          setCartItems(JSON.parse(savedGuest));
        }
      } catch (e) {}
      return;
    }

    // Logged-in mode: subscribe to user's cart in Firestore
    const unsubscribe = subscribeToUserCart(user.uid, (firestoreItems) => {
      if (firestoreItems && Array.isArray(firestoreItems)) {
        const json = JSON.stringify(firestoreItems);
        lastSyncedCartJson.current = json;
        isUpdatingFromRemote.current = true;
        setCartItems(firestoreItems);
      }
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Save cart changes to Firestore (if logged in and changed by user) and localStorage
  useEffect(() => {
    const currentJson = JSON.stringify(cartItems);

    if (user?.uid) {
      try {
        localStorage.setItem(`mundo_pipa_cart_${user.uid}`, currentJson);
      } catch (e) {}

      if (isUpdatingFromRemote.current) {
        isUpdatingFromRemote.current = false;
        return;
      }

      if (lastSyncedCartJson.current !== currentJson) {
        lastSyncedCartJson.current = currentJson;
        saveUserCartToFirestore(user.uid, cartItems);
      }
    } else {
      try {
        localStorage.setItem('mundo_pipa_cart_guest', currentJson);
        localStorage.setItem('mundo_pipa_cart', currentJson);
      } catch (e) {}
    }
  }, [cartItems, user?.uid]);

  // Cart total count
  const cartCount = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.quantity, 0);
  }, [cartItems]);

  // Add to cart handler
  const handleAddToCart = (product: Product, quantity: number = 1) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  // Update cart item quantity
  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  // Remove item from cart
  const handleRemoveFromCart = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Clear cart
  const handleClearCart = () => {
    setCartItems([]);
  };

  // Admin Actions
  const handleOpenAddProduct = () => {
    setProductToEdit(null);
    setIsAdminModalOpen(true);
  };

  const handleOpenEditProduct = (product: Product) => {
    setProductToEdit(product);
    setIsAdminModalOpen(true);
  };

  const handleOpenEditPrice = (product: Product) => {
    setProductToEditPrice(product);
    setIsPriceModalOpen(true);
  };

  const handleDeleteProduct = (product: Product) => {
    setProductToDelete(product);
  };

  const handleConfirmDeleteProduct = async () => {
    if (!productToDelete) return;
    setIsDeletingProduct(true);
    try {
      await deleteProductFromFirestore(productToDelete.id);
      setProductToDelete(null);
    } catch (err: any) {
      console.error('Erro ao deletar produto:', err);
    } finally {
      setIsDeletingProduct(false);
    }
  };

  // Filter & Sort logic
  const filteredProducts = useMemo(() => {
    let list = products.filter((p) => {
      // Category filter
      if (activeCategory !== 'todos' && p.category !== activeCategory) {
        return false;
      }
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesDesc = p.description.toLowerCase().includes(q);
        const matchesCategory = p.category.toLowerCase().includes(q);
        return matchesName || matchesDesc || matchesCategory;
      }
      return true;
    });

    // Sorting logic
    if (sortBy === 'newest') {
      list.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (timeA !== timeB) return timeB - timeA;
        return (b.id || '').localeCompare(a.id || '');
      });
    } else if (sortBy === 'price-asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'sales') {
      list.sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0));
    } else if (sortBy === 'rating') {
      list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return list;
  }, [products, activeCategory, searchQuery, sortBy]);

  const scrollToProducts = () => {
    const el = document.getElementById('produtos');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col selection:bg-orange-500 selection:text-white">
      
      {/* Top Header */}
      <Header
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        cartCount={cartCount}
        onOpenCart={() => setIsCartOpen(true)}
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={logoutAppUser}
        onOpenAddProduct={handleOpenAddProduct}
        onOpenAdminSettings={() => setIsAdminSettingsOpen(true)}
      />


      {/* Hero Banner Section */}
      <Hero 
        onExploreClick={scrollToProducts} 
        onOpenCart={handleOpenCartWithCoupon} 
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        
        {/* Official Shopee Promotional Banner */}
        <ShopeeBanner />

        {/* Product Catalog Section */}
        <section id="produtos" className="scroll-mt-24">
          
          {/* Section Header & Filters Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase">
                  Nosso Catálogo de Pipas & Acessórios
                </h2>
                <span className="bg-orange-100 text-orange-800 text-xs font-black px-2.5 py-0.5 rounded-full">
                  {filteredProducts.length} itens
                </span>
              </div>
              <p className="text-slate-500 text-xs sm:text-sm mt-1 font-medium">
                Dedicação à arte desde 1999 • Armações artesanais, linhas de alta resistência e rabiolas
              </p>
            </div>

            {/* Sorting controls & Admin controls */}
            <div className="flex flex-wrap items-center gap-2.5">
              {user?.role === 'admin' && (
                <>
                  <button
                    onClick={handleOpenAddProduct}
                    className="bg-orange-600 hover:bg-orange-700 text-white font-black text-xs px-3.5 py-2 rounded-xl shadow-md flex items-center gap-1.5 uppercase tracking-wide transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Cadastrar Item</span>
                  </button>

                  <button
                    onClick={() => setIsAdminSettingsOpen(true)}
                    className="bg-white hover:bg-slate-50 text-slate-700 hover:text-orange-600 font-bold text-xs px-3 py-2 rounded-xl border border-slate-200 shadow-xs flex items-center gap-1.5 transition-all"
                    title="Configurações de Ordenação (Admin)"
                  >
                    <Settings className="w-3.5 h-3.5 text-orange-500" />
                    <span className="hidden sm:inline">Padrão: {catalogSettings.defaultSortNewest ? 'Mais Novos' : 'Personalizado'}</span>
                    <span className="sm:hidden">Padrão</span>
                  </button>
                </>
              )}

              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-xs text-xs font-bold text-slate-700">
                <SlidersHorizontal className="w-3.5 h-3.5 text-orange-500" />
                <span className="hidden sm:inline">Ordenar:</span>
                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value as SortOption)}
                  className="bg-transparent text-slate-900 font-black focus:outline-none cursor-pointer"
                >
                  <option value="newest">⚡ Mais Novos Primeiro</option>
                  <option value="sales">🔥 Mais Vendidos</option>
                  <option value="price-asc">🏷️ Menor Preço</option>
                  <option value="price-desc">💎 Maior Preço</option>
                  <option value="rating">⭐ Melhores Avaliações</option>
                  <option value="relevance">📌 Destaques</option>
                </select>
              </div>
            </div>
          </div>

          {/* Aba de Ordenar por (Tabs Bar) */}
          <div className="mb-8">
            <ProductSortToolbar
              sortBy={sortBy}
              onSortChange={setSortBy}
              isAdmin={user?.role === 'admin'}
              onOpenAdminSettings={() => setIsAdminSettingsOpen(true)}
              defaultSortNewest={catalogSettings.defaultSortNewest}
            />
          </div>

          {/* Product Cards Grid */}
          {products.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 sm:p-14 text-center border border-slate-200 shadow-sm my-8 max-w-2xl mx-auto">
              <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 font-black">
                <PackagePlus className="w-8 h-8" />
              </div>
              <h3 className="font-black text-xl text-slate-900 tracking-tight">
                Catálogo Vazio (Pronto para Inserir do Zero)
              </h3>
              <p className="text-slate-500 text-xs sm:text-sm mt-2 max-w-md mx-auto leading-relaxed">
                Todos os produtos anteriores foram removidos. Agora você pode cadastrar e organizar seus produtos do zero.
              </p>
              {user?.role === 'admin' ? (
                <button
                  onClick={handleOpenAddProduct}
                  className="mt-6 bg-orange-600 hover:bg-orange-700 text-white font-black text-xs px-6 py-3.5 rounded-2xl shadow-lg flex items-center gap-2 mx-auto uppercase tracking-wide transition-all transform hover:-translate-y-0.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Cadastrar Primeiro Produto</span>
                </button>
              ) : (
                <div className="mt-6 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-bold inline-block">
                  Faça login como Administrador para cadastrar produtos.
                </div>
              )}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm my-8">
              <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-500 mb-3">
                <Filter className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-lg text-slate-900">
                Nenhum produto encontrado para "{searchQuery}"
              </h3>
              <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto">
                Tente buscar por termos mais genéricos como "raia", "linha" ou "vareta".
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('todos');
                }}
                className="mt-4 bg-slate-900 text-amber-400 font-bold text-xs px-5 py-2.5 rounded-xl shadow"
              >
                Limpar Filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  coupons={coupons}
                  onAddToCart={handleAddToCart}
                  onQuickView={setSelectedProduct}
                  isAdmin={user?.role === 'admin'}
                  onEditProduct={handleOpenEditProduct}
                  onEditPrice={handleOpenEditPrice}
                  onDeleteProduct={handleDeleteProduct}
                />
              ))}
            </div>
          )}

        </section>

        {/* Brand History Section */}
        <div id="historia">
          <AboutSection isAdmin={user?.role === 'admin'} />
        </div>

        {/* Community & Public Posts Section (Direct Firebase Firestore) */}
        <CommunityPostsSection user={user} />

        {/* Customer Reviews Section */}
        <ReviewsSection />

      </main>

      {/* Footer */}
      <Footer />

      {/* Auth Modal (Login / Signup for Customers & Admin) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={(loggedUser) => setUser(loggedUser)}
      />

      {/* Admin Product Create / Edit Modal */}
      <AdminProductModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        productToEdit={productToEdit}
      />

      {/* Admin Quick Price Edit Modal */}
      <EditPriceModal
        isOpen={isPriceModalOpen}
        onClose={() => setIsPriceModalOpen(false)}
        product={productToEditPrice}
      />

      {/* Admin Catalog Settings & Promo Codes Modal */}
      <AdminSettingsModal
        isOpen={isAdminSettingsOpen}
        onClose={() => setIsAdminSettingsOpen(false)}
        currentSettings={catalogSettings}
        products={products}
        onSettingsSaved={(newSettings) => {
          setCatalogSettings(newSettings);
          if (newSettings.defaultSortNewest) {
            setSortBy('newest');
          } else {
            setSortBy(newSettings.defaultSortOption || 'relevance');
          }
        }}
        userEmail={user?.email}
      />

      {/* Quick View Product Modal */}
      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
      />

      {/* Slide-Over Shopping Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={handleClearCart}
        user={user}
        initialCouponCode={cartPrefillCoupon}
      />

      {/* Custom Confirmation Modal for Deleting Product */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-red-200 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 leading-tight">Excluir Produto?</h3>
                <p className="text-xs text-slate-500">Esta ação não poderá ser desfeita.</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-center gap-3">
              <img
                src={productToDelete.image}
                alt={productToDelete.name}
                className="w-14 h-14 object-cover rounded-xl border border-slate-200 bg-white shrink-0"
              />
              <div className="min-w-0">
                <p className="font-bold text-sm text-slate-900 truncate">{productToDelete.name}</p>
                <p className="text-xs text-emerald-600 font-black">
                  R$ {productToDelete.price.toFixed(2).replace('.', ',')}
                </p>
                <p className="text-[11px] text-slate-400 capitalize">Categoria: {productToDelete.category}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                disabled={isDeletingProduct}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteProduct}
                disabled={isDeletingProduct}
                className="px-4 py-2 text-xs font-black text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-lg transition-colors flex items-center gap-1.5"
              >
                {isDeletingProduct ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Excluindo...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Sim, Excluir Produto</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

