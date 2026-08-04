import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Save, Image as ImageIcon, Tag, DollarSign, PackageCheck, Trash2, Upload, Camera, Link as LinkIcon, CheckCircle2 } from 'lucide-react';
import { Product, Category } from '../types';
import { addProductToFirestore, updateProductInFirestore, deleteProductFromFirestore } from '../lib/firebase';

interface AdminProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
}

export const AdminProductModal: React.FC<AdminProductModalProps> = ({
  isOpen,
  onClose,
  productToEdit
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('pipas');
  const [price, setPrice] = useState<string>('');
  const [originalPrice, setOriginalPrice] = useState<string>('');
  const [image, setImage] = useState('');
  const [uploadSource, setUploadSource] = useState<'device' | 'url'>('device');
  const [fileName, setFileName] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [specInput, setSpecInput] = useState('');
  const [specs, setSpecs] = useState<string[]>([]);
  const [badge, setBadge] = useState('');
  const [inStock, setInStock] = useState(true);
  const [shopeeUrl, setShopeeUrl] = useState('https://shopee.com.br/mundo_da_pipa');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setCategory(productToEdit.category);
      setPrice(productToEdit.price.toString());
      setOriginalPrice(productToEdit.originalPrice ? productToEdit.originalPrice.toString() : '');
      setImage(productToEdit.image);
      setUploadSource('url');
      setDescription(productToEdit.description);
      setSpecs(productToEdit.specs || []);
      setBadge(productToEdit.badge || '');
      setInStock(productToEdit.inStock !== false);
      setShopeeUrl(productToEdit.shopeeUrl || 'https://shopee.com.br/mundo_da_pipa');
    } else {
      // Reset form for new product
      setName('');
      setCategory('pipas');
      setPrice('');
      setOriginalPrice('');
      setImage('');
      setFileName(null);
      setUploadSource('device');
      setDescription('');
      setSpecs(['Bambu selecionado', 'Papel de seda de alta qualidade']);
      setBadge('Novo');
      setInStock(true);
      setShopeeUrl('https://shopee.com.br/mundo_da_pipa');
    }
  }, [productToEdit, isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddSpec = () => {
    if (specInput.trim()) {
      setSpecs([...specs, specInput.trim()]);
      setSpecInput('');
    }
  };

  const handleRemoveSpec = (index: number) => {
    setSpecs(specs.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numPrice = parseFloat(price.replace(',', '.'));
    if (isNaN(numPrice) || numPrice <= 0) {
      setError('Informe um preço válido.');
      return;
    }

    const numOrigPrice = originalPrice ? parseFloat(originalPrice.replace(',', '.')) : undefined;

    setLoading(true);

    try {
      const productData = {
        name,
        category,
        price: numPrice,
        originalPrice: numOrigPrice,
        image: image.trim() || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
        description,
        specs,
        inStock,
        shopeeUrl,
        badge: badge.trim() || undefined,
        rating: productToEdit ? productToEdit.rating : 5.0,
        salesCount: productToEdit ? productToEdit.salesCount : 0
      };

      if (productToEdit) {
        await updateProductInFirestore(productToEdit.id, productData);
      } else {
        await addProductToFirestore(productData);
      }

      onClose();
    } catch (err: any) {
      console.error('Error saving product:', err);
      setError('Erro ao salvar produto no FirebaseDB: ' + err.message);
    } finally {
      setLoading(false);
    }
  };


  const handleDelete = async () => {
    if (!productToEdit) return;
    if (window.confirm(`Tem certeza que deseja DELETAR a pipa/item "${productToEdit.name}"?`)) {
      setLoading(true);
      try {
        await deleteProductFromFirestore(productToEdit.id);
        onClose();
      } catch (err: any) {
        setError('Erro ao deletar produto: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-100 my-8 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center font-black">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight">
                {productToEdit ? 'Editar Item no Firestore' : 'Cadastrar Novo Item (Admin)'}
              </h2>
              <p className="text-xs text-amber-400 font-medium">
                Sincronizado em tempo real no banco de dados FirebaseDB
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-bold">
              {error}
            </div>
          )}

          {/* Title & Category */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-black uppercase text-slate-700 mb-1">Nome do Produto</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Pipa Raia Combate 45cm (Pacote c/ 10 un)"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-slate-700 mb-1">Categoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-orange-500"
              >
                <option value="pipas">Pipas</option>
                <option value="linhas">Linhas</option>
                <option value="rabiolas">Rabiolas</option>
                <option value="varetas">Varetas & Carretilhas</option>
                <option value="kits">Kits Especiais</option>
              </select>
            </div>
          </div>

          {/* Pricing Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <label className="block text-xs font-black uppercase text-emerald-700 mb-1">Preço Atual (R$)</label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="24.90"
                  className="w-full bg-white border border-emerald-300 rounded-xl pl-9 pr-3 py-2 text-sm font-black text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-slate-500 mb-1">Preço Original (De)</label>
              <input
                type="text"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                placeholder="29.90 (opcional)"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-slate-700 mb-1">Selo / Badge</label>
              <input
                type="text"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="Ex: Mais Vendido, Oferta"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-900 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* Photo Upload Options & Shopee Link */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-black uppercase text-slate-800">
                Foto do Produto
              </label>
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setUploadSource('device')}
                  className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all ${
                    uploadSource === 'device'
                      ? 'bg-slate-900 text-white shadow'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Upload className="w-3 h-3" />
                  <span>Do Dispositivo / Fotos</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUploadSource('url')}
                  className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all ${
                    uploadSource === 'url'
                      ? 'bg-slate-900 text-white shadow'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LinkIcon className="w-3 h-3" />
                  <span>URL / Link Web</span>
                </button>
              </div>
            </div>

            {uploadSource === 'device' ? (
              <div className="space-y-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-orange-500 bg-white p-4 rounded-xl text-center cursor-pointer transition-all hover:bg-orange-50/50 group"
                >
                  <div className="w-10 h-10 bg-orange-100 group-hover:bg-orange-200 text-orange-600 rounded-xl flex items-center justify-center mx-auto mb-2 transition-colors">
                    <Camera className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-slate-800">
                    Clique para escolher imagem do Dispositivo ou Google Fotos
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Aceita PNG, JPG, WEBP de fotos salvas no seu celular ou computador
                  </p>
                  {fileName && (
                    <span className="inline-flex items-center gap-1 mt-2 text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {fileName}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <input
                  type="url"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="Cole a URL da imagem ou link do Google Fotos..."
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>
            )}

            {/* Live Image Preview Thumbnail */}
            {image && (
              <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-slate-200">
                <img
                  src={image}
                  alt="Prévia"
                  className="w-14 h-14 object-cover rounded-lg border border-slate-200 bg-slate-100"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">Foto Carregada com Sucesso</p>
                  <p className="text-[11px] text-slate-400">Pronta para exibição no catálogo</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setImage(''); setFileName(null); }}
                  className="text-xs text-red-600 hover:text-red-700 font-bold px-2 py-1 rounded bg-red-50 hover:bg-red-100 border border-red-200"
                >
                  Remover
                </button>
              </div>
            )}

            <div>
              <label className="block text-xs font-black uppercase text-slate-700 mb-1">Link de Compra na Shopee</label>
              <input
                type="url"
                required
                value={shopeeUrl}
                onChange={(e) => setShopeeUrl(e.target.value)}
                placeholder="https://shopee.com.br/mundo_da_pipa..."
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>


          {/* Description */}
          <div>
            <label className="block text-xs font-black uppercase text-slate-700 mb-1">Descrição do Produto</label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva detalhes como material, acabamento, tamanho..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium text-slate-900 focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Specs List */}
          <div>
            <label className="block text-xs font-black uppercase text-slate-700 mb-1">Especificações Técnicas</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={specInput}
                onChange={(e) => setSpecInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSpec())}
                placeholder="Ex: Tamanho 60cm, Vareta de bambu"
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-orange-500"
              />
              <button
                type="button"
                onClick={handleAddSpec}
                className="bg-slate-900 text-white font-bold text-xs px-4 py-2 rounded-xl hover:bg-slate-800"
              >
                + Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {specs.map((spec, index) => (
                <span key={index} className="bg-slate-100 border border-slate-200 text-slate-700 text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-semibold">
                  <span>{spec}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSpec(index)}
                    className="text-slate-400 hover:text-red-600"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Stock Checkbox */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="inStockCheck"
              checked={inStock}
              onChange={(e) => setInStock(e.target.checked)}
              className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
            />
            <label htmlFor="inStockCheck" className="text-xs font-extrabold uppercase text-slate-700 cursor-pointer">
              Produto Disponível em Estoque
            </label>
          </div>

          {/* Submit & Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-4">
            {productToEdit ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="bg-red-50 hover:bg-red-100 text-red-600 font-extrabold text-xs px-4 py-3 rounded-xl border border-red-200 flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Deletar Item</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-5 py-3 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-orange-600 hover:bg-orange-700 text-white font-black text-xs px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 uppercase tracking-wide disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{loading ? 'Salvando...' : 'Salvar no Firestore'}</span>
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};
