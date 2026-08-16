import React from 'react';
import { Star, ShoppingCart, ExternalLink, Check, Eye, Pencil, Trash2, ShieldCheck, DollarSign } from 'lucide-react';
import { Product } from '../types';
import { FastImage } from './FastImage';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onQuickView: (product: Product) => void;
  isAdmin?: boolean;
  onEditProduct?: (product: Product) => void;
  onEditPrice?: (product: Product) => void;
  onDeleteProduct?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onQuickView,
  isAdmin,
  onEditProduct,
  onEditPrice,
  onDeleteProduct,
}) => {
  const [added, setAdded] = React.useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div
      onClick={() => onQuickView(product)}
      className="group bg-white rounded-3xl p-5 card-shadow border border-slate-100 hover:border-sky-300 transition-all duration-300 flex flex-col justify-between cursor-pointer relative transform hover:-translate-y-1"
    >
      {/* Admin Quick Action Overlay Toolbar */}
      {isAdmin && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="bg-slate-900 text-white text-[11px] font-bold p-2 rounded-2xl mb-3 flex items-center justify-between gap-2 shadow-md border border-amber-400/40"
        >
          <div className="flex items-center gap-1 text-amber-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="uppercase text-[9px] font-black tracking-widest">Painel Admin</span>
          </div>

          <div className="flex items-center gap-1">
            {onEditPrice && (
              <button
                type="button"
                onClick={() => onEditPrice(product)}
                className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-2 py-1 rounded-lg text-[10px] flex items-center gap-1 transition-colors"
                title="Alterar Preço Rápido"
              >
                <DollarSign className="w-3 h-3" />
                <span>Preço</span>
              </button>
            )}

            {onEditProduct && (
              <button
                type="button"
                onClick={() => onEditProduct(product)}
                className="bg-slate-700 hover:bg-slate-600 text-white p-1 rounded-lg transition-colors"
                title="Editar Item Completo"
              >
                <Pencil className="w-3 h-3" />
              </button>
            )}

            {onDeleteProduct && (
              <button
                type="button"
                onClick={() => onDeleteProduct(product)}
                className="bg-red-600 hover:bg-red-500 text-white p-1 rounded-lg transition-colors"
                title="Deletar Item"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Top Badge or Diamond Kite Accent */}
      <div className="relative w-full aspect-square bg-slate-50 rounded-2xl overflow-hidden mb-4 p-2 flex items-center justify-center">
        <FastImage
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-500"
        />

        {/* Diamond Kite Badge */}
        {product.badge ? (
          <span className="absolute top-3 left-3 bg-orange-600 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-full shadow-md tracking-wider">
            {product.badge}
          </span>
        ) : (
          <div className="absolute top-3 left-3 diamond-shape w-6 h-6 bg-amber-400 border-white text-[8px] font-black text-slate-900 flex items-center justify-center">
            <span className="-rotate-45">PIPA</span>
          </div>
        )}

        {/* Quick View Floating Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onQuickView(product);
          }}
          className="absolute bottom-3 right-3 bg-white/90 hover:bg-slate-900 hover:text-white text-slate-800 p-2 rounded-full shadow-md transition-all opacity-90 sm:opacity-0 group-hover:opacity-100"
          title="Ver detalhes"
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>

      {/* Info Section */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <div className="flex items-center gap-1 text-amber-500 font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <span>{product.rating.toFixed(1)}</span>
            </div>
            {Boolean(product.salesCount && product.salesCount > 0) && (
              <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                {product.salesCount} vendidos
              </span>
            )}
          </div>

          <h3 className="text-slate-900 font-bold text-base line-clamp-2 leading-snug group-hover:text-sky-600 transition-colors">
            {product.name}
          </h3>

          <p className="text-slate-500 text-xs mt-1.5 line-clamp-2">
            {product.description}
          </p>
        </div>

        {/* Price & Action Row */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-2xl font-black text-emerald-600 font-sans tracking-tight">
              R$ {product.price.toFixed(2).replace('.', ',')}
            </span>
            {Boolean(product.originalPrice && product.originalPrice > product.price) && (
              <span className="text-[11px] text-slate-400 line-through -mt-1">
                R$ {product.originalPrice!.toFixed(2).replace('.', ',')}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleAdd}
              className={`p-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-all shadow-sm ${
                added
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-900 hover:bg-slate-800 text-white active:scale-95'
              }`}
              title="Adicionar ao Carrinho"
            >
              {added ? (
                <Check className="w-4 h-4" />
              ) : (
                <ShoppingCart className="w-4 h-4 text-amber-400" />
              )}
            </button>

            <a
              href={product.shopeeUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="bg-orange-500 hover:bg-orange-600 text-white font-black text-xs p-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center"
              title="Comprar na Shopee"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
