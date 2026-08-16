import React, { useState } from 'react';
import { X, DollarSign, Check, Trash2 } from 'lucide-react';
import { Product } from '../types';
import { updateProductInFirestore, deleteProductFromFirestore } from '../lib/firebase';

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
  if (!isOpen || !product) return null;

  const [price, setPrice] = useState(product.price.toString());
  const [originalPrice, setOriginalPrice] = useState(product.originalPrice ? product.originalPrice.toString() : '');
  const [salesCount, setSalesCount] = useState(product.salesCount != null ? product.salesCount.toString() : '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    setLoading(true);

    try {
      await updateProductInFirestore(product.id, {
        price: numPrice,
        originalPrice: numOrigPrice !== null ? numOrigPrice : undefined,
        salesCount: numSales !== null ? numSales : undefined
      });
      onClose();
    } catch (err: any) {
      setError('Erro ao atualizar dados: ' + err.message);
    } finally {
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
            <span className="text-[10px] font-black uppercase tracking-widest text-orange-600 block">Editar Preço (Admin)</span>
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
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="24.90"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-base font-black text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold uppercase text-slate-500 mb-1">Preço Antigo / De (R$)</label>
            <input
              type="text"
              value={originalPrice}
              onChange={(e) => setOriginalPrice(e.target.value)}
              placeholder="Ex: 29.90 (opcional)"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold uppercase text-slate-600 mb-1">Qtd. Itens Vendidos (Opcional)</label>
            <input
              type="number"
              min="0"
              value={salesCount}
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
