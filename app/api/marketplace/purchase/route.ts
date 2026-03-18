import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";
import { NextRequest } from "next/server";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const session = getAuth(req);
    const userId = session?.userId;
    
    if (!userId) {
      return NextResponse.json({ error: "Debes iniciar sesión para comprar" }, { status: 401 });
    }

    const body = await req.json();
    const { songId } = body;

    if (!songId) {
      return NextResponse.json({ error: "ID de obra inválido" }, { status: 400 });
    }

    // Buscar canción
    const song = await (prisma.song as any).findUnique({
      where: { id: songId }
    });

    if (!song || !song.price || song.price <= 0) {
      return NextResponse.json({ error: "Esta obra no está a la venta o no existe" }, { status: 400 });
    }

    if (song.userId === userId) {
      return NextResponse.json({ error: "No puedes comprar tu propia obra" }, { status: 400 });
    }

    // Verificar si ya la ha comprado
    const existingPurchase = await (prisma as any).purchase.findUnique({
      where: {
        userId_songId: { userId, songId }
      }
    });

    if (existingPurchase) {
      return NextResponse.json({ error: "Ya posees esta obra" }, { status: 400 });
    }

    // BLOQUEO DE PAGOS FALSOS: Evitar que los usuarios se aprueben la obra sin pagar
    // TODO: Eliminar esto cuando Stripe Checkout se integre en la fase final.
    return NextResponse.json({ error: "Checkout y pasarela de pago en mantenimiento. Las compras premium están temporalmente pausadas." }, { status: 400 });

  } catch (error) {
    console.error("Error al procesar la compra:", error);
    return NextResponse.json({ error: "Error interno procesando el pago" }, { status: 500 });
  }
}
