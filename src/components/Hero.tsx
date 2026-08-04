import React, { useRef, useEffect } from 'react';
import { ShoppingBag, Award, Star, ExternalLink, ShieldCheck, Sparkles } from 'lucide-react';
import logoImg from '../assets/images/mundo_pipa_logo_1785770997796.jpg';
import { SHOPEE_STORE_URL } from '../data/products';

interface HeroProps {
  onExploreClick: () => void;
}

interface Diamond {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseVx: number;
  baseVy: number;
  size: number;
  color: string;
  rotation: number;
  rotSpeed: number;
  opacity: number;
}

export const Hero: React.FC<HeroProps> = ({ onExploreClick }) => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({ x: -1000, y: -1000, active: false });

  useEffect(() => {
    // Check if mobile screen (width < 768px) to disable animation for lightweight mobile performance
    if (window.innerWidth < 768) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrameId: number;
    let width = (canvas.width = canvas.parentElement?.offsetWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.offsetHeight || 500);

    const colors = [
      '#EF4444', // Red
      '#F59E0B', // Amber/Yellow
      '#10B981', // Emerald Green
      '#3B82F6', // Sky Blue
      '#8B5CF6', // Purple
      '#EC4899', // Pink
      '#F97316', // Bright Orange
      '#06B6D4', // Cyan
      '#FFFFFF'  // White
    ];

    // Generate random diamonds (rhombus kites)
    const numDiamonds = 28;
    const diamonds: Diamond[] = Array.from({ length: numDiamonds }, () => {
      const size = Math.random() * 22 + 14; // 14px to 36px
      const baseVx = (Math.random() - 0.5) * 1.2;
      const baseVy = -Math.random() * 0.8 - 0.3; // Float slightly upward
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: baseVx,
        vy: baseVy,
        baseVx,
        baseVy,
        size,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.025,
        opacity: Math.random() * 0.55 + 0.35
      };
    });

    const handleResize = () => {
      if (window.innerWidth < 768) return;
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.offsetWidth;
      height = canvas.height = canvas.parentElement.offsetHeight;
    };

    window.addEventListener('resize', handleResize);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const mouse = mouseRef.current;
      const repelRadius = 170;

      diamonds.forEach((d) => {
        // Mouse interaction: repel / avoid mouse
        if (mouse.active) {
          const dx = d.x - mouse.x;
          const dy = d.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < repelRadius && dist > 0) {
            const force = ((repelRadius - dist) / repelRadius) * 8.5;
            d.vx += (dx / dist) * force;
            d.vy += (dy / dist) * force;
          }
        }

        // Return smoothly to base drifting velocity (friction/damping)
        d.vx += (d.baseVx - d.vx) * 0.04;
        d.vy += (d.baseVy - d.vy) * 0.04;

        // Cap max velocity
        const speed = Math.sqrt(d.vx * d.vx + d.vy * d.vy);
        const maxSpeed = 10;
        if (speed > maxSpeed) {
          d.vx = (d.vx / speed) * maxSpeed;
          d.vy = (d.vy / speed) * maxSpeed;
        }

        // Update positions & rotation
        d.x += d.vx;
        d.y += d.vy;
        d.rotation += d.rotSpeed;

        // Wrap around boundaries
        const margin = 60;
        if (d.x < -margin) d.x = width + margin;
        if (d.x > width + margin) d.x = -margin;
        if (d.y < -margin) d.y = height + margin;
        if (d.y > height + margin) d.y = -margin;

        // Render Diamond (Losango / Pipa)
        ctx.save();
        ctx.translate(d.x, d.y);
        ctx.rotate(d.rotation);
        ctx.globalAlpha = d.opacity;

        // Outer glow/shadow
        ctx.shadowColor = d.color;
        ctx.shadowBlur = 8;

        // Draw filled Losango (Rhombus)
        ctx.beginPath();
        ctx.moveTo(0, -d.size * 1.3);        // Top
        ctx.lineTo(d.size * 0.85, 0);       // Right
        ctx.lineTo(0, d.size * 1.3);         // Bottom
        ctx.lineTo(-d.size * 0.85, 0);      // Left
        ctx.closePath();
        ctx.fillStyle = d.color;
        ctx.fill();

        // White border contour
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // Inner kite cross lines (Cruzeta)
        ctx.beginPath();
        ctx.moveTo(0, -d.size * 1.3);
        ctx.lineTo(0, d.size * 1.3);
        ctx.moveTo(-d.size * 0.85, 0);
        ctx.lineTo(d.size * 0.85, 0);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Trailing kite tail (Rabiola)
        ctx.beginPath();
        ctx.moveTo(0, d.size * 1.3);
        ctx.quadraticCurveTo(
          Math.sin(d.rotation * 3) * 14,
          d.size * 2.2,
          Math.cos(d.rotation * 2) * 10,
          d.size * 3.2
        );
        ctx.strokeStyle = d.color;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.restore();
      });

      animFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animFrameId);
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!sectionRef.current) return;
    const rect = sectionRef.current.getBoundingClientRect();
    mouseRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      active: true
    };
  };

  const handleMouseLeave = () => {
    mouseRef.current.active = false;
  };

  return (
    <section
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="kite-bg text-white py-14 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center text-center shadow-lg relative border-b border-sky-300/30 overflow-hidden select-none"
    >
      {/* Interactive Floating Diamond Kites Layer (Hidden on mobile for lightweight performance) */}
      <canvas
        ref={canvasRef}
        className="hidden md:block absolute inset-0 pointer-events-none z-0"
      />

      <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
        
        {/* Logo & Brand Badge */}
        <div className="flex items-center gap-3 bg-white/20 backdrop-blur-md px-5 py-2 rounded-full border border-white/40 text-xs sm:text-sm font-black uppercase tracking-widest text-white mb-6 shadow-xl hover:scale-105 transition-transform cursor-pointer">
          <img
            src={logoImg}
            alt="Logo Mundo da Pipa"
            className="w-9 h-9 sm:w-11 sm:h-11 rounded-full border-2 border-amber-400 shadow-lg object-cover bg-white"
            referrerPolicy="no-referrer"
          />
          <div className="flex flex-col text-left">
            <span className="text-amber-300 text-xs font-black leading-tight">MUNDO DA PIPA</span>
            <span className="text-[10px] sm:text-xs text-white/95 font-extrabold leading-none mt-0.5">Desde 1999 • Arte & Tradição</span>
          </div>
        </div>

        {/* Main Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black mb-4 drop-shadow-md tracking-tight uppercase leading-none font-sans">
          DEDICAÇÃO À ARTE
        </h1>

        <p className="text-lg sm:text-2xl font-semibold opacity-95 max-w-2xl leading-relaxed mb-8 text-sky-50 drop-shadow-sm">
          As melhores pipas, linhas e acessórios produzidos com a qualidade de quem ama o festival há mais de duas décadas.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <button
            onClick={onExploreClick}
            className="w-full sm:w-auto bg-white text-sky-600 hover:text-sky-700 px-8 py-4 rounded-xl font-black text-base sm:text-lg shadow-2xl uppercase tracking-wider transition-all transform hover:-translate-y-0.5 active:translate-y-0 border border-white flex items-center justify-center gap-2"
          >
            <ShoppingBag className="w-5 h-5 text-sky-600" />
            <span>Ver Catálogo</span>
          </button>

          <a
            href={SHOPEE_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 border-2 border-orange-400 text-white px-8 py-4 rounded-xl font-black text-base sm:text-lg shadow-2xl uppercase tracking-wider transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
          >
            <span>LOJA NA SHOPEE</span>
            <ExternalLink className="w-5 h-5" />
          </a>
        </div>

        {/* Highlights Bar */}
        <div className="mt-12 pt-6 border-t border-white/20 grid grid-cols-2 sm:grid-cols-4 gap-6 text-white text-xs sm:text-sm font-bold uppercase tracking-wider w-full max-w-3xl">
          <div className="flex items-center justify-center gap-2">
            <Award className="w-4 h-4 text-amber-300" />
            <span>25+ Anos no Mercado</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Bambu Selecionado</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Star className="w-4 h-4 text-amber-300" />
            <span>Nota 5.0 Shopee</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-300" />
            <span>Envio Seguro</span>
          </div>
        </div>

      </div>
    </section>
  );
};

