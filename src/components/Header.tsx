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
    <header className="sticky top-0 z-40 bg-white text-slate-900 shadow-sm border-b border-slate-200">
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 bg-white">
        <div className="flex items-center justify-between gap-3 sm:gap-4">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onSelectCategory('todos')}>
            <div className="relative shrink-0 group-hover:scale-105 transition-transform duration-300">
              <img
                src={logoImg}
                alt="Logo Mundo da Pipa"
                className="w-12 h-12 sm:w-14 sm:h-14 object-contain drop-shadow-sm"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-none text-slate-900 font-sans">
                  MUNDO DA PIPA
                </h1>
                <span className="hidden md:inline-block bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                  DESDE 1999
                </span>
              </div>
              <p className="text-[11px] uppercase tracking-wider font-bold text-orange-600 mt-0.5 hidden sm:block">
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
              className="w-full bg-slate-100 text-slate-900 placeholder-slate-400 pl-10 pr-10 py-2 rounded-full text-sm border border-slate-200 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20 transition-all"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            {searchQuery && (
              <button 
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Action Buttons: Account, Admin Add, Shopee Store & Cart */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* User Account / Login Button */}
            {user ? (
              <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 rounded-full p-1 pl-3 text-xs font-bold text-slate-700">
                <div className="flex flex-col text-left pr-1">
                  <span className="line-clamp-1 max-w-[90px] text-[11px] font-black text-slate-900 leading-none">
                    {user.name}
                  </span>
                  <span className={`text-[9px] uppercase font-black tracking-wider leading-none mt-0.5 ${user.role === 'admin' ? 'text-amber-600' : 'text-emerald-600'}`}>
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
                  className="text-slate-400 hover:text-red-500 p-1.5 rounded-full hover:bg-slate-200 transition-colors"
                  title="Sair da Conta"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 font-black text-xs px-3 sm:px-4 py-2.5 rounded-full flex items-center gap-1.5 shadow-sm uppercase tracking-wide transition-all hover:border-orange-500"
              >
                <User className="w-3.5 h-3.5 text-orange-500" />
                <span className="hidden sm:inline">Entrar / Login</span>
                <span className="sm:hidden">Entrar</span>
              </button>
            )}

            {/* Shopee Link */}
            <a
              href={SHOPEE_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs px-3.5 py-2.5 rounded-full shadow-md flex items-center gap-1.5 uppercase tracking-wide hidden sm:flex transition-all"
              title="Acessar Loja Oficial na Shopee"
            >
              <span>Shopee</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            {/* Cart Button */}
            <button
              onClick={onOpenCart}
              className="relative bg-slate-100 hover:bg-slate-200 text-slate-800 p-2.5 sm:px-3.5 rounded-full border border-slate-200 flex items-center gap-2 transition-all font-bold text-xs uppercase tracking-wide"
              aria-label="Abrir Carrinho"
            >
              <ShoppingBag className="w-4 h-4 text-orange-600" />
              <span className="hidden sm:inline">Carrinho</span>
              <span className="text-orange-600 font-extrabold">({cartCount})</span>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-orange-500 to-amber-400 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-pulse">
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
            className="w-full bg-slate-100 text-slate-900 placeholder-slate-400 pl-9 pr-8 py-2 rounded-lg text-xs border border-slate-200 focus:outline-none focus:border-orange-500"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Navigation Categories Strip */}
      <div className="bg-white border-t border-slate-200 overflow-x-auto no-scrollbar py-2 px-4">
        <div className="max-w-7xl mx-auto flex items-center gap-2 min-w-max">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black shadow-md scale-105'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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
