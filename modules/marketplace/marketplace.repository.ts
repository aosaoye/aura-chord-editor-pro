import { db } from "@/lib/db";

export const marketplaceRepository = {
  hasPurchased(userId: string, songId: string) {
    return db.purchase.findUnique({
      where: {
        userId_songId: { userId, songId },
      },
    });
  },

  async createPurchase(data: {
    userId: string;
    songId: string;
    amount: number;
    stripeSessionId: string;
  }) {
    // Evita duplicados en caso de webhooks dobles
    const exists = await db.purchase.findUnique({
      where: { stripeSessionId: data.stripeSessionId },
    });

    if (exists) return exists;

    return db.purchase.create({ data });
  },
};
