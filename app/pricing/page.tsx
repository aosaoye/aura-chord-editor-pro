import { Check } from "lucide-react";
import Navbar from "../components/Navbar";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans relative overflow-hidden transition-colors duration-500 pt-[72px]">
      <Navbar variant="border" className="bg-background/80 border-b border-border" />

      <main className="max-w-[1200px] mx-auto px-6 py-20 flex flex-col items-center">
        
        <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-5 duration-700">
           <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">El valor de lo excelente.</h1>
           <p className="text-muted-foreground text-lg max-w-xl mx-auto font-light">
             Descubre planes adaptados a compositores serios. Desbloquea herramientas únicas de estructuración y visualización.
           </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-150">
           
           {/* Plan Gratuito */}
           <div className="border border-border rounded-3xl p-8 sm:p-10 bg-white dark:bg-zinc-900 shadow-sm relative flex flex-col justify-between">
              <div>
                <h3 className="text-2xl font-bold tracking-tight mb-2">Compositor</h3>
                <p className="text-muted-foreground text-sm mb-6 pb-6 border-b border-border">Para aquellos que comienzan a documentar su visión.</p>
                <div className="flex items-baseline gap-2 mb-8">
                  <span className="text-5xl font-black tracking-tighter">€0</span>
                  <span className="text-muted-foreground text-sm font-semibold uppercase tracking-widest">/ por siempre</span>
                </div>
                
                <ul className="flex flex-col gap-4 text-sm font-medium">
                  <li className="flex items-start gap-3"><Check className="text-primary mt-0.5" size={18} /> Límite de 3 obras guardadas en la nube</li>
                  <li className="flex items-start gap-3"><Check className="text-primary mt-0.5" size={18} /> Editor de Acordes Proceso Inteligente</li>
                  <li className="flex items-start gap-3"><Check className="text-primary mt-0.5" size={18} /> Exportación básica a PNG</li>
                </ul>
              </div>
              <button disabled className="w-full mt-10 py-4 bg-zinc-100 dark:bg-zinc-800 text-muted-foreground text-xs font-bold tracking-[0.2em] uppercase rounded-xl transition-all text-center">
                 Tu Plan Actual
              </button>
           </div>

           {/* Plan PRO */}
           <div className="border border-primary rounded-3xl p-8 sm:p-10 bg-zinc-950 dark:bg-zinc-50 text-white dark:text-zinc-900 shadow-2xl relative overflow-hidden flex flex-col justify-between transform md:-translate-y-4">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-2">
                   <h3 className="text-2xl font-bold tracking-tight">Maestro (PRO)</h3>
                   <span className="bg-primary text-primary-foreground text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full">Recomendado</span>
                </div>
                <p className="text-zinc-400 dark:text-zinc-500 text-sm mb-6 pb-6 border-b border-zinc-800 dark:border-zinc-200">Para músicos que exigen control absoluto de su arte.</p>
                
                <div className="flex items-baseline gap-2 mb-8">
                  <span className="text-5xl font-black tracking-tighter">€9</span>
                  <span className="text-zinc-400 dark:text-zinc-500 text-sm font-semibold uppercase tracking-widest">/ mes</span>
                </div>
                
                <ul className="flex flex-col gap-4 text-sm font-medium">
                  <li className="flex items-start gap-3"><Check className="text-primary mt-0.5" size={18} /> Obras en la nube ILIMITADAS</li>
                  <li className="flex items-start gap-3"><Check className="text-primary mt-0.5" size={18} /> Exportación profesional PDF y Multi-página ZIP</li>
                  <li className="flex items-start gap-3"><Check className="text-primary mt-0.5" size={18} /> Modo Teleprompter Avanzado en vivo</li>
                  <li className="flex items-start gap-3"><Check className="text-primary mt-0.5" size={18} /> Previsualización en Piano 3D interactivo</li>
                  <li className="flex items-start gap-3"><Check className="text-primary mt-0.5" size={18} /> Auto-fill Inteligente de Armonía</li>
                </ul>
              </div>
              
              <button className="relative z-10 w-full mt-10 py-4 bg-primary text-primary-foreground text-xs font-bold tracking-[0.2em] uppercase rounded-xl hover:scale-105 active:scale-95 transition-all text-center shadow-[0_10px_20px_rgba(var(--primary-raw),0.3)]">
                 Mejorar Ahora
              </button>
           </div>
        </div>
      </main>
    </div>
  );
}
