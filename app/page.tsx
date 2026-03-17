import Link from 'next/link';
import Navbar from './components/Navbar';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden selection:bg-primary selection:text-white font-sans relative transition-colors duration-500">
      
      {/* Decorative huge background letters a la Ebenzer */}
      <div className="absolute top-32 left-0 w-full h-[60vh] overflow-hidden pointer-events-none flex items-center justify-center -z-10 select-none">
         <span className="text-[35vw] font-black tracking-tighter text-black opacity-[0.02] whitespace-nowrap">AURA</span>
      </div>

      {/* Navbar Premium */}
      <Navbar variant="default" />

      {/* Hero Section */}
      <main className="pb-20 px-8 sm:px-16 max-w-[1800px] mx-auto flex flex-col justify-center relative">
        
         {/* Huge curved visual container at the bottom */}
        <div className="w-full mt-24 lg:mt-32 min-h-[400px] lg:aspect-[25/9] bg-zinc-950 rounded-2xl sm:rounded-3xl relative group shadow-lg overflow-hidden flex flex-col justify-end p-8 sm:p-14 lg:p-24 border border-border/50 bg-[url('https://images.pexels.com/photos/7521300/pexels-photo-7521300.jpeg')] bg-cover bg-center">
          
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/40 via-zinc-950/80 to-zinc-950/90 opacity-90 group-hover:scale-105 group-hover:opacity-100 transition-all duration-1000 ease-in-out"></div>
          
          {/* Subtle primary light glow */}
          <div className="absolute bottom-0 right-0 w-full lg:w-2/3 h-full lg:h-2/3 bg-primary/20 blur-[100px] mix-blend-screen pointer-events-none"></div>

          <div className="relative z-10 w-full flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10">
            <div>
              <h2 className="text-4xl sm:text-6xl md:text-5xl lg:text-6xl font-light text-white tracking-tight mb-4 leading-[1.1]">
                Música que <br className="hidden lg:block"/><span className="font-bold italic">cuenta tu historia.</span>
              </h2>
              <p className="text-[9px] sm:text-[10px] font-bold tracking-[0.3em] sm:tracking-[0.4em] uppercase text-zinc-400">
                ARQUITECTURA • ARMONÍA • REFINAMIENTO
              </p>
            </div>

            <Link href="/editor" className="bg-primary text-primary-foreground px-8 sm:px-12 py-4 sm:py-5 rounded-full text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase hover:bg-primary/80 hover:scale-105 transition-all shadow-[0_20px_40px_rgba(var(--primary-raw),0.3)] active:scale-95 whitespace-nowrap text-center w-full lg:w-auto mt-4 lg:mt-0">
              Entrar al Editor
            </Link>
          </div>
        </div>

        <div className="my-10">
          <p className="text-[10px] font-bold tracking-[0.4em] text-foreground uppercase">
            LEGACY OF EXCELLENCE
          </p>
        </div>

        <div className="relative z-10 w-full">
          <h1 className="text-[15vw] lg:text-[11vw] font-black tracking-tighter leading-[0.8] text-foreground">
            Acordes que<br/>
            <span className="font-light italic text-muted-foreground">transcienden.</span>
          </h1>
        </div>

        <div className="flex justify-start lg:justify-end mt-20 relative z-10 lg:-mt-24 pr-4 lg:pr-32">
          <div className="max-w-md lg:max-w-lg border-t border-border pt-10">
            <p className="text-muted-foreground font-light text-2xl leading-relaxed">
              Cada proyecto de <span className="font-bold text-foreground">AuraChords</span> es una pieza única 
              de arquitectura musical. No anotamos simples acordes, 
              creamos escenarios para tu inspiración más auténtica.
            </p>
            <div className="mt-12 flex items-center gap-6 text-[10px] font-bold tracking-[0.3em] uppercase text-foreground">
               <div className="w-16 h-[1px] bg-foreground"></div>
               EST. 2026
            </div>
          </div>
        </div>

       

      </main>
    </div>
  );
}
