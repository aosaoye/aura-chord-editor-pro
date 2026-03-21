import { ok, fail } from "@/lib/http";
import { requireUser } from "@/lib/auth";
import { songService } from "@/modules/songs/songs.service";
import { updateSongSchema } from "@/modules/songs/songs.schema";

export async function GET(_: Request, context: any) {
  try {
    const params = await context.params;
    const song = await songService.getById(params.id);
    return ok(song);
  } catch (e) {
    return fail(e);
  }
}

export async function PATCH(req: Request, context: any) {
  try {
    const userId = await requireUser();
    const params = await context.params;
    const body = await req.json();

    const data = updateSongSchema.parse(body);

    const song = await songService.update(userId, params.id, data);

    return ok(song);
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(_: Request, context: any) {
  try {
    const userId = await requireUser();
    const params = await context.params;

    await songService.delete(userId, params.id);

    return ok({ deleted: true });
  } catch (e) {
    return fail(e);
  }
}
