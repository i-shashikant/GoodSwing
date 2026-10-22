import { createClient } from "@/lib/supabase/server";
import { CharityDirectoryPremium } from "@/components/charity/charity-directory-premium";

export const metadata = {
  title: "Charities — GoodSwing",
  description:
    "Explore GoodSwing partner charities and see how the community turns membership into measurable impact.",
};

export default async function PublicCharitiesPage() {
  const supabase = await createClient();

  // Keep the page data-driven: the directory is populated entirely from Supabase.
  const { data: charities, error: charitiesError } = await supabase
    .from("charities")
    .select("id,name,slug,description,category,image_url,website_url,featured,created_at")
    .eq("active", true)
    .order("featured", { ascending: false })
    .order("name");

  if (charitiesError) throw new Error("Unable to load charities.");

  // Contribution rows provide the measurable impact shown on the page.
  const { data: contributions, error: contributionError } = await supabase
    .from("charity_contributions")
    .select("charity_id,user_id,amount_paise,created_at,status")
    .in("status", ["allocated", "confirmed"]);

  if (contributionError) throw new Error("Unable to load charity impact.");

  // Events are optional content. An empty table produces a graceful omission,
  // rather than a fabricated list of events.
  const { data: events, error: eventsError } = await supabase
    .from("charity_events")
    .select("id,charity_id,title,description,event_date,amount_paise")
    .gte("event_date", new Date().toISOString().slice(0, 10))
    .order("event_date")
    .limit(12);

  if (eventsError) throw new Error("Unable to load charity events.");

  const contributionRows = contributions ?? [];
  const charityRows = charities ?? [];
  const currentMonth = new Date();
  const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const previousMonthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);

  const totalRaisedPaise = contributionRows.reduce((sum, row) => sum + (row.amount_paise ?? 0), 0);
  const monthlyRaisedPaise = contributionRows
    .filter((row) => new Date(row.created_at) >= monthStart)
    .reduce((sum, row) => sum + (row.amount_paise ?? 0), 0);
  const monthlyPreviousPaise = contributionRows
    .filter((row) => {
      const date = new Date(row.created_at);
      return date >= previousMonthStart && date < monthStart;
    })
    .reduce((sum, row) => sum + (row.amount_paise ?? 0), 0);
  const activeSupporters = new Set(contributionRows.map((row) => row.user_id)).size;

  const contributionByCharity = new Map<
    string,
    { raised_paise: number; supporters: Set<string>; contribution_count: number }
  >();

  for (const row of contributionRows) {
    const current = contributionByCharity.get(row.charity_id) ?? {
      raised_paise: 0,
      supporters: new Set<string>(),
      contribution_count: 0,
    };

    current.raised_paise += row.amount_paise ?? 0;
    current.supporters.add(row.user_id);
    current.contribution_count += 1;
    contributionByCharity.set(row.charity_id, current);
  }

  const enrichedCharities = charityRows.map((charity) => {
    const impact = contributionByCharity.get(charity.id);

    return {
      ...charity,
      raised_paise: impact?.raised_paise ?? 0,
      supporters: impact?.supporters.size ?? 0,
      contribution_count: impact?.contribution_count ?? 0,
    };
  });

  return (
    <CharityDirectoryPremium
      charities={enrichedCharities}
      events={events ?? []}
      impact={{
        totalRaisedPaise,
        monthlyRaisedPaise,
        activeSupporters,
        partnerCharities: charityRows.length,
        monthlyPreviousPaise,
      }}
    />
  );
}
