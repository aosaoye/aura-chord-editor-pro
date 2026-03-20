import PusherServer from "pusher";

// Solo instanciamos si las variables de entorno existen para no crashear builds
export const pusherServer = new PusherServer({
  appId: process.env.PUSHER_APP_ID || "app-id",
  key: process.env.NEXT_PUBLIC_PUSHER_KEY || "key",
  secret: process.env.PUSHER_SECRET || "secret",
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "eu",
  useTLS: true,
});
