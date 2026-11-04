import React, { useState, useEffect, useRef } from 'react';
import { getEmbedVideoInfo, resolveVideoUrl } from '../utils/mediaStore';
import { AlertCircle, Video as VideoIcon, ExternalLink, RefreshCw, Smartphone, Play } from 'lucide-react';

export interface SmartVideoPlayerProps {
  url?: string;
  videoUrl?: string;
  title?: string;
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
}

export const SmartVideoPlayer: React.FC<SmartVideoPlayerProps> = ({
  url,
  videoUrl,
  title = 'Vídeo demonstrativo',
  className = 'w-full h-full object-contain',
  autoPlay = false,
  muted = false
}) => {
  const effectiveUrl = (url || videoUrl || '').trim();
  const [resolvedSrc, setResolvedSrc] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [isLocalDeviceMissing, setIsLocalDeviceMissing] = useState<boolean>(false);
  const [reloadKey, setReloadKey] = useState<number>(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    let isMounted = true;
    setHasError(false);
    setIsLocalDeviceMissing(false);
    setLoading(true);

    if (!effectiveUrl) {
      setResolvedSrc('');
      setLoading(false);
      return;
    }

    // Check if it's a local-video scheme
    if (effectiveUrl.startsWith('local-video://')) {
      resolveVideoUrl(effectiveUrl)
        .then((src) => {
          if (!isMounted) return;
          if (src) {
            setResolvedSrc(src);
            setLoading(false);
          } else {
            // Local video is stored on another machine/device
            setIsLocalDeviceMissing(true);
            setLoading(false);
          }
        })
        .catch(() => {
          if (isMounted) {
            setIsLocalDeviceMissing(true);
            setLoading(false);
          }
        });
      return () => {
        isMounted = false;
      };
    }

    // Regular URL / embed / data url
    setResolvedSrc(effectiveUrl);
    setLoading(false);

    return () => {
      isMounted = false;
    };
  }, [effectiveUrl, reloadKey]);

  if (!effectiveUrl) {
    return (
      <div className="w-full h-full min-h-[180px] bg-slate-900 rounded-xl flex flex-col items-center justify-center text-slate-400 text-xs p-4">
        <VideoIcon className="w-7 h-7 mb-1.5 opacity-50 text-slate-500" />
        <span className="font-semibold text-slate-400">Nenhum vídeo anexado</span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full h-full min-h-[200px] bg-slate-950 rounded-xl flex flex-col items-center justify-center text-slate-400 gap-2 p-4">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold text-slate-300">Carregando vídeo...</span>
      </div>
    );
  }

  // If it was a local file uploaded on another device that doesn't exist in current IndexedDB
  if (isLocalDeviceMissing) {
    return (
      <div className="w-full h-full min-h-[220px] bg-slate-900 rounded-xl border border-slate-800 p-5 flex flex-col items-center justify-center text-center text-slate-300">
        <div className="w-11 h-11 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center mb-2.5 border border-amber-500/20">
          <Smartphone className="w-5 h-5" />
        </div>
        <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1">
          Vídeo Salvo no Celular do Administrador
        </h4>
        <p className="text-[11px] text-slate-400 max-w-sm leading-relaxed mb-3">
          Este vídeo foi gravado na memória interna do aparelho de cadastro. Para que todos os clientes vejam online sem erro, adicione um link do <strong>YouTube, Shorts, TikTok ou Shopee</strong>.
        </p>
        <span className="text-[10px] bg-slate-800 text-amber-300 px-2.5 py-1 rounded-full border border-slate-700 font-mono">
          {effectiveUrl.slice(0, 32)}...
        </span>
      </div>
    );
  }

  const { type, embedUrl, originalUrl } = getEmbedVideoInfo(resolvedSrc || effectiveUrl);

  // If direct HTML5 video threw an error
  if (hasError) {
    return (
      <div className="w-full h-full min-h-[200px] bg-slate-900 rounded-xl border border-rose-900/30 p-5 flex flex-col items-center justify-center text-center text-slate-300">
        <AlertCircle className="w-8 h-8 text-rose-400 mb-2" />
        <h4 className="text-xs font-bold text-white mb-1">
          Não foi possível reproduzir diretamente
        </h4>
        <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed mb-3">
          O formato do vídeo ou permissões do servidor de origem podem requerer abertura direta.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => {
              setHasError(false);
              setReloadKey(prev => prev + 1);
            }}
            className="bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors border border-slate-700"
          >
            <RefreshCw className="w-3 h-3 text-orange-400" />
            <span>Tentar Novamente</span>
          </button>

          {originalUrl && !originalUrl.startsWith('local-video://') && !originalUrl.startsWith('data:') && (
            <a
              href={originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-orange-600 hover:bg-orange-500 text-white text-[11px] font-black px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shadow-md"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Abrir no Navegador</span>
            </a>
          )}
        </div>
      </div>
    );
  }

  // YouTube / Vimeo / Google Drive iframe Embeds
  if (type === 'youtube' || type === 'vimeo' || type === 'gdrive') {
    return (
      <div className="w-full h-full min-h-[220px] bg-black rounded-xl overflow-hidden flex flex-col items-center justify-center relative group">
        <iframe
          src={embedUrl}
          title={title}
          className="w-full h-full border-0 aspect-video rounded-xl"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
        />

        {/* Quick External Link Overlay */}
        {originalUrl && (
          <a
            href={originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-2 right-2 bg-black/75 hover:bg-black text-white text-[10px] font-bold px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 border border-white/20 shadow-md backdrop-blur-sm"
            title="Abrir em nova aba"
          >
            <ExternalLink className="w-3 h-3 text-amber-400" />
            <span>Assistir Fora</span>
          </a>
        )}
      </div>
    );
  }

  // Direct HTML5 Video (MP4, WebM, OGG, Shopee CDN, Blob URL, Data URL)
  return (
    <div className="w-full h-full min-h-[200px] bg-black rounded-xl overflow-hidden flex items-center justify-center relative group">
      <video
        ref={videoRef}
        src={resolvedSrc || effectiveUrl}
        controls
        playsInline
        autoPlay={autoPlay}
        muted={autoPlay || muted} // Browser policy: unmuted autoplay is blocked by default
        preload="metadata"
        className={className}
        onError={() => setHasError(true)}
      >
        Seu navegador não suporta reprodução deste formato de vídeo.
      </video>

      {/* Direct external link button if online URL */}
      {originalUrl && !originalUrl.startsWith('local-video://') && !originalUrl.startsWith('data:') && !originalUrl.startsWith('blob:') && (
        <a
          href={originalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-2 right-2 bg-black/75 hover:bg-black text-white text-[10px] font-bold px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 border border-white/20 shadow-md backdrop-blur-sm z-10"
          title="Abrir vídeo original em nova aba"
        >
          <ExternalLink className="w-3 h-3 text-orange-400" />
          <span>Abrir Vídeo</span>
        </a>
      )}
    </div>
  );
};
