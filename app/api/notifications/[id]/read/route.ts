import { ok, fail } from "@/lib/http";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(req: Request, context: any) {
  try {
    const userId = await requireUser();
    const params = await context.params;
    
    // updateMany for extra safety against invalid user IDs trying to read someone else's notification
    await db.notification.updateMany({
      where: { id: params.id, userId },
      data: { read: true },
    });

    return ok({ success: true });
  } catch (e) {
    return fail(e);
  }
}
