import Link from "next/link";
import { Plus, Folder, Clock, Music, Settings, LayoutDashboard, Globe } from "lucide-react";
import Navbar from "../components/Navbar";
import { getAuth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import PublicToggle from "./PublicToggle";
import DeleteSongButton from "./DeleteSongButton";

const prisma = new PrismaClient();

export default async function DashboardPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  // En Next.js App Router (Server Component) we need to use a different way to get user id if we want to run SSR
  // But since we don't have the req object directly unless we pass it, it's easier to use currentUser()
  const { currentUser } = await import("@clerk/nextjs/server");
  const user = await currentUser();
  const userId = user?.id; // Clerk user id

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
    <div className="min-h-screen bg-background text-foreground font-sans relative overflow-hidden transition-colors duration-500 flex flex-col pt-[72px]">
      <Navbar variant="border" className="bg-background/80 border-b border-border" />
      
      <div className="flex flex-1 w-full max-w-[1600px] mx-auto overflow-hidden">
        
        {/* Sidebar Vertical (Hidden on mobile, very similar to the reference image) */}
        <aside className="hidden md:flex flex-col w-64 border-r border-border bg-background p-6 gap-8">
          <div className="flex flex-col gap-2">
             <p className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase mb-2">Mi Espacio</p>
             <Link href="/dashboard" className="flex items-center gap-3 text-sm font-semibold p-3 rounded-lg bg-primary/10 text-primary transition-colors">
               <LayoutDashboard size={18} />
               Visión General
             </Link>
             <Link href="/editor?new=true" className="flex items-center gap-3 text-sm font-medium p-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-muted-foreground hover:text-foreground transition-colors">
               <Plus size={18} />
               Nueva Obra
             </Link>
             <Link href="/dashboard" className="flex items-center gap-3 text-sm font-medium p-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-muted-foreground hover:text-foreground transition-colors">
               <Folder size={18} />
               Todas mis obras
             </Link>
             <Link href="/community" className="flex items-center gap-3 text-sm font-medium p-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-muted-foreground hover:text-foreground transition-colors">
               <Globe size={18} />
               Comunidad
             </Link>
          </div>

          <div className="flex flex-col gap-2">
             <p className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase mb-2">Ajustes</p>
             <Link href="/settings" className="flex items-center gap-3 text-sm font-medium p-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-muted-foreground hover:text-foreground transition-colors">
               <Settings size={18} />
               Configuración
             </Link>
          </div>
        </aside>

        {/* Main Content Dashboard */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10 lg:p-12 relative">
           
           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 gap-6">
              <div>
                <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-foreground">
                  Buenos días, <span className="font-bold">{user?.firstName || "Compositor"}</span>
                </h1>
                <p className="text-muted-foreground mt-2 font-medium">Aquí está un resumen de tu espacio creativo.</p>
              </div>

              <Link href="/editor" className="bg-primary text-primary-foreground px-6 py-3 rounded-xl text-xs font-bold tracking-[0.1em] uppercase hover:scale-105 active:scale-95 transition-all shadow-[0_10px_20px_rgba(var(--primary-raw),0.2)] flex items-center gap-2 whitespace-nowrap">
                <Plus size={16} />
                Añadir nueva obra
              </Link>
           </div>

           {/* Metrics Grid */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
             
             <div className="bg-background border border-border rounded-3xl p-6 flex flex-col justify-between shadow-sm relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all"></div>
               <p className="text-muted-foreground font-semibold text-sm flex items-center gap-2 relative z-10"><Music size={16}/> Total Obras</p>
               <h3 className="text-5xl font-bold tracking-tighter mt-4 relative z-10">{songs.length}</h3>
             </div>

             <div className="bg-background border border-border rounded-3xl p-6 flex flex-col justify-between shadow-sm relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all"></div>
               <p className="text-muted-foreground font-semibold text-sm flex items-center gap-2 relative z-10"><Clock size={16}/> Última Edictión</p>
               <h3 className="text-2xl font-bold tracking-tight mt-4 relative z-10">
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

           </div>

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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {songs.map((song) => (
                    <div key={song.id} className="relative group">
                      <PublicToggle songId={song.id} initialIsPublic={song.isPublic ?? false} />
                      <DeleteSongButton songId={song.id} />
                      <Link href={`/editor?id=${song.id}`} className="cursor-pointer">
                        <div className="bg-background border border-border rounded-2xl p-6 h-48 flex flex-col justify-between hover:border-primary hover:shadow-lg transition-all duration-300 relative overflow-hidden">
                          
                          <div className="flex justify-between items-start z-10 w-full pr-16">
                             <div className="bg-primary/10 text-primary p-2 rounded-lg">
                               <Music size={20} />
                             </div>
                             <div className="text-right">
                               <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{song.bpm} BPM</p>
                             </div>
                          </div>

                        <div className="z-10 mt-auto">
                          <h3 className="text-lg font-bold tracking-tight group-hover:text-primary transition-colors line-clamp-1">{song.title}</h3>
                          <p className="text-xs text-muted-foreground mt-1">Actualizado: {format(new Date(song.updatedAt), "dd/MM/yyyy")}</p>
                        </div>
                        
                        {/* Decorative background visual */}
                        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors"></div>
                      </div>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
           </div>

        </main>
      </div>
    </div>
  );
}
