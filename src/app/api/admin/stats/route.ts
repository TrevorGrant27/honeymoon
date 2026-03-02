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

  const { data: experiences } = await supabase.from("experiences").select("*");
  const { data: sponsors } = await supabase.from("sponsors").select("*");

  const expList = experiences || [];
  const sponList = sponsors || [];

  const totalRaisedCents = sponList.reduce((sum, s) => sum + s.amount_cents, 0);
  const totalSponsors = sponList.length;
  const fullyFundedCount = expList.filter(
    (e) => e.funded_cents >= e.price_cents
  ).length;
  const totalExperiences = expList.filter((e) => e.is_active).length;
  const averageGiftCents =
    totalSponsors > 0 ? Math.round(totalRaisedCents / totalSponsors) : 0;

  return NextResponse.json({
    total_raised_cents: totalRaisedCents,
    total_sponsors: totalSponsors,
    fully_funded_count: fullyFundedCount,
    total_experiences: totalExperiences,
    average_gift_cents: averageGiftCents,
  });
}
