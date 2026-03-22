"use client";

import { useState, useMemo } from "react";
import { Link } from "@/i18n/routing";
import { Search, Music, Users, Star } from "lucide-react";
import GsapWrapper from "../components/GsapWrapper";

interface CommunityClientProps {
  initialSongs: any[];
  userId: string | null;
}

export default function CommunityClient({ initialSongs, userId }: CommunityClientProps) {
  const [query, setQuery] = useState("");

  const filteredSongs = useMemo(() => {
    if (!query) return initialSongs;
    const lowerQ = query.toLowerCase();
    return initialSongs.filter(song => 
      song.title.toLowerCase().includes(lowerQ) || 
      (song.user?.name && song.user.name.toLowerCase().includes(lowerQ))
    );
  }, [query, initialSongs]);

  return (
    <>
      <GsapWrapper animationType="fade-up" duration={1}>
        <div className="text-center mb-16">
          <div className="relative group flex items-center shadow-[0_10px_40px_rgba(0,0,0,0.5)] rounded-full overflow-hidden border border-white/10 bg-white/5 backdrop-blur-md focus-within:border-teal-500/50 focus-within:bg-white/10 transition-all duration-300 max-w-2xl mx-auto">
            <Search className="absolute left-6 text-zinc-500 group-focus-within:text-teal-400 transition-colors" size={20} />
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Busca por título o autor..."
              className="w-full bg-transparent py-5 pl-16 pr-6 focus:outline-none text-lg font-light text-white placeholder-zinc-500 tracking-wide"
            />
          </div>
        </div>
      </GsapWrapper>

      {query && (
        <GsapWrapper animationType="fade-in" delay={0.1}>
          <p className="mb-6 text-muted-foreground text-center">Resultados de tu búsqueda en vivo...</p>
        </GsapWrapper>
      )}

      <GsapWrapper animationType="stagger-children" delay={0.2} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredSongs.length === 0 ? (
          <div className="col-span-full py-20 text-center flex flex-col items-center">
             <Music size={48} className="text-zinc-600 mb-6 drop-shadow-lg" />
             <p className="text-2xl font-light text-zinc-400">No se encontraron obras para "{query}".</p>
          </div>
        ) : (
          filteredSongs.map((song) => (
             <div key={song.id} className="group bg-foreground/[0.03] dark:bg-white/5 backdrop-blur-xl border border-border/50 dark:border-white/10 rounded-[2.5rem] p-8 flex flex-col justify-between hover:border-teal-500/50 hover:bg-foreground/5 dark:hover:bg-white/10 hover:shadow-[0_20px_60px_rgba(45,212,191,0.15)] transition-all duration-500 relative overflow-hidden">
               
               {/* Internal Card Glow On Hover */}
               <div className="absolute -top-24 -right-24 w-48 h-48 bg-teal-500/20 rounded-full blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

               <div className="flex justify-between items-start z-10 mb-8 w-full">
                  <div className="bg-gradient-to-br from-teal-500/20 to-transparent border border-teal-500/30 text-teal-400 p-3 rounded-2xl shadow-inner group-hover:scale-110 transition-transform duration-500">
                    <Music size={22} className="drop-shadow-[0_0_8px_rgba(45,212,191,0.5)]" />
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest px-3 py-1 bg-foreground/5 dark:bg-black/40 border border-border/50 dark:border-white/5 rounded-full">{song.bpm || 120} BPM</p>
                  </div>
               </div>

               <div className="z-10 mb-8">
                 <h3 className="text-2xl font-serif italic font-bold tracking-tight text-foreground group-hover:text-teal-500 dark:group-hover:text-teal-400 transition-colors line-clamp-2 mb-4 leading-snug drop-shadow-sm">{song.title}</h3>
                 <div className="flex flex-col gap-3 mt-4">
                   <div className="flex items-center gap-2">
                     <div className="w-5 h-5 rounded-full bg-foreground/10 dark:bg-zinc-800 flex items-center justify-center border border-border/50 dark:border-white/10">
                       <Users size={10} className="text-zinc-600 dark:text-zinc-400" />
                     </div>
                     <Link href={`/u/${song.user.clerkId}`} className="text-xs text-foreground/70 hover:text-foreground transition-colors font-bold tracking-wide">
                        {song.user.name || "Músico Anónimo"}
                     </Link>
                   </div>
                   <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold tracking-widest uppercase text-zinc-500">
                     <span title="Seguidores del Autor">{song.user._count.followers} SEGS</span>
                     <span className="text-zinc-700">•</span>
                     <span title="Obras Globales Publicadas">{song.user._count.songs} OBRAS</span>
                     <span className="text-zinc-700">•</span>
                     {(() => {
                       const avgRating = song.ratings.length > 0
                         ? (song.ratings.reduce((acc: number, r: { value: number }) => acc + r.value, 0) / song.ratings.length).toFixed(1)
                         : "0";
                       
                       const isOwner = userId === song.user.clerkId;

                       return (
                         <div className="flex items-center gap-1 ml-auto text-amber-400 bg-amber-400/10 px-2 py-1 rounded-md border border-amber-400/20" title={isOwner ? "N/A" : "Valoración"}>
                           <Star size={10} fill="currentColor" />
                           <span className="text-[10px] font-bold text-amber-500 ml-1">({avgRating})</span>
                         </div>
                       );
                     })()}
                   </div>
                 </div>
               </div>
               
                <hr className="border-border/50 dark:border-white/5 mb-5" />
               <div className="flex justify-between items-center z-10 w-full">
                  <div className="text-[9px] font-bold tracking-[0.2em] uppercase text-zinc-500">
                    {new Date(song.updatedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </div>
                  <div className="flex items-center gap-3">
                    <Link href={`/editor?id=${song.id}`} className="text-[10px] font-bold text-primary bg-primary/10 px-4 py-2 rounded-full uppercase tracking-widest group-hover:bg-primary group-hover:text-primary-foreground transition-all flex items-center gap-2">
                      Acceder
                    </Link>
                  </div>
               </div>
             </div>
          ))
        )}
      </GsapWrapper>
    </>
  );
}
