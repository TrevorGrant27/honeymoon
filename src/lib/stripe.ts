import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";

export const stripe: Stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2026-01-28.clover",
    })
  : (null as unknown as Stripe);
