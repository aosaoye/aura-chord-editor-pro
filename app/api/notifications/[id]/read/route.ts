import { ok, fail } from "@/lib/http";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUser();
    const { id } = await params;
    
    // updateMany for extra safety against invalid user IDs trying to read someone else's notification
    await db.notification.updateMany({
      where: { id, userId },
      data: { read: true },
    });

    return ok({ success: true });
  } catch (e) {
    return fail(e);
  }
}
