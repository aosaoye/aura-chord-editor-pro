import { AppError } from "@/lib/errors";
import { songRepository } from "./songs.repository";

export const songService = {
  async create(userId: string, data: any) {
    return songRepository.create(userId, data);
  },

  async getPublicSongs() {
    return songRepository.findPublic();
  },

  async getById(id: string) {
    const song = await songRepository.findById(id);

    if (!song) {
      throw new AppError(404, "SONG_NOT_FOUND", "Song not found");
    }

    return song;
  },

  async update(userId: string, id: string, data: any) {
    const song = await this.getById(id);

    if (song.userId !== userId) {
      throw new AppError(403, "FORBIDDEN", "Not your song");
    }

    return songRepository.update(id, data);
  },

  async delete(userId: string, id: string) {
    const song = await this.getById(id);

    if (song.userId !== userId) {
      throw new AppError(403, "FORBIDDEN", "Not your song");
    }

    return songRepository.delete(id);
  },

  async rate(userId: string, songId: string, rating: number) {
    await this.getById(songId);
    return songRepository.upsertRating(userId, songId, rating);
  },
};
