import { ok, fail } from "@/lib/http";
import { requireUser } from "@/lib/auth";
import { songService } from "@/modules/songs/songs.service";
import { updateSongSchema } from "@/modules/songs/songs.schema";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const song = await songService.getById(id);
    return ok(song);
  } catch (e) {
    return fail(e);
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUser();
    const { id } = await params;
    const body = await req.json();

    const data = updateSongSchema.parse(body);

    const song = await songService.update(userId, id, data);

    return ok(song);
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUser();
    const { id } = await params;

    await songService.delete(userId, id);

    return ok({ deleted: true });
  } catch (e) {
    return fail(e);
  }
}
