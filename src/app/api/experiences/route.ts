import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    if (!supabase) {
      return NextResponse.json([]);
    }

    const { data: experiences, error: expError } = await supabase
      .from("experiences")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (expError) {
      return NextResponse.json([]);
    }

    const experienceIds = (experiences || []).map((e) => e.id);

    if (experienceIds.length === 0) {
      return NextResponse.json([]);
    }

    const { data: sponsors, error: sponError } = await supabase
      .from("sponsors")
      .select("*")
      .in("experience_id", experienceIds);

    if (sponError) {
      return NextResponse.json(
        (experiences || []).map((exp) => ({ ...exp, sponsors: [] }))
      );
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
  } catch {
    return NextResponse.json([]);
  }
}
