import React, { useState, useMemo, useEffect } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ShopeeBanner } from './components/ShopeeBanner';
import { ProductCard } from './components/ProductCard';
import { ProductModal } from './components/ProductModal';
import { CartDrawer } from './components/CartDrawer';
import { AboutSection } from './components/AboutSection';
import { ReviewsSection } from './components/ReviewsSection';
import { Footer } from './components/Footer';

import { AuthModal } from './components/AuthModal';
import { AdminProductModal } from './components/AdminProductModal';
import { EditPriceModal } from './components/EditPriceModal';

import { Category, Product, CartItem } from './types';
import { PRODUCTS as DEFAULT_PRODUCTS } from './data/products';
import { 
  subscribeToProducts, 
  listenAuthState, 
  logoutAppUser, 
  deleteProductFromFirestore,
  clearAllProductsFromFirestore,
  registerShopeeItemDirectly,
  UserProfile 
} from './lib/firebase';
import { ShoppingBag } from 'lucide-react';

import { Filter, SlidersHorizontal, Sparkles, Plus, ShieldCheck, DollarSign, Lock, Trash2, PackagePlus } from 'lucide-react';

export default function App() {
  const [activeCategory, setActiveCategory] = useState<Category>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'relevance' | 'price-asc' | 'price-desc' | 'sales'>('relevance');

  // Firebase Real-time Products list (starts empty for fresh creation)
  const [products, setProducts] = useState<Product[]>([]);
  
  // Firebase Auth User State
  const [user, setUser] = useState<UserProfile | null>(null);

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

  // Clear all products action
  const handleClearAllProducts = async () => {
    if (window.confirm('Tem certeza que deseja REMOVER TODOS OS PRODUTOS do banco Firestore? Você poderá cadastrar novos itens do zero.')) {
      try {
        await clearAllProductsFromFirestore();
        setProducts([]);
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
    return () => unsubscribe();
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

  useEffect(() => {
    try {
      localStorage.setItem('mundo_pipa_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.error('Error saving cart state', e);
    }
  }, [cartItems]);

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

  const handleDeleteProduct = async (product: Product) => {
    if (window.confirm(`Tem certeza que deseja DELETAR o item "${product.name}" do banco FirebaseDB?`)) {
      try {
        await deleteProductFromFirestore(product.id);
      } catch (err: any) {
        alert('Erro ao deletar produto: ' + err.message);
      }
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

    // Sorting
    if (sortBy === 'price-asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'sales') {
      list.sort((a, b) => b.salesCount - a.salesCount);
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
      />

      {/* Admin Logged-In Top Banner */}
      {user?.role === 'admin' && (
        <div className="bg-slate-900 text-amber-400 border-b border-amber-400/30 px-4 py-2 text-xs font-black flex flex-wrap items-center justify-between gap-2 shadow-inner">
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-orange-500" />
              <span>Painel Admin Conectado (FirebaseDB) — Você pode cadastrar, editar e remover produtos do zero.</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRegisterShopeeItem}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-2.5 py-1 rounded-lg text-xs flex items-center gap-1 shadow transition-colors"
                title="Cadastrar Fio 10 3mil Jardas 2P Oficial da Shopee"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">+ Item Shopee (Fio 10)</span>
              </button>
              {products.length > 0 && (
                <button
                  onClick={handleClearAllProducts}
                  className="bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800 font-extrabold px-2.5 py-1 rounded-lg text-xs flex items-center gap-1 transition-colors"
                  title="Remover todos os produtos do banco"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Limpar Catálogo</span>
                </button>
              )}
              <button
                onClick={handleOpenAddProduct}
                className="bg-orange-600 hover:bg-orange-700 text-white font-black px-3 py-1 rounded-lg text-xs uppercase tracking-wider flex items-center gap-1 shadow"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Cadastrar Novo Item</span>
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Hero Banner Section */}
      <Hero onExploreClick={scrollToProducts} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        
        {/* Official Shopee Promotional Banner */}
        <ShopeeBanner />

        {/* Product Catalog Section */}
        <section id="produtos" className="scroll-mt-24">
          
          {/* Section Header & Filters Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-4 border-b border-slate-200">
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

            {/* Sorting controls & Admin Add button */}
            <div className="flex items-center gap-3">
              {user?.role === 'admin' && (
                <button
                  onClick={handleOpenAddProduct}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-black text-xs px-4 py-2 rounded-xl shadow-md flex items-center gap-1.5 uppercase tracking-wide"
                >
                  <Plus className="w-4 h-4" />
                  <span>Cadastrar Item</span>
                </button>
              )}

              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3.5 py-2 shadow-sm text-xs font-bold text-slate-700">
                <SlidersHorizontal className="w-3.5 h-3.5 text-orange-500" />
                <span>Ordenar:</span>
                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="bg-transparent text-slate-900 font-black focus:outline-none cursor-pointer"
                >
                  <option value="relevance">Mais Relevantes</option>
                  <option value="sales">Mais Vendidos</option>
                  <option value="price-asc">Menor Preço</option>
                  <option value="price-desc">Maior Preço</option>
                </select>
              </div>
            </div>
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
                Todos os produtos anteriores foram removidos. Agora você pode cadastrar e organizar seus produtos do zero no banco Firebase.
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
          <AboutSection />
        </div>

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
      />

    </div>
  );
}

