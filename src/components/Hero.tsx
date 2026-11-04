import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Award, 
  Star, 
  ExternalLink, 
  ShieldCheck, 
  Sparkles, 
  MessageCircle, 
  Instagram, 
  Tag, 
  Percent, 
  Copy, 
  Check, 
  ArrowRight 
} from 'lucide-react';
import logoImg from '../assets/images/logo.png';
import { SHOPEE_STORE_URL, WHATSAPP_NUMBER } from '../data/products';
import { subscribeToCoupons } from '../lib/firebase';
import { Coupon } from '../types';

interface HeroProps {
  onExploreClick: () => void;
  onOpenCart?: (prefillCouponCode?: string) => void;
}

export const Hero: React.FC<HeroProps> = ({ onExploreClick, onOpenCart }) => {
  const [siteCoupons, setSiteCoupons] = useState<Coupon[]>([]);
  const [selectedCouponIdx, setSelectedCouponIdx] = useState(0);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeToCoupons((coupons) => {
      // Filter coupons that are both active AND marked to show on site
      const publicActive = coupons.filter((c) => c.active && c.showOnSite !== false);
      setSiteCoupons(publicActive);
      if (selectedCouponIdx >= publicActive.length) {
        setSelectedCouponIdx(0);
      }
    });
    return () => unsub();
  }, [selectedCouponIdx]);

  const activeCoupon = siteCoupons.length > 0 
    ? (siteCoupons[selectedCouponIdx] || siteCoupons[0]) 
    : null;

  const handleCopyCoupon = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <section className="bg-slate-950 text-white py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center text-center shadow-xl relative border-b border-slate-800 overflow-hidden">
      
      {/* Seamless Ambient Lighting - Soft continuous radial gradient without hard circular disc edges */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 20%, rgba(234, 88, 12, 0.12) 0%, rgba(245, 158, 11, 0.04) 40%, rgba(2, 6, 23, 0) 75%)'
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center w-full">
        
        {/* Official Logo Showcase */}
        <div className="relative mb-6 group">
          <div className="w-44 h-44 sm:w-56 sm:h-56 md:w-64 md:h-64 rounded-full overflow-hidden border-4 border-amber-400 shadow-2xl bg-slate-900 p-2 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
            <img
              src={logoImg}
              alt="Logo Oficial Mundo da Pipa"
              className="w-full h-full object-contain drop-shadow-xl"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="absolute -bottom-3 inset-x-0 flex justify-center">
            <span className="bg-gradient-to-r from-orange-600 via-amber-500 to-orange-600 text-white text-[11px] sm:text-xs font-black px-4 py-1 rounded-full shadow-lg border border-white/30 uppercase tracking-wider">
              Desde 1999
            </span>
          </div>
        </div>

        {/* Brand Headline */}
        <div className="mt-4 w-full">
          <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 bg-slate-900 border border-slate-800 text-amber-400 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-inner">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Dedicação à Arte das Pipas</span>
            </span>

            {/* Featured Active Coupon Badge (Quick Access) */}
            {activeCoupon && (
              <span 
                onClick={() => onOpenCart?.(activeCoupon.code)}
                className="inline-flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-lg border border-emerald-400/50 cursor-pointer animate-pulse transition-all transform hover:scale-105"
                title="Clique para abrir o carrinho com o cupom aplicado"
              >
                <Tag className="w-3.5 h-3.5 text-amber-300" />
                <span>Cupom {activeCoupon.code}: {activeCoupon.discountPercent}% OFF</span>
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white uppercase tracking-tight leading-tight">
            MUNDO DA PIPA
          </h1>

          <p className="text-slate-300 text-sm sm:text-base md:text-lg max-w-2xl mx-auto mt-3 font-medium leading-relaxed">
            Fabricação própria de <strong className="text-amber-400">pipas, raias de combate, linhas 10 especiais, rabiolas e carretilhas artesanais</strong>. Qualidade e tradição para todo o Brasil.
          </p>

          {/* HERO DE CÓDIGO PROMOCIONAL (Exibido se o cupom tiver opção 'Mostrar no Site' ativada) */}
          {activeCoupon && (
            <div className="w-full max-w-2xl mx-auto my-6 bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border-2 border-amber-400/80 rounded-3xl p-4 sm:p-5 shadow-2xl shadow-amber-500/10 relative overflow-hidden group text-left animate-fadeIn">
              {/* Background ambient lighting */}
              <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -left-10 -top-10 w-44 h-44 bg-orange-500/15 rounded-full blur-2xl pointer-events-none" />

              {/* Promo Header Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3 border-b border-slate-800/80 pb-2.5 relative z-10">
                <div className="flex items-center gap-2">
                  <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-slate-950 text-[10px] sm:text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1.5 shadow">
                    <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                    <span>Hero de Promoção Oficial</span>
                  </span>
                  <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-600/40 text-[10px] sm:text-xs font-black px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                    <span>Disponível no Site</span>
                  </span>
                </div>

                {/* Switcher if more than one promo coupon on site */}
                {siteCoupons.length > 1 && (
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-400 font-bold">Mais cupons:</span>
                    {siteCoupons.map((c, idx) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedCouponIdx(idx)}
                        className={`text-[10px] font-black px-2 py-0.5 rounded-md border transition-all ${
                          idx === selectedCouponIdx
                            ? 'bg-amber-400 text-slate-950 border-amber-400 shadow'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        {c.code}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Main Content & Ticket Voucher */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl sm:text-3xl font-black text-amber-400 font-serif">
                      {activeCoupon.discountPercent}% OFF
                    </span>
                    <span className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                      no seu pedido
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 font-medium leading-relaxed">
                    {activeCoupon.appliesToAll ? (
                      <span className="text-emerald-400 font-bold">✓ Válido para todo o catálogo do Mundo da Pipa</span>
                    ) : (
                      <span className="text-amber-300 font-bold">🎯 Válido para produtos selecionados na promoção</span>
                    )}
                  </p>

                  {activeCoupon.description && (
                    <p className="text-[11px] text-slate-400 italic">
                      "{activeCoupon.description}"
                    </p>
                  )}
                </div>

                {/* Ticket and Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto shrink-0 justify-end">
                  {/* Monospace Code Voucher */}
                  <div className="bg-slate-950 border-2 border-dashed border-amber-400/80 rounded-2xl px-3.5 py-2 flex items-center justify-between gap-3 w-full sm:w-auto shadow-inner">
                    <div className="text-left">
                      <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold block">
                        Código:
                      </span>
                      <span className="font-mono text-base sm:text-lg font-black text-amber-300 tracking-wider">
                        {activeCoupon.code}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyCoupon(activeCoupon.code)}
                      className="p-1.5 hover:bg-slate-800 text-amber-400 hover:text-amber-300 rounded-lg transition-colors border border-slate-800 shrink-0"
                      title="Copiar código do cupom"
                    >
                      {copiedCode === activeCoupon.code ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* 1-Click Buy / Cart apply button */}
                  <button
                    type="button"
                    onClick={() => onOpenCart?.(activeCoupon.code)}
                    className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs px-4 py-3 rounded-2xl shadow-lg uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all transform hover:scale-[1.02] shrink-0"
                    title="Aproveitar cupom e comprar no carrinho"
                  >
                    <ShoppingBag className="w-4 h-4 text-amber-300" />
                    <span>Usar na Compra</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Gold Ribbon Badge: Atacado & Varejo */}
        <div className="inline-flex items-center justify-center bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black text-xs sm:text-sm px-6 py-1.5 rounded-full shadow-lg border-2 border-white uppercase tracking-widest my-5">
          <span>★ ATACADO & VAREJO PARA TODO O BRASIL ★</span>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto mt-4">
          <button
            onClick={onExploreClick}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-black text-base px-8 py-3.5 rounded-2xl shadow-xl uppercase tracking-wider transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
          >
            <ShoppingBag className="w-5 h-5 text-amber-300" />
            <span>Ver Catálogo Completo</span>
          </button>

          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-100 px-7 py-3.5 rounded-2xl font-black text-base shadow-xl uppercase tracking-wider transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-5 h-5 text-emerald-400" />
            <span>WhatsApp (31) 98437-4513</span>
          </a>
        </div>

        {/* Social Quick Links */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs font-bold text-slate-300 bg-slate-900/80 px-5 py-2 rounded-full border border-slate-800 shadow-md">
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-emerald-400 hover:text-white transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>WhatsApp: (31) 98437-4513</span>
          </a>
          <span className="text-slate-600">•</span>
          <a
            href="https://instagram.com/mundodapipa.oficial"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-pink-400 hover:text-white transition-colors"
          >
            <Instagram className="w-3.5 h-3.5" />
            <span>@mundodapipa.oficial</span>
          </a>
        </div>

        {/* Highlights Bar */}
        <div className="mt-8 pt-6 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 text-slate-300 text-xs sm:text-sm font-bold uppercase tracking-wider w-full max-w-3xl">
          <div className="flex items-center justify-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <span>25+ Anos Tradição</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Bambu & Fibra VIP</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Star className="w-4 h-4 text-amber-400" />
            <span>Nota 5.0 Shopee</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Atacado & Varejo</span>
          </div>
        </div>

      </div>
    </section>
  );
};
