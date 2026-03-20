import { Song } from "@prisma/client";

export type CreateSongDTO = {
  title: string;
  content: any;
};

export type UpdateSongDTO = {
  title?: string;
  content?: any;
  isPublic?: boolean;
};

export type SongResponse = Song;
