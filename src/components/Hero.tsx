import React from 'react';
import { ShoppingBag, Award, Star, ExternalLink, ShieldCheck, Sparkles, MessageCircle, Instagram } from 'lucide-react';
import logoImg from '../src/assets/images/logo.png';
import { SHOPEE_STORE_URL, WHATSAPP_NUMBER } from '../data/products';

interface HeroProps {
  onExploreClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onExploreClick }) => {
  return (
    <section className="bg-white text-slate-900 py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center text-center shadow-sm relative border-b border-slate-200 overflow-hidden">
      
      {/* Background Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-500/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
        
        {/* Official Logo Showcase */}
        <div className="relative mb-6 group">
          <div className="w-48 h-48 sm:w-60 sm:h-60 md:w-72 md:h-72 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
            <img
              src={logoImg}
              alt="Logo Oficial Mundo da Pipa"
              className="w-full h-full object-contain drop-shadow-[0_15px_25px_rgba(245,158,11,0.2)]"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        {/* Brand Headline */}
        <div className="mt-4">
          <span className="inline-flex items-center gap-1.5 bg-orange-50 border border-orange-200 text-orange-600 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full mb-3 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Dedicação à Arte das Pipas</span>
          </span>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 uppercase tracking-tight leading-tight">
            MUNDO DA PIPA
          </h1>

          <p className="text-slate-600 text-sm sm:text-base md:text-lg max-w-2xl mx-auto mt-3 font-medium leading-relaxed">
            Fabricação própria de <strong className="text-orange-600">pipas, raias de combate, linhas 10 especiais, rabiolas e carretilhas artesanais</strong>. Qualidade e tradição para todo o Brasil.
          </p>
        </div>

        {/* Gold Ribbon Badge: Atacado & Varejo */}
        <div className="inline-flex items-center justify-center bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black text-xs sm:text-sm px-6 py-1.5 rounded-full shadow-md border-2 border-white uppercase tracking-widest my-5">
          <span>★ ATACADO & VAREJO PARA TODO O BRASIL ★</span>
        </div>

        {/* Main CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto mt-2">
          <button
            onClick={onExploreClick}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-black text-base px-8 py-3.5 rounded-2xl shadow-lg uppercase tracking-wider transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
          >
            <ShoppingBag className="w-5 h-5 text-amber-200" />
            <span>Ver Catálogo</span>
          </button>

          <a
            href={SHOPEE_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto bg-orange-600 hover:bg-orange-500 text-white font-black text-base px-8 py-3.5 rounded-2xl shadow-lg uppercase tracking-wider transition-all transform hover:-translate-y-0.5 active:translate-y-0 border border-orange-400/50 flex items-center justify-center gap-2"
          >
            <span>Loja Oficial Shopee</span>
            <ExternalLink className="w-4 h-4" />
          </a>

          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 px-7 py-3.5 rounded-2xl font-black text-base shadow-sm uppercase tracking-wider transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-5 h-5 text-emerald-600" />
            <span>(31) 98437-4513</span>
          </a>
        </div>

        {/* Social Quick Links */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs font-bold text-slate-700 bg-slate-100 px-5 py-2 rounded-full border border-slate-200 shadow-sm">
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-emerald-700 hover:text-emerald-900 transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>WhatsApp: (31) 98437-4513</span>
          </a>
          <span className="text-slate-400">•</span>
          <a
            href="https://instagram.com/mundodapipa.oficial"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-pink-700 hover:text-pink-900 transition-colors"
          >
            <Instagram className="w-3.5 h-3.5" />
            <span>@mundodapipa.oficial</span>
          </a>
        </div>

        {/* Highlights Bar */}
        <div className="mt-8 pt-6 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 text-slate-700 text-xs sm:text-sm font-bold uppercase tracking-wider w-full max-w-3xl">
          <div className="flex items-center justify-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            <span>25+ Anos Tradição</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Bambu & Fibra VIP</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Star className="w-4 h-4 text-amber-500" />
            <span>Nota 5.0 Shopee</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Atacado & Varejo</span>
          </div>
        </div>

      </div>
    </section>
  );
};
