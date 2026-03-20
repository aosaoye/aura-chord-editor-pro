import { auth } from "@clerk/nextjs/server";
import { AppError } from "./errors";

export async function requireUser() {
  const { userId } = await auth();

  if (!userId) {
    throw new AppError(401, "UNAUTHORIZED", "User not authenticated");
  }

  return userId;
}
