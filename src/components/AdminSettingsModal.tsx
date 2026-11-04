import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Sparkles, 
  Check, 
  Settings, 
  ArrowDownWideNarrow, 
  ShieldCheck, 
  RefreshCw, 
  AlertCircle, 
  Tag, 
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  Percent, 
  Package, 
  CheckSquare, 
  Square, 
  Copy, 
  ExternalLink 
} from 'lucide-react';
import { 
  CatalogSettings, 
  saveCatalogSettingsToFirestore, 
  subscribeToCoupons, 
  saveCouponToFirestore, 
  deleteCouponFromFirestore, 
  toggleCouponStatusInFirestore 
} from '../lib/firebase';
import { SortOption, Product, Coupon } from '../types';

interface AdminSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: CatalogSettings;
  onSettingsSaved: (newSettings: CatalogSettings) => void;
  products: Product[];
  userEmail?: string;
}

type TabType = 'coupons' | 'sorting';

export const AdminSettingsModal: React.FC<AdminSettingsModalProps> = ({
  isOpen,
  onClose,
  currentSettings,
  onSettingsSaved,
  products,
  userEmail
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('coupons');

  // Sorting state
  const [defaultSortNewest, setDefaultSortNewest] = useState(currentSettings.defaultSortNewest);
  const [fallbackSort, setFallbackSort] = useState<SortOption>(
    (currentSettings.defaultSortOption as SortOption) || 'newest'
  );
  const [savingSettings, setSavingSettings] = useState(false);

  // Coupons state
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null);

  // Form Fields
  const [couponCode, setCouponCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState<number>(10);
  const [description, setDescription] = useState('');
  const [appliesToAll, setAppliesToAll] = useState(true);
  const [applicableProductIds, setApplicableProductIds] = useState<string[]>([]);
  const [couponActive, setCouponActive] = useState(true);

  // Product selector search & filter
  const [productSearch, setProductSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('todos');

  // Feedback messages
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savingCoupon, setSavingCoupon] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Real-time coupons subscription
  useEffect(() => {
    if (!isOpen) return;
    const unsub = subscribeToCoupons((realtimeCoupons) => {
      setCoupons(realtimeCoupons);
    });
    return () => unsub();
  }, [isOpen]);

  // Sync sorting settings on open
  useEffect(() => {
    if (isOpen) {
      setDefaultSortNewest(currentSettings.defaultSortNewest);
      setFallbackSort((currentSettings.defaultSortOption as SortOption) || 'newest');
      setSuccessMessage(null);
      setErrorMessage(null);
    }
  }, [isOpen, currentSettings]);

  // Filtered products for target selection
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = productSearch.trim() === '' || 
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.category.toLowerCase().includes(productSearch.toLowerCase());
      const matchesCategory = categoryFilter === 'todos' || p.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [products, productSearch, categoryFilter]);

  if (!isOpen) return null;

  const handleOpenNewCoupon = () => {
    setEditingCouponId(null);
    setCouponCode('');
    setDiscountPercent(10);
    setDescription('');
    setAppliesToAll(true);
    setApplicableProductIds([]);
    setCouponActive(true);
    setProductSearch('');
    setIsFormOpen(true);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleEditCoupon = (coupon: Coupon) => {
    setEditingCouponId(coupon.id);
    setCouponCode(coupon.code);
    setDiscountPercent(coupon.discountPercent);
    setDescription(coupon.description || '');
    setAppliesToAll(coupon.appliesToAll);
    setApplicableProductIds(coupon.applicableProductIds || []);
    setCouponActive(coupon.active);
    setProductSearch('');
    setIsFormOpen(true);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleToggleProductSelection = (productId: string) => {
    setApplicableProductIds((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  const handleSelectAllFiltered = () => {
    const idsToAdd = filteredProducts.map((p) => p.id);
    setApplicableProductIds((prev) => Array.from(new Set([...prev, ...idsToAdd])));
  };

  const handleClearSelection = () => {
    setApplicableProductIds([]);
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = couponCode.trim().toUpperCase().replace(/\s+/g, '');

    if (!cleanCode) {
      setErrorMessage('Por favor, informe o código do cupom (ex: PIPA10).');
      return;
    }

    if (discountPercent <= 0 || discountPercent > 100) {
      setErrorMessage('A porcentagem de desconto deve ser entre 1% e 100%.');
      return;
    }

    if (!appliesToAll && applicableProductIds.length === 0) {
      setErrorMessage('Selecione pelo menos um produto para o cupom ou marque a opção "Todos os produtos".');
      return;
    }

    setSavingCoupon(true);
    setErrorMessage(null);

    try {
      await saveCouponToFirestore({
        id: editingCouponId || undefined,
        code: cleanCode,
        discountPercent: Number(discountPercent),
        description: description.trim(),
        active: couponActive,
        appliesToAll,
        applicableProductIds: appliesToAll ? [] : applicableProductIds
      }, userEmail);

      setSuccessMessage(editingCouponId ? `Cupom ${cleanCode} atualizado com sucesso!` : `Cupom ${cleanCode} cadastrado com sucesso!`);
      setIsFormOpen(false);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Erro ao salvar cupom.');
    } finally {
      setSavingCoupon(false);
    }
  };

  const handleDeleteCoupon = async (coupon: Coupon) => {
    if (window.confirm(`Tem certeza que deseja excluir o cupom "${coupon.code}"?`)) {
      try {
        await deleteCouponFromFirestore(coupon.id);
        setSuccessMessage(`Cupom ${coupon.code} excluído com sucesso.`);
        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (err: any) {
        setErrorMessage(err?.message || 'Erro ao excluir cupom.');
      }
    }
  };

  const handleToggleCouponStatus = async (coupon: Coupon) => {
    try {
      await toggleCouponStatusInFirestore(coupon.id, coupon.active);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Erro ao alterar status do cupom.');
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleSaveSortingSettings = async () => {
    setSavingSettings(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const newSettings: CatalogSettings = {
      defaultSortNewest,
      defaultSortOption: defaultSortNewest ? 'newest' : fallbackSort,
      updatedAt: new Date().toISOString(),
      updatedBy: userEmail || 'admin'
    };

    try {
      await saveCatalogSettingsToFirestore(newSettings, userEmail);
      onSettingsSaved(newSettings);
      setSuccessMessage('Configurações de ordenação salvas no Firebase!');
      setTimeout(() => {
        setSuccessMessage(null);
      }, 2000);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Erro ao salvar configurações.');
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-5 sm:px-6 py-4 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600/30 border border-orange-500/50 flex items-center justify-center text-orange-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                Painel Administrativo Mundo da Pipa
              </h3>
              <p className="text-slate-400 text-xs font-medium">
                Cupons de desconto e ordenação do catálogo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-slate-100 border-b border-slate-200 px-4 sm:px-6 pt-2.5 flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => { setActiveTab('coupons'); setIsFormOpen(false); }}
            className={`px-4 py-2.5 rounded-t-2xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 border-t border-x ${
              activeTab === 'coupons'
                ? 'bg-white text-orange-600 border-slate-200 shadow-sm -mb-px'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-200/60'
            }`}
          >
            <Tag className="w-4 h-4 text-orange-500" />
            <span>Cupons Promocionais</span>
            <span className="bg-orange-100 text-orange-800 text-[10px] font-black px-2 py-0.5 rounded-full">
              {coupons.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('sorting'); setIsFormOpen(false); }}
            className={`px-4 py-2.5 rounded-t-2xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 border-t border-x ${
              activeTab === 'sorting'
                ? 'bg-white text-orange-600 border-slate-200 shadow-sm -mb-px'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-200/60'
            }`}
          >
            <ArrowDownWideNarrow className="w-4 h-4 text-slate-700" />
            <span>Ordenação do Catálogo</span>
          </button>
        </div>

        {/* Notifications */}
        {successMessage && (
          <div className="mx-4 sm:mx-6 mt-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-emerald-800 text-xs sm:text-sm font-bold animate-fadeIn shrink-0">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mx-4 sm:mx-6 mt-4 p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2.5 text-red-800 text-xs sm:text-sm font-bold animate-fadeIn shrink-0">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          
          {/* TAB 1: CUPONS PROMOCIONAIS */}
          {activeTab === 'coupons' && (
            <div className="space-y-5">
              
              {/* Top Action Bar */}
              {!isFormOpen && (
                <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-2xl border border-orange-200/80">
                  <div>
                    <h4 className="text-slate-900 font-black text-sm">
                      Gerenciar Códigos Promocionais
                    </h4>
                    <p className="text-slate-600 text-xs mt-0.5">
                      Crie descontos em porcentagem e escolha produtos específicos ou toda a loja
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenNewCoupon}
                    className="bg-orange-600 hover:bg-orange-500 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 uppercase tracking-wide transition-all shrink-0 hover:scale-[1.02]"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Novo Cupom</span>
                  </button>
                </div>
              )}

              {/* FORM: Criar / Editar Cupom */}
              {isFormOpen ? (
                <form onSubmit={handleSaveCoupon} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-6 space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <h4 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                      <Tag className="w-4 h-4 text-orange-600" />
                      <span>{editingCouponId ? 'Editar Cupom Promocional' : 'Cadastrar Novo Cupom Promocional'}</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsFormOpen(false)}
                      className="text-slate-400 hover:text-slate-700 text-xs font-bold"
                    >
                      Cancelar
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Código Promocional */}
                    <div>
                      <label className="block text-xs font-black text-slate-800 uppercase tracking-wide mb-1">
                        Código do Cupom *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          placeholder="EX: PIPA15"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-sm font-black text-slate-900 uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-mono"
                        />
                        <Tag className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        O cliente digitará este código no carrinho
                      </p>
                    </div>

                    {/* Desconto de Porcentagem */}
                    <div>
                      <label className="block text-xs font-black text-slate-800 uppercase tracking-wide mb-1">
                        Desconto em Porcentagem (%) *
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min={1}
                          max={100}
                          required
                          value={discountPercent}
                          onChange={(e) => setDiscountPercent(Number(e.target.value))}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 pr-10"
                        />
                        <Percent className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                      </div>
                      {/* Presets */}
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <span className="text-[10px] text-slate-500 font-bold">Atalhos:</span>
                        {[5, 10, 15, 20, 25, 30, 50].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setDiscountPercent(preset)}
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded border transition-colors ${
                              discountPercent === preset
                                ? 'bg-orange-600 text-white border-orange-600'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {preset}%
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Descrição Opcional */}
                  <div>
                    <label className="block text-xs font-black text-slate-800 uppercase tracking-wide mb-1">
                      Descrição / Regra (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 10% OFF em todas as carretilhas e linhas especiais"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>

                  {/* Seleção de Itens da Promoção */}
                  <div className="pt-2 border-t border-slate-200 space-y-3">
                    <label className="block text-xs font-black text-slate-900 uppercase tracking-wide">
                      Onde este desconto será aplicado? *
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setAppliesToAll(true)}
                        className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${
                          appliesToAll
                            ? 'bg-orange-50 border-orange-500 ring-2 ring-orange-500/20'
                            : 'bg-white border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center mt-0.5 shrink-0 ${
                          appliesToAll ? 'border-orange-600 bg-orange-600 text-white' : 'border-slate-400'
                        }`}>
                          {appliesToAll && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <div>
                          <span className="block text-xs font-black text-slate-900">
                            Todos os produtos da loja
                          </span>
                          <span className="block text-[11px] text-slate-500 mt-0.5">
                            O desconto se aplica a qualquer item que o cliente colocar no carrinho
                          </span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAppliesToAll(false)}
                        className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${
                          !appliesToAll
                            ? 'bg-orange-50 border-orange-500 ring-2 ring-orange-500/20'
                            : 'bg-white border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center mt-0.5 shrink-0 ${
                          !appliesToAll ? 'border-orange-600 bg-orange-600 text-white' : 'border-slate-400'
                        }`}>
                          {!appliesToAll && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <div>
                          <span className="block text-xs font-black text-slate-900">
                            Selecionar itens específicos
                          </span>
                          <span className="block text-[11px] text-slate-500 mt-0.5">
                            O desconto só calcula sobre os produtos marcados na lista abaixo
                          </span>
                        </div>
                      </button>
                    </div>

                    {/* Interactive Product Checklist (Only when specific items selected) */}
                    {!appliesToAll && (
                      <div className="bg-white border border-slate-300 rounded-2xl p-3 sm:p-4 space-y-3 animate-fadeIn">
                        
                        {/* Selector Controls */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                          <div className="relative flex-1">
                            <input
                              type="text"
                              placeholder="Filtrar produtos por nome..."
                              value={productSearch}
                              onChange={(e) => setProductSearch(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                            />
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                          </div>

                          <div className="flex items-center gap-1.5 text-xs">
                            <button
                              type="button"
                              onClick={handleSelectAllFiltered}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg border border-slate-200 text-[11px]"
                            >
                              Marcar Filtrados
                            </button>
                            <button
                              type="button"
                              onClick={handleClearSelection}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg border border-slate-200 text-[11px]"
                            >
                              Limpar
                            </button>
                          </div>
                        </div>

                        {/* Selected counter badge */}
                        <div className="flex items-center justify-between text-xs font-bold text-slate-600 bg-orange-50/60 px-3 py-1.5 rounded-lg border border-orange-200/60">
                          <span>Produtos selecionados para a promoção:</span>
                          <span className="bg-orange-600 text-white px-2 py-0.5 rounded-full font-black text-[11px]">
                            {applicableProductIds.length} {applicableProductIds.length === 1 ? 'item' : 'itens'}
                          </span>
                        </div>

                        {/* Product Checkboxes List */}
                        <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100">
                          {products.length === 0 ? (
                            <p className="text-xs text-slate-500 py-4 text-center">
                              Nenhum produto cadastrado no catálogo ainda.
                            </p>
                          ) : filteredProducts.length === 0 ? (
                            <p className="text-xs text-slate-500 py-4 text-center">
                              Nenhum produto encontrado com o filtro "{productSearch}".
                            </p>
                          ) : (
                            filteredProducts.map((p) => {
                              const isSelected = applicableProductIds.includes(p.id);
                              return (
                                <div
                                  key={p.id}
                                  onClick={() => handleToggleProductSelection(p.id)}
                                  className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-colors pt-2.5 ${
                                    isSelected ? 'bg-orange-50/70 border border-orange-200' : 'hover:bg-slate-50'
                                  }`}
                                >
                                  <div className="shrink-0 text-orange-600">
                                    {isSelected ? (
                                      <CheckSquare className="w-5 h-5 text-orange-600" />
                                    ) : (
                                      <Square className="w-5 h-5 text-slate-400" />
                                    )}
                                  </div>

                                  <img
                                    src={p.image}
                                    alt={p.name}
                                    className="w-10 h-10 object-cover rounded-lg border border-slate-200 bg-white shrink-0"
                                    referrerPolicy="no-referrer"
                                  />

                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-black text-slate-900 truncate">
                                      {p.name}
                                    </p>
                                    <p className="text-[11px] text-slate-500">
                                      Categoria: <span className="capitalize">{p.category}</span> • R$ {p.price.toFixed(2).replace('.', ',')}
                                    </p>
                                  </div>

                                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 ${
                                    isSelected ? 'bg-orange-600 text-white' : 'bg-slate-200 text-slate-600'
                                  }`}>
                                    {isSelected ? 'Incluído' : 'Não'}
                                  </span>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Status Toggle */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                    <div>
                      <span className="text-xs font-black text-slate-900 block">
                        Status do Cupom
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        {couponActive ? 'Cupom ativo e aceito pelos clientes' : 'Cupom pausado temporariamente'}
                      </span>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={couponActive}
                      onClick={() => setCouponActive(!couponActive)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                        couponActive ? 'bg-emerald-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          couponActive ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Form Footer */}
                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setIsFormOpen(false)}
                      className="px-4 py-2 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-100 text-xs transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={savingCoupon}
                      className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs shadow-md transition-all flex items-center gap-1.5 uppercase tracking-wide disabled:opacity-50"
                    >
                      {savingCoupon ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Salvando...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>{editingCouponId ? 'Salvar Alterações' : 'Criar Cupom'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : null}

              {/* LIST OF COUPONS */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Cupons Cadastrados ({coupons.length})
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    Sincronizados em tempo real com o Firestore
                  </span>
                </div>

                {coupons.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 border border-slate-200 rounded-2xl p-6">
                    <Tag className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-700">Nenhum cupom cadastrado ainda</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Clique no botão "Novo Cupom" acima para criar seu primeiro cupom de desconto em porcentagem.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {coupons.map((coupon) => {
                      const isCopied = copiedCode === coupon.code;
                      const targetCount = coupon.applicableProductIds ? coupon.applicableProductIds.length : 0;
                      
                      return (
                        <div
                          key={coupon.id}
                          className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                            coupon.active
                              ? 'bg-white border-slate-200 hover:border-orange-300 shadow-sm'
                              : 'bg-slate-50 border-slate-200 opacity-70'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono font-black text-sm sm:text-base text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-300">
                                  {coupon.code}
                                </span>
                                <span className="bg-emerald-600 text-white font-black text-xs px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                                  <Percent className="w-3 h-3" />
                                  <span>{coupon.discountPercent}% OFF</span>
                                </span>
                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                  coupon.active 
                                    ? 'bg-emerald-100 text-emerald-800' 
                                    : 'bg-slate-200 text-slate-600'
                                }`}>
                                  {coupon.active ? 'Ativo' : 'Pausado'}
                                </span>
                              </div>

                              {coupon.description && (
                                <p className="text-xs text-slate-600 font-medium">
                                  {coupon.description}
                                </p>
                              )}

                              <div className="flex items-center gap-2 text-[11px] text-slate-500 flex-wrap">
                                <span className="font-semibold">
                                  {coupon.appliesToAll ? (
                                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                      ✓ Aplica em todos os produtos da loja
                                    </span>
                                  ) : (
                                    <span className="text-orange-700 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                                      🎯 Válido para {targetCount} {targetCount === 1 ? 'produto selecionado' : 'produtos selecionados'}
                                    </span>
                                  )}
                                </span>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                              <button
                                type="button"
                                onClick={() => handleCopyCode(coupon.code)}
                                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                                title="Copiar código do cupom"
                              >
                                {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleToggleCouponStatus(coupon)}
                                className={`text-[11px] font-bold px-2 py-1 rounded-lg transition-colors border ${
                                  coupon.active
                                    ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300'
                                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-300'
                                }`}
                              >
                                {coupon.active ? 'Pausar' : 'Ativar'}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleEditCoupon(coupon)}
                                className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                title="Editar cupom"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteCoupon(coupon)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Excluir cupom"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: ORDENAÇÃO DO CATÁLOGO */}
          {activeTab === 'sorting' && (
            <div className="space-y-6">
              
              {/* Master Toggle: Mais Novos Primeiro como Padrão */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 transition-all hover:border-orange-300">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-900 text-base">
                        Mais novos primeiro (Padrão)
                      </span>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        defaultSortNewest 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-slate-200 text-slate-600'
                      }`}>
                        {defaultSortNewest ? 'Ativado' : 'Desativado'}
                      </span>
                    </div>
                    <p className="text-slate-600 text-xs leading-relaxed">
                      Quando <strong>ativado</strong>, todos os clientes e visitantes verão os produtos recém-cadastrados ou atualizados no topo da lista por padrão.
                    </p>
                  </div>

                  {/* Toggle switch */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={defaultSortNewest}
                    onClick={() => setDefaultSortNewest(!defaultSortNewest)}
                    className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                      defaultSortNewest ? 'bg-orange-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        defaultSortNewest ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Fallback Selection (When "Mais novos primeiro" is deactivated) */}
              {!defaultSortNewest && (
                <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3 animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <ArrowDownWideNarrow className="w-4 h-4 text-amber-700" />
                    <span className="text-xs font-black text-amber-900 uppercase tracking-wide">
                      Selecione a nova ordenação padrão alternativa:
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {[
                      { id: 'relevance', label: 'Mais Relevantes (Destaque)', icon: '📌' },
                      { id: 'sales', label: 'Mais Vendidos', icon: '🔥' },
                      { id: 'price-asc', label: 'Menor Preço Primeiro', icon: '🏷️' },
                      { id: 'price-desc', label: 'Maior Preço Primeiro', icon: '💎' },
                      { id: 'rating', label: 'Melhores Avaliações', icon: '⭐' }
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setFallbackSort(opt.id as SortOption)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-left font-bold transition-all ${
                          fallbackSort === opt.id
                            ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                            : 'bg-white text-slate-700 border-amber-200/80 hover:bg-amber-100/50'
                        }`}
                      >
                        <span>{opt.icon}</span>
                        <span className="truncate">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Explanation Box */}
              <div className="p-3.5 bg-slate-100 rounded-2xl text-slate-600 text-xs flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-slate-500 shrink-0" />
                <span>
                  A preferência é salva no Firebase e replicada instantaneamente para todos os dispositivos e novos acessos.
                </span>
              </div>

              {/* Save Button for sorting */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleSaveSortingSettings}
                  disabled={savingSettings}
                  className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-xs shadow-md transition-all flex items-center gap-2 uppercase tracking-wide disabled:opacity-50"
                >
                  {savingSettings ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Salvar Ordenação</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          )}

        </div>

        {/* Modal Bottom Bar */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>Administrador: <strong>{userEmail || 'jeanpierreowner@gmail.com'}</strong></span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-200 transition-colors"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
