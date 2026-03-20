"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

type FeedSong = {
  id: string;
  title: string;
  rawLyrics: string;
  price: number | null;
  user: { name: string; clerkId: string };
  _score: number;
};

export default function SmartFeedPage() {
  const { isSignedIn } = useUser();
  const router = useRouter();
  const [songs, setSongs] = useState<FeedSong[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Track viewport visibility to register "views" vs "skips"
  const observerRef = useRef<IntersectionObserver | null>(null);
  const viewTimestamps = useRef<Record<string, number>>({});

  useEffect(() => {
    // Si no está logueado, podríamos redirigir, pero dejamos que la API/Clerk lo decida
    if (isSignedIn === false) return;

    fetch("/api/feed")
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          setSongs(data.data);
        }
        setLoading(false);
      });
  }, [isSignedIn]);

  // Manejo de Interacciones vía IntersectionObserver
  useEffect(() => {
    if (loading || songs.length === 0) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const songId = entry.target.getAttribute("data-song-id");
          if (!songId) return;

          if (entry.isIntersecting) {
            // Empezó a mirarlo
            viewTimestamps.current[songId] = Date.now();
          } else {
            // Dejó de mirarlo
            const startTime = viewTimestamps.current[songId];
            if (startTime) {
              const viewDuration = Date.now() - startTime;
              // Si lo miró más de 3 segundos es un VIEW, si no es un SKIP
              const type = viewDuration > 3000 ? "view" : "skip";
              const value = type === "view" ? 1 : -1;

              fetch("/api/feed/interactions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ songId, type, value }),
              }).catch(() => {});
            }
          }
        });
      },
      { threshold: 0.6 } // Se activa cuando el 60% de la card es visible
    );

    const cards = document.querySelectorAll(".feed-card");
    cards.forEach((card) => observerRef.current?.observe(card));

    return () => observerRef.current?.disconnect();
  }, [loading, songs]);

  const handleLike = (songId: string) => {
     // Enviar interaction de Like (peso +3)
     fetch("/api/feed/interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songId, type: "like", value: 3 }),
     });
     // TODO: Update UI optimistic
  };

  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-black text-white">Cargando Smart Feed...</div>;

  return (
    <div className="h-[100dvh] w-full snap-y snap-mandatory overflow-y-scroll bg-black text-white">
      {songs.map((song) => (
        <div
          key={song.id}
          data-song-id={song.id}
          className="feed-card h-[100dvh] w-full snap-start snap-always relative flex items-end justify-center pb-20 select-none overflow-hidden border-b border-gray-900"
        >
          {/* Fondo difuminado o visual */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10 pointer-events-none" />

          {/* Letra de fondo gigante, estilo Canvas de Spotify */}
          <div className="absolute inset-0 flex items-center justify-center opacity-10 overflow-hidden pointer-events-none">
            <p className="text-[12vw] font-black leading-none break-all text-center filter blur-sm">
               {song.rawLyrics ? song.rawLyrics.slice(0, 100) : "MÚSICA"}
            </p>
          </div>

          <div className="relative z-20 w-full max-w-md px-6 flex justify-between items-end">
             {/* Info de Canción */}
             <div className="flex-1">
                <h2 className="text-3xl font-black mb-1">{song.title}</h2>
                <p className="text-gray-400 font-medium text-sm mb-4">
                  por @{song.user?.name || "Autor"}
                </p>
                
                {/* Score Debugging (Borrar en prod) */}
                <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-6">
                  Match Score: {song._score.toFixed(2)}
                </p>

                <button 
                  onClick={() => router.push(`/editor?id=${song.id}`)}
                  className="bg-white text-black px-6 py-3 rounded-full font-bold uppercase tracking-wider text-xs shadow-lg hover:scale-105 active:scale-95 transition-transform"
                >
                  Abrir Transcripción
                </button>
             </div>

             {/* Action Sidebar tipo TikTok */}
             <div className="flex flex-col items-center gap-6 ml-4 pb-4">
                <button 
                  onClick={() => handleLike(song.id)}
                  className="h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur flex items-center justify-center transition-colors"
                >
                  ❤️
                </button>
                <button className="h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur flex items-center justify-center transition-colors">
                  🔗
                </button>
                {song.price && song.price > 0 && (
                   <div className="h-12 w-12 rounded-full bg-yellow-500/20 text-yellow-500 flex items-center justify-center font-bold text-xs">
                     Pro
                   </div>
                )}
             </div>
          </div>
        </div>
      ))}
    </div>
  );
}
