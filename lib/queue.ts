import { Queue } from "bullmq";
import Redis from "ioredis";

const retryPolicy = {
  maxRetriesPerRequest: null,
  retryStrategy: (times: number) => {
    if (times > 3) return null; // Aborta tras 3 intentos para no spamearte
    return Math.min(times * 1000, 3000);
  }
};

const redisInstance = process.env.REDIS_HOST?.startsWith("redis")
  ? new Redis(process.env.REDIS_HOST, retryPolicy)
  : new Redis({
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: parseInt(process.env.REDIS_PORT || "6379"),
      password: process.env.REDIS_PASSWORD || undefined,
      ...retryPolicy,
    });

// Silenciar errores feos del SDK de Redis para que no inunden Node ni NextJS
redisInstance.on("error", () => {});

export const notificationQueue = new Queue("notifications", {
  connection: redisInstance as any,
});
