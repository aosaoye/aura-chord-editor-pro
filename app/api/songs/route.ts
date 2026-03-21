import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

// GET fetching
export async function GET(req: NextRequest) {
  try {
    const session = getAuth(req);
    const userId = session?.userId;

    const id = req.nextUrl.searchParams.get("id");

    if (id) {
      const song = await db.song.findUnique({
        where: { id },
        include: { user: true, ratings: true }
      });

      if (!song) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

      // Transform db JSON back to object for frontend
      const parsedData = typeof song.parsedData === 'string' ? JSON.parse(song.parsedData) : song.parsedData;
      return NextResponse.json({ songs: [{ ...song, parsedData }] }, { status: 200 });
    }

    // List logic (if no id)
    const songs = await db.song.findMany({
      where: { isPublic: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ songs }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error interno" }, { status: 500 });
  }
}

// POST creating/updating
export async function POST(req: NextRequest) {
  try {
    const session = getAuth(req);
    const userId = session?.userId;
    if (!userId) return NextResponse.json({ error: "Debes iniciar sesión para guardar." }, { status: 401 });

    const body = await req.json();
    const { song } = body;

    // Frontend manda el objeto `song` completo con la lógica del editor.
    if (!song || !song.title) return NextResponse.json({ error: "Datos de la canción inválidos." }, { status: 400 });

    const songId = song.id;

    if (songId) {
      // Intenta actualizar
      const existing = await db.song.findUnique({ where: { id: songId } });
      if (existing) {
        if (existing.userId !== userId) return NextResponse.json({ error: "No tienes permiso para modificar esta obra." }, { status: 403 });
        
        // Actualizar
        const updated = await db.song.update({
          where: { id: songId },
          data: {
             title: song.title,
             bpm: Number(song.bpm) || 120,
             parsedData: song,
             rawLyrics: "Updated lyrics", 
          }
        });
        return NextResponse.json({ success: true, savedSong: updated }, { status: 200 });
      }
    }

    // Crear nuevo (si no hay ID o el ID era falso/inválido)
    const newSong = await db.song.create({
      data: {
        userId,
        title: song.title,
        bpm: Number(song.bpm) || 120,
        parsedData: song,
        rawLyrics: "Raw lyrics not provided",
        isPublic: true
      }
    });

    return NextResponse.json({ success: true, savedSong: newSong }, { status: 201 });

  } catch (error: any) {
    console.error("Save Error:", error);
    return NextResponse.json({ error: "Error de servidor al guardar." }, { status: 500 });
  }
}

// DELETE deleting
export async function DELETE(req: NextRequest) {
  try {
    const session = getAuth(req);
    const userId = session?.userId;
    if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID de obra requerido" }, { status: 400 });

    const song = await db.song.findUnique({ where: { id }, select: { userId: true } });
    if (!song) return NextResponse.json({ error: "Obra no encontrada" }, { status: 404 });
    if (song.userId !== userId) return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

    await db.song.delete({ where: { id } });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}