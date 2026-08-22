import React from 'react';
import { ShoppingBag, Search, ExternalLink, ShieldCheck, Truck, Sparkles, X, User, Plus, LogOut } from 'lucide-react';
import { Category } from '../types';
import logoImg from '../assets/images/logo.png';
import { SHOPEE_STORE_URL } from '../data/products';
import { UserProfile } from '../lib/firebase';

interface HeaderProps {
  activeCategory: Category;
  onSelectCategory: (cat: Category) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  cartCount: number;
  onOpenCart: () => void;
  user: UserProfile | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenAddProduct?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  cartCount,
  onOpenCart,
  user,
  onOpenAuth,
  onLogout,
  onOpenAddProduct
}) => {
  const categories: { id: Category; label: string; icon: string }[] = [
    { id: 'todos', label: 'Todos os Produtos', icon: '🪁' },
    { id: 'pipas', label: 'Pipas & Raias', icon: '🪁' },
    { id: 'linhas', label: 'Linhas Especializadas', icon: '🧵' },
    { id: 'rabiolas', label: 'Rabiolas & Fitas', icon: '🎗️' },
    { id: 'varetas', label: 'Varetas & Carretilhas', icon: '🪵' },
    { id: 'kits', label: 'Kits Promocionais', icon: '🎁' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950 text-white shadow-xl border-b border-slate-800">
      {/* Top Notification Bar */}
      <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 text-white font-semibold text-xs py-1.5 px-4 text-center flex items-center justify-between overflow-x-auto gap-4">
        <div className="flex items-center gap-2 mx-auto sm:mx-0">
          <Truck className="w-3.5 h-3.5 text-amber-200" />
          <span>Enviamos com máxima agilidade para todo o Brasil via Correios e Shopee Express!</span>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-[11px] uppercase tracking-wider font-extrabold">
          <span className="flex items-center gap-1 text-amber-200"><Sparkles className="w-3 h-3 text-amber-200" /> Tradição Desde 1999</span>
          <span className="flex items-center gap-1 text-emerald-200"><ShieldCheck className="w-3 h-3 text-emerald-200" /> Compra 100% Garantida</span>
        </div>
      </div>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex items-center justify-between gap-3 sm:gap-4">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onSelectCategory('todos')}>
            <div className="relative shrink-0 group-hover:scale-105 transition-transform duration-300">
              <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-full overflow-hidden border-2 border-amber-400/90 shadow-md bg-slate-900 flex items-center justify-center p-1">
                <img
                  src={logoImg}
                  alt="Logo Mundo da Pipa"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-none text-white font-sans">
                  MUNDO DA PIPA
                </h1>
                <span className="hidden md:inline-block bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                  DESDE 1999
                </span>
              </div>
              <p className="text-[11px] uppercase tracking-wider font-bold text-amber-400 mt-0.5 hidden sm:block">
                Dedicação à Arte das Pipas
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="hidden lg:flex flex-1 max-w-md mx-2 relative">
            <input
              type="text"
              placeholder="Buscar raias, linha 10, rabiolas, carretilhas..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-slate-900 text-white placeholder-slate-400 pl-10 pr-10 py-2 rounded-full text-sm border border-slate-700 focus:outline-none focus:border-amber-400 focus:bg-slate-900/90 focus:ring-2 focus:ring-amber-400/20 transition-all"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            {searchQuery && (
              <button 
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Action Buttons: Account, Admin Add, Shopee Store & Cart */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* User Account / Login Button */}
            {user ? (
              <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-full p-1 pl-3 text-xs font-bold text-slate-200">
                <div className="flex flex-col text-left pr-1">
                  <span className="line-clamp-1 max-w-[90px] text-[11px] font-black text-white leading-none">
                    {user.name}
                  </span>
                  <span className={`text-[9px] uppercase font-black tracking-wider leading-none mt-0.5 ${user.role === 'admin' ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {user.role === 'admin' ? '★ Admin' : 'Cliente'}
                  </span>
                </div>

                {user.role === 'admin' && onOpenAddProduct && (
                  <button
                    onClick={onOpenAddProduct}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] px-2.5 py-1.5 rounded-full flex items-center gap-1 shadow-sm uppercase"
                    title="Cadastrar Novo Item"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="hidden xl:inline">Novo Item</span>
                  </button>
                )}

                <button
                  onClick={onLogout}
                  className="text-slate-400 hover:text-red-400 p-1.5 rounded-full hover:bg-slate-800 transition-colors"
                  title="Sair da Conta"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-black text-xs px-3 sm:px-4 py-2.5 rounded-full flex items-center gap-1.5 shadow-sm uppercase tracking-wide transition-all hover:border-amber-400"
              >
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Entrar / Login</span>
                <span className="sm:hidden">Entrar</span>
              </button>
            )}

            {/* Shopee Link */}
            <a
              href={SHOPEE_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs px-3.5 py-2.5 rounded-full shadow-lg flex items-center gap-1.5 uppercase tracking-wide hidden sm:flex transition-all"
              title="Acessar Loja Oficial na Shopee"
            >
              <span>Shopee</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            {/* Cart Button */}
            <button
              onClick={onOpenCart}
              className="relative bg-slate-900 hover:bg-slate-800 text-slate-100 p-2.5 sm:px-3.5 rounded-full border border-slate-700 flex items-center gap-2 transition-all font-bold text-xs uppercase tracking-wide"
              aria-label="Abrir Carrinho"
            >
              <ShoppingBag className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Carrinho</span>
              <span className="text-amber-400 font-extrabold">({cartCount})</span>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-orange-500 to-amber-400 text-slate-950 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-900 animate-pulse">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="mt-3 lg:hidden relative">
          <input
            type="text"
            placeholder="Buscar pipa, linha, carretilha..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-slate-900 text-white placeholder-slate-400 pl-9 pr-8 py-2 rounded-lg text-xs border border-slate-700 focus:outline-none focus:border-amber-400"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Navigation Categories Strip */}
      <div className="bg-slate-900 border-t border-slate-800 overflow-x-auto no-scrollbar py-2 px-4">
        <div className="max-w-7xl mx-auto flex items-center gap-2 min-w-max">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black shadow-lg scale-105'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
