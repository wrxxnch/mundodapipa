import React, { useRef, useEffect } from 'react';
import { ShoppingBag, Award, Star, ExternalLink, ShieldCheck, Sparkles, Flame, Rocket, MessageCircle, Instagram, Radio } from 'lucide-react';
import logoImg from '../assets/images/mundo_pipa_logo_1785770997796.jpg';
import alienMascotImg from '../assets/images/alien_mascot_badge_1786676801815.jpg';
import cosmicHeroImg from '../assets/images/cosmic_space_hero_1786676790111.jpg';
import { SHOPEE_STORE_URL, WHATSAPP_NUMBER } from '../data/products';

interface HeroProps {
  onExploreClick: () => void;
}

interface CelestialObject {
  type: 'diamond' | 'ufo' | 'comet' | 'star';
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
  tailLength?: number;
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
    let height = (canvas.height = canvas.parentElement?.offsetHeight || 550);

    const psychedelicColors = [
      '#39FF14', // Neon Alien Green
      '#00F0FF', // Cosmic Cyan
      '#FF007F', // Neon Magenta
      '#FF9900', // Solar Flare Orange
      '#A855F7', // Psychedelic Purple
      '#FACC15', // Starlight Gold
      '#38BDF8', // Electric Sky
      '#FFFFFF'  // Pure Starlight
    ];

    // Generate celestial objects: Diamonds (kites), UFOs, Comets and Glowing Stars
    const objects: CelestialObject[] = [];

    // 16 Psychedelic Diamond Kites
    for (let i = 0; i < 16; i++) {
      const baseVx = (Math.random() - 0.5) * 1.4;
      const baseVy = -Math.random() * 0.9 - 0.3;
      objects.push({
        type: 'diamond',
        x: Math.random() * width,
        y: Math.random() * height,
        vx: baseVx,
        vy: baseVy,
        baseVx,
        baseVy,
        size: Math.random() * 20 + 14,
        color: psychedelicColors[Math.floor(Math.random() * psychedelicColors.length)],
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.03,
        opacity: Math.random() * 0.6 + 0.35
      });
    }

    // 4 UFO Saucers
    for (let i = 0; i < 4; i++) {
      const baseVx = (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 0.8 + 0.4);
      const baseVy = (Math.random() - 0.5) * 0.4;
      objects.push({
        type: 'ufo',
        x: Math.random() * width,
        y: Math.random() * (height * 0.6),
        vx: baseVx,
        vy: baseVy,
        baseVx,
        baseVy,
        size: Math.random() * 12 + 16,
        color: i % 2 === 0 ? '#00F0FF' : '#39FF14',
        rotation: 0,
        rotSpeed: 0,
        opacity: 0.85
      });
    }

    // 3 Shooting Comets with burning fire trails
    for (let i = 0; i < 3; i++) {
      objects.push({
        type: 'comet',
        x: Math.random() * width,
        y: Math.random() * height * 0.5,
        vx: 2.8 + Math.random() * 2,
        vy: 1.6 + Math.random() * 1.5,
        baseVx: 3.2,
        baseVy: 2.0,
        size: Math.random() * 4 + 3,
        color: '#FF6600',
        rotation: Math.atan2(2.0, 3.2),
        rotSpeed: 0,
        opacity: 0.9,
        tailLength: 45 + Math.random() * 35
      });
    }

    // 35 Cosmic stardust particles
    for (let i = 0; i < 35; i++) {
      objects.push({
        type: 'star',
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        baseVx: 0,
        baseVy: 0,
        size: Math.random() * 2 + 1,
        color: psychedelicColors[Math.floor(Math.random() * psychedelicColors.length)],
        rotation: 0,
        rotSpeed: 0,
        opacity: Math.random() * 0.8 + 0.2
      });
    }

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
      const repelRadius = 180;

