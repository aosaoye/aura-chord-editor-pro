import { Worker } from "bullmq";
import { db } from "@/lib/db";
import { pusherServer } from "@/lib/pusher";

const connection = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: parseInt(process.env.REDIS_PORT || "6379"),
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
      connection,
    }
  );
};
