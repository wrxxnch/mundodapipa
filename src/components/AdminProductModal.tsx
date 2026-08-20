import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Plus, Save, Image as ImageIcon, Tag, DollarSign, 
  Trash2, Upload, Camera, Link as LinkIcon, CheckCircle2, 
  Sparkles, Video, AlertCircle, Youtube, ExternalLink, Package 
} from 'lucide-react';
import { Product, Category } from '../types';
import { addProductToFirestore, updateProductInFirestore, deleteProductFromFirestore, deleteField } from '../lib/supabase';
import { compressImageFile } from '../utils/imageCompressor';
import { saveLocalVideo } from '../utils/mediaStore';
import { SmartVideoPlayer } from './SmartVideoPlayer';

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
  const [salesCount, setSalesCount] = useState<string>('');
  const [image, setImage] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [extraImageUrl, setExtraImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [uploadSource, setUploadSource] = useState<'device' | 'url'>('device');
  const [fileName, setFileName] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [specInput, setSpecInput] = useState('');
  const [specs, setSpecs] = useState<string[]>([]);
  const [badge, setBadge] = useState('');
  const [inStock, setInStock] = useState(true);
  const [stockQuantity, setStockQuantity] = useState<string>('');
  const [shopeeUrl, setShopeeUrl] = useState('https://shopee.com.br/mundo_da_pipa');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoSource, setVideoSource] = useState<'device' | 'url'>('device');
  const [videoFileName, setVideoFileName] = useState<string | null>(null);
  const [isCompressingExtra, setIsCompressingExtra] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const extraFileInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setConfirmDelete(false);
    if (productToEdit) {
      setName(productToEdit.name);
      setCategory(productToEdit.category);
      setPrice(productToEdit.price.toString());
      setOriginalPrice(productToEdit.originalPrice ? productToEdit.originalPrice.toString() : '');
      setSalesCount(productToEdit.salesCount != null ? productToEdit.salesCount.toString() : '');
      setImage(productToEdit.image);
      setImages(productToEdit.images || [productToEdit.image]);
      setVideoUrl(productToEdit.videoUrl || '');
      setUploadSource('url');
      setVideoSource(productToEdit.videoUrl?.startsWith('local-video://') ? 'device' : 'url');
      setDescription(productToEdit.description);
      setSpecs(productToEdit.specs || []);
      setBadge(productToEdit.badge || '');
      setInStock(productToEdit.inStock !== false);
      setStockQuantity(productToEdit.stockQuantity != null ? productToEdit.stockQuantity.toString() : '');
      setShopeeUrl(productToEdit.shopeeUrl || 'https://shopee.com.br/mundo_da_pipa');
      setFileName(null);
      setVideoFileName(productToEdit.videoUrl?.startsWith('local-video://') ? 'Vídeo do produto carregado' : null);
    } else {
      // Reset form for new product
      setName('');
      setCategory('pipas');
      setPrice('');
      setOriginalPrice('');
      setSalesCount('');
      setImage('');
      setImages([]);
      setExtraImageUrl('');
      setVideoUrl('');
      setFileName(null);
      setVideoFileName(null);
      setUploadSource('device');
      setVideoSource('device');
      setDescription('');
      setSpecs(['Bambu selecionado', 'Papel de seda de alta qualidade']);
      setBadge('Novo');
      setInStock(true);
      setStockQuantity('50');
      setShopeeUrl('https://shopee.com.br/mundo_da_pipa');
    }
  }, [productToEdit, isOpen]);

  if (!isOpen) return null;

  // Handle Cover Image Upload from Device (Instant compression)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setError(null);
      try {
        const compressedBase64 = await compressImageFile(file, 640, 640, 0.72);
        setImage(compressedBase64);
        setImages(prev => prev.includes(compressedBase64) ? prev : [compressedBase64, ...prev]);
      } catch (err: any) {
        console.error('Error compressing image:', err);
        setError('Erro ao carregar imagem: ' + (err.message || 'Tente outra foto.'));
      }
    }
  };

  // Handle Extra Gallery Images Upload from Device (Parallel instant compression)
  const handleExtraFilesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setIsCompressingExtra(true);
      setError(null);
      try {
        const filesArray = Array.from(files) as File[];
        const compressedList = await Promise.all(
          filesArray.map(f => compressImageFile(f, 640, 640, 0.72))
        );
        setImages(prev => {
          const combined = [...prev];
          compressedList.forEach(img => {
            if (!combined.includes(img)) combined.push(img);
          });
          return combined;
        });
      } catch (err: any) {
        console.error('Error compressing extra images:', err);
        setError('Erro ao carregar fotos: ' + (err.message || 'Tente novamente'));
      } finally {
        setIsCompressingExtra(false);
        if (extraFileInputRef.current) {
          extraFileInputRef.current.value = '';
        }
      }
    }
  };

  // Handle Video Upload (Any video size accepted with no limits via local store)
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFileName(file.name);
      setLoading(true);
      setError(null);

      try {
        const mediaId = `vid_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const localRef = await saveLocalVideo(mediaId, file);
        setVideoUrl(localRef);
      } catch (err: any) {
        console.error('Error storing video:', err);
        setError('Erro ao salvar vídeo: ' + (err.message || 'Tente novamente'));
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAddExtraImage = () => {
    if (extraImageUrl.trim()) {
      if (!images.includes(extraImageUrl.trim())) {
        setImages([...images, extraImageUrl.trim()]);
      }
      setExtraImageUrl('');
    }
  };

  const handleRemoveImage = (index: number) => {
    const removedImg = images[index];
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    if (image === removedImg) {
      setImage(newImages.length > 0 ? newImages[0] : '');
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

    const numOrigPrice = originalPrice && parseFloat(originalPrice.replace(',', '.')) > 0
      ? parseFloat(originalPrice.replace(',', '.'))
      : undefined;

    const numSalesCount = salesCount.trim() && !isNaN(parseInt(salesCount.trim(), 10)) && parseInt(salesCount.trim(), 10) > 0
      ? parseInt(salesCount.trim(), 10)
      : undefined;

    const numStockQty = stockQuantity.trim() && !isNaN(parseInt(stockQuantity.trim(), 10)) && parseInt(stockQuantity.trim(), 10) >= 0
      ? parseInt(stockQuantity.trim(), 10)
      : undefined;

    setLoading(true);

    try {
      const cover = image.trim() || (images.length > 0 ? images[0] : 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80');
      const allImages = images.length > 0 ? images : [cover];

      const computedInStock = numStockQty !== undefined ? numStockQty > 0 && inStock : inStock;

      const productData: Record<string, any> = {
        name: name.trim(),
        category,
        price: numPrice,
        image: cover,
        images: allImages,
        description: description.trim(),
        specs: specs.filter(s => s && s.trim().length > 0),
        inStock: computedInStock,
        shopeeUrl: shopeeUrl.trim() || 'https://shopee.com.br/mundo_da_pipa',
        rating: productToEdit ? productToEdit.rating : 5.0
      };

      if (numStockQty !== undefined) {
        productData.stockQuantity = numStockQty;
      } else if (productToEdit) {
        productData.stockQuantity = deleteField();
      }

      if (numOrigPrice !== undefined) {
        productData.originalPrice = numOrigPrice;
      } else if (productToEdit) {
        productData.originalPrice = deleteField();
      }

      if (videoUrl && videoUrl.trim()) {
        productData.videoUrl = videoUrl.trim();
      } else if (productToEdit) {
        productData.videoUrl = deleteField();
      }

      if (badge && badge.trim()) {
        productData.badge = badge.trim();
      } else if (productToEdit) {
        productData.badge = deleteField();
      }

      if (numSalesCount !== undefined) {
        productData.salesCount = numSalesCount;
      } else if (productToEdit) {
        productData.salesCount = deleteField();
      }

      if (productToEdit) {
        // Instant local update + non-blocking cloud sync
        updateProductInFirestore(productToEdit.id, productData).catch(e => console.warn('Background sync:', e));
      } else {
        // Instant local add + non-blocking cloud sync
        addProductToFirestore(productData).catch(e => console.warn('Background sync:', e));
      }

      // Close modal immediately
      onClose();
    } catch (err: any) {
      console.error('Error saving product:', err);
      setError('Erro ao salvar produto: ' + (err.message || 'Tente novamente'));
      setLoading(false);
    }
  };
 
  const handleDelete = async () => {
    if (!productToEdit) return;
    setLoading(true);
    try {
      await deleteProductFromFirestore(productToEdit.id);
      onClose();
    } catch (err: any) {
      setError('Erro ao deletar produto: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-100 my-4 sm:my-8 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center font-black shadow-md">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight">
                {productToEdit ? 'Editar Produto' : 'Cadastrar Novo Item (Admin)'}
              </h2>
              <p className="text-xs text-amber-400 font-medium">
                Gerencie catálogo, preços, fotos e vídeos sem restrições
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
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-bold flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
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
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-slate-700 mb-1">Categoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white"
              >
                <option value="pipas">Pipas</option>
                <option value="linhas">Linhas</option>
                <option value="rabiolas">Rabiolas</option>
                <option value="varetas">Varetas & Carretilhas</option>
                <option value="kits">Kits Especiais</option>
              </select>
            </div>
          </div>

          {/* Pricing & Sales & Stock Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
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
              <label className="block text-xs font-black uppercase text-slate-500 mb-1">Preço Antigo (De)</label>
              <input
                type="text"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                placeholder="29.90 (opcional)"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-orange-700 mb-1 flex items-center gap-1">
                <Package className="w-3.5 h-3.5 text-orange-600" />
                <span>Qtd. em Estoque</span>
              </label>
              <input
                type="number"
                min="0"
                value={stockQuantity}
                onChange={(e) => {
                  setStockQuantity(e.target.value);
                  if (e.target.value === '0') {
                    setInStock(false);
                  } else if (Number(e.target.value) > 0) {
                    setInStock(true);
                  }
                }}
                placeholder="Ex: 50"
                className="w-full bg-white border border-orange-300 rounded-xl px-3 py-2 text-sm font-black text-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-slate-700 mb-1">Qtd. Vendidos</label>
              <input
                type="number"
                min="0"
                value={salesCount}
                onChange={(e) => setSalesCount(e.target.value)}
                placeholder="Ex: 120"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-900 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-slate-700 mb-1">Selo / Badge</label>
              <input
                type="text"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="Ex: Mais Vendido"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-900 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* Photo & Media Section */}
          <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <label className="block text-xs font-black uppercase text-slate-800 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-orange-600" />
                <span>Fotos do Produto</span>
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
                  <span>Do Dispositivo</span>
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
                  <span>URL Web</span>
                </button>
              </div>
            </div>

            {/* Main Cover Image */}
            <div>
              <span className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Foto Principal (Capa)</span>
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
                    className="border-2 border-dashed border-slate-300 hover:border-orange-500 bg-white p-3.5 rounded-xl text-center cursor-pointer transition-all hover:bg-orange-50/50 group"
                  >
                    <div className="w-8 h-8 bg-orange-100 group-hover:bg-orange-200 text-orange-600 rounded-xl flex items-center justify-center mx-auto mb-1 transition-colors">
                      <Camera className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-bold text-slate-800">
                      Clique para escolher imagem da Capa (Celular ou Computador)
                    </p>
                    {fileName && (
                      <span className="inline-block mt-1 text-[11px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        ✓ {fileName}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <input
                  type="url"
                  value={image}
                  onChange={(e) => {
                    setImage(e.target.value);
                    if (e.target.value.trim() && !images.includes(e.target.value.trim())) {
                      setImages([e.target.value.trim(), ...images]);
                    }
                  }}
                  placeholder="Cole o link da foto principal..."
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-orange-500"
                />
              )}
            </div>

            {/* Gallery Multiple Photos */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="block text-[11px] font-bold text-slate-600 uppercase">
                  Galeria de Fotos Adicionais ({images.length} foto{images.length !== 1 ? 's' : ''})
                </span>
                <input
                  type="file"
                  ref={extraFileInputRef}
                  accept="image/*"
                  multiple
                  onChange={handleExtraFilesUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => extraFileInputRef.current?.click()}
                  disabled={isCompressingExtra}
                  className="text-xs font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-2.5 py-1 rounded-lg border border-orange-200 flex items-center gap-1 transition-colors"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{isCompressingExtra ? 'Carregando...' : '+ Adicionar Fotos do Aparelho'}</span>
                </button>
              </div>

              <div className="flex gap-2 mb-2">
                <input
                  type="url"
                  value={extraImageUrl}
                  onChange={(e) => setExtraImageUrl(e.target.value)}
                  placeholder="Ou adicione link de outra foto web..."
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-orange-500"
                />
                <button
                  type="button"
                  onClick={handleAddExtraImage}
                  className="bg-slate-900 text-white font-bold text-xs px-3 py-1.5 rounded-xl hover:bg-slate-800 shrink-0"
                >
                  + Add Link
                </button>
              </div>

              {images.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {images.map((imgUrl, idx) => (
                    <div key={idx} className="relative group w-16 h-16 rounded-xl overflow-hidden border border-slate-300 bg-white shadow-sm">
                      <img src={imgUrl} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute inset-0 bg-red-900/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold"
                      >
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Video Section */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5">
                  <Video className="w-4 h-4 text-red-500" />
                  <span>Vídeo do Produto</span>
                </label>
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => setVideoSource('device')}
                    className={`px-2.5 py-1 rounded-md flex items-center gap-1 transition-all ${
                      videoSource === 'device' ? 'bg-orange-600 text-white shadow' : 'text-slate-600'
                    }`}
                  >
                    <Upload className="w-3 h-3" />
                    <span>Arquivo do Dispositivo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setVideoSource('url')}
                    className={`px-2.5 py-1 rounded-md flex items-center gap-1 transition-all ${
                      videoSource === 'url' ? 'bg-orange-600 text-white shadow' : 'text-slate-600'
                    }`}
                  >
                    <Youtube className="w-3 h-3" />
                    <span>Link Web</span>
                  </button>
                </div>
              </div>

              {videoSource === 'device' ? (
                <div>
                  <input
                    type="file"
                    ref={videoFileInputRef}
                    accept="video/*,video/mp4,video/webm,video/ogg,video/quicktime"
                    onChange={handleVideoUpload}
                    className="hidden"
                  />
                  <div
                    onClick={() => videoFileInputRef.current?.click()}
                    className="border-2 border-dashed border-red-200 hover:border-red-400 bg-red-50/40 p-4 rounded-xl text-center cursor-pointer transition-all hover:bg-red-50"
                  >
                    <div className="w-9 h-9 bg-red-100 text-red-600 rounded-xl flex items-center justify-center mx-auto mb-1">
                      <Video className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-slate-800">
                      Clique para escolher qualquer vídeo do Celular ou PC
                    </p>
                    {videoFileName && (
                      <span className="inline-block mt-2 text-[11px] font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                        ✓ {videoFileName}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="Ex: Link do YouTube, Shorts, Shopee, Google Drive ou link direto MP4..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white"
                  />
                </div>
              )}

              {/* Video Player Preview */}
              {videoUrl && (
                <div className="mt-2 p-2 bg-slate-950 rounded-xl overflow-hidden relative group">
                  <div className="h-44 w-full flex items-center justify-center">
                    <SmartVideoPlayer url={videoUrl} />
                  </div>
                  <button
                    type="button"
                    onClick={() => { setVideoUrl(''); setVideoFileName(null); }}
                    className="mt-1 text-[11px] text-red-400 hover:text-red-300 font-bold w-full text-center py-0.5"
                  >
                    Remover Vídeo
                  </button>
                </div>
              )}
            </div>

            {/* Link Shopee */}
            <div>
              <label className="block text-xs font-black uppercase text-slate-700 mb-1">Link de Compra na Shopee</label>
              <input
                type="url"
                required
                value={shopeeUrl}
                onChange={(e) => setShopeeUrl(e.target.value)}
                placeholder="https://shopee.com.br/mundo_da_pipa..."
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-orange-500"
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
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white"
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
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white"
              />
              <button
                type="button"
                onClick={handleAddSpec}
                className="bg-slate-900 text-white font-bold text-xs px-4 py-2 rounded-xl hover:bg-slate-800 shrink-0"
              >
                + Add Spec
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {specs.map((spec, index) => (
                <span key={index} className="bg-slate-100 border border-slate-200 text-slate-700 text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-semibold">
                  <span>{spec}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSpec(index)}
                    className="text-slate-400 hover:text-red-600 font-bold"
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
          <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            {productToEdit ? (
              confirmDelete ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={loading}
                    className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs px-4 py-3 rounded-xl shadow flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>{loading ? 'Deletando...' : 'Confirmar Exclusão'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3 py-3 rounded-xl"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  disabled={loading}
                  className="bg-red-50 hover:bg-red-100 text-red-600 font-extrabold text-xs px-4 py-3 rounded-xl border border-red-200 flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Deletar Item</span>
                </button>
              )
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
                className="bg-orange-600 hover:bg-orange-700 text-white font-black text-xs px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 uppercase tracking-wide disabled:opacity-50 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>{loading ? 'Salvando...' : 'Salvar Produto'}</span>
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};
