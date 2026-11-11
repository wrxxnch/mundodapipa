import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Sparkles, 
  Plus, 
  Trash2, 
  Calendar, 
  User, 
  RefreshCw, 
  Flame, 
  MessageSquare,
  ExternalLink,
  ShieldAlert,
  Database
} from 'lucide-react';
import { Post } from '../types';
import { 
  subscribeToPosts, 
  deletePostFromFirestore, 
  getPostsFromFirestore,
  UserProfile,
  subscribeToQuotaState,
  FIRESTORE_UPGRADE_URL,
  isFirestoreQuotaExhausted
} from '../lib/firebase';
import { SmartVideoPlayer } from './SmartVideoPlayer';
import { FastImage } from './FastImage';
import { AdminPostModal } from './AdminPostModal';
import { PostDetailModal } from './PostDetailModal';

interface CommunityPostsSectionProps {
  user: UserProfile | null;
}

export const CommunityPostsSection: React.FC<CommunityPostsSectionProps> = ({ user }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [quotaExhausted, setQuotaExhausted] = useState(isFirestoreQuotaExhausted);

  // Subscribe to quota state
  useEffect(() => {
    const unsub = subscribeToQuotaState((exhausted) => {
      setQuotaExhausted(exhausted);
    });
    return () => unsub();
  }, []);

  // Subscribe directly to Firebase Firestore in real-time
  useEffect(() => {
    const unsubscribe = subscribeToPosts(
      (realtimePosts) => {
        setPosts(realtimePosts);
        setLoading(false);
        setErrorNotice(null);
      },
      (err) => {
        console.warn('Posts Firestore subscription note:', err);
        setLoading(false);
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      const livePosts = await getPostsFromFirestore();
      setPosts(livePosts);
    } catch (e: any) {
      setErrorNotice('Erro ao buscar do Firebase: ' + e.message);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDeletePost = async (post: Post) => {
    if (!window.confirm(`Tem certeza que deseja apagar este post do Firebase Firestore permanentemente?`)) {
      return;
    }
    try {
      await deletePostFromFirestore(post.id);
    } catch (err: any) {
      alert('Erro ao deletar post do Firebase: ' + err.message);
    }
  };

  const formatDate = (isoDateString: string) => {
    try {
      const date = new Date(isoDateString);
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch {
      return isoDateString;
    }
  };

  return (
    <section id="posts" className="py-12 my-8 border-t border-slate-200 scroll-mt-24">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 bg-sky-100 text-sky-800 text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider border border-sky-200">
              <Database className="w-3.5 h-3.5 text-sky-600" />
              <span>Firebase Firestore em Tempo Real</span>
            </span>
            <span className="bg-orange-100 text-orange-800 text-xs font-black px-2.5 py-0.5 rounded-full">
              {posts.length} {posts.length === 1 ? 'publicação' : 'publicações'}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase">
            Mural de Novidades & Dicas das Pipas
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm font-medium mt-1">
            Posts, notícias, fotos de festivais e comunicados buscados diretamente do banco de dados na nuvem.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-1.5 transition-all"
            title="Atualizar busca do Firebase"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-orange-500' : 'text-slate-500'}`} />
            <span className="hidden sm:inline">Buscar do Firebase</span>
          </button>

          {user?.role === 'admin' ? (
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 uppercase tracking-wide transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Criar Post</span>
            </button>
          ) : (
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-slate-900 hover:bg-slate-800 text-amber-400 font-black text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 uppercase tracking-wide transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Publicar Post</span>
            </button>
          )}
        </div>
      </div>

      {quotaExhausted && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 text-xs">
          <div className="flex items-start sm:items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <p className="font-bold">
                Limite de leituras diárias do Firebase atingido no plano gratuito Spark.
              </p>
              <p className="text-amber-700 text-[11px] mt-0.5">
                Os posts e produtos continuam funcionando normalmente através do armazenamento local de alta velocidade. O limite do Firebase reseta automaticamente amanhã ou você pode atualizar para o plano Blaze sem limites.
              </p>
            </div>
          </div>
          <a
            href={FIRESTORE_UPGRADE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-amber-600 hover:bg-amber-700 text-white font-black text-xs px-3.5 py-2 rounded-xl shrink-0 inline-flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <span>Firebase Console</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {errorNotice && !quotaExhausted && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs font-semibold flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{errorNotice}</span>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Buscando posts do Firebase Firestore...
          </p>
        </div>
      ) : posts.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-3xl p-10 sm:p-14 text-center border border-slate-200 shadow-sm max-w-xl mx-auto">
          <div className="w-14 h-14 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Radio className="w-7 h-7" />
          </div>
          <h3 className="font-black text-lg text-slate-900 tracking-tight">
            Nenhum post no Firebase Firestore ainda
          </h3>
          <p className="text-slate-500 text-xs sm:text-sm mt-1.5 leading-relaxed">
            Os posts agora são buscados e salvos 100% diretamente no Firebase na nuvem, sem armazenamento local.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-5 bg-orange-600 hover:bg-orange-700 text-white font-black text-xs px-5 py-3 rounded-2xl shadow-md inline-flex items-center gap-2 uppercase tracking-wide transition-transform hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>Publicar Primeiro Post</span>
          </button>
        </div>
      ) : (
        /* Posts Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <article
              key={post.id}
              onClick={() => setSelectedPost(post)}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-orange-300 transition-all duration-300 flex flex-col overflow-hidden group cursor-pointer transform hover:-translate-y-1 relative"
            >
              {/* Media banner if present */}
              {post.imageUrl && (
                <div className="relative w-full h-48 bg-slate-100 overflow-hidden border-b border-slate-100">
                  <FastImage
                    src={post.imageUrl}
                    alt={post.title || 'Foto do post'}
                    updatedAt={post.createdAt}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3 pointer-events-none">
                    <span className="text-white text-xs font-bold drop-shadow">Clique para ver o post completo</span>
                  </div>
                </div>
              )}

              {/* Video Player if present */}
              {post.videoUrl && (
                <div 
                  className="p-3 bg-slate-950 aspect-video w-full overflow-hidden"
                  onClick={(e) => {
                    // Let user interact with player or click to expand
                  }}
                >
                  <SmartVideoPlayer url={post.videoUrl} videoUrl={post.videoUrl} title={post.title || 'Vídeo'} />
                </div>
              )}

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  {/* Top Metadata */}
                  <div className="flex items-center justify-between gap-2 text-[11px] font-semibold text-slate-500 mb-2.5">
                    <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                      <div className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-[10px] font-black">
                        {post.author ? post.author.charAt(0).toUpperCase() : 'M'}
                      </div>
                      <span className="truncate max-w-[120px]">{post.author || 'Mundo da Pipa'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-400">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(post.createdAt)}</span>
                    </div>
                  </div>

                  {/* Title */}
                  {post.title && (
                    <h3 className="font-black text-slate-900 text-base leading-snug mb-2 group-hover:text-orange-600 transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                  )}

                  {/* Body Content (Clean preview truncated) */}
                  <p className="text-slate-600 text-xs sm:text-sm font-normal leading-relaxed line-clamp-3">
                    {post.content}
                  </p>

                  <div className="mt-3 text-xs font-bold text-orange-600 flex items-center gap-1 group-hover:text-orange-700">
                    <span>Ler post completo</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Firebase Firestore
                  </span>

                  {(user?.role === 'admin' || user?.uid === post.authorId) && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePost(post);
                      }}
                      className="text-rose-500 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 transition-colors z-10"
                      title="Deletar post do Firebase"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Full Post Detail Modal */}
      <PostDetailModal
        post={selectedPost}
        onClose={() => setSelectedPost(null)}
        user={user}
        onDeletePost={handleDeletePost}
      />

      {/* Admin / User Post Creation Modal */}
      <AdminPostModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={user}
      />
    </section>
  );
};
