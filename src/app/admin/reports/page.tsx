import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function ReportsPage() {
  // Ensure only authenticated admins can access this page.
  await requireAdmin();

  // Create a Supabase server client.
  const supabase = await createClient();

  // Fetch all report data in parallel to reduce loading time.
  const [
    { count: users },
    { count: subs },
    { data: payments },
    { data: contributions },
    { data: draws },
  ] = await Promise.all([
    // Total number of registered users.
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true }),

    // Number of currently active subscriptions/memberships.
    supabase
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),

    // Fetch payment amounts for revenue calculation.
    supabase
      .from("payments")
      .select("amount_paise,paid_at"),

    // Fetch charity contributions along with the charity name.
    supabase
      .from("charity_contributions")
      .select("amount_paise,charity_id,charities(name)"),

    // Fetch draw information for prize-pool statistics.
    supabase
      .from("draws")
      .select("prize_pool,jackpot_rollover_out,status"),
  ]);

  // Calculate total payment revenue.
  // Amounts are stored in paise, so divide by 100 to convert to rupees.
  const revenue =
    (payments ?? []).reduce(
      (sum, payment) => sum + Number(payment.amount_paise || 0),
      0
    ) / 100;

  // Calculate the total amount allocated to charity.
  const impact =
    (contributions ?? []).reduce(
      (sum, contribution) =>
        sum + Number(contribution.amount_paise || 0),
      0
    ) / 100;

  // Calculate the total configured prize-pool value across all draws.
  const pool = (draws ?? []).reduce(
    (sum, draw) => sum + Number(draw.prize_pool || 0),
    0
  );

  return (
    <main className="min-h-screen px-6 py-10 md:px-10">
      <div className="mx-auto max-w-6xl">
        {/* Back link to the admin dashboard */}
        <Link
          href="/admin"
          className="text-sm text-muted-foreground"
        >
          ← Admin overview
        </Link>

        {/* Page heading */}
        <h1 className="mt-6 text-4xl font-semibold tracking-tight">
          Reports & analytics
        </h1>

        <p className="mt-2 text-muted-foreground">
          Operational view of users, payments, charity impact and draws.
        </p>

        {/* =========================================================
            SUMMARY STATISTICS
            ========================================================= */}
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {[
            ["Total users", users ?? 0],
            ["Active members", subs ?? 0],
            [
              "Payments",
              `₹${revenue.toLocaleString("en-IN")}`,
            ],
            [
              "Charity allocated",
              `₹${impact.toLocaleString("en-IN")}`,
            ],
          ].map(([label, value]) => (
            <div
              key={String(label)}
              className="rounded-2xl border p-6"
            >
              <p className="text-sm text-muted-foreground">
                {label}
              </p>

              <p className="mt-2 text-3xl font-semibold">
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* =========================================================
            DRAW STATISTICS
            ========================================================= */}
        <section className="mt-8 rounded-2xl border p-6">
          <p className="text-sm text-muted-foreground">
            DRAW STATISTICS
          </p>

          <h2 className="mt-1 text-2xl font-semibold">
            Prize pools
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Total configured pool value: ₹
            {pool.toLocaleString("en-IN")}. Jackpot rollover is
            tracked per draw.
          </p>

          {/* List of individual draws */}
          <div className="mt-5 space-y-2">
            {draws?.map((draw, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-xl border p-4 text-sm"
              >
                {/* Draw status */}
                <span className="capitalize">
                  {draw.status}
                </span>

                {/* Prize pool and jackpot rollover */}
                <span>
                  Pool ₹
                  {Number(draw.prize_pool).toLocaleString("en-IN")}
                  {" · "}
                  rollover ₹
                  {Number(
                    draw.jackpot_rollover_out
                  ).toLocaleString("en-IN")}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}