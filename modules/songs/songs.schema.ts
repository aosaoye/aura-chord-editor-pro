import { z } from "zod";

export const createSongSchema = z.object({
  title: z.string().min(1),
  content: z.any(),
});

export const updateSongSchema = z.object({
  title: z.string().optional(),
  content: z.any().optional(),
  isPublic: z.boolean().optional(),
});

export const ratingSchema = z.object({
  rating: z.number().min(1).max(5),
});
