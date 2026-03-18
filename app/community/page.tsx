import Link from "next/link";
import { Search, Music, Users, Clock, Globe } from "lucide-react";
import Navbar from "../components/Navbar";
import { PrismaClient } from "@prisma/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { auth } from "@clerk/nextjs/server";
import GsapWrapper from "../components/GsapWrapper";
import StarRatingInteractive from "../components/StarRatingInteractive";

const prisma = new PrismaClient();

export default async function CommunityPage({ searchParams }: { searchParams: { q?: string } }) {
  const query = searchParams.q || "";
  const { userId } = await auth();

  // Buscamos canciones públicas recientes
  const publicSongs = await prisma.song.findMany({
    where: {
      isPublic: true,
      ...(query ? {
        title: {
          contains: query,
          mode: "insensitive"
        }  ,
      } : {})
    },
    include: {
      user: {
        select: {
          name: true,
          clerkId: true,
          _count: {
            select: {
              followers: true,
              songs: { where: { isPublic: true } }
            }
          }
        }
      },
      ratings: {
        select: { value: true, userId: true }
      }
    },
    orderBy: { updatedAt: "desc" },
    take: 40
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-foreground font-sans relative overflow-hidden transition-colors duration-500 flex flex-col pt-[72px]">
      <Navbar variant="border" className="bg-white/80 dark:bg-zinc-950/80 border-b border-border" />
      
      <main className="flex-1 w-full max-w-[1200px] mx-auto p-6 md:p-10 lg:p-12">
        
        <GsapWrapper animationType="fade-up" duration={1}>
          <div className="text-center mb-12">
             <div className="inline-flex items-center justify-center p-3 bg-primary/10 text-primary rounded-full mb-6">
                <Globe size={32} />
             </div>
             <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Comunidad Global</h1>
             <p className="text-muted-foreground text-lg max-w-xl mx-auto font-light mb-10">
               Descubre la música de otros creadores, encuentra inspiración y sigue a tus compositores favoritos.
             </p>

           <form className="max-w-2xl mx-auto relative group flex items-center shadow-lg rounded-full overflow-hidden border border-border bg-white dark:bg-zinc-900 focus-within:border-primary transition-colors">
              <Search className="absolute left-6 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
              <input 
                 type="text" 
                 name="q"
                 defaultValue={query}
                 placeholder="Busca partituras o autores..."
                 className="w-full bg-transparent py-5 pl-16 pr-6 focus:outline-none text-lg font-light placeholder-muted-foreground"
              />
              <button type="submit" className="absolute right-2 px-6 py-3 bg-primary text-primary-foreground font-bold text-xs uppercase tracking-widest rounded-full hover:bg-primary/90 transition-colors">
                Buscar
              </button>
           </form>
          </div>
        </GsapWrapper>

        {query && (
          <GsapWrapper animationType="fade-in" delay={0.2}>
            <p className="mb-6 text-muted-foreground">Resultados para: <span className="text-foreground font-bold">"{query}"</span></p>
          </GsapWrapper>
        )}

        <GsapWrapper animationType="stagger-children" delay={0.3} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {publicSongs.length === 0 ? (
            <div className="col-span-full py-20 text-center flex flex-col items-center">
               <Music size={48} className="text-muted-foreground/30 mb-4" />
               <p className="text-xl font-bold">No se encontraron obras públicas.</p>
               <p className="text-muted-foreground mt-2">Prueba a buscar otro nombre o sé el primero en publicar una obra magistral.</p>
            </div>
          ) : (
            (publicSongs as any[]).map((song) => (
               <div key={song.id} className="group bg-white dark:bg-zinc-900 border border-border rounded-3xl p-6 flex flex-col justify-between hover:border-primary hover:shadow-xl transition-all duration-300 relative overflow-hidden">
                 
                 <div className="flex justify-between items-start z-10 mb-6">
                    <div className="bg-primary/10 text-primary p-3 rounded-2xl">
                      <Music size={24} />
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-2 py-1 bg-muted rounded-full">{song.bpm} BPM</p>
                    </div>
                 </div>

                 <div className="z-10 mb-8">
                   <h3 className="text-2xl font-black tracking-tight group-hover:text-primary transition-colors line-clamp-1 mb-2">{song.title}</h3>
                   <div className="flex flex-col gap-2 mt-3">
                     <div className="flex items-center gap-2">
                       <Users size={14} className="text-muted-foreground" />
                       <Link href={`/u/${song.user.clerkId}`} className="text-sm text-foreground hover:text-primary transition-colors font-bold tracking-tight">
                          {song.user.name || "Músico Anónimo"}
                       </Link>
                     </div>
                     <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
                       <span title="Seguidores del Autor">{song.user._count.followers} Seguidores</span>
                       <span>•</span>
                       <span title="Obras Globales Publicadas">{song.user._count.songs} Obras</span>
                       <span>•</span>
                       {(() => {
                         const avgRating = song.ratings.length > 0
                           ? (song.ratings.reduce((acc: number, r: { value: number }) => acc + r.value, 0) / song.ratings.length).toFixed(1)
                           : "0";
                         
                         const myRating = userId ? song.ratings.find((r: { userId: string, value: number }) => r.userId === userId)?.value || 0 : 0;
                         const isOwner = userId === song.user.clerkId;

                         return (
                           <div className="flex items-center gap-2 ml-auto" title={isOwner ? "No puedes votar tu propia obra" : "Valora esta obra"}>
                             <StarRatingInteractive 
                               songId={song.id} 
                               myInitialRating={myRating} 
                               readOnly={!userId || isOwner} 
                             />
                             <span className="text-[10px] font-bold text-muted-foreground">({avgRating})</span>
                           </div>
                         );
                       })()}
                     </div>
                   </div>
                 </div>
                 
                 <div className="z-10 flex items-center justify-between border-t border-border pt-4 mt-auto">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                      <Clock size={12} />
                      {format(new Date(song.createdAt), "d MMM, yy", { locale: es })}
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {song.price && song.price > 0 ? (
                        <span className="text-xs font-black px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full border border-amber-500/20">
                          {song.price.toFixed(2)} €
                        </span>
                      ) : (
                        <span className="text-xs font-black px-3 py-1 bg-primary/10 text-primary rounded-full border border-primary/20">
                          GRATIS
                        </span>
                      )}
                      
                      <Link href={`/editor?id=${song.id}`} className="text-xs font-bold uppercase tracking-widest text-primary hover:text-primary/70 transition-colors flex items-center gap-1">
                        VER →
                      </Link>
                    </div>
                 </div>

                 {/* Visual Decorativo */}
                 <div className="absolute -bottom-16 -right-16 w-40 h-40 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all opacity-50 group-hover:opacity-100 pointer-events-none"></div>
               </div>
            ))
          )}
        </GsapWrapper>

      </main>
    </div>
  );
}
