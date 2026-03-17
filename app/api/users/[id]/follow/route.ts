import { NextResponse, NextRequest } from "next/server";
import { getAuth, currentUser } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = getAuth(req);
    const followerId = session?.userId;
    const { id: followingId } = await params;
    
    if (!followerId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (followerId === followingId) {
      return NextResponse.json({ error: "No puedes seguirte a ti mismo" }, { status: 400 });
    }

    // Asegurar que el usuario follower existe en la base de datos (Sincronización lazy)
    let dbUser = await prisma.user.findUnique({
      where: { clerkId: followerId },
    });

    if (!dbUser) {
      const clerkUser = await currentUser();
      dbUser = await prisma.user.create({
        data: {
          clerkId: followerId,
          email: clerkUser?.emailAddresses[0]?.emailAddress ?? "",
          name: clerkUser?.firstName ?? "Usuario",
        },
      });
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
