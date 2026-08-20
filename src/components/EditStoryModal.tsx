import React, { useState, useEffect } from 'react';
import { X, Save, RotateCcw, Sparkles, BookOpen, Award, Heart, Flag } from 'lucide-react';
import { StoryContent, DEFAULT_STORY_CONTENT, saveStoryContent } from '../lib/supabase';

interface EditStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialContent: StoryContent;
  onSaved: (content: StoryContent) => void;
}

export const EditStoryModal: React.FC<EditStoryModalProps> = ({
  isOpen,
  onClose,
  initialContent,
  onSaved
}) => {
  const [formData, setFormData] = useState<StoryContent>(initialContent);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setFormData(initialContent);
    setSavedSuccess(false);
  }, [initialContent, isOpen]);

  if (!isOpen) return null;

  const handleChange = (field: keyof StoryContent, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleResetDefault = () => {
    if (window.confirm('Deseja restaurar o texto e os destaques originais de fábrica?')) {
      setFormData(DEFAULT_STORY_CONTENT);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveStoryContent(formData);
    onSaved(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-100 my-4 sm:my-8 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center font-black shadow-md">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight">
                Editar História & Sobre Nós
              </h2>
              <p className="text-xs text-amber-400 font-medium">
                Personalize o texto, parágrafos, estatísticas e compromissos da marca
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

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          
          {/* Tag / Badge */}
          <div>
            <label className="block text-xs font-black uppercase text-slate-700 mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Selo / Etiqueta do Topo</span>
            </label>
            <input
              type="text"
              required
              value={formData.badge ?? ''}
              onChange={(e) => handleChange('badge', e.target.value)}
              placeholder="Ex: Nossa Arte e Compromisso"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white"
            />
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-black uppercase text-slate-700 mb-1">
              Título Principal
            </label>
            <input
              type="text"
              required
              value={formData.title ?? ''}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Ex: A Arte e a Paixão das Pipas no Sangue"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-base font-black text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white"
            />
          </div>

          {/* Paragraph 1 */}
          <div>
            <label className="block text-xs font-black uppercase text-slate-700 mb-1">
              Primeiro Parágrafo (História / Origem)
            </label>
            <textarea
              rows={3}
              required
              value={formData.paragraph1 ?? ''}
              onChange={(e) => handleChange('paragraph1', e.target.value)}
              placeholder="Conte como a marca começou, ano de fundação, tradição..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white"
            />
          </div>

          {/* Paragraph 2 */}
          <div>
            <label className="block text-xs font-black uppercase text-slate-700 mb-1">
              Segundo Parágrafo (Processo / Qualidade)
            </label>
            <textarea
              rows={3}
              required
              value={formData.paragraph2 ?? ''}
              onChange={(e) => handleChange('paragraph2', e.target.value)}
              placeholder="Conte sobre materiais, varetas de bambu, aerodinâmica e cuidado..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white"
            />
          </div>

          {/* Statistics Box */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">
              Estatísticas & Números de Destaque
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm space-y-2">
                <span className="text-[11px] font-extrabold text-amber-600 uppercase block">Estatística 1</span>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Número / Valor</label>
                  <input
                    type="text"
                    value={formData.stat1Value ?? ''}
                    onChange={(e) => handleChange('stat1Value', e.target.value)}
                    placeholder="Ex: 25+"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-black text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Rótulo / Descrição</label>
                  <input
                    type="text"
                    value={formData.stat1Label ?? ''}
                    onChange={(e) => handleChange('stat1Label', e.target.value)}
                    placeholder="Ex: Anos de Paixão"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800"
                  />
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm space-y-2">
                <span className="text-[11px] font-extrabold text-sky-600 uppercase block">Estatística 2</span>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Número / Valor</label>
                  <input
                    type="text"
                    value={formData.stat2Value ?? ''}
                    onChange={(e) => handleChange('stat2Value', e.target.value)}
                    placeholder="Ex: 100k+"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-black text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Rótulo / Descrição</label>
                  <input
                    type="text"
                    value={formData.stat2Label ?? ''}
                    onChange={(e) => handleChange('stat2Label', e.target.value)}
                    placeholder="Ex: Pipas Produzidas"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3 Value Cards */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">
              3 Pilares de Compromisso
            </h4>

            {/* Value 1 */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-orange-500" />
                <span className="text-xs font-black text-slate-900">Pilar 1: Matéria-Prima</span>
              </div>
              <input
                type="text"
                value={formData.value1Title ?? ''}
                onChange={(e) => handleChange('value1Title', e.target.value)}
                placeholder="Título do Pilar 1"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900"
              />
              <textarea
                rows={2}
                value={formData.value1Desc ?? ''}
                onChange={(e) => handleChange('value1Desc', e.target.value)}
                placeholder="Descrição do Pilar 1"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-700"
              />
            </div>

            {/* Value 2 */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-sky-500" />
                <span className="text-xs font-black text-slate-900">Pilar 2: Paixão e Cuidado</span>
              </div>
              <input
                type="text"
                value={formData.value2Title ?? ''}
                onChange={(e) => handleChange('value2Title', e.target.value)}
                placeholder="Título do Pilar 2"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900"
              />
              <textarea
                rows={2}
                value={formData.value2Desc ?? ''}
                onChange={(e) => handleChange('value2Desc', e.target.value)}
                placeholder="Descrição do Pilar 2"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-700"
              />
            </div>

            {/* Value 3 */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center gap-2">
                <Flag className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-black text-slate-900">Pilar 3: Entrega e Confiança</span>
              </div>
              <input
                type="text"
                value={formData.value3Title ?? ''}
                onChange={(e) => handleChange('value3Title', e.target.value)}
                placeholder="Título do Pilar 3"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900"
              />
              <textarea
                rows={2}
                value={formData.value3Desc ?? ''}
                onChange={(e) => handleChange('value3Desc', e.target.value)}
                placeholder="Descrição do Pilar 3"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-700"
              />
            </div>
          </div>

          {/* Footer Controls */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={handleResetDefault}
              className="text-xs text-slate-500 hover:text-red-600 font-bold flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar Padrão</span>
            </button>

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
                className="bg-orange-600 hover:bg-orange-700 text-white font-black text-xs px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 uppercase tracking-wide transition-all"
              >
                <Save className="w-4 h-4" />
                <span>{savedSuccess ? 'Salvo!' : 'Salvar Alterações'}</span>
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};
