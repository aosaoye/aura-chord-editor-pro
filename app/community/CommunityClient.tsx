"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
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
        <div className="text-center mb-12">
          <div className="relative group flex items-center shadow-lg rounded-full overflow-hidden border border-border bg-white dark:bg-zinc-900 focus-within:border-primary transition-colors max-w-2xl mx-auto">
            <Search className="absolute left-6 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Busca por título o autor... (Búsqueda en vivo)"
              className="w-full bg-transparent py-5 pl-16 pr-6 focus:outline-none text-lg font-light placeholder-muted-foreground"
            />
          </div>
        </div>
      </GsapWrapper>

      {query && (
        <GsapWrapper animationType="fade-in" delay={0.1}>
          <p className="mb-6 text-muted-foreground text-center">Resultados de tu búsqueda en vivo...</p>
        </GsapWrapper>
      )}

      <GsapWrapper animationType="stagger-children" delay={0.2} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSongs.length === 0 ? (
          <div className="col-span-full py-20 text-center flex flex-col items-center">
             <Music size={48} className="text-muted-foreground/30 mb-4" />
             <p className="text-xl font-bold">No se encontraron obras para "{query}".</p>
          </div>
        ) : (
          filteredSongs.map((song) => (
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
                       
                       const isOwner = userId === song.user.clerkId;

                       return (
                         <div className="flex items-center gap-1 ml-auto text-yellow-500" title={isOwner ? "N/A" : "Valoración"}>
                           <Star size={12} fill="currentColor" />
                           <span className="text-[10px] font-bold text-muted-foreground ml-1">({avgRating})</span>
                         </div>
                       );
                     })()}
                   </div>
                 </div>
               </div>
               
               <hr className="border-border mb-4" />
               <div className="flex justify-between items-center z-10">
                  <div className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
                    {new Date(song.updatedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-amber-500 uppercase tracking-widest bg-amber-500/10 px-2 py-1 rounded-md">
                      {song.price ? `${song.price.toFixed(2)}€` : "GRATIS"}
                    </span>
                    <Link href={`/editor?id=${song.id}`} className="text-xs font-bold text-primary uppercase tracking-widest group-hover:underline flex items-center gap-1">
                      Ver &rarr;
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
