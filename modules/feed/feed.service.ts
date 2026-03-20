import { db } from "@/lib/db";

export const feedService = {
  async getFeed(userId: string) {
    // 1. obtener canciones públicas
    const songs = await db.song.findMany({
      where: { isPublic: true },
      include: {
        interactions: true,
        user: true,
      },
      take: 100,
      orderBy: { createdAt: "desc" }
    });

    // 2. historial del usuario
    const userInteractions = await db.interaction.findMany({
      where: { userId },
    });

    const userMap = new Map();
    userInteractions.forEach((i) => {
      // Sumamos el valor si ya existe por si ha interactuado de varias formas
      userMap.set(i.songId, (userMap.get(i.songId) || 0) + i.value);
    });

    // 3. Algoritmo de score
    const scored = songs.map((song) => {
      const popularity = song.interactions.reduce((acc, curr) => acc + curr.value, 0);

      // Penalizamos contenido más antiguo
      const recency = 1 / (1 + (Date.now() - song.createdAt.getTime()) / 10000000);

      const userAffinity = userMap.get(song.id) || 0;

      // Podría calcularse usando db.follows pero por ahora lo dejamos estático
      const socialBoost = 0; 

      const score =
        popularity * 0.4 +
        recency * 0.2 +
        userAffinity * 0.3 +
        socialBoost * 0.1;

      // Omitimos interactions para no saturar al cliente, pero dejamos lo necesario
      const { interactions: _, ...clientData } = song;

      return { ...clientData, _score: score };
    });

    // 4. Ordenación final
    return scored.sort((a, b) => b._score - a._score).slice(0, 20);
  },
};
