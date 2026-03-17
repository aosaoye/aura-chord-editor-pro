import { NextResponse, NextRequest } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = getAuth(req);
    const followerId = session?.userId;
    const followingId = params.id;
    
    if (!followerId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (followerId === followingId) {
      return NextResponse.json({ error: "No puedes seguirte a ti mismo" }, { status: 400 });
    }

    // Comprobar si ya le sigue
    const existingFollow = await prisma.follows.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId
        }
      }
    });

    if (existingFollow) {
      // Si ya le sigue, dejamos de seguir (unfollow)
      await prisma.follows.delete({
        where: {
          followerId_followingId: {
            followerId,
            followingId
          }
        }
      });
      return NextResponse.json({ success: true, following: false });
    } else {
      // Si no le sigue, empezamos a seguir
      await prisma.follows.create({
        data: {
          followerId,
          followingId
        }
      });
      return NextResponse.json({ success: true, following: true });
    }
  } catch (error) {
    console.error("Error al seguir/dejar de seguir:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
