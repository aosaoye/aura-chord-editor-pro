import Link from "next/link";
import { Search, Music, Users, Clock, Globe, Star } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { db } from "@/lib/db";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { auth } from "@clerk/nextjs/server";
import GsapWrapper from "../components/GsapWrapper";
import CommunityClient from "./CommunityClient";
import GlobalAnimatedBackground from "../components/GlobalAnimatedBackground";
import { getTranslations } from "next-intl/server";

const prisma = db;

export default async function CommunityPage() {
  const { userId } = await auth();
  const t = await getTranslations('landing');

  // Buscamos canciones públicas recientes
  const publicSongs = await prisma.song.findMany({
    where: {
      isPublic: true,
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
    <div className="min-h-screen bg-background text-foreground font-sans relative overflow-x-hidden transition-colors duration-500 flex flex-col pt-[72px]">
      <GlobalAnimatedBackground />
      <Navbar variant="transparent" />
      
      <main className="flex-1 w-full max-w-[1400px] mx-auto p-6 md:p-10 lg:p-16 relative z-10 flex flex-col">
        
        {/* CHALKBOARD MUSIC HERO BANNER */}
        <GsapWrapper animationType="fade-in" duration={1.2} className="w-full relative rounded-[2rem] md:rounded-[3rem] border border-white/5 overflow-hidden mb-20 bg-[#0A0A0A]">
           
           {/* Background Image: Chalkboard with music notes */}
           <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/164936/pexels-photo-164936.jpeg')] bg-cover bg-center mix-blend-screen opacity-40 grayscale"></div>
           
           {/* Subtle gradient overlay for text readability */}
           <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>
           <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>

           <div className="relative z-10 p-10 sm:p-16 md:p-24 flex flex-col md:flex-row items-center justify-between gap-12 min-h-[400px] md:min-h-[500px]">
             
             {/* Left Text */}
             <div className="flex-1 w-full text-left self-end md:self-center">
               <h1 className="flex flex-col text-left">
                 <span className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-sans font-light tracking-tight text-white mb-2">
                   {t('music_that')}
                 </span>
                 <span className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-bold italic tracking-tighter text-white">
                   {t('tells_your_story')}
                 </span>
               </h1>
             </div>
             
             {/* Right CTA */}
             <div className="flex-none self-start md:self-end md:pb-6">
                <Link 
                  href="#community-list"
                  className="px-8 py-4 bg-[#1A1A1A]/80 backdrop-blur-md border border-white/10 text-white text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase rounded-full hover:bg-white hover:text-black transition-all duration-500 shadow-xl inline-block"
                >
                  {t('explore_community')}
                </Link>
             </div>
           </div>
        </GsapWrapper>
        
        <div id="community-list" className="scroll-mt-32"></div>

        <CommunityClient initialSongs={publicSongs} userId={userId} />

      </main>
      <Footer />
    </div>
  );
}
