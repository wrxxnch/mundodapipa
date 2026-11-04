import React from 'react';
import { 
  SlidersHorizontal, Sparkles, Flame, ArrowDownUp, 
  ArrowUp, ArrowDown, Star, Settings, Check 
} from 'lucide-react';
import { SortOption } from '../types';

interface ProductSortToolbarProps {
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  isAdmin?: boolean;
  onOpenAdminSettings?: () => void;
  defaultSortNewest?: boolean;
}

export const ProductSortToolbar: React.FC<ProductSortToolbarProps> = ({
  sortBy,
  onSortChange,
  isAdmin = false,
  onOpenAdminSettings,
  defaultSortNewest = true
}) => {
  const sortTabs: { id: SortOption; label: string; shortLabel: string; icon: React.ReactNode; isNew?: boolean }[] = [
    { 
      id: 'newest', 
      label: 'Mais Novos', 
      shortLabel: 'Mais Novos',
      icon: <Sparkles className="w-3.5 h-3.5" />,
      isNew: true
    },
    { 
      id: 'sales', 
      label: 'Mais Vendidos', 
      shortLabel: 'Vendidos',
      icon: <Flame className="w-3.5 h-3.5" /> 
    },
    { 
      id: 'price-asc', 
      label: 'Menor Preço', 
      shortLabel: 'Menor R$',
      icon: <ArrowDown className="w-3.5 h-3.5" /> 
    },
    { 
      id: 'price-desc', 
      label: 'Maior Preço', 
      shortLabel: 'Maior R$',
      icon: <ArrowUp className="w-3.5 h-3.5" /> 
    },
    { 
      id: 'rating', 
      label: 'Melhores Avaliações', 
      shortLabel: 'Avaliações',
      icon: <Star className="w-3.5 h-3.5" /> 
    },
    { 
      id: 'relevance', 
      label: 'Destaques', 
      shortLabel: 'Destaques',
      icon: <ArrowDownUp className="w-3.5 h-3.5" /> 
    }
  ];

  return (
    <div className="w-full flex flex-col gap-2.5">
      {/* Tab bar header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-black text-slate-700 uppercase tracking-wider">
          <SlidersHorizontal className="w-4 h-4 text-orange-500" />
          <span>Ordenar por:</span>
          {sortBy === 'newest' && (
            <span className="bg-orange-100 text-orange-800 text-[10px] font-black px-2 py-0.5 rounded-full ml-1">
              Recentes Primeiro
            </span>
          )}
        </div>

        {/* Admin Quick Setting Button */}
        {isAdmin && onOpenAdminSettings && (
          <button
            type="button"
            onClick={onOpenAdminSettings}
            className="flex items-center gap-1.5 text-[11px] font-black text-slate-700 hover:text-orange-600 bg-slate-100 hover:bg-orange-50 px-3 py-1.5 rounded-xl border border-slate-200 transition-colors cursor-pointer"
            title="Painel Admin: Cupons Promocionais e Ordenação do Catálogo"
          >
            <Settings className="w-3.5 h-3.5 text-orange-500" />
            <span>Painel Admin: Cupons & Ordenação</span>
          </button>
        )}
      </div>

      {/* Tabs navigation row */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
        {sortTabs.map((tab) => {
          const isActive = sortBy === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSortChange(tab.id)}
              className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all transform active:scale-95 ${
                isActive
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-500/20 font-black'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-xs hover:border-slate-300'
              }`}
            >
              <span className={isActive ? 'text-white' : 'text-orange-500'}>
                {tab.icon}
              </span>
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.shortLabel}</span>
              {tab.isNew && !isActive && (
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
