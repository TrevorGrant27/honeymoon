import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getServiceSupabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { experience_id, amount_cents, display_name, photo_url, note } = body;

    if (!experience_id || !amount_cents || !display_name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Fetch experience and check availability
    const { data: experience, error } = await supabase
      .from("experiences")
      .select("*")
      .eq("id", experience_id)
      .single();

    if (error || !experience) {
      return NextResponse.json(
        { error: "Experience not found" },
        { status: 404 }
      );
    }

    const remainingCents = experience.price_cents - experience.funded_cents;

    if (remainingCents <= 0) {
      return NextResponse.json(
        { error: "This experience is already fully funded" },
        { status: 400 }
      );
    }

    // Cap at remaining balance to prevent overfunding
    const chargeAmount = Math.min(amount_cents, remainingCents);

    // Validate minimum split
    if (experience.allow_splitting && chargeAmount < experience.min_split_cents && chargeAmount < remainingCents) {
      return NextResponse.json(
        { error: `Minimum contribution is $${(experience.min_split_cents / 100).toFixed(0)}` },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: experience.title,
              description: `Honeymoon experience sponsored by ${display_name}`,
            },
            unit_amount: chargeAmount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${baseUrl}/thank-you/{CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/?cancelled=true`,
      metadata: {
        experience_id,
        display_name,
        photo_url: photo_url || "",
        note: note || "",
        amount_cents: chargeAmount.toString(),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    console.error("Checkout error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
