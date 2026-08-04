import React from 'react';
import { ExternalLink, Tag, Truck, ShieldCheck, Heart } from 'lucide-react';
import { SHOPEE_STORE_URL } from '../data/products';

export const ShopeeBanner: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-orange-600 via-amber-500 to-orange-600 text-white rounded-3xl p-6 sm:p-8 my-8 card-shadow relative overflow-hidden border border-orange-400/40">
      {/* Background Decorative Diamond Elements */}
      <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-3xl transform rotate-45 pointer-events-none"></div>

      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
        <div className="flex-1 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-3">
            <Tag className="w-3.5 h-3.5" />
            <span>Loja Oficial Shopee • Mundo da Pipa</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black leading-tight tracking-tight uppercase">
            Economize no Frete com Cupons Shopee!
          </h2>
          <p className="text-orange-50 text-sm sm:text-base mt-2 max-w-xl font-medium">
            Aproveite cupons de <strong className="text-white font-black underline">Frete Grátis</strong>, parcelamento sem juros no cartão e a proteção total da Compra Garantida Shopee.
          </p>

          <div className="mt-4 flex flex-wrap justify-center lg:justify-start gap-3 text-xs font-black text-slate-900">
            <span className="bg-white px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
              <Truck className="w-4 h-4 text-orange-600" />
              Frete Grátis Shopee
            </span>
            <span className="bg-white px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
              <ShieldCheck className="w-4 h-4 text-orange-600" />
              Compra 100% Protegida
            </span>
            <span className="bg-white px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
              <Heart className="w-4 h-4 text-orange-600" />
              +5.000 Vendas
            </span>
          </div>
        </div>

        <a
          href={SHOPEE_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-slate-900 hover:bg-slate-800 text-white font-black text-sm sm:text-base px-8 py-4 rounded-xl shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 shrink-0 uppercase tracking-wider border border-slate-700"
        >
          <span>ACESSAR LOJA SHOPEE</span>
          <ExternalLink className="w-5 h-5 text-amber-400" />
        </a>
      </div>
    </div>
  );
};
