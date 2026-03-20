import Link from 'next/link';
import Navbar from './components/Navbar';
import GsapWrapper from './components/GsapWrapper';
import Footer from './components/Footer';
import { Music, Smartphone, Zap, DollarSign, Crown, Lock, ArrowRight, ShieldCheck } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen w-full max-w-[100vw] bg-background text-foreground overflow-hidden overflow-x-hidden selection:bg-primary selection:text-white font-sans relative transition-colors duration-500">
      
      {/* Decorative huge background letters */}
      <GsapWrapper animationType="fade-in" duration={2} delay={0.5} className="absolute top-32 left-0 w-full h-[60vh] overflow-hidden pointer-events-none flex items-center justify-center -z-10 select-none">
         <span className="text-[35vw] font-black tracking-tighter text-black dark:text-white opacity-[0.02] whitespace-nowrap">AURA</span>
      </GsapWrapper>

      {/* Navbar Premium */}
      <Navbar variant="transparent" className="mix-blend-normal backdrop-blur-md" />

      {/* Hero Section */}
      <main className="pb-20 px-4 sm:px-12 lg:px-16 w-full max-w-[1800px] mx-auto flex flex-col justify-center relative pt-24">
        
        <GsapWrapper animationType="fade-up" duration={1} delay={0.1}>
          <div className="my-10">
            <p className="text-[10px] font-bold tracking-[0.4em] text-primary uppercase">
              La Nueva Era de la Transcripción
            </p>
          </div>

          <div className="relative z-10 w-full mt-4 sm:mt-0">
            <h1 className="text-[16vw] sm:text-[13vw] lg:text-[10vw] font-black tracking-tighter leading-[0.8] text-foreground">
              Composición<br/>
              <span className="font-light italic text-muted-foreground tracking-tight">sin fricción.</span>
            </h1>
          </div>

          <div className="flex justify-start lg:justify-end mt-12 sm:mt-16 relative z-10 lg:-mt-20 pr-0 lg:pr-32">
            <div className="max-w-full sm:max-w-md lg:max-w-xl border-t border-border pt-8 sm:pt-10">
              <p className="text-muted-foreground font-light text-xl sm:text-2xl leading-relaxed">
                <span className="font-bold text-foreground">ChordPro Pro</span> es el lienzo inteligente que te permite llevar una idea a la partitura masterizada en minutos. Estructura, silabea y armoniza de forma fluida, sin batallas técnicas.
              </p>
              <div className="mt-8 sm:mt-12 flex items-center gap-6 text-[10px] sm:text-[10px] font-bold tracking-[0.3em] uppercase text-foreground">
                 <Link href="/editor?new=true" className="bg-primary text-primary-foreground px-8 sm:px-10 py-4 rounded-full text-[10px] sm:text-xs hover:bg-primary/80 transition-all hover:scale-105 active:scale-95 shadow-[0_15px_30px_rgba(var(--primary-raw),0.2)] flex items-center gap-3">
                   Comienza a componer gratis <ArrowRight size={16} />
                 </Link>
              </div>
            </div>
          </div>
        </GsapWrapper>

        {/* Visual Showcase (Hero Banner) */}
        <GsapWrapper animationType="scale-up" duration={1.2} delay={0.3} className="w-full mt-20 lg:mt-32 aspect-[4/3] sm:aspect-video lg:aspect-[21/9] bg-zinc-950 rounded-[30px] lg:rounded-[40px] relative group shadow-2xl border border-white/5 overflow-hidden flex flex-col justify-end p-6 sm:p-14 lg:p-24 bg-[url('https://images.pexels.com/photos/7521300/pexels-photo-7521300.jpeg')] bg-cover bg-center">
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90 group-hover:scale-105 group-hover:opacity-100 transition-all duration-1000 ease-in-out"></div>
          <div className="absolute top-0 right-0 w-full lg:w-2/3 h-full lg:h-2/3 bg-primary/20 blur-[120px] mix-blend-screen pointer-events-none"></div>

          <div className="relative z-10 w-full flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 sm:gap-10">
            <div>
               <h2 className="text-3xl sm:text-5xl lg:text-5xl font-light text-white tracking-tight mb-2 sm:mb-4 leading-[1.1]">
                 Música que <br className="hidden lg:block"/><span className="font-bold italic">cuenta tu historia.</span>
               </h2>
            </div>
            <Link href="/community" className="backdrop-blur-xl bg-white/10 border border-white/20 text-white px-6 sm:px-12 py-3 sm:py-4 rounded-full text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase hover:bg-white/20 hover:scale-105 transition-all w-full sm:w-auto text-center">
              Explorar la Comunidad
            </Link>
          </div>
        </GsapWrapper>

        {/* Section: Ventajas & Características */}
        <div className="mt-40 mb-20 relative">
          <GsapWrapper animationType="fade-up">
            <div className="text-center max-w-4xl mx-auto mb-20">
              <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-8 text-muted-foreground">
                ¿Cansado de que tus partituras se desconfiguren al cambiar el tono, o de no saber dónde caen los acordes en el móvil?
              </h2>
              <p className="text-foreground text-2xl leading-relaxed font-light">
                La arquitectura silábica de <span className="font-bold">ChordPro Pro</span> garantiza que tus acordes y letras estén sincronizados al milímetro, en cualquier dispositivo y en cualquier tono.
              </p>
            </div>
          </GsapWrapper>

          <GsapWrapper animationType="stagger-children" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: <Music size={24}/>, title: 'Transpositor Inteligente', desc: 'Sube o baja medio tono todos tus acordes con un clic, sin arruinar tu formato.' },
              { icon: <Smartphone size={24}/>, title: 'Teleprompter 3D', desc: 'Modo presentación inmersivo a pantalla completa optimizado para iPad y móviles en vivo.' },
              { icon: <Zap size={24}/>, title: 'Renderizado en Tiempo Real', desc: 'Escribe letras, usa tags como [Verso] y experimenta la magía del Canvas auto-generado.' }
            ].map((feature, i) => (
              <div key={i} className="bg-muted/30 border border-border rounded-[2rem] p-6 sm:p-10 hover:border-primary/50 transition-colors group">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-background rounded-2xl flex items-center justify-center text-primary mb-6 sm:mb-8 shadow-sm group-hover:scale-110 transition-transform">{feature.icon}</div>
                <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">{feature.title}</h3>
                <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </GsapWrapper>

          {/* Social Proof */}
          <GsapWrapper animationType="fade-in" className="mt-32 max-w-4xl mx-auto text-center">
            <div className="bg-primary/5 border border-primary/20 rounded-3xl p-10 sm:p-16 relative">
               <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-6xl text-primary opacity-50 font-serif">"</span>
               <p className="text-2xl sm:text-3xl font-light italic leading-relaxed text-foreground mb-8">
                 Probé Aura Chord Editor Pro en un ensayo y por fin mi banda dejó de equivocarse de acorde. El teleprompter es una maravilla.
               </p>
               <div className="flex items-center justify-center gap-4">
                 <div className="w-12 h-12 rounded-full bg-zinc-800 bg-[url('https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg')] bg-cover bg-center"></div>
                 <div className="text-left">
                   <p className="font-bold text-sm">Alejandro M.</p>
                   <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Director Musical</p>
                 </div>
               </div>
            </div>
          </GsapWrapper>
        </div>

        {/* Section: Premium / Marketplace (Redesign Premium) */}
        <div className="my-32 lg:my-48 relative overflow-hidden rounded-[40px] border border-white/5 group">
           
           {/* Deep atmospheric backdrop */}
           <div className="absolute inset-0 bg-[#060606] z-0"></div>
           {/* Glowing orbs */}
           <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/20 blur-[200px] rounded-full translate-x-1/3 -translate-y-1/3 z-0 pointer-events-none transition-opacity duration-700 group-hover:opacity-100 opacity-60"></div>
           <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-orange-600/10 blur-[150px] rounded-full -translate-x-1/2 translate-y-1/2 z-0 pointer-events-none"></div>
           
           {/* Grid pattern overlay */}
           <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center bg-repeat opacity-[0.03] z-0 mix-blend-overlay"></div>

           <div className="relative z-10 w-full flex flex-col lg:flex-row items-center justify-between p-8 sm:p-16 lg:p-24 gap-16 lg:gap-20">
              
              {/* Left Content Column */}
              <GsapWrapper animationType="fade-up" className="flex-1 w-full max-w-2xl">
                 <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 backdrop-blur-md mb-8 shadow-[0_0_20px_rgba(var(--primary-raw),0.1)]">
                    <Crown size={14} className="text-primary drop-shadow-[0_0_8px_rgba(var(--primary-raw),0.8)]" />
                    <span className="text-primary font-black tracking-[0.25em] uppercase text-[10px] sm:text-xs">
                      Nivel Creador Pro
                    </span>
                 </div>
                 
                 <h2 className="text-4xl sm:text-6xl lg:text-[5.5rem] font-[100] tracking-tighter mb-6 leading-[0.9] text-white">
                   Monetiza <br />
                   <span className="font-black italic text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-400 to-zinc-600">tu talento.</span>
                 </h2>
                 
                 <p className="text-zinc-400 text-lg sm:text-xl leading-relaxed mb-10 max-w-lg font-light">
                   Transforma tus horas de ensayo en ingresos pasivos. Sube obras maestras con acordes exactos y véndelas en un marketplace libre de piratería.
                 </p>
                 
                 {/* Modern Features Pill-Grid */}
                 <div className="flex flex-wrap gap-4 mb-12">
                    <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors">
                       <ShieldCheck size={18} className="text-primary" />
                       <span className="text-sm font-medium text-zinc-300">Stripe Connect</span>
                    </div>
                    <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors">
                       <Lock size={18} className="text-primary" />
                       <span className="text-sm font-medium text-zinc-300">Anti-Capturas</span>
                    </div>
                    <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors">
                       <DollarSign size={18} className="text-primary" />
                       <span className="text-sm font-medium text-zinc-300">Pagos Directos</span>
                    </div>
                 </div>

                 <Link href="/pricing" className="relative group inline-block focus:outline-none">
                    <div className="absolute inset-0 bg-primary rounded-full blur-xl opacity-40 group-hover:opacity-80 transition-opacity duration-500"></div>
                    <span className="relative z-10 bg-primary text-primary-foreground px-10 sm:px-12 py-5 rounded-full font-bold tracking-[0.15em] uppercase hover:scale-[1.03] active:scale-[0.98] transition-all flex items-center gap-4 text-xs">
                       Activar Nivel Pro <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </span>
                 </Link>
              </GsapWrapper>

              {/* Right Visual / 3D Composition */}
              <GsapWrapper animationType="scale-up" delay={0.2} className="flex-1 w-full lg:w-auto relative perspective-1000 mt-10 lg:mt-0 pb-10">
                 
                 {/* Floating Element 1 - Notification */}
                 <div className="absolute -top-10 right-0 sm:-right-8 bg-zinc-900/80 backdrop-blur-2xl border border-white/10 p-4 rounded-2xl shadow-2xl z-20 flex items-center gap-4 animate-bounce-slow transform rotate-3">
                    <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center text-green-500">
                      <DollarSign size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Nueva Venta</p>
                      <p className="text-sm font-black text-white">+ € 2.50 recibidos</p>
                    </div>
                 </div>

                 {/* Main Premium Card (Glassmorphism + 3D rotation) */}
                 <div className="bg-zinc-900/40 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 sm:p-10 relative overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.8)] transform -rotate-y-12 rotate-x-6 hover:rotate-y-0 hover:rotate-x-0 transition-transform duration-700 w-full sm:w-[450px] mx-auto z-10 group-hover:shadow-[0_40px_100px_rgba(var(--primary-raw),0.15)]">
                    
                    {/* Interior glow inside card */}
                    <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none"></div>

                    <div className="flex justify-between items-start mb-8 relative z-10">
                       <div className="flex gap-5 items-center">
                          <div className="w-14 h-14 bg-gradient-to-br from-primary to-orange-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary/20">
                             <Music size={24} />
                          </div>
                          <div>
                            <h4 className="font-black text-xl text-white">Llenar Tu Trono</h4>
                            <p className="text-[10px] text-primary uppercase tracking-[0.2em] font-bold mt-1">Obra Oficial (Premium)</p>
                          </div>
                       </div>
                    </div>
                    
                    <div className="space-y-4 mb-10 relative z-10 opacity-30">
                       <div className="h-4 bg-white/20 rounded-full w-[85%]"></div>
                       <div className="h-4 bg-white/20 rounded-full w-[60%]"></div>
                       <div className="h-4 bg-white/20 rounded-full w-[70%]"></div>
                    </div>
                    
                    <div className="bg-[#050505] rounded-3xl p-8 border border-white/10 text-center relative z-10 overflow-hidden group/lock">
                       <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover/lock:opacity-100 transition-opacity duration-500"></div>
                       <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-800 shadow-xl relative top-0 group-hover/lock:-translate-y-2 transition-transform duration-500">
                          <Lock size={28} className="text-primary drop-shadow-[0_0_15px_rgba(var(--primary-raw),0.5)]" />
                       </div>
                       <h5 className="font-black text-2xl text-white mb-2 tracking-tight">Acceso Bloqueado</h5>
                       <p className="text-xs text-zinc-500 font-medium mb-6">El contenido original está protegido por el creador.</p>
                       <button className="bg-primary hover:bg-white hover:text-black w-full py-4 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-lg active:scale-95 text-white">
                         Adquirir por € 2.50
                       </button>
                    </div>
                 </div>
                 
                 {/* Floating Element 2 - Subtle background blur block */}
                 <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-primary/10 rounded-[3rem] backdrop-blur-xl border border-white/5 transform rotate-12 -z-10 animate-pulse-slow"></div>

              </GsapWrapper>
           </div>
        </div>

      </main>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}
