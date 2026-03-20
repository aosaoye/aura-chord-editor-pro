import PusherClient from "pusher-js";

// Instancia global en cliente
// PusherClient se expone como un object global si no validamos
export const getPusherClient = () => {
  if (typeof window === "undefined") return null;
  return new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY || "key", {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "eu",
  });
};
