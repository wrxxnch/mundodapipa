import React from 'react';
import { ExternalLink, Tag, Truck, ShieldCheck, Heart, Sparkles, Rocket } from 'lucide-react';
import { SHOPEE_STORE_URL } from '../data/products';
import alienMascotImg from '../assets/images/alien_mascot_badge_1786676801815.jpg';

export const ShopeeBanner: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-slate-950 via-purple-950 to-slate-950 text-white rounded-3xl p-6 sm:p-8 my-8 card-shadow relative overflow-hidden border-2 border-orange-500/60 neon-glow-orange">
      {/* Background Cosmic Accents */}
      <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-gradient-to-br from-orange-500/20 to-pink-500/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -left-10 -top-10 w-60 h-60 bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="hidden sm:block w-20 h-20 rounded-2xl overflow-hidden border-2 border-orange-400 shadow-lg shrink-0 bg-slate-900 neon-glow-orange">
            <img src={alienMascotImg} alt="Alien Shopee" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>

          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-600 to-amber-500 text-white px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-2 shadow-md">
              <Tag className="w-3.5 h-3.5" />
              <span>🛸 Loja Oficial Shopee • mundo_da_pipa</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black leading-tight tracking-tight uppercase text-white">
              ECONOMIZE NO FRETE COM CUPONS SHOPEE!
            </h2>
            <p className="text-cyan-200 text-xs sm:text-sm mt-1.5 max-w-xl font-medium">
              Aproveite cupons de <strong className="text-amber-300 font-black underline">Frete Grátis</strong>, parcelamento sem juros e a proteção total da Compra Garantida Shopee.
            </p>

            <div className="mt-4 flex flex-wrap justify-center lg:justify-start gap-2.5 text-xs font-black text-slate-950">
              <span className="bg-gradient-to-r from-emerald-400 to-teal-300 px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-md">
                <Truck className="w-4 h-4 text-slate-950" />
                Frete Grátis Shopee
              </span>
              <span className="bg-gradient-to-r from-amber-300 to-yellow-400 px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-md">
                <ShieldCheck className="w-4 h-4 text-slate-950" />
                Compra 100% Protegida
              </span>
              <span className="bg-gradient-to-r from-cyan-300 to-sky-400 px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-md">
                <Heart className="w-4 h-4 text-red-600 fill-red-600" />
                +5.000 Vendas
              </span>
            </div>
          </div>
        </div>

        <a
          href={SHOPEE_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-gradient-to-r from-orange-600 via-red-500 to-orange-500 hover:from-orange-500 hover:to-red-400 text-white font-black text-sm sm:text-base px-8 py-4 rounded-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 shrink-0 uppercase tracking-wider border-2 border-white/80 neon-glow-orange"
        >
          <Rocket className="w-5 h-5 text-amber-300 animate-pulse" />
          <span>ACESSAR LOJA SHOPEE</span>
          <ExternalLink className="w-5 h-5 text-white" />
        </a>
      </div>
    </div>
  );
};

