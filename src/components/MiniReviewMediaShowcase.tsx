import React, { useState } from 'react';
import { Star, Play, CheckCircle2, Eye, X, Image as ImageIcon, Video, ThumbsUp, ShoppingBag, ExternalLink } from 'lucide-react';
import fio10Img from '../assets/images/fio_10_spool_1785809294784.jpg';
import pipaRaiaImg from '../assets/images/pipa_raia_product_1785771023453.jpg';
import linhaCorrenteImg from '../assets/images/linha_corrente_product_1785771036343.jpg';
import heroPipasImg from '../assets/images/hero_pipas_banner_1785771011358.jpg';
import { SmartVideoPlayer } from './SmartVideoPlayer';
import { SHOPEE_STORE_URL } from '../data/products';

export interface MiniReviewItem {
  id: string;
  type: 'photo' | 'video';
  mediaUrl: string;
  thumbUrl: string;
  author: string;
  date: string;
  rating: number;
  variation: string;
  comment: string;
  tag: string;
}

const MINI_REVIEWS: MiniReviewItem[] = [
  {
    id: 'rev-1',
    type: 'photo',
    mediaUrl: fio10Img,
    thumbUrl: fio10Img,
    author: 'theus878',
    date: '24/05/2026',
    rating: 5,
    variation: 'Fio 10 3000y 2P Emborrachada',
    comment: 'Linha lisa emborrachada de extrema qualidade, recomendo. Comprarei mais vezes!',
    tag: 'Foto do Comprador'
  },
  {
    id: 'rev-2',
    type: 'video',
    mediaUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // or default demo video
    thumbUrl: heroPipasImg,
    author: 'u45p9ldsxm',
    date: '09/07/2026',
    rating: 5,
    variation: 'Teste no Alto - Pipas & Linha 10',
    comment: 'Vídeo testando a linha e as pipas no vento forte. Linha lisinha top demais!',
    tag: 'Vídeo Real'
  },
  {
    id: 'rev-3',
    type: 'photo',
    mediaUrl: pipaRaiaImg,
    thumbUrl: pipaRaiaImg,
    author: 'ivanete1212',
    date: '30/06/2026',
    rating: 5,
    variation: 'Raias de Combate e Varetas',
    comment: 'Chegou super rápido e muito bem embalado. Varetas retinhas e excelente acabamento.',
    tag: 'Foto da Encomenda'
  },
  {
    id: 'rev-4',
    type: 'photo',
    mediaUrl: linhaCorrenteImg,
    thumbUrl: linhaCorrenteImg,
    author: 'maianaigor',
    date: '18/05/2026',
    rating: 5,
    variation: 'Linhas & Acessórios',
    comment: 'Linha muito macia e resistente. Melhor custo-benefício que já encontrei na Shopee.',
    tag: 'Foto do Produto'
  }
];

