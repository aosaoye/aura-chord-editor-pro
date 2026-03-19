import { NextResponse, NextRequest } from "next/server";
import { getAuth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { Prisma } from '@prisma/client';

const prisma = db;

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

    let savedSong;
    
    // 1. Verificación Fuerte de Plagio y Duplicación
    if (song.id && song.id.length > 20) {
      const existing = await prisma.song.findUnique({ where: { id: song.id } });
      if (existing) {
        if (existing.userId !== userId) {
          return NextResponse.json({ error: "🔒 Bloqueo de Plagio: Las obras de otros creadores no pueden sobrescribirse." }, { status: 403 });
        }
        
        // 🚀 SENIOR FIX: Llamada tipada correctamente. Prisma espera que parsedData sea Prisma.InputJsonValue
        savedSong = await prisma.song.update({
          where: { id: song.id },
          data: {
            title: song.title,
            bpm: song.bpm || 120,
            parsedData: song as Prisma.InputJsonValue, 
            price: price != null ? Number(price) : undefined,
          }
        });
        return NextResponse.json({ success: true, savedSong }, { status: 200 });
      }
    }

    if (song.metadata?.originalCreatorId && song.metadata.originalCreatorId !== userId) {
        return NextResponse.json({ error: "🔒 Bloqueo por Huella Digital: Este archivo ChordPro contiene metadatos de otro compositor." }, { status: 403 });
    }

    song.metadata = {
      originalCreatorId: userId,
      authorName: dbUser?.name || "Autor Verificado"
    };

    const isPro = dbUser.stripeSubscriptionId != null;
    const userSongsCount = await prisma.song.count({ where: { userId } });

    if (!isPro && userSongsCount >= 3) {
      return NextResponse.json(
        { error: "Límite del plan gratuito alcanzado. Actualiza a Pro para composiciones ilimitadas." },
        { status: 402 }
      );
    }

    // 🚀 SENIOR FIX: Sin `as any`
    savedSong = await prisma.song.create({
      data: {
        userId,
        title: song.title,
        bpm: song.bpm || 120,
        rawLyrics: "(Letra generada)", 
        parsedData: song as Prisma.InputJsonValue,
        price: price != null ? Number(price) : 0,
      },
    });

    return NextResponse.json({ success: true, savedSong }, { status: 200 });
  } catch (error) {
    console.error("Error al guardar la canción:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// app/api/songs/route.ts (Actualización Senior)

export async function PATCH(req: NextRequest) {
  try {
    const session = getAuth(req);
    const userId = session?.userId;
    if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await req.json();
    const { id, parsedData, title, bpm } = body;

    if (!id) return NextResponse.json({ error: "ID de obra requerido" }, { status: 400 });

    // 🚀 SENIOR FIX: Verificación fuerte de autoría antes de actualizar
    const song = await prisma.song.findUnique({ where: { id }, select: { userId: true } });
    if (!song) return NextResponse.json({ error: "Obra no encontrada" }, { status: 404 });
    if (song.userId !== userId) return NextResponse.json({ error: "🔒 Bloqueo de Seguridad: No eres el autor de esta obra." }, { status: 403 });

    // Actualización parcial
    const updatedSong = await prisma.song.update({
      where: { id },
      data: {
        // Solo actualizamos si nos pasan el dato
        ...(parsedData && { parsedData: parsedData as Prisma.InputJsonValue }),
        ...(title && { title }),
        ...(bpm && { bpm: Number(bpm) }),
      },
    });

    return NextResponse.json({ success: true, song: updatedSong }, { status: 200 });
  } catch (error) {
    console.error("Error en autoguardado:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = getAuth(req);
    const userId = session?.userId;
    
    if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const urlParams = new URL(req.url);
    const id = urlParams.searchParams.get("id");

    if (id) {
       // 🚀 SENIOR FIX: Todo fuertemente tipado
       const song = await prisma.song.findUnique({
          where: { id },
          include: { 
            user: { select: { name: true, clerkId: true } },
            ratings: { select: { value: true, userId: true } }
          }
       });
       
       if (!song) return NextResponse.json({ error: "Obra no encontrada" }, { status: 404 });

       if (song.userId !== userId && !song.isPublic) {
           return NextResponse.json({ error: "No tienes permiso para ver esta obra" }, { status: 403 });
       }
       
       let hasPurchased = false;
       let isPreviewRestriction = false;

       // Marketplace: Preview Restriction
       if (song.price && song.price > 0 && song.userId !== userId) {
          const purchase = await prisma.purchase.findUnique({
            where: {
              userId_songId: { userId, songId: song.id }
            }
          });
          
          if (purchase) {
             hasPurchased = true;
          } else {
             try {
                // Casteamos a 'any' solo para la manipulación en memoria antes de enviarlo
                const parsed = song.parsedData as any;
                parsed.sections = parsed.sections.slice(0, 1);
                if (parsed.sections.length > 0) {
                    parsed.sections[0].lines = parsed.sections[0].lines.slice(0, 1);
                }
                parsed.isPreviewRestriction = true; 
                song.parsedData = parsed;
                song.rawLyrics = "[CONTENIDO PROTEGIDO] Adquiere el acceso permanente para visualizar completo.";
                isPreviewRestriction = true;
             } catch(e) {
                song.rawLyrics = "[CONTENIDO PROTEGIDO]";
             }
          }
       }

       return NextResponse.json({ success: true, songs: [song], hasPurchased, isPreviewRestriction }, { status: 200 });
    }

    const songs = await prisma.song.findMany({
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
  // (Mantén tu código DELETE exactamente igual, solo asegúrate de no usar "as any")
  try {
    const session = getAuth(req);
    const userId = session?.userId;
    if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const urlParams = new URL(req.url);
    const id = urlParams.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID de obra requerido" }, { status: 400 });

    const song = await prisma.song.findUnique({ where: { id }, select: { userId: true } });
    if (!song) return NextResponse.json({ error: "Obra no encontrada" }, { status: 404 });
    if (song.userId !== userId) return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

    await prisma.song.delete({ where: { id } });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}