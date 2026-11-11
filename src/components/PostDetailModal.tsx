import React from 'react';
import { X, Calendar, User, Trash2, Share2, MessageCircle, ExternalLink, Sparkles } from 'lucide-react';
import { Post } from '../types';
import { UserProfile } from '../lib/firebase';
import { SmartVideoPlayer } from './SmartVideoPlayer';
import { FastImage } from './FastImage';

interface PostDetailModalProps {
  post: Post | null;
  onClose: () => void;
  user: UserProfile | null;
  onDeletePost?: (post: Post) => void;
}

export const PostDetailModal: React.FC<PostDetailModalProps> = ({
  post,
  onClose,
  user,
  onDeletePost
}) => {
  if (!post) return null;

  const formatDate = (isoDateString: string) => {
    try {
      const date = new Date(isoDateString);
      return new Intl.DateTimeFormat('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch {
      return isoDateString;
    }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `*${post.title || 'Novidade Mundo da Pipa'}*\n\n${post.content}\n\nConfira no site Mundo da Pipa: ${window.location.origin}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="relative bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-orange-600 text-white font-black flex items-center justify-center text-xs shadow-md">
              {post.author ? post.author.charAt(0).toUpperCase() : 'M'}
            </div>
            <div>
              <span className="font-bold text-sm text-white block leading-tight">
                {post.author || 'Mundo da Pipa'}
              </span>
              <span className="text-[11px] text-slate-400 capitalize">
                {formatDate(post.createdAt)}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {/* Post Title */}
          {post.title && (
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
              {post.title}
            </h2>
          )}

          {/* Video Player if present */}
          {post.videoUrl && (
            <div className="w-full rounded-2xl overflow-hidden bg-black shadow-lg border border-slate-800">
              <div className="aspect-video w-full">
                <SmartVideoPlayer 
                  url={post.videoUrl} 
                  title={post.title || 'Vídeo da publicação'} 
                />
              </div>
            </div>
          )}

          {/* Photo / Image if present */}
          {post.imageUrl && (
            <div className="w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm max-h-[460px] flex items-center justify-center">
              <FastImage
                src={post.imageUrl}
                alt={post.title || 'Foto do post'}
                updatedAt={post.createdAt}
                className="w-full h-auto max-h-[460px] object-contain rounded-2xl"
              />
            </div>
          )}

          {/* Full Post Text Content */}
          <div className="prose prose-slate max-w-none">
            <p className="text-slate-800 text-sm sm:text-base font-normal leading-relaxed whitespace-pre-line selection:bg-orange-100">
              {post.content}
            </p>
          </div>
        </div>

        {/* Modal Bottom Bar */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-all hover:scale-102"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Compartilhar no WhatsApp</span>
          </button>

          <div className="flex items-center gap-2">
            {(user?.role === 'admin' || user?.uid === post.authorId) && onDeletePost && (
              <button
                type="button"
                onClick={() => {
                  onDeletePost(post);
                  onClose();
                }}
                className="text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1 transition-colors border border-rose-200"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir Post</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs px-4 py-2 rounded-xl transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
