import { NextResponse } from "next/server";
import { getAuth, currentUser } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";
import { NextRequest } from "next/server";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const session = getAuth(req);
    const userId = session?.userId;
    
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { song } = body;

    if (!song || !song.title) {
      return NextResponse.json({ error: "Faltan datos de la canción" }, { status: 400 });
    }

    // Asegurar que el usuario existe en nuestra base de datos (Sincronización lazy)
    let dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!dbUser) {
      const clerkUser = await currentUser();
      dbUser = await prisma.user.create({
        data: {
          clerkId: userId,
          email: clerkUser?.emailAddresses[0]?.emailAddress ?? "",
          name: clerkUser?.firstName ?? "Usuario",
        },
      });
    }

    // 1. Verificar si el usuario ya alcanzó el límite del plan gratuito
    const isPro = dbUser.stripeSubscriptionId != null;
    const userSongsCount = await prisma.song.count({ where: { userId } });

    if (!isPro && userSongsCount >= 3) {
      return NextResponse.json(
        { error: "Límite del plan gratuito alcanzado. Actualiza a Pro para composiciones ilimitadas." },
        { status: 402 } // 402 Payment Required
      );
    }

    // Guardar o actualizar la canción
    const savedSong = await prisma.song.create({
      data: {
        userId,
        title: song.title,
        bpm: song.bpm || 120,
        rawLyrics: "(Letra JSON comprimida)", // Idealmente guardas el string original de creación
        parsedData: JSON.stringify(song),
      },
    });

    return NextResponse.json({ success: true, savedSong }, { status: 200 });
  } catch (error) {
    console.error("Error al guardar la canción:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = getAuth(req);
    const userId = session?.userId;
    
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const songs = await prisma.song.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, bpm: true, updatedAt: true, createdAt: true }
    });

    return NextResponse.json({ success: true, songs }, { status: 200 });
  } catch (error) {
    console.error("Error al obtener las obras:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
