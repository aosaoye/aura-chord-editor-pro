import { NextResponse, NextRequest } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = getAuth(req);
    const userId = session?.userId;
    
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { isPublic } = body;

    // Verify ownership
    const song = await (prisma as any).song.findUnique({ where: { id } });
    
    if (!song || song.userId !== userId) {
      return NextResponse.json({ error: "Obra no encontrada o no tienes permiso" }, { status: 404 });
    }

    const updatedSong = await (prisma as any).song.update({
      where: { id },
      data: { isPublic },
      include: {
        user: {
          select: {
            name: true,
            followers: { select: { followerId: true } }
          }
        }
      }
    });

    // Enviar notificación a seguidores si se hace pública por primera vez
    if (isPublic && !song.isPublic) {
        const followers = updatedSong.user?.followers || [];
        if (followers.length > 0) {
           await (prisma as any).notification.createMany({
             data: followers.map((f: any) => ({
               userId: f.followerId,
               message: `${updatedSong.user?.name || 'Un músico'} ha publicado una nueva partitura: "${updatedSong.title}"`,
               link: `/editor?id=${updatedSong.id}`
             }))
           });
        }
    }

    return NextResponse.json({ success: true, isPublic: updatedSong.isPublic }, { status: 200 });
  } catch (error) {
    console.error("Error al publicar la canción:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
