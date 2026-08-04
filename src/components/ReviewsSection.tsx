import React from 'react';
import { Star, MessageSquareQuote, CheckCircle2, CornerDownRight } from 'lucide-react';

export const ReviewsSection: React.FC = () => {
  const reviews = [
    {
      id: 1,
      author: 'theus878',
      variation: 'Variação: 2P, Emborrachada',
      rating: 5,
      date: '2026-05-24',
      comment: 'linha lisa emborrachada de extrema qualidade, recomendo. comprarei mais vezes',
      badges: ['Custo-benefício: perfeito', 'Parecido c/ anúncio: sim', 'Segurança: ótima'],
      sellerReply: 'Muito obrigado pela preferência 😃 Deus abençoe 🙏🏻'
    },
    {
      id: 2,
      author: 'u45p9ldsxm',
      variation: 'Variação: 2P, Emborrachada',
      rating: 5,
      date: '2026-07-09',
      comment: 'sim linha lisinha de qualidade',
      badges: ['Custo-benefício: excelente', 'Parecido c/ anúncio: sim', 'Segurança: bom'],
      sellerReply: 'Muito obrigado pela preferência 😃'
    },
    {
      id: 3,
      author: 'ivanete1212',
      variation: 'Variação: 2P, Meio termo',
      rating: 5,
      date: '2026-06-30',
      comment: 'Excelente produto! Chegou no prazo, bem embalado e pronto para uso.',
      badges: ['Entrega rápida', 'Qualidade Garantida'],
      sellerReply: 'Muito obrigado pela preferência 😃'
    },
    {
      id: 4,
      author: 'maianaigor',
      variation: 'Variação: 2P, Emborrachada',
      rating: 5,
      date: '2026-05-18',
      comment: 'Linha muito macia, resistente e de fácil manuseio. Recomendo muito a loja Mundo da Pipa!',
      badges: ['Qualidade Premium', 'Super Recomendo'],
      sellerReply: 'Muito obrigado pela preferência 😃'
    }
  ];

  return (
    <section className="py-12 my-8 border-t border-slate-200">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-1.5 bg-orange-100 text-orange-800 text-xs font-black px-3.5 py-1.5 rounded-full mb-3 border border-orange-200">
          <MessageSquareQuote className="w-4 h-4 text-orange-600" />
          <span>Avaliações Reais Extraídas da Loja Shopee Oficial (365+ Avaliações)</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black font-serif text-slate-900">
          O que dizem nossos Compradores na Shopee
        </h2>
        <p className="text-slate-600 text-xs sm:text-sm mt-1">
          Depoimentos autênticos com respostas oficiais da equipe Mundo da Pipa
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        {reviews.map((rev) => (
          <div
            key={rev.id}
            className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-black text-xs text-slate-900">{rev.author}</span>
                  <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Compra Verificada Shopee
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">{rev.date}</span>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <div className="flex text-amber-400">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                  ))}
                </div>
                <span className="text-[11px] text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded">
                  {rev.variation}
                </span>
              </div>

              <p className="text-slate-800 text-xs sm:text-sm font-medium leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100">
                "{rev.comment}"
              </p>

              <div className="flex flex-wrap gap-1.5 mt-3">
                {rev.badges.map((badge, idx) => (
                  <span key={idx} className="bg-orange-50 text-orange-700 text-[10px] font-extrabold px-2 py-0.5 rounded-lg border border-orange-200">
                    {badge}
                  </span>
                ))}
              </div>
            </div>

            {/* Seller Response */}
            <div className="mt-4 pt-3 border-t border-slate-100 bg-amber-50/50 p-3 rounded-2xl border border-amber-100 flex items-start gap-2">
              <CornerDownRight className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-[11px] font-black text-orange-600 uppercase tracking-wide">
                  Resposta do Vendedor (Mundo da Pipa):
                </span>
                <p className="text-xs text-slate-800 font-medium mt-0.5">
                  {rev.sellerReply}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

