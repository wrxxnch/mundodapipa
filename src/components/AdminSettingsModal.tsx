import React, { useState, useEffect } from 'react';
import { X, Sparkles, Check, Settings, ArrowDownWideNarrow, ShieldCheck, RefreshCw, AlertCircle } from 'lucide-react';
import { CatalogSettings, getLocalCatalogSettings, saveCatalogSettingsToFirestore } from '../lib/firebase';
import { SortOption } from '../types';

interface AdminSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: CatalogSettings;
  onSettingsSaved: (newSettings: CatalogSettings) => void;
  userEmail?: string;
}

export const AdminSettingsModal: React.FC<AdminSettingsModalProps> = ({
  isOpen,
  onClose,
  currentSettings,
  onSettingsSaved,
  userEmail
}) => {
  const [defaultSortNewest, setDefaultSortNewest] = useState(currentSettings.defaultSortNewest);
  const [fallbackSort, setFallbackSort] = useState<SortOption>(
    (currentSettings.defaultSortOption as SortOption) || 'newest'
  );
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDefaultSortNewest(currentSettings.defaultSortNewest);
      setFallbackSort((currentSettings.defaultSortOption as SortOption) || 'newest');
      setSuccessMessage(null);
      setErrorMessage(null);
    }
  }, [isOpen, currentSettings]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setSaving(true);
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
      setSuccessMessage('Configurações salvas e aplicadas com sucesso em tempo real!');
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Erro ao salvar configurações no Firebase.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-5 text-white flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-orange-600/30 border border-orange-500/50 flex items-center justify-center text-orange-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                Painel Admin: Ordenação do Catálogo
              </h3>
              <p className="text-slate-400 text-xs font-medium">
                Defina como os produtos aparecem para todos os visitantes
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

        {/* Content */}
        <div className="p-6 space-y-6">
          {successMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm font-bold animate-fadeIn">
              <Check className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-800 text-sm font-bold">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

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

        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-100 text-xs transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-xs shadow-md transition-all flex items-center gap-2 uppercase tracking-wide disabled:opacity-50"
          >
            {saving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Salvar Configuração</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
