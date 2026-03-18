import { NextResponse, NextRequest } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const session = getAuth(req);
    const userId = session?.userId;
    
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const notifications = await (prisma as any).notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20
    });

    return NextResponse.json({ notifications }, { status: 200 });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = getAuth(req);
    const userId = session?.userId;
    
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Mark all as read
    await (prisma as any).notification.updateMany({
      where: { userId, read: false },
      data: { read: true }
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error marking notifications read:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
