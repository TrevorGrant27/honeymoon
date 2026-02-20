import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data: experience, error: expError } = await supabase
    .from("experiences")
    .select("*")
    .eq("id", id)
    .eq("is_active", true)
    .single();

  if (expError || !experience) {
    return NextResponse.json({ error: "Experience not found" }, { status: 404 });
  }

  const { data: sponsors } = await supabase
    .from("sponsors")
    .select("*")
    .eq("experience_id", id)
    .order("created_at", { ascending: true });

  return NextResponse.json({
    ...experience,
    sponsors: sponsors || [],
  });
}
