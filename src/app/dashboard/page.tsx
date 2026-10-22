import Link from "next/link";
import {
  getProfile,
  getSubscription,
  hasActiveSubscription,
  requireUser,
} from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  // Ensure the user is authenticated before accessing the dashboard.
  const user = await requireUser();

  // Fetch the user's profile, subscription, and active-subscription status.
  const [profile, subscription, isActive] = await Promise.all([
    getProfile(),
    getSubscription(),
    hasActiveSubscription(),
  ]);

  const supabase = await createClient();

  // Fetch dashboard data in parallel to reduce loading time.
  const [
    { data: scores },
    { data: charity },
    { data: draws },
    { data: winners },
    { count: entryCount },
  ] = await Promise.all([
    // Get the user's five most recent Stableford scores.
    supabase
      .from("scores")
      .select("id, score, played_at")
      .eq("user_id", user.id)
      .order("played_at", { ascending: false })
      .limit(5),

    // Get the charity associated with the user's subscription.
    subscription?.charity_id
      ? supabase
          .from("charities")
          .select("id, name, description, category")
          .eq("id", subscription.charity_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),

    // Get the latest three open or completed draws.
    supabase
      .from("draws")
      .select(
        "id, draw_month, draw_date, status, number_1, number_2, number_3, number_4, number_5"
      )
      .in("status", ["open", "completed"])
      .order("draw_month", { ascending: false })
      .limit(3),

    // Get the user's winning entries.
    supabase
      .from("winners")
      .select("id, prize_amount, payment_status, verification_status")
      .eq("user_id", user.id),

    // Count how many draw entries the user has.
    supabase
      .from("draw_entries")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
  ]);

  // Calculate the total prize money won by the user.
  const totalWon = (winners ?? []).reduce(
    (sum, winner) => sum + Number(winner.prize_amount || 0),
    0
  );

  const currentScores = scores ?? [];
  const currentDraws = draws ?? [];
  const currentWinners = winners ?? [];

  return (
    <main className="min-h-screen px-6 py-10 md:px-10">
      <div className="mx-auto max-w-6xl">
        {/* ------------------------------------------------------------ */}
        {/* Header */}
        {/* ------------------------------------------------------------ */}

        <header className="border-b pb-8">
          <p className="text-sm font-medium text-[#087f4e]">GOODSWING</p>

          <h1 className="mt-2 text-4xl font-semibold tracking-tight">
            Welcome
            {profile?.full_name ? `, ${profile.full_name}` : ""}
          </h1>

          <p className="mt-3 max-w-2xl text-muted-foreground">
            Play your game. Give with purpose. Keep your chance to win in view.
          </p>
        </header>

        {/* ------------------------------------------------------------ */}
        {/* Membership & Charity */}
        {/* ------------------------------------------------------------ */}

        <section className="mt-8 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
          {/* Membership card */}
          <div className="rounded-2xl border bg-[#087f4e] p-7 text-white shadow-xl shadow-black/10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/60">
                  Membership
                </p>

                <h2 className="mt-3 text-3xl font-semibold capitalize">
                  {subscription?.plan ?? "Not a member"}
                </h2>
              </div>

              <span className="rounded-full border border-white/20 px-3 py-1 text-xs">
                {isActive ? "Active" : "Inactive"}
              </span>
            </div>

            {/* Subscription details */}
            {subscription && (
              <p className="mt-4 text-sm text-white/70">
                ₹{Number(subscription.amount).toLocaleString("en-IN")} ·{" "}
                {subscription.current_period_end
                  ? `renews/ends ${new Date(
                      subscription.current_period_end
                    ).toLocaleDateString("en-IN")}`
                  : "active"}
              </p>
            )}

            {/* CTA for users without an active membership */}
            {!isActive && (
              <Link
                href="/dashboard/subscription"
                className="mt-6 inline-flex rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#087f4e]"
              >
                Become a member
              </Link>
            )}
          </div>

          {/* Charity card */}
          <div className="rounded-2xl border p-7">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Your charity
            </p>

            <h2 className="mt-3 text-2xl font-semibold">
              {charity?.name ?? "Not selected"}
            </h2>

            <p className="mt-2 text-sm text-muted-foreground">
              {subscription?.charity_percentage ?? 0}% contribution
            </p>

            <Link
              href="/dashboard/charity"
              className="mt-5 inline-block text-sm font-semibold underline underline-offset-4"
            >
              {charity ? "Change charity" : "Choose a charity"}
            </Link>
          </div>
        </section>

        {/* ------------------------------------------------------------ */}
        {/* Quick Stats */}
        {/* ------------------------------------------------------------ */}

        <section className="mt-5 grid gap-4 md:grid-cols-4">
          {[
            ["Scores", `${currentScores.length}/5`],
            ["Draws entered", entryCount ?? 0],
            [
              "Upcoming draws",
              currentDraws.filter((draw) => draw.status === "open").length,
            ],
            ["Total won", `₹${totalWon.toLocaleString("en-IN")}`],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-2xl border p-5">
              <p className="text-sm text-muted-foreground">{label}</p>

              <p className="mt-2 text-2xl font-semibold">{value}</p>
            </div>
          ))}
        </section>

        {/* ------------------------------------------------------------ */}
        {/* Latest Scores & Winnings */}
        {/* ------------------------------------------------------------ */}

        <section className="mt-8 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          {/* Latest scores */}
          <div className="rounded-2xl border p-6">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Your game</p>

                <h2 className="mt-1 text-2xl font-semibold">
                  Latest scores
                </h2>
              </div>

              <Link
                href="/dashboard/scores"
                className="text-sm font-semibold underline"
              >
                Manage
              </Link>
            </div>

            {currentScores.length ? (
              <div className="mt-6 grid gap-3 sm:grid-cols-5">
                {currentScores.map((score) => (
                  <div
                    key={score.id}
                    className="rounded-xl border p-4 text-center transition hover:-translate-y-1"
                  >
                    <p className="text-3xl font-semibold">{score.score}</p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(
                        `${score.played_at}T00:00:00`
                      ).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-xl border border-dashed p-6">
                <p className="font-medium">Add your first five rounds.</p>

                <Link
                  href="/dashboard/scores"
                  className="mt-3 inline-block text-sm font-semibold underline"
                >
                  Enter scores
                </Link>
              </div>
            )}
          </div>

          {/* Winnings */}
          <div className="rounded-2xl border p-6">
            <p className="text-sm text-muted-foreground">Winnings</p>

            <h2 className="mt-1 text-2xl font-semibold">Monthly draw</h2>

            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              View your winning history, submit proof and follow payout status.
            </p>

            <Link
              href="/dashboard/winnings"
              className="mt-5 inline-flex rounded-xl border px-4 py-2.5 text-sm font-semibold"
            >
              View winnings
            </Link>
          </div>
        </section>

        {/* ------------------------------------------------------------ */}
        {/* Draw Calendar */}
        {/* ------------------------------------------------------------ */}

        <section className="mt-8 rounded-2xl border p-6">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Draw calendar</p>

              <h2 className="mt-1 text-2xl font-semibold">
                Upcoming & recent draws
              </h2>
            </div>

            <Link
              href="/dashboard/charity"
              className="text-sm font-semibold underline"
            >
              View impact
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            {currentDraws.map((draw) => (
              <div
                key={draw.id}
                className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  {/* Draw month */}
                  <p className="font-semibold">
                    {new Date(
                      `${draw.draw_month}T00:00:00`
                    ).toLocaleDateString("en-IN", {
                      month: "long",
                      year: "numeric",
                    })}
                  </p>

                  {/* Winning numbers for completed draws,
                      otherwise show the entry closing date. */}
                  <p className="text-sm text-muted-foreground">
                    {draw.status === "completed"
                      ? `Winning numbers: ${[
                          draw.number_1,
                          draw.number_2,
                          draw.number_3,
                          draw.number_4,
                          draw.number_5,
                        ]
                          .filter(Boolean)
                          .join(" · ")}`
                      : `Entries close ${new Date(
                          draw.draw_date
                        ).toLocaleDateString("en-IN")}`}
                  </p>
                </div>

                {/* Draw status */}
                <span className="rounded-full border px-3 py-1 text-xs capitalize">
                  {draw.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}