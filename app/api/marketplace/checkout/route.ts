import { ok, fail } from "@/lib/http";
import { requireUser } from "@/lib/auth";
import { marketplaceService } from "@/modules/marketplace/marketplace.service";

export async function POST(req: Request) {
  try {
    const userId = await requireUser();
    const { songId } = await req.json();

    const url = await marketplaceService.createCheckout(userId, songId);

    return ok({ url });
  } catch (e) {
    return fail(e);
  }
}
