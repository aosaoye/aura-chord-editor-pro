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
    const { song, price } = body;

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

    // Verificar si la canción ya existe y pertenece al usuario
    let savedSong;
    
    // El id vendrá dentro de song si estamos editando
    if (song.id && song.id.length > 20) {
      const existing = await prisma.song.findUnique({ where: { id: song.id } });
      if (existing && existing.userId === userId) {
        savedSong = await prisma.song.update({
          where: { id: song.id },
          data: {
            title: song.title,
            bpm: song.bpm || 120,
            parsedData: JSON.stringify(song),
            price: price != null ? Number(price) : undefined,
          } as any
        });
        return NextResponse.json({ success: true, savedSong }, { status: 200 });
      }
    }

    // 1. Verificar si el usuario ya alcanzó el límite del plan gratuito para creación nueva
    const isPro = dbUser.stripeSubscriptionId != null;
    const userSongsCount = await prisma.song.count({ where: { userId } });

    if (!isPro && userSongsCount >= 3) {
      return NextResponse.json(
        { error: "Límite del plan gratuito alcanzado. Actualiza a Pro para composiciones ilimitadas." },
        { status: 402 } // 402 Payment Required
      );
    }

    // Si no existe o es un id temporal generado en frontend, creamos uno nuevo
    savedSong = await (prisma.song as any).create({
      data: {
        userId,
        title: song.title,
        bpm: song.bpm || 120,
        rawLyrics: "(Letra generada)", 
        parsedData: JSON.stringify(song),
        price: price != null ? Number(price) : 0,
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

    const urlParams = new URL(req.url);
    const id = urlParams.searchParams.get("id");

    if (id) {
       // Buscar canción específica (puede ser pública o del usuario)
       const song = await (prisma as any).song.findUnique({
          where: { id },
          include: { 
            user: { select: { name: true, clerkId: true } },
            ratings: { select: { value: true, userId: true } }
          }
       });
       
       if (!song) {
           return NextResponse.json({ error: "Obra no encontrada" }, { status: 404 });
       }

       if ((song as any).userId !== userId && !(song as any).isPublic) {
           return NextResponse.json({ error: "No tienes permiso para ver esta obra" }, { status: 403 });
       }
       
       let hasPurchased = false;
       let isPreviewRestriction = false;

       // Marketplace: Preview Restriction para obras de pago
       if ((song as any).price && (song as any).price > 0 && (song as any).userId !== userId) {
          const purchase = await (prisma as any).purchase.findUnique({
            where: {
              userId_songId: { userId, songId: song.id }
            }
          });
          
          if (purchase) {
             hasPurchased = true;
          } else {
             // Aplicar censura o scrub del contenido para generar un preview
             try {
                const parsed = JSON.parse(song.parsedData);
                // Dejamos solo las 2 primeras secciones del JSON ChordPro (Preview)
                parsed.sections = parsed.sections.slice(0, 2);
                parsed.isPreviewRestriction = true; // Avisamos al editor
                song.parsedData = JSON.stringify(parsed);
                isPreviewRestriction = true;
             } catch(e) {}
          }
       }

       // Incluimos parsedData
       return NextResponse.json({ 
         success: true, 
         songs: [song], 
         hasPurchased, 
         isPreviewRestriction 
       }, { status: 200 });
    }

    // Listado normal del usuario
    const songs = await (prisma.song as any).findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, bpm: true, updatedAt: true, createdAt: true, parsedData: true, isPublic: true, price: true }
    });

    return NextResponse.json({ success: true, songs }, { status: 200 });
  } catch (error) {
    console.error("Error al obtener las obras:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = getAuth(req);
    const userId = session?.userId;
    
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const urlParams = new URL(req.url);
    const id = urlParams.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID de obra requerido" }, { status: 400 });
    }

    // Verificar propiedad
    const song = await prisma.song.findUnique({
      where: { id },
      select: { userId: true }
    });

    if (!song) {
      return NextResponse.json({ error: "Obra no encontrada" }, { status: 404 });
    }

    if (song.userId !== userId) {
      return NextResponse.json({ error: "No tienes permiso para eliminar esta obra" }, { status: 403 });
    }

    await prisma.song.delete({
      where: { id }
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error al eliminar la obra:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
