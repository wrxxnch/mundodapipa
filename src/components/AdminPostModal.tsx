import React, { useState } from 'react';
import { X, Send, Image as ImageIcon, Video, AlertCircle, Sparkles } from 'lucide-react';
import { Post } from '../types';
import { addPostToFirestore, UserProfile } from '../lib/firebase';
import { compressImageFile } from '../utils/imageCompressor';

interface AdminPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
}

export const AdminPostModal: React.FC<AdminPostModalProps> = ({
  isOpen,
  onClose,
  user
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [authorName, setAuthorName] = useState(user?.name || 'Mundo da Pipa');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setError(null);
      try {
        const compressed = await compressImageFile(file, 800, 800, 0.75);
        setImageUrl(compressed);
      } catch (err: any) {
        setError('Erro ao processar imagem: ' + (err.message || 'Tente outra foto'));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError('O conteúdo do post não pode ficar vazio.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await addPostToFirestore({
        title: title.trim() || undefined,
        content: content.trim(),
        author: authorName.trim() || 'Mundo da Pipa',
        authorId: user?.uid || '',
        imageUrl: imageUrl.trim() || undefined,
        videoUrl: videoUrl.trim() || undefined,
        createdAt: new Date().toISOString()
      });

      // Reset & close
      setTitle('');
      setContent('');
      setImageUrl('');
      setVideoUrl('');
      onClose();
    } catch (err: any) {
      console.error('Error creating post in Firestore:', err);
      setError('Erro ao salvar post no Firebase: ' + (err.message || 'Tente novamente'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-950 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-white tracking-tight uppercase">
                Novo Post no Firebase
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Publicar dica, novidade ou comunicado diretamente no Firestore
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Título do Post (Opcional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Chegaram novas raias de 50cm no estoque!"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Conteúdo / Mensagem <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escreva aqui a novidade, dica de combate, festival ou anúncio..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm font-medium text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Nome do Autor
            </label>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Mundo da Pipa"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
            />
          </div>

          {/* Image input / upload */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Foto / Imagem do Post (URL ou Arquivo)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://exemplo.com/foto.jpg ou carregue do celular"
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
              />
              <label className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer border border-slate-300">
                <ImageIcon className="w-3.5 h-3.5 text-slate-600" />
                <span>Foto</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFile}
                  className="hidden"
                />
              </label>
            </div>
            {imageUrl && (
              <div className="mt-2 relative w-full h-32 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="absolute top-1.5 right-1.5 bg-black/60 hover:bg-black text-white p-1 rounded-full text-xs"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Video URL */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Link de Vídeo (YouTube, Shorts ou Direto)
            </label>
            <div className="relative">
              <input
                type="text"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://youtube.com/shorts/... ou https://youtu.be/..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
              />
              <Video className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Submit button */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-black text-xs uppercase tracking-wider py-3.5 rounded-2xl shadow-lg hover:shadow-orange-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{loading ? 'Salvando no Firebase...' : 'Publicar Post no Firebase'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
