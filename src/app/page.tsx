import { createClient } from "@/lib/supabase/server";
import { LandingPage } from "@/components/goodswing/landing-page";

export default async function HomePage() {
  const supabase = await createClient();

  const [{ data: charities }, { count: charityCount }, { count: activeSubscribers }, { data: draw }, { data: contributions }] = await Promise.all([
    supabase.from("charities").select("id,name,slug,description,category,image_url,featured").eq("active", true).order("featured", { ascending: false }).order("name", { ascending: true }).limit(6),
    supabase.from("charities").select("id", { count: "exact", head: true }).eq("active", true),
    supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("draws").select("prize_pool").in("status", ["open", "completed"]).order("draw_date", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("charity_contributions").select("amount_paise").in("status", ["allocated", "confirmed"]),
  ]);

  const donated = (contributions ?? []).reduce((sum, row) => sum + Number(row.amount_paise ?? 0), 0) / 100;

  return (
    <LandingPage
      charities={charities ?? []}
      charityCount={charityCount ?? 0}
      activeSubscribers={activeSubscribers ?? 0}
      prizePool={Number(draw?.prize_pool ?? 0)}
      donated={donated}
    />
  );
}
