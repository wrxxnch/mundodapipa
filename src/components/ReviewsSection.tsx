import React, { useState, useEffect } from 'react';
import { Star, MessageSquareQuote, CheckCircle2, CornerDownRight } from 'lucide-react';
import { subscribeToReviews, CustomerReviewItem } from '../lib/firebase';

export const ReviewsSection: React.FC = () => {
  const [reviews, setReviews] = useState<CustomerReviewItem[]>([]);

  useEffect(() => {
    const unsub = subscribeToReviews((liveReviews) => {
      setReviews(liveReviews);
    });
    return () => unsub();
  }, []);

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

