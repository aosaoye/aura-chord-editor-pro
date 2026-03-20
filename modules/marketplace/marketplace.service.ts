import { stripe } from "@/lib/stripe";
import { AppError } from "@/lib/errors";
import { marketplaceRepository } from "./marketplace.repository";
import { db } from "@/lib/db";

export const marketplaceService = {
  async createCheckout(userId: string, songId: string) {
    const song = await db.song.findUnique({
      where: { id: songId },
    });

    if (!song) {
      throw new AppError(404, "SONG_NOT_FOUND", "Canción no encontrada");
    }

    if (!song.isPublic) {
      throw new AppError(403, "NOT_PUBLIC", "La canción no es pública");
    }

    if (!song.price || song.price <= 0) {
      throw new AppError(400, "NOT_FOR_SALE", "La canción es gratuita");
    }

    const alreadyBought = await marketplaceRepository.hasPurchased(
      userId,
      songId
    );

    if (alreadyBought) {
      throw new AppError(400, "ALREADY_PURCHASED", "Ya habías adquirido esta obra");
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `Aura Chords Pro: ${song.title}`,
            },
            unit_amount: Math.round(song.price * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId,
        songId,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/editor?id=${song.id}&success=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/editor?id=${song.id}&canceled=1`,
    });

    return session.url;
  },

  async handleWebhook(event: any) {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      const userId = session.metadata?.userId;
      const songId = session.metadata?.songId;
      const amount = session.amount_total ? session.amount_total / 100 : 0;

      if (!userId || !songId) return;

      await marketplaceRepository.createPurchase({
        userId,
        songId,
        amount,
        stripeSessionId: session.id,
      });
    }
  },
};
