import { notificationQueue } from "@/lib/queue";

export async function emitFollowEvent(data: {
  followerId: string;
  followingId: string;
}) {
  await notificationQueue.add("follow_created", data);
}

export async function emitLikeEvent(data: {
  userId: string;
  songId: string;
}) {
  await notificationQueue.add("song_liked", data);
}

export async function emitPurchaseEvent(data: {
  buyerId: string;
  creatorId: string;
  songId: string;
}) {
  await notificationQueue.add("song_purchased", data);
}
