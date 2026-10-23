import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CharityDirectoryPremium } from "@/components/charity/charity-directory-premium";

/**
 * Public charity directory.
 *
 * The page contains two kinds of data:
 *
 * 1. Public data
 *    - Charity records
 *    - Upcoming charity events
 *
 * 2. Aggregate platform statistics
 *    - Total funds raised
 *    - This month's contributions
 *    - Previous month's contributions
 *    - Active supporters
 *
 * The aggregate statistics cannot be read through the normal
 * authenticated Supabase client because RLS correctly restricts
 * charity_contributions to the owner/admin.
 *
 * Therefore:
 * - Normal server client = public charity/event data
 * - Admin server client = read-only aggregate statistics
 *
 * The admin client is server-only and its service-role key is
 * never exposed to the browser.
 */

/**
 * Cache this public page for 60 seconds.
 *
 * This prevents every visitor/navigation from repeatedly hitting
 * Supabase for exactly the same public statistics.
 *
 * The page does not contain user-specific information, so a short
 * revalidation window is appropriate.
 */
export const revalidate = 60;

export const metadata = {
  title: "Charities — GoodSwing",
  description:
    "Explore GoodSwing partner charities and see how the community turns membership into measurable impact.",
};

export default async function PublicCharitiesPage() {
  /**
   * Normal server client.
   *
   * Used for publicly readable tables such as charities and events.
   */
  const supabase = await createClient();

  /**
   * Admin server client.
   *
   * This bypasses RLS safely because this code runs only on the server.
   *
   * IMPORTANT:
   * Never import createAdminClient() into a client component.
   */
  const adminSupabase = createAdminClient();

  /**
   * Fetch the public directory data and contribution data in parallel.
   *
   * Running these requests concurrently keeps the page fast.
   */
  const [
    { data: charities, error: charitiesError },
    { data: events, error: eventsError },
    { data: contributions, error: contributionError },
  ] = await Promise.all([
    /**
     * Active charities shown in the public directory.
     */
    supabase
      .from("charities")
      .select(
        "id,name,slug,description,category,image_url,website_url,featured,created_at"
      )
      .eq("active", true)
      .order("featured", { ascending: false })
      .order("name"),

    /**
     * Upcoming charity events.
     *
     * Events are optional. An empty table simply means that
     * the events section will not be displayed.
     */
    supabase
      .from("charity_events")
      .select(
        "id,charity_id,title,description,event_date,amount_paise"
      )
      .gte(
        "event_date",
        new Date().toISOString().slice(0, 10)
      )
      .order("event_date")
      .limit(12),

    /**
     * Contribution records used ONLY to calculate public
     * aggregate impact statistics.
     *
     * We use the admin client here because the normal public
     * client is blocked by the charity_contributions RLS policy.
     */
    adminSupabase
      .from("charity_contributions")
      .select(
        "charity_id,user_id,amount_paise,created_at,status"
      )
      .in("status", ["allocated", "confirmed"]),
  ]);

  /**
   * Fail loudly if public charity data cannot be loaded.
   *
   * This prevents rendering a misleading empty directory.
   */
  if (charitiesError) {
    console.error(
      "GoodSwing charity directory error:",
      charitiesError
    );

    throw new Error("Unable to load charities.");
  }

  /**
   * Events are optional content.
   *
   * If the table has an issue, we still want the charity
   * directory itself to remain usable.
   */
  if (eventsError) {
    console.error(
      "GoodSwing charity events error:",
      eventsError
    );
  }

  /**
   * Contribution data is required for the impact section.
   */
  if (contributionError) {
    console.error(
      "GoodSwing charity contribution error:",
      contributionError
    );

    throw new Error("Unable to load charity impact.");
  }

  /**
   * Normalize the returned arrays.
   */
  const charityRows = charities ?? [];
  const contributionRows = contributions ?? [];
  const eventRows = events ?? [];

  /**
   * ------------------------------------------------------------
   * DATE RANGES
   * ------------------------------------------------------------
   *
   * We calculate the current and previous calendar month.
   *
   * These values power:
   *
   * - "This month"
   * - "Community contribution momentum"
   * - Growth percentage
   */
  const currentDate = new Date();

  const monthStart = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  );

  const previousMonthStart = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() - 1,
    1
  );

  /**
   * ------------------------------------------------------------
   * TOTAL COMMUNITY IMPACT
   * ------------------------------------------------------------
   *
   * Database stores money in paise.
   */
  const totalRaisedPaise = contributionRows.reduce(
    (sum, row) =>
      sum + Number(row.amount_paise ?? 0),
    0
  );

  /**
   * Contributions made during the current month.
   */
  const monthlyRaisedPaise = contributionRows
    .filter((row) => {
      const date = new Date(row.created_at);

      return date >= monthStart;
    })
    .reduce(
      (sum, row) =>
        sum + Number(row.amount_paise ?? 0),
      0
    );

  /**
   * Contributions made during the previous month.
   */
  const monthlyPreviousPaise = contributionRows
    .filter((row) => {
      const date = new Date(row.created_at);

      return (
        date >= previousMonthStart &&
        date < monthStart
      );
    })
    .reduce(
      (sum, row) =>
        sum + Number(row.amount_paise ?? 0),
      0
    );

  /**
   * Count unique users who have contributed.
   *
   * A Set prevents one user with multiple contributions
   * from being counted multiple times.
   */
  const activeSupporters = new Set(
    contributionRows
      .map((row) => row.user_id)
      .filter(Boolean)
  ).size;

  /**
   * ------------------------------------------------------------
   * PER-CHARITY IMPACT
   * ------------------------------------------------------------
   *
   * Build a small in-memory map so each charity card can show:
   *
   * - Amount raised
   * - Number of supporters
   * - Number of contributions
   *
   * We do this once rather than making a Supabase query for
   * every individual charity.
   */
  const contributionByCharity = new Map<
    string,
    {
      raised_paise: number;
      supporters: Set<string>;
      contribution_count: number;
    }
  >();

  for (const row of contributionRows) {
    const current =
      contributionByCharity.get(row.charity_id) ??
      {
        raised_paise: 0,
        supporters: new Set<string>(),
        contribution_count: 0,
      };

    current.raised_paise += Number(
      row.amount_paise ?? 0
    );

    if (row.user_id) {
      current.supporters.add(row.user_id);
    }

    current.contribution_count += 1;

    contributionByCharity.set(
      row.charity_id,
      current
    );
  }

  /**
   * Attach calculated impact data to every charity.
   *
   * Charities with no contributions simply receive zero values.
   */
  const enrichedCharities = charityRows.map(
    (charity) => {
      const impact =
        contributionByCharity.get(charity.id);

      return {
        ...charity,

        raised_paise:
          impact?.raised_paise ?? 0,

        supporters:
          impact?.supporters.size ?? 0,

        contribution_count:
          impact?.contribution_count ?? 0,
      };
    }
  );

  /**
   * ------------------------------------------------------------
   * RENDER
   * ------------------------------------------------------------
   */
  return (
    <CharityDirectoryPremium
      charities={enrichedCharities}
      events={eventRows}
      impact={{
        totalRaisedPaise,
        monthlyRaisedPaise,
        activeSupporters,
        partnerCharities:
          charityRows.length,
        monthlyPreviousPaise,
      }}
    />
  );
}