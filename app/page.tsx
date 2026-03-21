import Link from 'next/link';
import Navbar from './components/Navbar';
import GsapWrapper from './components/GsapWrapper';
import Footer from './components/Footer';
import { Music, Smartphone, Zap, DollarSign, Crown, Lock, ArrowRight, ShieldCheck, Users } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-[100svh] bg-background text-foreground font-sans relative overflow-x-hidden selection:bg-primary/30 selection:text-foreground transition-colors duration-500">
      
      {/* ESTILOS GLOBALES PARA ANIMACIÓN DE DIBUJO VECTORIAL */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes drawVectorCSS {
          0% { stroke-dashoffset: 1; opacity: 0; }
          5% { opacity: 1; }
          100% { stroke-dashoffset: 0; opacity: 1; }
        }
        .animate-draw-vectors path, 
        .animate-draw-vectors line, 
        .animate-draw-vectors circle, 
        .animate-draw-vectors rect, 
        .animate-draw-vectors text {
          stroke-dasharray: 1;
          stroke-dashoffset: 1;
          animation: drawVectorCSS 4s cubic-bezier(0.2, 0, 0.2, 1) forwards;
        }
        .animate-draw-vectors text { animation-delay: 1.5s; animation-duration: 3s; }
        .animate-draw-vectors circle { animation-delay: 0.2s; animation-duration: 5s; }
        .animate-draw-vectors rect { animation-delay: 0.5s; }
      `}} />

      {/* GLOBAL BACKGROUND - Extremely dark and minimal */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 opacity-[0.02]" 
          style={{ backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`, backgroundSize: '100px 100px' }} 
        />
        {/* Deep ambient glows */}
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[80vw] h-[80vw] bg-primary/10 blur-[150px] mix-blend-screen rounded-full" />
      </div>

      <Navbar variant="transparent" />

      <main className="w-full relative z-10">
        
        {/* 1. SIMON SPARKS STYLE HERO (CENTERED) */}
        <section className="relative flex flex-col items-center justify-center pt-32 pb-20 px-6 min-h-screen overflow-hidden">
        
           {/* Huge Animated Background Sketch (The Cmaj13 structure) */}
           <div className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none opacity-[0.08] dark:opacity-[0.15] mix-blend-multiply dark:mix-blend-screen scale-[2] sm:scale-125 md:scale-100">
             <svg width="1000" height="1000" viewBox="0 0 1000 1000" className="text-foreground dark:text-primary stroke-current relative animate-draw-vectors">
               <line x1="0" y1="500" x2="1000" y2="500" strokeWidth="1" strokeDasharray="3 5" opacity="0.3" pathLength={"1"} />
               <line x1="500" y1="0" x2="500" y2="1000" strokeWidth="1" strokeDasharray="3 5" opacity="0.3" pathLength={"1"} />
               <circle cx="500" cy="500" r="400" fill="none" strokeWidth="0.5" strokeDasharray="2 10" opacity="0.3" pathLength={"1"} />
               <circle cx="500" cy="500" r="280" fill="none" strokeWidth="1" opacity="0.4" pathLength={"1"} />
               <circle cx="500" cy="500" r="100" fill="none" strokeWidth="0.5" opacity="0.2" pathLength={"1"} />

               {/* Geometric connecting node lines */}
               <path d="M 220 500 L 500 220 M 500 220 L 780 500 M 780 500 L 500 780 M 500 780 L 220 500" fill="none" strokeWidth="1" opacity="0.3" pathLength={"1"} />
               <path d="M 500 500 L 700 300 M 700 300 Q 800 500 700 700" fill="none" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" pathLength={"1"} />
               
               {/* Typographic sketch */}
               <text x="350" y="580" fontFamily="serif" fontSize="280" fontWeight="900" fill="none" stroke="currentColor" strokeWidth="2" textAnchor="middle" opacity="0.4" pathLength={"1"}>C</text>
               <text x="650" y="420" fontFamily="sans-serif" fontSize="60" fontWeight="800" fill="none" stroke="currentColor" strokeWidth="1" textAnchor="middle" opacity="0.5" pathLength={"1"}>maj13</text>
               <text x="750" y="620" fontFamily="mono" fontSize="50" fontStyle="italic" fill="none" stroke="currentColor" strokeWidth="1" textAnchor="middle" opacity="0.4" pathLength={"1"}>(#11)</text>

               {/* Measurement marks */}
               <path d="M 500 100 L 500 80 M 480 90 L 520 90" fill="none" strokeWidth="1.5" opacity="0.5" pathLength={"1"} />
               <path d="M 900 500 L 920 500 M 910 480 L 910 520" fill="none" strokeWidth="1.5" opacity="0.5" pathLength={"1"} />
               
               {/* Sine wave or harmonic representation */}
               <path d="M 100 500 Q 200 400 300 500 T 500 500 T 700 500 T 900 500" fill="none" strokeWidth="0.5" strokeDasharray="1 2" opacity="0.4" pathLength={"1"} />
             </svg>
           </div>
           
           <GsapWrapper animationType="fade-up" delay={0.1} className="relative z-10 flex flex-col items-center text-center">
             
             {/* Small Overline */}
             <div className="text-[10px] tracking-[0.4em] text-zinc-500 uppercase mb-12 font-bold font-mono">
               Ecosistema Musical
             </div>
             
             {/* Main Title */}
             <h1 className="text-6xl md:text-8xl lg:text-[9rem] font-bold tracking-tighter leading-none text-foreground drop-shadow-2xl mb-8">
               AURA CHORDS
             </h1>
             
             {/* Small Underline / Category */}
             <div className="text-[10px] tracking-[0.5em] text-muted-foreground uppercase font-bold border-t border-border pt-6 px-12">
               Composición Sin Fricción
             </div>

           </GsapWrapper>
        </section>

        {/* 2. THE 4 SQUARED CARDS GRID */}
        <section className="max-w-[1400px] mx-auto px-6 pb-32">
           <GsapWrapper animationType="stagger-children" className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
             
             {[
                { label: 'Studio Pro', num: '01', icon: <Music size={28}/> },
                { label: 'Transpositor', num: '02', icon: <Zap size={28}/> },
                { label: 'Live Mode', num: '03', icon: <Smartphone size={28}/> },
                { label: 'Comunidad', num: '04', icon: <Users size={28}/> }
             ].map((card, i) => (
               <div key={i} className="aspect-square bg-foreground/[0.03] dark:bg-[#0B0D14] border border-border rounded-2xl md:rounded-[2.5rem] p-6 md:p-10 flex flex-col justify-between items-center text-center hover:bg-foreground/5 dark:hover:bg-[#11141D] hover:border-primary/20 transition-all duration-500 group">
                  <div className="mt-4 text-muted-foreground group-hover:text-primary transition-colors duration-500 group-hover:scale-110 transform">
                    {card.icon}
                  </div>
                  <div className="flex flex-col items-center gap-4">
                    <span className="text-xs md:text-sm font-bold tracking-widest uppercase text-zinc-300">{card.label}</span>
                    <span className="text-[9px] md:text-[10px] text-primary font-mono tracking-[0.2em]">{card.num}</span>
                  </div>
               </div>
             ))}

           </GsapWrapper>
        </section>


        {/* 3. PORTFOLIO / CHALKBOARD SECTION */}
        <section className="max-w-[1400px] mx-auto px-6 pb-32 relative">
           
           <div className="flex items-center gap-6 mb-12">
             <div className="w-2 h-2 rounded-full bg-primary"></div>
             <div className="text-[10px] tracking-[0.3em] font-bold text-zinc-500 uppercase">
               Explorador
             </div>
           </div>

           <GsapWrapper animationType="fade-up" duration={1.2}>
              <div className="w-full relative rounded-3xl md:rounded-[3rem] border border-white/5 overflow-hidden bg-[#05060A]">
                
                {/* SVG Live Drawing Substitute for Architect Instrument */}
                <div className="absolute inset-0 mix-blend-screen opacity-30 pointer-events-none flex justify-center items-center overflow-hidden scale-[1.5] md:scale-110 lg:translate-x-1/4 lg:translate-y-10">
                  <svg width="1000" height="1000" viewBox="0 0 1000 1000" className="text-white stroke-current animate-draw-vectors">
                     {/* Outer limits / Frame */}
                     <rect x="50" y="50" width="900" height="900" fill="none" strokeWidth="0.5" strokeDasharray="10 20" opacity="0.1" pathLength={"1"} />
                     <line x1="500" y1="0" x2="500" y2="1000" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.3" pathLength={"1"} />
                     <line x1="0" y1="500" x2="1000" y2="500" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.3" pathLength={"1"} />
                     
                     {/* The shape of a brass instrument abstracted digitally */}
                     {/* Giant Bell Silhouette */}
                     <path d="M 300 150 C -50 100 50 900 300 850 L 450 600 L 450 400 Z" fill="none" strokeWidth="1.5" opacity="0.5" pathLength={"1"} />
                     <path d="M 300 150 Q 150 500 300 850" fill="none" strokeWidth="1" strokeDasharray="5 5" opacity="0.3" pathLength={"1"} />
                     <circle cx="300" cy="500" r="150" fill="none" strokeWidth="0.5" strokeDasharray="2 4" opacity="0.4" pathLength={"1"} />
                     <circle cx="300" cy="500" r="50" fill="none" strokeWidth="0.5" opacity="0.2" pathLength={"1"} />
                     
                     {/* Structural Valves */}
                     <rect x="500" y="400" width="30" height="200" fill="none" strokeWidth="1.5" opacity="0.5" pathLength={"1"} />
                     <rect x="560" y="400" width="30" height="200" fill="none" strokeWidth="1.5" opacity="0.5" pathLength={"1"} />
                     <rect x="620" y="400" width="30" height="200" fill="none" strokeWidth="1.5" opacity="0.5" pathLength={"1"} />
                     
                     {/* Valve Actuators/Buttons */}
                     <line x1="515" y1="400" x2="515" y2="350" strokeWidth="2" opacity="0.8" pathLength={"1"} />
                     <circle cx="515" cy="340" r="10" fill="none" strokeWidth="2" opacity="0.8" pathLength={"1"} />
                     <line x1="575" y1="400" x2="575" y2="350" strokeWidth="2" opacity="0.8" pathLength={"1"} />
                     <circle cx="575" cy="340" r="10" fill="none" strokeWidth="2" opacity="0.8" pathLength={"1"} />
                     <line x1="635" y1="400" x2="635" y2="350" strokeWidth="2" opacity="0.8" pathLength={"1"} />
                     <circle cx="635" cy="340" r="10" fill="none" strokeWidth="2" opacity="0.8" pathLength={"1"} />
                     
                     {/* Master Tubing routing complex mathematical curves */}
                     <path d="M 450 500 L 500 500" fill="none" strokeWidth="2" opacity="0.6" pathLength={"1"} />
                     <path d="M 530 500 L 560 500" fill="none" strokeWidth="2" opacity="0.6" pathLength={"1"} />
                     <path d="M 590 500 L 620 500" fill="none" strokeWidth="2" opacity="0.6" pathLength={"1"} />
                     <path d="M 650 500 L 800 500 Q 860 500 860 450 Q 860 400 800 400 L 700 400" fill="none" strokeWidth="2" opacity="0.6" pathLength={"1"} />
                     
                     <path d="M 500 600 C 500 700 635 700 635 600" fill="none" strokeWidth="1.5" opacity="0.7" pathLength={"1"} />
                     <path d="M 560 600 C 560 650 635 650 635 600" fill="none" strokeWidth="1" opacity="0.4" pathLength={"1"} />
                     
                     {/* Mouthpiece / Receptacle */}
                     <path d="M 800 500 L 880 500 C 920 500 920 480 890 480 L 890 520 C 920 520 920 500 880 500" fill="none" strokeWidth="1.5" opacity="0.5" pathLength={"1"} />
                     
                     {/* Analytic Cross sections and measurements */}
                     <line x1="860" y1="350" x2="860" y2="550" strokeWidth="0.5" strokeDasharray="2 4" opacity="0.3" pathLength={"1"} />
                     <line x1="480" y1="650" x2="650" y2="650" strokeWidth="0.5" opacity="0.4" pathLength={"1"} />
                     <circle cx="700" cy="400" r="2" fill="currentColor" opacity="0.7" pathLength={"1"} />
                  </svg>
                </div>
                
                {/* Fade Overlays */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#05060A] via-[#05060A]/60 to-transparent"></div>
                <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-[#05060A] to-transparent"></div>

                <div className="relative z-10 p-10 sm:p-16 md:p-24 flex flex-col items-start gap-8 min-h-[500px] md:min-h-[600px] justify-center">
                  
                  <div className="max-w-xl relative">
                    <p className="text-[10px] tracking-[0.4em] font-bold text-primary uppercase mb-8">
                       Proyecto Abierto
                    </p>
                    <h2 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-sans font-light tracking-tight text-white mb-2 leading-none">
                      Música que
                    </h2>
                    <h2 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-serif font-bold italic tracking-tighter text-white leading-none drop-shadow-lg mb-10">
                      cuenta tu historia.
                    </h2>
                    
                    <p className="text-zinc-400 font-light text-sm md:text-base leading-relaxed max-w-sm mb-12 hidden md:block border-l px-4 border-white/20">
                      Entra al estudio y comparte tus arreglos con compositores de todo el mundo.
                    </p>

                    <Link 
                      href="/community"
                      className="inline-block px-10 py-5 bg-white text-black text-[10px] font-black tracking-[0.3em] uppercase rounded-full hover:scale-105 transition-all shadow-xl"
                    >
                      Explorar la comunidad
                    </Link>
                  </div>

                </div>
              </div>
           </GsapWrapper>
        </section>

        {/* 4. CONTACT / START BANNER (Organizing a conference style) */}
        <section className="w-full border-t border-b border-border bg-foreground/[0.02] py-24 md:py-32 flex flex-col items-center">
           <GsapWrapper animationType="fade-in" className="flex flex-col items-center gap-12 text-center px-6">
              <span className="text-[10px] tracking-[0.4em] font-bold text-zinc-600 uppercase">
                · · ·
              </span>
              <h3 className="text-4xl md:text-5xl lg:text-6xl font-serif tracking-tight text-foreground">
                ¿Listo para crear la tuya?
              </h3>
              <Link 
                href="/editor?new=true"
                className="px-12 py-5 border border-border text-foreground text-[10px] font-bold tracking-[0.3em] uppercase rounded-full hover:bg-foreground hover:text-background transition-all"
              >
                Abrir Nuevo Lienzo
              </Link>
           </GsapWrapper>
        </section>

      </main>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}
