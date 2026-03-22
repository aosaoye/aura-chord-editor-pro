import { ok, fail } from "@/lib/http";
import { requireUser } from "@/lib/auth";
import { songService } from "@/modules/songs/songs.service";
import { ratingSchema } from "@/modules/songs/songs.schema";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUser();
    const { id } = await params;
    const body = await req.json();

    const { rating } = ratingSchema.parse(body);

    const result = await songService.rate(userId, id, rating);

    return ok(result);
  } catch (e) {
    return fail(e);
  }
}
