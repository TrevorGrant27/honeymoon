import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  if (!supabase) {
    console.error(
      "[experiences] Supabase client not configured — set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
    return NextResponse.json(
      {
        error: "supabase_not_configured",
        message:
          "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      },
      { status: 500 }
    );
  }

  try {
    const { data: experiences, error: expError } = await supabase
      .from("experiences")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (expError) {
      console.error("[experiences] Failed to query experiences:", expError);
      return NextResponse.json(
        {
          error: "experiences_query_failed",
          message: expError.message,
          code: expError.code ?? null,
          hint: expError.hint ?? null,
          details: expError.details ?? null,
        },
        { status: 500 }
      );
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
      console.error("[experiences] Failed to query sponsors:", sponError);
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
  } catch (err) {
    console.error("[experiences] Unexpected error:", err);
    return NextResponse.json(
      {
        error: "unexpected_error",
        message: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
