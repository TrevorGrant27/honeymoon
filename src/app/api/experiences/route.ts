import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  const { data: experiences, error: expError } = await supabase
    .from("experiences")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (expError) {
    return NextResponse.json({ error: expError.message }, { status: 500 });
  }

  const { data: sponsors, error: sponError } = await supabase
    .from("sponsors")
    .select("*")
    .in(
      "experience_id",
      (experiences || []).map((e) => e.id)
    );

  if (sponError) {
    return NextResponse.json({ error: sponError.message }, { status: 500 });
  }

  const sponsorsByExperience = new Map<string, typeof sponsors>();
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