export const MiniReviewMediaShowcase: React.FC = () => {
  const [selectedMedia, setSelectedMedia] = useState<MiniReviewItem | null>(null);

  return (
    <div className="w-full max-w-4xl mx-auto my-3 bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xl backdrop-blur-md">
      
      {/* Header with Shopee badge and rating */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3.5 pb-2.5 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Mini Reviews de Clientes (Fotos & Vídeos Reais)
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="flex text-amber-400">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
            ))}
          </div>
          <span className="font-extrabold text-white text-[11px] bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
            5.0 (365+ Avaliações na Shopee)
          </span>
        </div>
      </div>

      {/* Media Thumbnails Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {MINI_REVIEWS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSelectedMedia(item)}
            className="group relative bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 hover:border-amber-400 transition-all duration-300 hover:scale-[1.03] active:scale-95 text-left flex flex-col focus:outline-none focus:ring-2 focus:ring-amber-400/50 shadow-lg"
          >
            {/* Image / Video Thumbnail Container */}
            <div className="relative w-full aspect-square bg-slate-950 overflow-hidden">
              <img
                src={item.thumbUrl}
                alt={item.variation}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent"></div>

              {/* Media Type Badge (Photo or Video) */}
              <div className="absolute top-2 left-2">
                {item.type === 'video' ? (
                  <span className="bg-red-600/90 text-white text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 shadow-md">
                    <Video className="w-3 h-3" />
                    <span>Vídeo</span>
                  </span>
                ) : (
                  <span className="bg-slate-900/90 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-md border border-amber-400/30">
                    <ImageIcon className="w-3 h-3" />
                    <span>Foto</span>
                  </span>
                )}
              </div>

              {/* Play / View Button Overlay */}
              <div className="absolute inset-0 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                {item.type === 'video' ? (
                  <div className="w-10 h-10 rounded-full bg-orange-600/90 text-white flex items-center justify-center shadow-xl border border-white/40 group-hover:scale-110 transition-transform">
                    <Play className="w-4 h-4 fill-white ml-0.5" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-900/80 text-white flex items-center justify-center shadow-md border border-white/20 group-hover:scale-110 transition-transform">
                    <Eye className="w-4 h-4 text-amber-300" />
                  </div>
                )}
              </div>

              {/* Star Rating Badge */}
              <div className="absolute bottom-2 left-2 flex items-center gap-1 text-[10px] font-bold text-amber-300">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>5.0</span>
                <span className="text-slate-400 text-[9px]">@{item.author}</span>
              </div>
            </div>

            {/* Comment snippet */}
            <div className="p-2.5 bg-slate-950 flex-1 flex flex-col justify-between">
              <p className="text-[11px] font-medium text-slate-300 line-clamp-2 leading-tight">
                "{item.comment}"
              </p>
              <div className="mt-1.5 flex items-center justify-between text-[9px] text-slate-400">
                <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                  <ThumbsUp className="w-2.5 h-2.5" /> Verificado
                </span>
                <span>{item.date}</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox / Video Modal */}
      {selectedMedia && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in"
          onClick={() => setSelectedMedia(null)}
        >
          <div
            className="relative bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setSelectedMedia(null)}
              className="absolute top-4 right-4 z-20 bg-slate-800/90 hover:bg-slate-700 text-white p-2 rounded-full shadow-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Media Display Area */}
            <div className="w-full max-h-[380px] bg-black flex items-center justify-center overflow-hidden">
              {selectedMedia.type === 'video' ? (
                <div className="w-full h-72">
                  <SmartVideoPlayer url={selectedMedia.mediaUrl} autoPlay />
                </div>
              ) : (
                <img
                  src={selectedMedia.mediaUrl}
                  alt={selectedMedia.variation}
                  className="w-full max-h-[360px] object-contain"
                  referrerPolicy="no-referrer"
                />
              )}
            </div>

            {/* Review Info Area */}
            <div className="p-5 bg-slate-900 text-white">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm text-amber-400">@{selectedMedia.author}</span>
                  <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Compra Verificada Shopee
                  </span>
                </div>
                <span className="text-xs text-slate-400">{selectedMedia.date}</span>
              </div>

              <div className="flex items-center gap-2 mb-2.5">
                <div className="flex text-amber-400">
                  {[...Array(selectedMedia.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                  ))}
                </div>
                <span className="text-xs text-slate-300 font-bold bg-slate-800 px-2 py-0.5 rounded-md">
                  {selectedMedia.variation}
                </span>
              </div>

              <p className="text-slate-200 text-xs sm:text-sm font-medium leading-relaxed bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                "{selectedMedia.comment}"
              </p>

              <div className="mt-4 flex items-center justify-between gap-3">
                <a
                  href={SHOPEE_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-orange-600 hover:bg-orange-500 text-white font-black text-xs sm:text-sm py-3 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 uppercase tracking-wide transition-all"
                >
                  <ShoppingBag className="w-4 h-4 text-amber-200" />
                  <span>Ver Produto na Shopee</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  type="button"
                  onClick={() => setSelectedMedia(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs py-3 px-4 rounded-xl transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
