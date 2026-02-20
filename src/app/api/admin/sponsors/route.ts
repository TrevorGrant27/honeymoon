import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase";

export async function GET() {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceSupabase();

  const { data: sponsors, error: sponError } = await supabase
    .from("sponsors")
    .select("*")
    .order("created_at", { ascending: false });

  if (sponError) {
    return NextResponse.json({ error: sponError.message }, { status: 500 });
  }

  // Get experience names for display
  const experienceIds = [...new Set((sponsors || []).map((s) => s.experience_id))];

  const { data: experiences } = await supabase
    .from("experiences")
    .select("id, title")
    .in("id", experienceIds);

  const expMap = new Map((experiences || []).map((e) => [e.id, e.title]));

  const result = (sponsors || []).map((s) => ({
    ...s,
    experience_title: expMap.get(s.experience_id) || "Unknown",
  }));

  return NextResponse.json(result);
}
