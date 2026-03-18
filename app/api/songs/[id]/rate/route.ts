import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { rating } = await req.json();

    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Invalid rating value" }, { status: 400 });
    }

    const { id: songId } = await params;

    // Check if song exists
    const song = await prisma.song.findUnique({
      where: { id: songId }
    });

    if (!song) {
       return NextResponse.json({ error: "Song not found" }, { status: 404 });
    }

    // Upsert rating (Create if not exists, update if exists)
    const newRating = await (prisma as any).songRating.upsert({
      where: {
         userId_songId: {
            userId: userId,
            songId: songId
         }
      },
      update: {
         value: rating
      },
      create: {
         userId: userId,
         songId: songId,
         value: rating
      }
    });

    return NextResponse.json(newRating, { status: 200 });
  } catch (error) {
    console.error("Error rating song:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
