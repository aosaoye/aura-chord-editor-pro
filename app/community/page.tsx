import Link from "next/link";
import { Search, Music, Users, Clock, Globe, Star } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { PrismaClient } from "@prisma/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { auth } from "@clerk/nextjs/server";
import GsapWrapper from "../components/GsapWrapper";
import CommunityClient from "./CommunityClient";


const prisma = new PrismaClient();

export default async function CommunityPage() {
  const { userId } = await auth();

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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-foreground font-sans relative overflow-hidden transition-colors duration-500 flex flex-col pt-[72px]">
      <Navbar variant="border" className="bg-white/80 dark:bg-zinc-950/80 border-b border-border" />
      
      <main className="flex-1 w-full max-w-[1200px] mx-auto p-6 md:p-10 lg:p-12">
        
        <CommunityClient initialSongs={publicSongs} userId={userId} />

      </main>
      <Footer />
    </div>
  );
}
