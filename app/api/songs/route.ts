import { ok, fail } from "@/lib/http";
import { requireUser } from "@/lib/auth";
import { songService } from "@/modules/songs/songs.service";
import { createSongSchema } from "@/modules/songs/songs.schema";

export async function GET() {
  try {
    const songs = await songService.getPublicSongs();
    return ok(songs);
  } catch (e) {
    return fail(e);
  }
}

export async function POST(req: Request) {
  try {
    const userId = await requireUser();
    const body = await req.json();

    const data = createSongSchema.parse(body);

    const song = await songService.create(userId, data);

    return ok(song, 201);
  } catch (e) {
    return fail(e);
  }
}