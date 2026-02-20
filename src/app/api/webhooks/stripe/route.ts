import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getServiceSupabase } from "@/lib/supabase";
import Stripe from "stripe";

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    console.error("Webhook signature verification failed:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = session.metadata;

    if (!metadata?.experience_id) {
      console.error("No experience_id in session metadata");
      return NextResponse.json({ received: true });
    }

    const supabase = getServiceSupabase();

    // Idempotency check: don't double-process
    const { data: existingSponsor } = await supabase
      .from("sponsors")
      .select("id")
      .eq("stripe_session_id", session.id)
      .single();

    if (existingSponsor) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    const amountCents = parseInt(metadata.amount_cents, 10);

    // Create sponsor record
    const { error: sponsorError } = await supabase.from("sponsors").insert({
      experience_id: metadata.experience_id,
      display_name: metadata.display_name,
      photo_url: metadata.photo_url || null,
      note: metadata.note || null,
      amount_cents: amountCents,
      email: session.customer_details?.email || "",
      stripe_session_id: session.id,
    });

    if (sponsorError) {
      console.error("Failed to create sponsor:", sponsorError);
      return NextResponse.json({ error: "Failed to create sponsor" }, { status: 500 });
    }

    // Update experience funded_cents
    const { data: experience } = await supabase
      .from("experiences")
      .select("funded_cents")
      .eq("id", metadata.experience_id)
      .single();

    if (experience) {
      await supabase
        .from("experiences")
        .update({
          funded_cents: experience.funded_cents + amountCents,
          updated_at: new Date().toISOString(),
        })
        .eq("id", metadata.experience_id);
    }
  }

  return NextResponse.json({ received: true });
}
