import { db } from "@/lib/db";

export const songRepository = {
  create(userId: string, data: any) {
    return db.song.create({
      data: {
        ...data,
        userId,
      },
    });
  },

  findById(id: string) {
    return db.song.findUnique({
      where: { id },
    });
  },

  findPublic() {
    return db.song.findMany({
      where: { isPublic: true },
      orderBy: { createdAt: "desc" },
    });
  },

  update(id: string, data: any) {
    return db.song.update({
      where: { id },
      data,
    });
  },

  delete(id: string) {
    return db.song.delete({
      where: { id },
    });
  },

  upsertRating(userId: string, songId: string, rating: number) {
    return db.songRating.upsert({
      where: {
        userId_songId: { userId, songId },
      },
      update: { value: rating },
      create: { userId, songId, value: rating },
    });
  },
};
