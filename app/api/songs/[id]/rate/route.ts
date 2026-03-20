import { ok, fail } from "@/lib/http";
import { requireUser } from "@/lib/auth";
import { songService } from "@/modules/songs/songs.service";
import { ratingSchema } from "@/modules/songs/songs.schema";

export async function PUT(req: Request, { params }: any) {
  try {
    const userId = await requireUser();
    const body = await req.json();

    const { rating } = ratingSchema.parse(body);

    const result = await songService.rate(userId, params.id, rating);

    return ok(result);
  } catch (e) {
    return fail(e);
  }
}