      objects.forEach((obj) => {
        // Mouse interaction for interactive objects
        if (mouse.active && obj.type !== 'star') {
          const dx = obj.x - mouse.x;
          const dy = obj.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < repelRadius && dist > 0) {
            const force = ((repelRadius - dist) / repelRadius) * 9.0;
            obj.vx += (dx / dist) * force;
            obj.vy += (dy / dist) * force;
          }
        }

        // Velocity damping to base
        obj.vx += (obj.baseVx - obj.vx) * 0.035;
        obj.vy += (obj.baseVy - obj.vy) * 0.035;

        // Position update
        obj.x += obj.vx;
        obj.y += obj.vy;
        obj.rotation += obj.rotSpeed;

        // Boundary wrap
        const margin = 80;
        if (obj.x < -margin) obj.x = width + margin;
        if (obj.x > width + margin) obj.x = -margin;
        if (obj.y < -margin) obj.y = height + margin;
        if (obj.y > height + margin) obj.y = -margin;

        ctx.save();

        if (obj.type === 'star') {
          // Render twinkling stardust
          ctx.beginPath();
          ctx.arc(obj.x, obj.y, obj.size, 0, Math.PI * 2);
          ctx.fillStyle = obj.color;
          ctx.globalAlpha = obj.opacity * (0.6 + Math.sin(Date.now() * 0.003 + obj.x) * 0.4);
          ctx.shadowColor = obj.color;
          ctx.shadowBlur = 6;
          ctx.fill();
        } else if (obj.type === 'comet') {
          // Render Shooting Comet with Fiery Plasma Trail
          const angle = Math.atan2(obj.vy, obj.vx);
          const tailLen = obj.tailLength || 50;

          const grad = ctx.createLinearGradient(
            obj.x,
            obj.y,
            obj.x - Math.cos(angle) * tailLen,
            obj.y - Math.sin(angle) * tailLen
          );
          grad.addColorStop(0, '#FFFFFF');
          grad.addColorStop(0.2, '#FFE600');
          grad.addColorStop(0.6, '#FF5500');
          grad.addColorStop(1, 'transparent');

          ctx.beginPath();
          ctx.moveTo(obj.x, obj.y);
          ctx.lineTo(
            obj.x - Math.cos(angle) * tailLen,
            obj.y - Math.sin(angle) * tailLen
          );
          ctx.strokeStyle = grad;
          ctx.lineWidth = obj.size * 1.5;
          ctx.lineCap = 'round';
          ctx.shadowColor = '#FF6600';
          ctx.shadowBlur = 12;
          ctx.stroke();

          // Comet Core Head
          ctx.beginPath();
          ctx.arc(obj.x, obj.y, obj.size, 0, Math.PI * 2);
          ctx.fillStyle = '#FFFFFF';
          ctx.shadowColor = '#00F0FF';
          ctx.shadowBlur = 15;
          ctx.fill();
        } else if (obj.type === 'ufo') {
          // Render Futuristic Flying Saucer (UFO)
          ctx.translate(obj.x, obj.y);
          ctx.globalAlpha = obj.opacity;

          // Glowing tractor beam down
          const beamGrad = ctx.createLinearGradient(0, 0, 0, 35);
          beamGrad.addColorStop(0, 'rgba(0, 240, 255, 0.35)');
          beamGrad.addColorStop(1, 'rgba(0, 240, 255, 0)');
          ctx.beginPath();
          ctx.moveTo(-obj.size * 0.4, 0);
          ctx.lineTo(-obj.size * 0.8, 35);
          ctx.lineTo(obj.size * 0.8, 35);
          ctx.lineTo(obj.size * 0.4, 0);
          ctx.closePath();
          ctx.fillStyle = beamGrad;
          ctx.fill();

          // Saucer Dome (Cockpit)
          ctx.beginPath();
          ctx.arc(0, -obj.size * 0.25, obj.size * 0.4, Math.PI, 0);
          ctx.fillStyle = 'rgba(0, 240, 255, 0.8)';
          ctx.shadowColor = '#00F0FF';
          ctx.shadowBlur = 10;
          ctx.fill();

          // Saucer Disk Body
          ctx.beginPath();
          ctx.ellipse(0, 0, obj.size, obj.size * 0.35, 0, 0, Math.PI * 2);
          ctx.fillStyle = '#0f172a';
          ctx.strokeStyle = obj.color;
          ctx.lineWidth = 1.8;
          ctx.shadowColor = obj.color;
          ctx.shadowBlur = 12;
          ctx.fill();
          ctx.stroke();

          // Saucer Neon Beacons / Lights
          const numLights = 5;
          for (let l = 0; l < numLights; l++) {
            const lx = ((l / (numLights - 1)) - 0.5) * (obj.size * 1.5);
            ctx.beginPath();
            ctx.arc(lx, 0, 1.8, 0, Math.PI * 2);
            ctx.fillStyle = (l + Math.floor(Date.now() / 200)) % 2 === 0 ? '#39FF14' : '#FF007F';
            ctx.shadowBlur = 4;
            ctx.fill();
          }
        } else {
          // Render Psychedelic Diamond Kite
          ctx.translate(obj.x, obj.y);
          ctx.rotate(obj.rotation);
          ctx.globalAlpha = obj.opacity;

          // Outer psychedelic neon glow
          ctx.shadowColor = obj.color;
          ctx.shadowBlur = 12;

          // Rhombus body
          ctx.beginPath();
          ctx.moveTo(0, -obj.size * 1.3);
          ctx.lineTo(obj.size * 0.85, 0);
          ctx.lineTo(0, obj.size * 1.3);
          ctx.lineTo(-obj.size * 0.85, 0);
          ctx.closePath();
          ctx.fillStyle = obj.color;
          ctx.fill();

          // White border
          ctx.shadowBlur = 0;
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.lineWidth = 1.8;
          ctx.stroke();

          // Cruzeta
          ctx.beginPath();
          ctx.moveTo(0, -obj.size * 1.3);
          ctx.lineTo(0, obj.size * 1.3);
          ctx.moveTo(-obj.size * 0.85, 0);
          ctx.lineTo(obj.size * 0.85, 0);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.lineWidth = 1.2;
          ctx.stroke();

          // Neon Rabiola Tail
          ctx.beginPath();
          ctx.moveTo(0, obj.size * 1.3);
          ctx.quadraticCurveTo(
            Math.sin(obj.rotation * 3) * 16,
            obj.size * 2.3,
            Math.cos(obj.rotation * 2) * 12,
            obj.size * 3.4
          );
          ctx.strokeStyle = obj.color;
          ctx.lineWidth = 1.6;
          ctx.stroke();
        }

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
      className="kite-bg text-white py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center text-center shadow-2xl relative border-b-2 border-purple-500/40 overflow-hidden select-none"
    >
      {/* Interactive Psychedelic Cosmos Canvas (Meteors, UFOs, Neon Kites, Cosmic Dust) */}
      <canvas
        ref={canvasRef}
        className="hidden md:block absolute inset-0 pointer-events-none z-0"
      />

      <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center">
        
        {/* Top Space Alien Mascot Badge & Tradicao Header */}
        <div className="flex flex-wrap items-center justify-center gap-3 bg-slate-950/85 backdrop-blur-md px-5 py-2 rounded-full border-2 border-emerald-400 text-xs sm:text-sm font-black uppercase tracking-widest text-emerald-300 mb-6 shadow-2xl neon-glow-green hover:scale-105 transition-transform cursor-pointer">
          <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 border-emerald-400 bg-slate-900 shadow-md">
            <img
              src={alienMascotImg}
              alt="Mascote Alien Mundo da Pipa"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <span className="text-white font-black drop-shadow-md">
            🛸 MUNDO DA PIPA • DEDICAÇÃO & ARTE DESDE 1999 🇧🇷
          </span>
          <span className="bg-emerald-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
            Psicodélico Espacial
          </span>
        </div>

        {/* Psychedelic Space Hero Mascot Callout Banner */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center my-3 w-full max-w-4xl bg-slate-950/90 backdrop-blur-xl border-2 border-purple-500/60 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden neon-glow-purple">
          {/* Subtle cosmic background glow in the card */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/15 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none"></div>

          {/* Left / Mascot Visual Feature with Glowing Sign */}
          <div className="md:col-span-5 flex flex-col items-center justify-center relative">
            <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-2xl overflow-hidden border-2 border-emerald-400 shadow-2xl animate-float-cosmic neon-glow-green">
              <img
                src={alienMascotImg}
                alt="Alien Espacial Mundo da Pipa"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              {/* Glowing Holographic Instagram Sign overlay badge */}
              <div className="absolute bottom-2 inset-x-2 bg-gradient-to-r from-purple-700 via-pink-600 to-orange-500 text-white text-[11px] font-black py-1.5 px-2 rounded-xl shadow-lg border border-white/40 flex items-center justify-center gap-1.5 uppercase tracking-wide">
                <Instagram className="w-3.5 h-3.5" />
                <span>@mundodapipa.oficial</span>
              </div>
            </div>
            
            {/* UFO Shopee & Zap Floating Badges */}
            <div className="mt-3 flex items-center gap-2">
              <a
                href={SHOPEE_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-orange-600 hover:bg-orange-500 text-white text-[10px] font-black px-3 py-1 rounded-full border border-orange-300 flex items-center gap-1 shadow-md uppercase transition-transform hover:scale-105"
              >
                <span>🛸 SHOPEE: mundo_da_pipa</span>
              </a>
            </div>
          </div>

          {/* Right / Poster Headline & Copy */}
          <div className="md:col-span-7 text-center md:text-left flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-950 to-slate-900 border border-purple-400/50 px-3.5 py-1 rounded-full text-xs font-black text-amber-300 uppercase tracking-widest mb-3 self-center md:self-start">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>O VERDADEIRO FESTIVAL DAS PIPAS</span>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white uppercase tracking-tight leading-tight">
              PAPAGAIOS, RABIOLAS, LINHAS DE COMBATE & CARRETILHAS
            </h1>

            <p className="text-xs sm:text-sm text-cyan-200 mt-2 font-medium leading-relaxed">
              Materiais artesanais selecionados, varetas de bambu e fibra de primeira linha, enviados com máxima velocidade e proteção.
            </p>

            {/* Glowing Callout Badge */}
            <div className="mt-4 p-3 bg-gradient-to-r from-purple-900/60 via-slate-900/80 to-emerald-950/60 border border-emerald-400/60 rounded-2xl flex items-center justify-center md:justify-start gap-3">
              <Flame className="w-6 h-6 text-orange-500 fill-orange-500 animate-bounce shrink-0" />
              <div className="text-left">
                <span className="block text-[11px] font-extrabold uppercase tracking-widest text-emerald-300">
                  PRECISOU DOS MELHORES MATERIAIS?
                </span>
                <span className="block text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                  SÓ CHAMAR NA MELHOR DO BRASIL!
                </span>
              </div>
            </div>

            {/* Green Highlight Brush Motto */}
            <div className="mt-4 bg-gradient-to-r from-emerald-600 via-green-500 to-emerald-600 text-slate-950 px-4 py-2 rounded-full font-black text-[11px] sm:text-xs uppercase tracking-wider shadow-xl border-2 border-white/60 flex items-center justify-center gap-2">
              <span>🪁 VEM SER FELIZ NO MUNDO DA PIPA! 🪁</span>
            </div>
          </div>
        </div>

        {/* Gold Ribbon Badge: Atacado & Varejo */}
        <div className="inline-flex items-center justify-center bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black text-xs sm:text-sm px-7 py-1.5 rounded-full shadow-2xl border-2 border-white uppercase tracking-widest my-4">
          <span>★ ATACADO & VAREJO PARA TODO O BRASIL ★</span>
        </div>

        {/* CTAs & Direct Contact */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mt-2">
          <button
            onClick={onExploreClick}
            className="w-full sm:w-auto bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-slate-950 font-black text-base sm:text-lg px-8 py-4 rounded-2xl shadow-2xl uppercase tracking-wider transition-all transform hover:-translate-y-0.5 active:translate-y-0 border-2 border-white flex items-center justify-center gap-2 neon-glow-green"
          >
            <ShoppingBag className="w-5 h-5 text-slate-950" />
            <span>Ver Catálogo</span>
          </button>

          <a
            href={SHOPEE_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-black text-base sm:text-lg px-8 py-4 rounded-2xl shadow-2xl uppercase tracking-wider transition-all transform hover:-translate-y-0.5 active:translate-y-0 border-2 border-amber-300 flex items-center justify-center gap-2 neon-glow-orange"
          >
            <span>Shopee - Mundo_da_pipa</span>
            <ExternalLink className="w-5 h-5" />
          </a>

          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 border-2 border-emerald-300 text-white px-7 py-4 rounded-2xl font-black text-base sm:text-lg shadow-2xl uppercase tracking-wider transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 neon-glow-green"
          >
            <MessageCircle className="w-5 h-5" />
            <span>(31) 98437-4513</span>
          </a>
        </div>

        {/* Social Direct Links with Psychedelic Space Badges */}
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs font-black uppercase text-white bg-slate-950/80 backdrop-blur-md px-6 py-2.5 rounded-full border border-purple-500/40 shadow-xl">
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-emerald-400 hover:text-white transition-colors"
          >
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            <span>Zap: 31 98437-4513</span>
          </a>
          <span className="text-purple-400">•</span>
          <a
            href="https://instagram.com/mundodapipa.oficial"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-pink-400 hover:text-white transition-colors"
          >
            <Instagram className="w-4 h-4 text-pink-400" />
            <span>Insta: @mundodapipa.oficial</span>
          </a>
          <span className="text-purple-400">•</span>
          <a
            href={SHOPEE_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-orange-400 hover:text-white transition-colors"
          >
            <ExternalLink className="w-4 h-4 text-orange-400" />
            <span>Shopee Oficial</span>
          </a>
        </div>

        {/* Highlights Bar */}
        <div className="mt-8 pt-5 border-t border-purple-500/30 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 text-cyan-200 text-xs sm:text-sm font-bold uppercase tracking-wider w-full max-w-3xl">
          <div className="flex items-center justify-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <span>25+ Anos Tradição</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Bambu & Fibra VIP</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Star className="w-4 h-4 text-amber-400" />
            <span>Nota 5.0 Shopee</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Atacado & Varejo</span>
          </div>
        </div>

      </div>
    </section>
  );
};


