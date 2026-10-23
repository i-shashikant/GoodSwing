import { LandingPage } from "@/components/goodswing/landing-page";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Public homepage.
 *
 * The homepage displays aggregate platform statistics:
 *
 * - Active members
 * - Active charities
 * - Current prize pool
 * - Total charity impact
 *
 * These are public aggregate values, not user-specific data.
 *
 * We therefore use the server-only admin client to read them
 * without being blocked by the RLS policies designed to protect
 * individual user records.
 *
 * The service-role key never reaches the browser.
 */

/**
 * Cache the public homepage for 60 seconds.
 *
 * This is an important performance improvement because the
 * homepage statistics do not need to be recalculated on every
 * single visitor request.
 */
export const revalidate = 60;

export default async function HomePage() {
  /**
   * Server-only Supabase client.
   *
   * This is safe here because this file is a Server Component.
   */
  const supabase = createAdminClient();

  /**
   * Fetch all homepage data concurrently.
   *
   * Promise.all prevents the queries from running one after
   * another and keeps the initial page response faster.
   */
  const [
    { data: charities, error: charitiesError },
    { count: charityCount, error: charityCountError },
    {
      count: activeSubscribers,
      error: subscriberCountError,
    },
    { data: draw, error: drawError },
    {
      data: contributions,
      error: contributionError,
    },
  ] = await Promise.all([
    /**
     * Featured active charities.
     *
     * Only six are required by the homepage.
     */
    supabase
      .from("charities")
      .select(
        "id,name,slug,description,category,image_url,featured"
      )
      .eq("active", true)
      .order("featured", {
        ascending: false,
      })
      .order("name", {
        ascending: true,
      })
      .limit(6),

    /**
     * Total number of active charities.
     */
    supabase
      .from("charities")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("active", true),

    /**
     * Total active subscriptions.
     *
     * The previous implementation used the normal
     * authenticated client, so an anonymous homepage visitor
     * could receive 0 because of RLS.
     */
    supabase
      .from("subscriptions")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("status", "active"),

    /**
     * Most recent open/completed draw.
     */
    supabase
      .from("draws")
      .select("prize_pool")
      .in("status", [
        "open",
        "completed",
      ])
      .order("draw_date", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle(),

    /**
     * Charity contributions used to calculate total impact.
     */
    supabase
      .from("charity_contributions")
      .select("amount_paise")
      .in("status", [
        "allocated",
        "confirmed",
      ]),
  ]);

  /**
   * Log errors without exposing sensitive database details
   * to the visitor.
   */
  if (charitiesError) {
    console.error(
      "GoodSwing homepage charities error:",
      charitiesError
    );
  }

  if (charityCountError) {
    console.error(
      "GoodSwing homepage charity count error:",
      charityCountError
    );
  }

  if (subscriberCountError) {
    console.error(
      "GoodSwing homepage subscriber count error:",
      subscriberCountError
    );
  }

  if (drawError) {
    console.error(
      "GoodSwing homepage draw error:",
      drawError
    );
  }

  if (contributionError) {
    console.error(
      "GoodSwing homepage contribution error:",
      contributionError
    );
  }

  /**
   * Calculate total charity impact.
   *
   * The database stores monetary amounts in paise,
   * while the UI displays Indian Rupees.
   */
  const donated =
    (contributions ?? []).reduce(
      (sum, row) =>
        sum + Number(row.amount_paise ?? 0),
      0
    ) / 100;

  /**
   * Render the landing page with live database statistics.
   */
  return (
    <LandingPage
      charities={charities ?? []}
      charityCount={charityCount ?? 0}
      activeSubscribers={
        activeSubscribers ?? 0
      }
      prizePool={Number(
        draw?.prize_pool ?? 0
      )}
      donated={donated}
    />
  );
}