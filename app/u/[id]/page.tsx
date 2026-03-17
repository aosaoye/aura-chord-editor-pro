import { notFound } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import Navbar from "../../components/Navbar";
import { Users, Music, Clock } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { getAuth } from "@clerk/nextjs/server";
import FollowButton from "./FollowButton";

const prisma = new PrismaClient();

export default async function UserProfilePage({ params }: { params: { id: string } }) {
  const { id } = params;

  const { currentUser } = await import('@clerk/nextjs/server');
  const user = await currentUser();
  const currentUserId = user?.id;

  const profileUser = await prisma.user.findUnique({
    where: { clerkId: id },
    include: {
      _count: {
        select: {
          followers: true,
          following: true,
          songs: { where: { isPublic: true } }
        }
      }
    }
  });

  if (!profileUser) {
    return notFound();
  }

  // Check follow status if logged in
  let isFollowing = false;
  if (currentUserId && currentUserId !== id) {
    const followRecord = await prisma.follows.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: id
        }
      }
    });
    isFollowing = !!followRecord;
  }

  // Obtenemos las obras públicas
  const publicSongs = await prisma.song.findMany({
    where: {
      userId: id,
      isPublic: true
    },
    orderBy: { updatedAt: "desc" },
    take: 50
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-foreground font-sans relative overflow-hidden transition-colors duration-500 flex flex-col pt-[72px]">
      <Navbar variant="border" className="bg-white/80 dark:bg-zinc-950/80 border-b border-border" />
      
      <main className="flex-1 w-full max-w-[1200px] mx-auto p-6 md:p-10 lg:p-12">
        {/* Cabecera de Perfil */}
        <div className="bg-white dark:bg-zinc-900 border border-border rounded-3xl p-8 md:p-16 mb-12 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center md:items-start justify-between gap-8 text-center md:text-left">
           {/* Visual Element */}
           <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>

           <div>
              <div className="w-24 h-24 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6 mx-auto md:mx-0 shadow-inner">
                 <Users size={40} />
              </div>
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-2">{profileUser.name || "Músico Anónimo"}</h1>
              <p className="text-muted-foreground tracking-widest uppercase text-xs font-bold flex flex-wrap gap-4 items-center justify-center md:justify-start">
                 <span><span className="text-foreground">{profileUser._count.followers}</span> Seguidores</span>
                 <span>•</span>
                 <span><span className="text-foreground">{profileUser._count.following}</span> Siguiendo</span>
                 <span>•</span>
                 <span><span className="text-foreground">{profileUser._count.songs}</span> Obras Públicas</span>
              </p>
           </div>
           
           <div className="mt-4 md:mt-0 flex flex-col items-center md:items-end gap-4 relative z-10 w-full md:w-auto">
              {currentUserId && currentUserId !== id && (
                <FollowButton userId={id} initialFollowing={isFollowing} />
              )}
              {currentUserId === id && (
                <span className="px-6 py-2 bg-muted text-muted-foreground rounded-full text-xs font-bold uppercase tracking-widest border border-border/50">Tu Perfil Público</span>
              )}
           </div>
        </div>

        <div className="mb-8 border-b border-border pb-4">
           <h2 className="text-2xl font-bold tracking-tight">Partituras de {profileUser.name}</h2>
        </div>

        {/* Lista de obras del usuario */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-5 duration-700">
          {publicSongs.length === 0 ? (
            <div className="col-span-full py-20 text-center">
               <Music size={48} className="text-muted-foreground/30 mx-auto mb-4" />
               <p className="text-lg font-bold">Este perfil aún no ha compartido obras abiertamente.</p>
            </div>
          ) : (
            publicSongs.map((song) => (
               <Link href={`/editor?id=${song.id}`} key={song.id} className="group">
                 <div className="bg-white dark:bg-zinc-900 border border-border rounded-2xl p-6 h-48 flex flex-col justify-between hover:border-primary hover:shadow-lg transition-all duration-300 relative overflow-hidden">
                   
                   <div className="flex justify-between items-start z-10 mb-6">
                      <div className="bg-primary/10 text-primary p-2 rounded-lg">
                        <Music size={20} />
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{song.bpm} BPM</p>
                      </div>
                   </div>

                   <div className="z-10 mt-auto">
                     <h3 className="text-lg font-bold tracking-tight group-hover:text-primary transition-colors line-clamp-1">{song.title}</h3>
                     <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground font-medium">
                        <Clock size={12} />
                        Actualizado {format(new Date(song.updatedAt), "d MMM, yyyy", { locale: es })}
                     </div>
                   </div>
                   
                   {/* Decorative background visual */}
                   <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors pointer-events-none"></div>
                 </div>
               </Link>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
