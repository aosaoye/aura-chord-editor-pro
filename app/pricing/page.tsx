"use client";

import Link from "next/link";
import Navbar from "../components/Navbar";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden selection:bg-primary selection:text-white font-sans relative transition-colors duration-500">
      
      <div className="absolute top-32 left-0 w-full h-[60vh] overflow-hidden pointer-events-none flex items-center justify-center -z-10 select-none">
         <span className="text-[35vw] font-black tracking-tighter text-black opacity-[0.02] whitespace-nowrap">PLANS</span>
      </div>

      <Navbar variant="default" />

      <main className="pt-48 pb-32 px-8 sm:px-16 max-w-[1400px] mx-auto flex flex-col items-center relative">
        
        <div className="text-center mb-24 animate-in fade-in slide-in-from-bottom-5 duration-1000">
          <p className="text-[10px] sm:text-xs font-bold tracking-[0.4em] text-primary uppercase mb-6">
            Inversión en tu arte
          </p>
          <h1 className="text-5xl sm:text-7xl font-light tracking-tight text-foreground leading-[1.1] mb-8">
            Diseñado para <br className="hidden sm:block"/><span className="font-bold italic">creadores serios.</span>
          </h1>
          <p className="text-muted-foreground font-light text-lg sm:text-xl max-w-2xl mx-auto">
            Comienza gratis o desbloquea el potencial completo del Estudio para llevar tus partituras y teleprompter al nivel profesional sin límites.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 w-full animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
          
          {/* Plan Gratuito */}
          <div className="flex flex-col p-10 sm:p-14 rounded-[2rem] border border-border bg-background group hover:border-foreground/30 transition-all duration-500 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-foreground/5 blur-[100px] rounded-full"></div>
            
            <h3 className="text-2xl font-light mb-2">Compositor <span className="font-bold">Esencial</span></h3>
            <p className="text-muted-foreground text-sm font-light mb-10 h-10">
              Para los que recién están bosquejando sus primeras ideas.
            </p>
            
            <div className="mb-10">
              <span className="text-6xl font-light tracking-tighter">$0</span>
              <span className="text-muted-foreground font-light tracking-wide"> / de por vida</span>
            </div>

            <ul className="flex flex-col gap-5 text-sm font-light text-foreground mb-16 flex-1">
              <li className="flex items-start gap-4">
                 <span className="text-primary mt-1">✓</span>
                 Teleprompter Básico (sin animaciones premium)
              </li>
              <li className="flex items-start gap-4">
                 <span className="text-primary mt-1">✓</span>
                 Exportación PNG / PDF estática
              </li>
              <li className="flex items-start gap-4">
                 <span className="text-primary mt-1">✓</span>
                 Hasta 3 Obras Liricas Guardadas en Nube
              </li>
              <li className="flex items-start gap-4 opacity-50">
                 <span className="mt-1">✕</span>
                 Soporte para Teclado 3D Virtual Acordes
              </li>
              <li className="flex items-start gap-4 opacity-50">
                 <span className="mt-1">✕</span>
                 Cifrado Inteligente Múltiple en tiempo real
              </li>
            </ul>

            <Link href="/editor" className="w-full py-5 rounded-full border border-border text-center text-[10px] font-bold tracking-[0.2em] uppercase hover:bg-foreground hover:text-background transition-colors group-hover:border-foreground relative z-10">
              Entrar al Estudio
            </Link>
          </div>

          {/* Plan Pro */}
          <div className="flex flex-col p-10 sm:p-14 rounded-[2rem] border border-primary/30 bg-zinc-950 text-white shadow-2xl relative overflow-hidden group hover:border-primary/60 transition-all duration-500 scale-100 md:scale-[1.03]">
            {/* Glow Backing */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-duration-1000"></div>
            
            <div className="absolute top-10 right-10 bg-primary/20 text-primary border border-primary/30 px-4 py-1.5 rounded-full text-[9px] font-bold tracking-[0.25em] uppercase">
               Mejor Valor
            </div>

            <h3 className="text-2xl font-light mb-2 relative z-10">Pro <span className="font-bold">Studio</span></h3>
            <p className="text-zinc-400 text-sm font-light mb-10 h-10 relative z-10">
              La suite completa de arquitectura musical y rendimiento en vivo.
            </p>
            
            <div className="mb-10 relative z-10">
              <span className="text-6xl font-light tracking-tighter">$15</span>
              <span className="text-zinc-400 font-light tracking-wide"> / por mes</span>
            </div>

            <ul className="flex flex-col gap-5 text-sm font-light text-zinc-300 mb-16 flex-1 relative z-10">
               <li className="flex items-start gap-4">
                 <span className="text-primary mt-1 font-bold">✓</span>
                 Teleprompter Cinematic & Smooth Scroll Engine
              </li>
              <li className="flex items-start gap-4">
                 <span className="text-primary mt-1 font-bold">✓</span>
                 Obras Teóricas Guardadas Ilimitadas
              </li>
              <li className="flex items-start gap-4">
                 <span className="text-primary mt-1 font-bold">✓</span>
                 Motor 3D Interactivo de Acordes Piano/Guitarra
              </li>
              <li className="flex items-start gap-4">
                 <span className="text-primary mt-1 font-bold">✓</span>
                 Atajos algorítmicos y auto-rellenado musical
              </li>
              <li className="flex items-start gap-4">
                 <span className="text-primary mt-1 font-bold">✓</span>
                 Acceso Prioritario a Nuevas Funciones
              </li>
            </ul>

            <button 
              className="w-full py-5 rounded-full bg-primary text-primary-foreground text-center text-[10px] font-bold tracking-[0.2em] uppercase hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all shadow-[0_10px_30px_rgba(var(--primary-raw),0.3)] relative z-10"
              onClick={() => {
                // Aquí en el futuro llamaremos a Stripe Checkouts.
                alert("Redirigiendo a Pasarela de Pago Stripe Segura...");
              }}
            >
              Mejorar a Pro
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}
