import { ok, fail } from "@/lib/http";
import { requireUser } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  console.log("---- INICIANDO CHECKOUT SUSCRIPCION ----");
  try {
    const userId = await requireUser();
    console.log("Usuario autenticado:", userId);

    const user = await db.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      console.log("Error: Usuario no encontrado en BD");
      return fail({ code: "USER_NOT_FOUND", message: "Usuario no encontrado" });
    }

    // Comprobar si ya tiene subscripción activa
    if (user.stripeSubscriptionId && user.stripeCurrentPeriodEnd && user.stripeCurrentPeriodEnd.getTime() > Date.now()) {
      // Redirigir a customer portal (simplificado, reusamos el mismo endpoint si se desea)
      return fail({ code: "ALREADY_SUBSCRIBED", message: "Ya eres PRO. Gestiona tu facturación desde tu panel." });
    }

    // Creamos o usamos cliente de Stripe
    let customerId = user.stripeCustomerId;
    if (!customerId) {
        const payload = await req.json().catch(() => ({}));
        const email = user.email || payload?.email || "user@example.com";
        const customer = await stripe.customers.create({
            email,
            metadata: { userId },
        });
        customerId = customer.id;
        await db.user.update({
            where: { clerkId: userId },
            data: { stripeCustomerId: customerId }
        });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `Aura Chords Maestro (PRO)`,
              description: "Obras ilimitadas, Teleprompter Pro y exportación avanzada."
            },
            unit_amount: 900,
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId,
        type: "pro_subscription"
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}?success=pro`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/pricing?canceled=true`,
    });

    return ok({ url: session.url });
  } catch (e: any) {
    return fail({ code: "STRIPE_ERROR", message: "No se pudo iniciar el checkout: " + e.message });
  }
}
