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

        {/* Section: Premium / Marketplace */}
        <div className="my-32 lg:my-56 bg-zinc-950 text-white rounded-[30px] lg:rounded-[40px] p-6 sm:p-16 lg:p-24 relative overflow-hidden flex flex-col lg:flex-row items-center gap-12 lg:gap-16 shadow-2xl w-full">
           <div className="absolute top-0 right-0 w-full lg:w-1/2 h-full bg-primary/10 blur-[100px] pointer-events-none"></div>
           
           <GsapWrapper animationType="fade-in" className="flex-1 relative z-10 w-full">
              <span className="text-primary font-bold tracking-[0.3em] uppercase text-[10px] sm:text-xs flex items-center gap-2 mb-4 sm:mb-6"><Crown size={16}/> Nivel Creador Pro</span>
              <h2 className="text-3xl sm:text-6xl font-black tracking-tighter mb-4 sm:mb-8 leading-[1.1]">No solo compongas.<br /><span className="text-muted-foreground font-light">Monetiza tu arte.</span></h2>
              <p className="text-zinc-400 text-base sm:text-lg leading-relaxed mb-8 max-w-xl">
                 AuraChords no es solo un editor, es un Marketplace de élite. Crea transcripciones premium, fija un precio, y vende tus obras directamente a miles de músicos en la plataforma.
              </p>
              
              <ul className="flex flex-col gap-6 mb-12">
                 <li className="flex items-center gap-4 text-sm font-medium"><ShieldCheck className="text-primary"/> Pasarela segura con Stripe Connect</li>
                 <li className="flex items-center gap-4 text-sm font-medium"><Lock className="text-primary"/> Protección Anti-Robo de Acordes (Vista Previa Inteligente)</li>
                 <li className="flex items-center gap-4 text-sm font-medium"><DollarSign className="text-primary"/> Desembolsos directos a tu cuenta bancaria</li>
              </ul>

              <Link href="/pricing" className="bg-primary text-primary-foreground px-10 py-5 rounded-full font-bold tracking-[0.1em] uppercase hover:scale-105 transition-all shadow-[0_10px_30px_rgba(var(--primary-raw),0.4)] inline-block text-sm text-center">
                 Ver Planes para Creadores
              </Link>
           </GsapWrapper>

           <GsapWrapper animationType="scale-up" delay={0.2} className="flex-1 w-full lg:w-auto relative z-10">
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 relative overflow-hidden shadow-2xl transform rotate-2 hover:rotate-0 transition-all duration-500">
                 <div className="flex justify-between items-center border-b border-zinc-800 pb-6 mb-6">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center text-primary"><Music/></div>
                       <div>
                         <h4 className="font-bold text-lg">Quiero Llenar Tu Trono</h4>
                         <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">120 BPM • 10 MAR, 26</p>
                       </div>
                    </div>
                    <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 px-4 py-2 rounded-lg font-black text-sm">
                       € 2.50
                    </div>
                 </div>
                 <div className="space-y-4 pt-2">
                    <div className="h-4 bg-zinc-800 rounded-full w-3/4 opacity-50"></div>
                    <div className="h-4 bg-zinc-800 rounded-full w-1/2 opacity-50"></div>
                    <div className="h-4 bg-zinc-800 rounded-full w-5/6 opacity-50"></div>
                 </div>
                 
                 <div className="mt-10 bg-black/50 backdrop-blur-md rounded-2xl p-6 border border-zinc-800 absolute bottom-4 left-4 right-4 text-center">
                    <span className="text-3xl mb-2 block">🔒</span>
                    <h5 className="font-bold mb-2">Obra Premium</h5>
                    <button className="bg-primary text-primary-foreground w-full py-3 rounded-full text-xs font-bold uppercase tracking-widest mt-2">Adquirir Permanente</button>
                 </div>
              </div>
           </GsapWrapper>
        </div>

      </main>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}
