import React, { useState, useEffect } from 'react';
import { getEmbedVideoInfo, resolveVideoUrl } from '../utils/mediaStore';
import { AlertCircle, Video as VideoIcon } from 'lucide-react';

interface SmartVideoPlayerProps {
  url: string;
  className?: string;
  autoPlay?: boolean;
}

export const SmartVideoPlayer: React.FC<SmartVideoPlayerProps> = ({
  url,
  className = 'w-full h-full object-contain',
  autoPlay = false
}) => {
  const [resolvedSrc, setResolvedSrc] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    setHasError(false);
    setLoading(true);

    if (!url) {
      setResolvedSrc('');
      setLoading(false);
      return;
    }

    resolveVideoUrl(url)
      .then((src) => {
        if (isMounted) {
          setResolvedSrc(src);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setHasError(true);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [url]);

  if (!url) {
    return (
      <div className="w-full h-full bg-slate-900 flex items-center justify-center text-slate-400 text-xs">
        <VideoIcon className="w-6 h-6 mb-1 opacity-50" />
      </div>
    );
  }

  const { type, embedUrl } = getEmbedVideoInfo(resolvedSrc || url);

  if (loading) {
    return (
      <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-2 p-4">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold">Carregando vídeo...</span>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center text-red-400 gap-1 p-4 text-center">
        <AlertCircle className="w-6 h-6" />
        <span className="text-xs font-bold">Erro ao reproduzir o vídeo.</span>
      </div>
    );
  }

  // YouTube or Vimeo or Google Drive Embed
  if (type === 'youtube' || type === 'vimeo' || type === 'gdrive') {
    return (
      <div className="w-full h-full bg-black rounded-xl overflow-hidden flex items-center justify-center">
        <iframe
          src={embedUrl}
          title="Vídeo demonstrativo"
          className="w-full h-full border-0 aspect-video rounded-xl"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  }

  // Direct HTML5 Video (or resolved Blob URL from IndexedDB / MP4 link)
  return (
    <div className="w-full h-full bg-black rounded-xl overflow-hidden flex items-center justify-center">
      <video
        src={resolvedSrc || url}
        controls
        playsInline
        autoPlay={autoPlay}
        preload="metadata"
        className={className}
        onError={() => setHasError(true)}
      >
        Seu navegador não suporta reprodução de vídeo.
      </video>
    </div>
  );
};
