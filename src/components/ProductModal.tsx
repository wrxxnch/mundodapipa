import React, { useState } from 'react';
import { X, Star, ShoppingCart, ExternalLink, Check, ShieldCheck, Truck, Sparkles, MessageSquare, CornerDownRight, Video, Play, Image as ImageIcon } from 'lucide-react';
import { Product } from '../types';
import { ShippingCalculator } from './ShippingCalculator';
import { FastImage } from './FastImage';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  onClose,
  onAddToCart,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeTab, setActiveTab] = useState<'photo' | 'video'>('photo');
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  if (!product) return null;

  const galleryImages = product.images && product.images.length > 0 ? product.images : [product.image];
  const activeImage = galleryImages[selectedPhotoIndex] || product.image;
  const videoUrl = product.videoUrl || (product.videos && product.videos[0]);

  const handleAdd = () => {
    onAddToCart(product, quantity);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 rounded-full transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Product Media Column */}
          <div className="relative bg-slate-100 p-5 flex flex-col items-center justify-between">
            {/* Media Selector Tabs if video exists */}
            {videoUrl && (
              <div className="flex items-center gap-1 bg-white p-1 rounded-full shadow-sm mb-3 border border-slate-200 text-xs font-bold z-10">
                <button
                  type="button"
                  onClick={() => setActiveTab('photo')}
                  className={`px-3 py-1 rounded-full flex items-center gap-1 transition-all ${
                    activeTab === 'photo' ? 'bg-orange-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Fotos ({galleryImages.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('video')}
                  className={`px-3 py-1 rounded-full flex items-center gap-1 transition-all ${
                    activeTab === 'video' ? 'bg-orange-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Vídeo Demo</span>
                </button>
              </div>
            )}

            {/* Media Display Area */}
            <div className="w-full h-64 flex items-center justify-center my-auto relative">
              {activeTab === 'photo' ? (
                <FastImage
                  src={activeImage}
                  alt={product.name}
                  className="max-h-60 w-full object-contain rounded-xl shadow-md transition-all duration-300"
                />
              ) : videoUrl ? (
                <div className="w-full h-full rounded-xl overflow-hidden shadow-inner bg-black flex items-center justify-center">
                  <video
                    src={videoUrl}
                    controls
                    autoPlay
                    playsInline
                    preload="metadata"
                    className="w-full h-full object-contain"
                  >
                    Seu navegador não suporta reprodução de vídeo.
                  </video>
                </div>
              ) : null}

              {product.badge && (
                <span className="absolute top-2 left-2 bg-slate-900 text-amber-400 text-xs font-black px-2.5 py-1 rounded-md shadow">
                  {product.badge}
                </span>
              )}
            </div>

            {/* Multi Photo Thumbnails Bar */}
            {activeTab === 'photo' && galleryImages.length > 1 && (
              <div className="flex items-center gap-2 mt-3 overflow-x-auto w-full py-1 justify-center">
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedPhotoIndex(idx)}
                    className={`w-12 h-12 rounded-lg border-2 overflow-hidden transition-all shrink-0 ${
                      selectedPhotoIndex === idx
                        ? 'border-orange-600 scale-105 shadow-md'
                        : 'border-slate-300 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <FastImage src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-amber-600 mb-1">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>{product.rating.toFixed(1)} / 5.0</span>
                <span className="text-slate-400">({product.salesCount} vendas na Shopee)</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-serif leading-tight">
                {product.name}
              </h2>

              <div className="mt-3 flex items-baseline gap-3">
                <span className="text-3xl font-black text-slate-900 font-serif">
                  R$ {product.price.toFixed(2).replace('.', ',')}
                </span>
                {product.originalPrice && (
                  <span className="text-sm text-slate-400 line-through">
                    R$ {product.originalPrice.toFixed(2).replace('.', ',')}
                  </span>
                )}
              </div>

              <p className="text-slate-600 text-sm mt-3 leading-relaxed">
                {product.description}
              </p>

              {/* Specifications List */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                  Especificações do Produto:
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-700 font-medium">
                  {product.specs.map((spec, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span>{spec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Quantity & Buy Controls */}
            <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Quantidade:</span>
                <div className="flex items-center gap-2 border border-slate-200 rounded-xl p-1 bg-slate-50">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-700 font-black hover:bg-slate-100"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-extrabold text-sm text-slate-900">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-700 font-black hover:bg-slate-100"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Shipping Calculator */}
              <div className="pt-2">
                <ShippingCalculator compact />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={handleAdd}
                  className={`w-full py-3 px-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-md ${
                    added
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  {added ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Adicionado!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4 text-amber-400" />
                      <span>Adicionar ao Carrinho</span>
                    </>
                  )}
                </button>

                <a
                  href={product.shopeeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black text-sm py-3 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all"
                >
                  <span>Comprar na Shopee</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500 pt-2 font-semibold">
                <span className="flex items-center gap-1"><Truck className="w-3.5 h-3.5 text-emerald-600" /> Envio Imediato</span>
                <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-sky-600" /> Garantia de Qualidade</span>
              </div>
            </div>
          </div>
        </div>

        {/* Shopee Reviews Section */}
        {product.reviews && product.reviews.length > 0 && (
          <div className="p-6 bg-slate-50 border-t border-slate-200">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5 text-orange-600" />
              <h3 className="font-black text-slate-900 text-sm uppercase tracking-wide">
                Avaliações do Produto na Shopee ({product.reviews.length})
              </h3>
            </div>

            <div className="space-y-3">
              {product.reviews.map((rev) => (
                <div key={rev.id} className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-900">{rev.author}</span>
                    <span className="text-[10px] text-slate-400">{rev.date}</span>
                  </div>

                  <div className="flex items-center gap-1 mb-2 text-amber-400">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-amber-400" />
                    ))}
                    {rev.variation && (
                      <span className="ml-2 text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-semibold">
                        Variação: {rev.variation}
                      </span>
                    )}
                  </div>

                  <p className="text-slate-700 font-medium leading-relaxed">{rev.comment}</p>

                  {rev.costBenefit && (
                    <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-bold">
                        Custo-benefício: {rev.costBenefit}
                      </span>
                      {rev.resemblance && (
                        <span className="bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded font-bold">
                          Parecido c/ anúncio: {rev.resemblance}
                        </span>
                      )}
                    </div>
                  )}

                  {rev.sellerReply && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-start gap-1.5 text-slate-600 bg-orange-50/50 p-2 rounded-xl">
                      <CornerDownRight className="w-3.5 h-3.5 text-orange-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-black text-orange-600 text-[10px]">Resposta do Vendedor (Mundo da Pipa):</span>
                        <p className="text-[11px] text-slate-800 font-medium mt-0.5">{rev.sellerReply}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

