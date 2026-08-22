import React, { useState, useEffect } from 'react';
import { X, DollarSign, Check, Trash2, Package } from 'lucide-react';
import { Product } from '../types';
import { updateProductInFirestore, deleteProductFromFirestore, deleteField } from '../lib/firebase';

interface EditPriceModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EditPriceModal: React.FC<EditPriceModalProps> = ({
  product,
  isOpen,
  onClose
}) => {
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [salesCount, setSalesCount] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setPrice(product.price != null ? product.price.toString() : '');
      setOriginalPrice(product.originalPrice != null ? product.originalPrice.toString() : '');
      setSalesCount(product.salesCount != null ? product.salesCount.toString() : '');
      setStockQuantity(product.stockQuantity != null ? product.stockQuantity.toString() : '');
      setError(null);
    } else {
      setPrice('');
      setOriginalPrice('');
      setSalesCount('');
      setStockQuantity('');
      setError(null);
    }
  }, [product, isOpen]);

  if (!isOpen || !product) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numPrice = parseFloat(price.replace(',', '.'));
    if (isNaN(numPrice) || numPrice <= 0) {
      setError('Informe um preço válido.');
      return;
    }

    const numOrigPrice = originalPrice && parseFloat(originalPrice.replace(',', '.')) > 0
      ? parseFloat(originalPrice.replace(',', '.'))
      : null;

    const numSales = salesCount.trim() && !isNaN(parseInt(salesCount.trim(), 10)) && parseInt(salesCount.trim(), 10) > 0
      ? parseInt(salesCount.trim(), 10)
      : null;

    const numStock = stockQuantity.trim() && !isNaN(parseInt(stockQuantity.trim(), 10)) && parseInt(stockQuantity.trim(), 10) >= 0
      ? parseInt(stockQuantity.trim(), 10)
      : null;

    setLoading(true);

    try {
      const updates: Record<string, any> = {
        price: numPrice
      };
      if (numOrigPrice !== null) {
        updates.originalPrice = numOrigPrice;
      } else {
        updates.originalPrice = deleteField();
      }
      if (numSales !== null) {
        updates.salesCount = numSales;
      } else {
        updates.salesCount = deleteField();
      }
      if (numStock !== null) {
        updates.stockQuantity = numStock;
        updates.inStock = numStock > 0;
      } else {
        updates.stockQuantity = deleteField();
      }

      updateProductInFirestore(product.id, updates).catch(e => console.warn('Background sync:', e));
      onClose();
    } catch (err: any) {
      setError('Erro ao atualizar dados: ' + err.message);
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Tem certeza que deseja DELETAR o item "${product.name}"?`)) {
      setLoading(true);
      try {
        await deleteProductFromFirestore(product.id);
        onClose();
      } catch (err: any) {
        setError('Erro ao deletar: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-slate-100 p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-slate-100 p-1.5 rounded-full transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-black">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-orange-600 block">Editar Preço & Estoque</span>
            <h3 className="text-base font-black text-slate-900 leading-tight line-clamp-1">{product.name}</h3>
          </div>
        </div>

        {error && (
          <div className="mb-3 p-2.5 bg-red-50 text-red-700 rounded-xl text-xs font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="block text-xs font-black uppercase text-slate-600 mb-1">Preço Atual (R$)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">R$</span>
              <input
                type="text"
                required
                value={price ?? ''}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="24.90"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-base font-black text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-extrabold uppercase text-slate-500 mb-1">Preço Antigo (De)</label>
              <input
                type="text"
                value={originalPrice ?? ''}
                onChange={(e) => setOriginalPrice(e.target.value)}
                placeholder="29.90"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase text-orange-700 mb-1 flex items-center gap-1">
                <Package className="w-3 h-3 text-orange-600" />
                <span>Qtd. Estoque</span>
              </label>
              <input
                type="number"
                min="0"
                value={stockQuantity ?? ''}
                onChange={(e) => setStockQuantity(e.target.value)}
                placeholder="50"
                className="w-full bg-slate-50 border border-orange-300 rounded-xl px-3 py-2 text-xs font-black text-orange-700 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold uppercase text-slate-600 mb-1">Qtd. Itens Vendidos (Opcional)</label>
            <input
              type="number"
              min="0"
              value={salesCount ?? ''}
              onChange={(e) => setSalesCount(e.target.value)}
              placeholder="Ex: 120 (deixe em branco se novo)"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="bg-red-50 hover:bg-red-100 text-red-600 p-2.5 rounded-xl border border-red-200 flex items-center justify-center transition-colors"
              title="Deletar este produto"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-black text-xs py-2.5 rounded-xl shadow-md flex items-center justify-center gap-1.5 uppercase tracking-wide transition-all disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{loading ? 'Salvando...' : 'Salvar Alteração'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
