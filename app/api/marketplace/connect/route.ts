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
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { iban } = body;

    if (!iban || typeof iban !== 'string') {
      return NextResponse.json({ error: "IBAN Inválido" }, { status: 400 });
    }

    // Simulamos la creación de una cuenta conectada de Stripe guardando el IBAN
    // en producción aquí crearías un `stripe.accounts.create` y enviarías al usuario por el on-boarding.
    await (prisma.user as any).update({
      where: { clerkId: userId },
      data: {
        stripeConnectAccountId: `acct_simulated_${iban.substring(0, 10)}`
      }
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error al conectar cuenta bancaria:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
