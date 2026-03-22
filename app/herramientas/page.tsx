"use client";

import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Mic, Activity, Zap } from 'lucide-react';

export default function HerramientasHub() {
  return (
    <div className="min-h-[100svh] bg-background text-foreground font-sans flex flex-col">
      <Navbar variant="default" />
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-6 pt-32 pb-20 flex flex-col items-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-black tracking-tight mb-6 text-center">Ecosistema de Herramientas</h1>
        <p className="text-muted-foreground text-center mb-16 max-w-xl text-sm md:text-base leading-relaxed">
          Potencia tu flujo creativo con nuestras utilidades de ingeniería acústica y teoría musical integradas.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
          
          <Link href="/herramientas/afinador" className="group rounded-[2.5rem] border border-border bg-foreground/[0.02] hover:bg-foreground/[0.04] transition-all p-10 flex flex-col items-start gap-6 hover:border-primary/40 relative overflow-hidden">
             
             {/* Glow decorativo */}
             <div className="absolute -right-20 -top-20 w-40 h-40 bg-teal-500/10 blur-[50px] rounded-full group-hover:bg-teal-500/20 transition-all"></div>
             
             <div className="w-16 h-16 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-500 group-hover:scale-110 transition-transform">
               <Activity size={32} />
             </div>
             <div className="relative z-10 w-full">
                <div className="flex items-center justify-between w-full mb-3">
                   <h3 className="text-2xl font-bold tracking-tight text-foreground">Afinador Inteligente</h3>
                   <span className="text-[9px] uppercase tracking-widest font-black text-teal-500 bg-teal-500/10 px-3 py-1 rounded-full">Activo</span>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Afinador cromático de alta precisión para guitarra, bajo, ukelele y violín con detección YIN en tiempo real mediante AudioWorklets y calibración de ruido dinámica.
                </p>
             </div>
          </Link>

          <div className="group rounded-[2.5rem] border border-border bg-foreground/[0.01] opacity-70 cursor-not-allowed p-10 flex flex-col items-start gap-6 relative overflow-hidden">
             <div className="absolute top-8 right-8 text-[9px] font-bold tracking-widest uppercase px-3 py-1 bg-primary/20 text-primary rounded-full">Próximamente</div>
             <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
               <Mic size={32} />
             </div>
             <div className="relative z-10">
                <h3 className="text-2xl font-bold tracking-tight mb-3">Aura Voice Titán</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">Puntaje vocal analítico (Singer Score), auto-key matcher y entrenamiento de armonías polifónicas en vivo.</p>
             </div>
          </div>

          <Link href="/herramientas/hum-to-chords" className="group rounded-[2.5rem] border border-border bg-foreground/[0.02] hover:bg-foreground/[0.04] transition-all p-10 flex flex-col items-start gap-6 hover:border-zinc-500/40 relative overflow-hidden">
             
             {/* Glow decorativo */}
             <div className="absolute -right-20 -top-20 w-40 h-40 bg-zinc-500/10 blur-[50px] rounded-full group-hover:bg-zinc-500/20 transition-all"></div>

             <div className="w-16 h-16 rounded-full bg-zinc-500/10 flex items-center justify-center text-zinc-500 group-hover:scale-110 transition-transform">
               <Zap size={32} />
             </div>
             <div className="relative z-10 w-full">
                <div className="flex items-center justify-between w-full mb-3">
                   <h3 className="text-2xl font-bold tracking-tight text-foreground">Hum-to-Chords</h3>
                   <span className="text-[9px] uppercase tracking-widest font-black text-zinc-500 bg-zinc-500/10 px-3 py-1 rounded-full">Activo</span>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">Tararea una melodía vocal y la Inteligencia Artificial escribirá la estructura de acordes base directamente en el editor.</p>
             </div>
          </Link>

        </div>
      </main>
      <Footer />
    </div>
  );
}
