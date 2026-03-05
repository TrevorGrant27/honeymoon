import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase";

export async function GET() {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  const { data: experiences, error: expError } = await supabase
    .from("experiences")
    .select("*")
    .order("display_order", { ascending: true });

  if (expError) {
    return NextResponse.json({ error: expError.message }, { status: 500 });
  }

  const { data: sponsors } = await supabase.from("sponsors").select("*");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sponsorsByExperience = new Map<string, any[]>();
  for (const s of sponsors || []) {
    const existing = sponsorsByExperience.get(s.experience_id) || [];
    existing.push(s);
    sponsorsByExperience.set(s.experience_id, existing);
  }

  const result = (experiences || []).map((exp) => ({
    ...exp,
    sponsors: sponsorsByExperience.get(exp.id) || [],
  }));

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const supabase = getServiceSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  // Get max display_order
  const { data: orders } = await supabase
    .from("experiences")
    .select("display_order")
    .order("display_order", { ascending: false })
    .limit(1);

  const newOrder = (orders && orders.length > 0 ? orders[0].display_order : 0) + 1;

  const { data, error } = await supabase
    .from("experiences")
    .insert({
      title: body.title,
      description: body.description,
      category: body.category,
      price_cents: body.price_cents,
      image_url: body.image_url || null,
      emoji: body.emoji || "✨",
      allow_splitting: body.allow_splitting ?? true,
      min_split_cents: body.min_split_cents || 5000,
      display_order: newOrder,
      is_active: body.is_active ?? true,
      funded_cents: 0,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
