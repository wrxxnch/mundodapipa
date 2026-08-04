import React from 'react';
import { Heart, ExternalLink, MessageCircle, MapPin, Phone, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import logoImg from '../assets/images/mundo_pipa_logo_1785770997796.jpg';
import { SHOPEE_STORE_URL, WHATSAPP_NUMBER } from '../data/products';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-12 border-b border-slate-800/80">
          
          {/* Col 1: Brand Info */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img
                src={logoImg}
                alt="Mundo da Pipa"
                className="w-12 h-12 rounded-full border border-amber-400 bg-white p-0.5"
                referrerPolicy="no-referrer"
              />
              <div>
                <h3 className="font-serif font-black text-white text-lg leading-none">
                  MUNDO DA PIPA
                </h3>
                <span className="text-amber-400 font-extrabold text-[10px] tracking-widest uppercase">
                  Desde 1999
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Dedicação inteira à arte das pipas e raias. Produtos de altíssima qualidade artesanal enviados para todo o Brasil.
            </p>
            <div className="flex items-center gap-2">
              <span className="bg-slate-800 text-slate-300 text-[11px] font-bold px-2.5 py-1 rounded-lg border border-slate-700">
                CNPJ: 00.000.000/0001-00
              </span>
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div>
            <h4 className="font-bold text-white text-sm uppercase tracking-wider mb-4 border-l-2 border-amber-400 pl-2">
              Navegação Rápida
            </h4>
            <ul className="space-y-2 text-xs font-medium">
              <li>
                <a href="#" className="hover:text-amber-400 transition-colors">Início</a>
              </li>
              <li>
                <a href="#produtos" className="hover:text-amber-400 transition-colors">Produtos e Raias</a>
              </li>
              <li>
                <a href={SHOPEE_STORE_URL} target="_blank" rel="noopener noreferrer" className="hover:text-amber-400 transition-colors flex items-center gap-1">
                  <span>Loja Oficial Shopee</span>
                  <ExternalLink className="w-3 h-3 text-orange-500" />
                </a>
              </li>
              <li>
                <a href="#historia" className="hover:text-amber-400 transition-colors">Nossa História</a>
              </li>
            </ul>
          </div>

          {/* Col 3: Contact & Support */}
          <div>
            <h4 className="font-bold text-white text-sm uppercase tracking-wider mb-4 border-l-2 border-amber-400 pl-2">
              Atendimento ao Cliente
            </h4>
            <ul className="space-y-3 text-xs">
              <li className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  WhatsApp: (31) 99999-8888
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-sky-400 shrink-0" />
                <span>contato@mundodapipa.com.br</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Envio para todo o Brasil</span>
              </li>
            </ul>
          </div>

          {/* Col 4: Official Shopee Badge Card */}
          <div>
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-4 rounded-2xl border border-slate-700/80 text-center">
              <div className="w-10 h-10 bg-orange-600 text-white rounded-xl flex items-center justify-center mx-auto mb-2 font-black text-xs shadow-md">
                Shopee
              </div>
              <h5 className="font-bold text-white text-xs">Loja Verificada na Shopee</h5>
              <p className="text-[11px] text-slate-400 mt-1">
                Aproveite frete grátis com cupom e parcelamento sem juros!
              </p>
              <a
                href={SHOPEE_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center justify-center gap-1.5 w-full bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-xs py-2 rounded-xl transition-all shadow-sm"
              >
                <span>COMPRAR NA SHOPEE</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

        </div>

        {/* Bottom Copyright Strip */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p className="text-center sm:text-left">
            &copy; 2026 Mundo da Pipa. Todos os direitos reservados. CNPJ: 00.000.000/0001-00
          </p>
          <div className="flex items-center gap-1 text-slate-400">
            <span>Dedicação à arte das pipas desde 1999</span>
            <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 ml-1" />
          </div>
        </div>

      </div>
    </footer>
  );
};
