import React, { useState, useEffect } from 'react';
import { Award, Heart, Sparkles, Flag, Edit3 } from 'lucide-react';
import logoImg from '../assets/images/logo.png';
import { StoryContent, DEFAULT_STORY_CONTENT, subscribeToStoryContent } from '../lib/firebase';
import { EditStoryModal } from './EditStoryModal';

interface AboutSectionProps {
  isAdmin?: boolean;
}

export const AboutSection: React.FC<AboutSectionProps> = ({ isAdmin = false }) => {
  const [story, setStory] = useState<StoryContent>(DEFAULT_STORY_CONTENT);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToStoryContent((data) => {
      setStory(data);
    });
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  return (
    <section className="bg-slate-900 text-white py-16 sm:py-20 my-12 rounded-3xl relative overflow-hidden border border-slate-800 card-shadow">
      {/* Background Subtle Accent */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Column: Brand Emblem & Stats */}
          <div className="lg:col-span-5 text-center flex flex-col items-center">
            <div className="relative mb-6">
              <div className="w-44 h-44 sm:w-52 sm:h-52 rounded-full overflow-hidden border-4 border-amber-500 bg-slate-900 p-2 shadow-2xl hover:scale-105 transition-transform duration-500 flex items-center justify-center">
                <img
                  src={logoImg}
                  alt="Mundo da Pipa Arte desde 1999"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full mt-4">
              <div className="bg-slate-800/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-700/80">
                <span className="text-3xl font-black text-amber-400 font-sans">
                  {story.stat1Value || '25+'}
                </span>
                <p className="text-xs text-slate-300 font-bold mt-1 uppercase tracking-wider">
                  {story.stat1Label || 'Anos de Paixão'}
                </p>
              </div>
              <div className="bg-slate-800/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-700/80">
                <span className="text-3xl font-black text-sky-400 font-sans">
                  {story.stat2Value || '100k+'}
                </span>
                <p className="text-xs text-slate-300 font-bold mt-1 uppercase tracking-wider">
                  {story.stat2Label || 'Pipas Produzidas'}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Story Text */}
          <div className="lg:col-span-7">
            
            {/* Top row with Tag and Admin Edit Button */}
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="inline-flex items-center gap-2 bg-sky-500/10 border border-sky-400/30 text-sky-400 font-extrabold text-xs px-3 py-1 rounded-full uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{story.badge || 'Nossa Arte e Compromisso'}</span>
              </div>

              {isAdmin && (
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-black px-3.5 py-1.5 rounded-xl shadow flex items-center gap-1.5 uppercase tracking-wide transition-all transform hover:scale-105"
                  title="Editar o texto da história (Admin)"
                >
                  <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Editar Texto</span>
                </button>
              )}
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight uppercase tracking-tight">
              {story.title || 'A Arte e a Paixão das Pipas no Sangue'}
            </h2>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed mt-4 whitespace-pre-line">
              {story.paragraph1 || 'Fundado em 1999, o Mundo da Pipa nasceu do amor pela tradição brasileira do festival de pipas e raias.'}
            </p>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed mt-3 whitespace-pre-line">
              {story.paragraph2 || 'Cada pipa produzida carrega um rigoroso processo de seleção: varetas de bambu alinhadas e tratadas contra umidade.'}
            </p>

            {/* Values Bullet Points */}
            <div className="mt-6 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">{story.value1Title}</h4>
                  <p className="text-xs text-slate-400">{story.value1Desc}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-sky-400/20 text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Heart className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">{story.value2Title}</h4>
                  <p className="text-xs text-slate-400">{story.value2Desc}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-400/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Flag className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">{story.value3Title}</h4>
                  <p className="text-xs text-slate-400">{story.value3Desc}</p>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Admin Edit Story Modal */}
      {isAdmin && (
        <EditStoryModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          initialContent={story}
          onSaved={(newContent) => setStory(newContent)}
        />
      )}
    </section>
  );
};
