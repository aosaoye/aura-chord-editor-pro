import { NextResponse, NextRequest } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = getAuth(req);
    const userId = session?.userId;
    
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const { isPublic } = body;

    // Verify ownership
    const song = await prisma.song.findUnique({ where: { id } });
    
    if (!song || song.userId !== userId) {
      return NextResponse.json({ error: "Obra no encontrada o no tienes permiso" }, { status: 404 });
    }

    const updatedSong = await prisma.song.update({
      where: { id },
      data: { isPublic },
    });

    return NextResponse.json({ success: true, isPublic: updatedSong.isPublic }, { status: 200 });
  } catch (error) {
    console.error("Error al publicar la canción:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
