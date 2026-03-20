import Stripe from "stripe";

// Solo instanciamos si las variables de entorno existen para no crashear builds
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_123", {
  apiVersion: "2026-02-25.clover" as any,
});
