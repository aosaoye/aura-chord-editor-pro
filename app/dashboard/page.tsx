import Link from "next/link";
import { Plus, Folder, Clock, Music, Settings, LayoutDashboard, Globe } from "lucide-react";
import Navbar from "../components/Navbar";
import { getAuth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import DeleteSongButton from "./DeleteSongButton";
import GsapWrapper from "../components/GsapWrapper";
import { Prisma } from "@prisma/client";

const prisma = db;

type DashboardSong = Prisma.SongGetPayload<{}>;

export default async function DashboardPage() {
  // En Next.js App Router (Server Component) we need to use a different way to get user id if we want to run SSR
  // But since we don't have the req object directly unless we pass it, it's easier to use currentUser()
  const { currentUser } = await import("@clerk/nextjs/server");
  const user = await currentUser();
  const userId = user?.id; // Clerk user id

  const handleGreetings = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return "Buenos días";
    } else if (hour < 18) {
      return "Buenas tardes";
    } else {
      return "Buenas noches";
    }
  }

  let dbUser = null;
  let songs: any[] = [];

  if (userId) {
    dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    });
    
    if (dbUser) {
      songs = await prisma.song.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
      });
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans relative transition-colors duration-500 flex flex-col pt-[72px]">
      
      {/* FONDO PROFESIONAL "BIG TECH WORKSHOP" GLOBAL */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-background" /> 
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" 
          style={{ backgroundImage: `linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)`, backgroundSize: '40px 40px' }} 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background" />
        <div className="absolute top-0 right-0 w-[50vw] h-[50vh] bg-primary/5 blur-[150px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[50vw] h-[50vh] bg-blue-500/5 blur-[150px] rounded-full" />
      </div>

      <Navbar variant="border" />
      
      <div className="flex flex-1 w-full max-w-[1600px] mx-auto z-10">
        
        {/* Sidebar Vertical (Hidden on mobile) */}
        <aside className="hidden md:flex flex-col w-64 border-r border-border/50 bg-background/50 backdrop-blur-md p-6 gap-8">
          <div className="flex flex-col gap-2">
             <p className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase mb-2">Mi Espacio</p>
             <Link href="/dashboard" className="flex items-center gap-3 text-sm font-semibold p-3 rounded-lg bg-primary/[0.08] text-primary border border-primary/20 shadow-[0_0_15px_rgba(var(--primary-raw),0.1)] transition-colors">
               <LayoutDashboard size={18} />
               Visión General
             </Link>
          </div>

          <div className="flex flex-col gap-2">
             <p className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase mb-2">Ajustes</p>

             <Link href="/settings" className="flex items-center gap-3 text-sm font-medium p-3 rounded-lg hover:bg-foreground/5 text-muted-foreground hover:text-foreground transition-all">
               <Settings size={18} />
               Configuración
             </Link>
          </div>
        </aside>

        {/* Main Content Dashboard */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10 lg:p-12 relative">
           
           <GsapWrapper animationType="fade-in" duration={1}>
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 gap-6">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-foreground">
                    {handleGreetings()}, <span className="font-bold">{user?.firstName || "Compositor"}</span>
                  </h1>
                  <p className="text-muted-foreground mt-2 font-medium">Aquí está un resumen de tu espacio creativo.</p>
                </div>

                <Link href="/editor?new=true" className="bg-primary text-primary-foreground px-6 py-3 rounded-full text-xs font-bold tracking-[0.1em] uppercase hover:scale-105 active:scale-95 transition-all shadow-[0_10px_20px_rgba(var(--primary-raw),0.2)] flex items-center gap-2 whitespace-nowrap">
                  <Plus size={16} />
                  Añadir nueva obra
                </Link>
             </div>
           </GsapWrapper>

           {/* Metrics Grid */}
           <GsapWrapper animationType="stagger-children" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12" delay={0.2}>
             
             <div className="bg-background/60 backdrop-blur-xl border border-white/10 dark:border-white/5 rounded-3xl p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all"></div>
               <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
               <p className="text-muted-foreground font-semibold text-sm flex items-center gap-2 relative z-10"><Music size={16} className="text-primary"/> Total Obras</p>
               <h3 className="text-5xl font-bold tracking-tighter mt-4 relative z-10 drop-shadow-md">{songs.length}</h3>
             </div>

             <div className="bg-background/60 backdrop-blur-xl border border-white/10 dark:border-white/5 rounded-3xl p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all"></div>
               <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
               <p className="text-muted-foreground font-semibold text-sm flex items-center gap-2 relative z-10"><Clock size={16} className="text-blue-500"/> Última Edición</p>
               <h3 className="text-2xl font-bold tracking-tight mt-4 relative z-10 drop-shadow-md">
                 {songs.length > 0 ? format(new Date(songs[0].updatedAt), "d MMM yyyy", { locale: es }) : "—"}
               </h3>
             </div>

             <div className="bg-primary text-primary-foreground border border-primary/20 rounded-3xl p-6 flex flex-col justify-center items-center shadow-md relative overflow-hidden text-center">
               <p className="text-primary-foreground/70 font-semibold text-sm mb-2">Plan Actual</p>
               <h3 className="text-3xl font-bold tracking-tighter">
                 {dbUser?.stripeSubscriptionId ? "PRO" : "GRATIS"}
               </h3>
               {!dbUser?.stripeSubscriptionId && (
                 <Link href="/pricing" className="mt-4 text-[10px] font-bold tracking-[0.2em] uppercase text-primary-foreground underline hover:text-white transition-colors">
                   Mejorar a Pro →
                 </Link>
               )}
             </div>

           </GsapWrapper>

           {/* Works Grid */}
           <div className="w-full">
              <h2 className="text-xl font-bold tracking-tight mb-6">Mis Obras Recientes</h2>
              
              {songs.length === 0 ? (
                <div className="w-full h-64 border-2 border-dashed border-border rounded-3xl flex flex-col items-center justify-center text-muted-foreground">
                  <Folder size={48} className="mb-4 opacity-50" />
                  <p className="font-semibold text-lg">Aún no tienes obras guardadas</p>
                  <p className="text-sm mt-1">Crea tu primera obra de arte musical en el estudio.</p>
                  <Link href="/editor?new=true" className="mt-6 font-bold text-primary text-sm hover:underline">
                    Ir al Estudio →
                  </Link>
                </div>
              ) : (
                <GsapWrapper animationType="stagger-children" delay={0.4} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {songs.map((song) => (
                    <div key={song.id} className="relative group">
                      <DeleteSongButton songId={song.id} />
                      <Link href={`/editor?id=${song.id}`} className="cursor-pointer block h-full">
                        <div className="bg-background/40 backdrop-blur-sm border border-white/10 dark:border-white/5 rounded-2xl p-6 h-48 flex flex-col justify-between hover:border-primary/50 hover:bg-background/80 hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_8px_30px_rgba(var(--primary-raw),0.1)] transition-all duration-300 relative overflow-hidden">
                          
                          <div className="flex justify-between items-start z-10 w-full pr-16">
                             <div className="bg-primary/10 text-primary border border-primary/20 shadow-inner p-2 rounded-lg">
                               <Music size={20} />
                             </div>
                             <div className="text-right">
                               <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-foreground/5 px-2 py-1 rounded-md border border-border/50">{song.bpm || 120} BPM</p>
                             </div>
                          </div>

                        <div className="z-10 mt-auto">
                          <h3 className="text-lg font-bold tracking-tight group-hover:text-primary transition-colors line-clamp-1 drop-shadow-sm">{song.title}</h3>
                          <p className="text-xs text-muted-foreground mt-1 font-medium">Actualizado: {format(new Date(song.updatedAt), "dd/MM/yyyy")}</p>
                        </div>
                        
                        {/* Decorative background visual */}
                        <div className="absolute -bottom-16 -right-16 w-40 h-40 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/20 transition-colors duration-500"></div>
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      </div>
                      </Link>
                    </div>
                  ))}
                </GsapWrapper>
              )}
           </div>

        </main>
      </div>
    </div>
  );
}
