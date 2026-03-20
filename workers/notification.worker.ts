import { Worker } from "bullmq";
import { db } from "@/lib/db";
import { pusherServer } from "@/lib/pusher";
import Redis from "ioredis";

const retryPolicy = {
  maxRetriesPerRequest: null,
  retryStrategy: (times: number) => {
    if (times > 3) return null; // Aborta tras 3 intentos
    return Math.min(times * 1000, 3000);
  }
};

// Usamos Redis con URL si el string tiene formato redis://
const connection = process.env.REDIS_HOST?.startsWith("redis")
  ? new Redis(process.env.REDIS_HOST, retryPolicy)
  : {
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: parseInt(process.env.REDIS_PORT || "6379"),
      password: process.env.REDIS_PASSWORD || undefined,
      ...retryPolicy,
    };

export const createNotificationWorker = () => {
  return new Worker(
    "notifications",
    async (job) => {
      const { name, data } = job;
      let notification = null;

      switch (name) {
        case "follow_created":
          notification = await db.notification.create({
            data: {
              userId: data.followingId,
              type: "follow",
              message: "Tienes un nuevo seguidor",
              metadata: { followerId: data.followerId }
            },
          });
          break;

        case "song_liked":
          notification = await db.notification.create({
            data: {
              userId: data.userId,
              type: "like",
              message: "Alguien marcó tu transcripción como favorita",
              metadata: { songId: data.songId }
            },
          });
          break;

        case "song_purchased":
          notification = await db.notification.create({
            data: {
              userId: data.creatorId,
              type: "purchase",
              message: "¡Han adquirido acceso Pro a tu transcripción!",
              metadata: { songId: data.songId, buyerId: data.buyerId }
            },
          });
          break;
      }

      // ⚡ REAL-TIME: Emitir a través de WebSockets
      if (notification) {
        try {
           await pusherServer.trigger(
             `user-${notification.userId}`, 
             'new_notification', 
             { notification }
           );
        } catch (e) {
           console.error("Pusher Trigger Error:", e);
        }
      }
    },
    {
      connection: connection as any,
    }
  );
};
