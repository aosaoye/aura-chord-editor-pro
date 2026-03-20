import { requireUser } from "@/lib/auth";
import { ok, fail } from "@/lib/http";
import { feedService } from "@/modules/feed/feed.service";

export async function GET() {
  try {
    const userId = await requireUser();

    const feed = await feedService.getFeed(userId);

    return ok(feed);
  } catch (e) {
    return fail(e);
  }
}
