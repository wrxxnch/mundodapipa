import React from 'react';
import { Award, Heart, Sparkles, ShieldCheck, Flag } from 'lucide-react';
import logoImg from '../assets/images/logo.png';

export const AboutSection: React.FC = () => {
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
                <span className="text-3xl font-black text-amber-400 font-sans">25+</span>
                <p className="text-xs text-slate-300 font-bold mt-1 uppercase tracking-wider">Anos de Paixão</p>
              </div>
              <div className="bg-slate-800/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-700/80">
                <span className="text-3xl font-black text-sky-400 font-sans">100k+</span>
                <p className="text-xs text-slate-300 font-bold mt-1 uppercase tracking-wider">Pipas Produzidas</p>
              </div>
            </div>
          </div>

          {/* Right Column: Story Text */}
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 bg-sky-500/10 border border-sky-400/30 text-sky-400 font-extrabold text-xs px-3 py-1 rounded-full uppercase tracking-widest mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Nossa Arte e Compromisso</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight uppercase tracking-tight">
              A Arte e a Paixão das Pipas no Sangue
            </h2>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed mt-4">
              Fundado em <strong className="text-amber-400">1999</strong>, o <strong className="text-white">Mundo da Pipa</strong> nasceu do amor pela tradição brasileira do festival de pipas e raias. O que começou como uma produção artesanal de bairro transformou-se em referência nacional de qualidade em armações, papel de seda e linhas.
            </p>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed mt-3">
              Cada pipa produzida carrega um rigoroso processo de seleção: varetas de bambu alinhadas e tratadas contra umidade, curvatura testada e papéis com estampas vibrantes e cortes de precisão para garantir um vôo estável e ágil.
            </p>

            {/* Values Bullet Points */}
            <div className="mt-6 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Bambu & Fibra Selecionados</h4>
                  <p className="text-xs text-slate-400">Matéria-prima de alta flexibilidade para excelente aerodinâmica e durabilidade no céu.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-sky-400/20 text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Heart className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Feito por Apaixonados por Pipas</h4>
                  <p className="text-xs text-slate-400">Respeito total aos praticantes, garantindo pipas calibradas prontas para o alto.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-400/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Flag className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Entrega Nacional com Segurança</h4>
                  <p className="text-xs text-slate-400">Embalagens reforçadas para que suas pipas cheguem perfeitamente intactas.</p>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};
