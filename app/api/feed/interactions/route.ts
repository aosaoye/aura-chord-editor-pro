import { requireUser } from "@/lib/auth";
import { ok, fail } from "@/lib/http";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const userId = await requireUser();
    const { songId, type, value } = await req.json();

    if (!songId || !type) {
      return fail({ code: "BAD_REQUEST", message: "Missing required fields" });
    }

    // Insertamos la interaccion (view, like, etc)
    const interaction = await db.interaction.create({
      data: {
        userId,
        songId,
        type,
        value: value || 1, // Peso default
      },
    });

    return ok({ success: true, interactionId: interaction.id });
  } catch (e) {
    return fail(e);
  }
}
