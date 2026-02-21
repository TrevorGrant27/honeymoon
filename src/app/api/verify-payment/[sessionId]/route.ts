import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getServiceSupabase } from "@/lib/supabase";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  if (!sessionId) {
    return NextResponse.json({ error: "Missing session ID" }, { status: 400 });
  }

  try {
    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return NextResponse.json({ status: "unpaid" });
    }

    const metadata = session.metadata;
    if (!metadata?.experience_id) {
      return NextResponse.json({ status: "paid", recorded: false, error: "No experience metadata" });
    }

    const supabase = getServiceSupabase();

    // Check if already recorded (by webhook or previous verification)
    const { data: existingSponsor } = await supabase
      .from("sponsors")
      .select("id")
      .eq("stripe_session_id", session.id)
      .single();

    if (existingSponsor) {
      return NextResponse.json({ status: "paid", recorded: true, duplicate: true });
    }

    // Record the payment (same logic as the webhook)
    const amountCents = parseInt(metadata.amount_cents, 10);

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
      console.error("Failed to create sponsor via verification:", sponsorError);
      return NextResponse.json({ status: "paid", recorded: false, error: "Database error" }, { status: 500 });
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

    return NextResponse.json({ status: "paid", recorded: true });
  } catch (err: unknown) {
    console.error("Payment verification error:", err);
    const message = err instanceof Error ? err.message : "Verification failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
