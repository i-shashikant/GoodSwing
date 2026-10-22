import Link from "next/link";
import {
  ArrowUpRight,
  Heart,
  Sparkles,
  Trophy,
  Users,
  Wallet,
  AlertTriangle,
} from "lucide-react";

import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/**
 * Format a number as Indian Rupees.
 */
const inr = (amount: number) =>
  `₹${amount.toLocaleString("en-IN")}`;

/**
 * Admin dashboard
 *
 * Shows:
 * - Total users
 * - Active members
 * - Revenue
 * - Charity impact
 * - Prize pool
 * - Winner proofs waiting for review
 * - Approved winners waiting for payout
 * - Recent draws
 */
export default async function AdminPage() {
  // Make sure the current user is an admin.
  const { profile, user } = await requireAdmin();

  // Create the server-side Supabase client.
  const supabase = await createClient();

  /**
   * Fetch all dashboard data in parallel.
   *
   * Important:
   * We don't join `profiles` from `winners` here.
   * The dashboard doesn't need the profile information,
   * and joining it was causing the "more than one relationship"
   * error elsewhere in the admin area.
   */
  const [
    { count: users },
    { count: activeSubs },
    { data: payments },
    { data: contributions },
    { data: draws },
    { data: winners },
  ] = await Promise.all([
    // Total registered users.
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true }),

    // Currently active memberships.
    supabase
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),

    // All payments for revenue calculation.
    supabase
      .from("payments")
      .select("amount_paise"),

    // All charity contributions.
    supabase
      .from("charity_contributions")
      .select("amount_paise"),

    // Recent draws.
    supabase
      .from("draws")
      .select("id, draw_month, status, prize_pool")
      .order("draw_month", { ascending: false }),

    /**
     * Winner records.
     *
     * Only select columns required by the dashboard.
     */
    supabase
      .from("winners")
      .select(
        "id, prize_amount, verification_status, payment_status, match_count"
      )
      .order("created_at", { ascending: false }),
  ]);

  /**
   * Calculate total revenue.
   *
   * Database stores money in paise,
   * so divide by 100 for rupees.
   */
  const revenue =
    (payments ?? []).reduce(
      (sum, payment) =>
        sum + Number(payment.amount_paise || 0),
      0
    ) / 100;

  /**
   * Calculate total charity impact.
   */
  const charityTotal =
    (contributions ?? []).reduce(
      (sum, contribution) =>
        sum + Number(contribution.amount_paise || 0),
      0
    ) / 100;

  /**
   * Calculate total prize pool.
   */
  const prizePool = (draws ?? []).reduce(
    (sum, draw) =>
      sum + Number(draw.prize_pool || 0),
    0
  );

  /**
   * Winner proofs waiting for admin review.
   *
   * A submitted proof is what the admin needs to review.
   *
   * We also include pending / awaiting_proof because
   * those are still unresolved winner actions.
   */
  const proofReview = (winners ?? []).filter((winner) =>
    [
      "pending",
      "awaiting_proof",
      "submitted",
    ].includes(winner.verification_status)
  );

  /**
   * Approved winners who haven't been paid yet.
   */
  const payouts = (winners ?? []).filter(
    (winner) =>
      winner.verification_status === "approved" &&
      winner.payment_status !== "paid"
  );

  /**
   * Dashboard statistic cards.
   */
  const stats = [
    ["Users", String(users ?? 0), Users],
    ["Active members", String(activeSubs ?? 0), Sparkles],
    ["Revenue", inr(revenue), Wallet],
    ["Charity impact", inr(charityTotal), Heart],
    ["Prize pool", inr(prizePool), Trophy],
  ] as const;

  return (
    <main className="min-h-screen px-5 py-7 md:px-10 md:py-9">
      <div className="mx-auto max-w-6xl">

        {/* =========================================================
            PAGE HEADER
        ========================================================= */}
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="eyebrow">
              GoodSwing operations
            </p>

            <h1 className="mt-2 text-4xl font-semibold tracking-[-.05em] md:text-5xl">
              Control room.
            </h1>

            <p className="mt-3 text-sm text-neutral-500">
              A live view of members, money, causes and the draw.
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs text-neutral-400">
              Signed in as
            </p>

            <p className="mt-1 text-sm font-semibold">
              {profile?.full_name ||
                user?.email ||
                "Admin"}
            </p>
          </div>
        </div>

        {/* =========================================================
            TOP STATISTICS
        ========================================================= */}
        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {stats.map(([label, value, Icon]) => (
            <Card
              key={label}
              className="transition hover:-translate-y-1 hover:shadow-lg"
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between">

                  <p className="text-[10px] font-bold uppercase tracking-[.16em] text-neutral-400">
                    {label}
                  </p>

                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                    <Icon className="h-4 w-4" />
                  </span>

                </div>

                <p className="mt-5 truncate text-2xl font-semibold tracking-tight">
                  {value}
                </p>
              </CardContent>
            </Card>
          ))}
        </section>

        {/* =========================================================
            NEEDS ATTENTION + DRAW DESK
        ========================================================= */}
        <section className="mt-6 grid gap-6 lg:grid-cols-[1.25fr_.75fr]">

          {/* -------------------------------------------------------
              NEEDS ATTENTION
          ------------------------------------------------------- */}
          <Card>
            <CardContent className="p-7">

              <div className="flex items-center justify-between">
                <div>
                  <p className="eyebrow">
                    Needs attention
                  </p>

                  <h2 className="mt-2 text-2xl font-semibold">
                    Keep the club moving.
                  </h2>
                </div>

                <Badge className="border-amber-200 bg-amber-50 text-amber-700">
                  {proofReview.length + payouts.length} actions
                </Badge>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">

                {/* -------------------------------------------------
                    PROOF REVIEW
                ------------------------------------------------- */}
                <div className="rounded-2xl bg-amber-50 p-5">

                  <div className="flex items-center gap-2 text-amber-800">
                    <AlertTriangle className="h-4 w-4" />

                    <span className="text-xs font-bold uppercase tracking-[.12em]">
                      Proof review
                    </span>
                  </div>

                  <p className="mt-5 text-4xl font-semibold">
                    {proofReview.length}
                  </p>

                  <p className="mt-1 text-xs text-amber-800/65">
                    winner proofs waiting
                  </p>

                </div>

                {/* -------------------------------------------------
                    PAYOUTS
                ------------------------------------------------- */}
                <div className="rounded-2xl bg-blue-50 p-5">

                  <div className="flex items-center gap-2 text-blue-800">
                    <Wallet className="h-4 w-4" />

                    <span className="text-xs font-bold uppercase tracking-[.12em]">
                      Payouts
                    </span>
                  </div>

                  <p className="mt-5 text-4xl font-semibold">
                    {payouts.length}
                  </p>

                  <p className="mt-1 text-xs text-blue-800/65">
                    approved winners to pay
                  </p>

                </div>

              </div>

              {/* Open winner management page */}
              <Link
                href="/admin/winners"
                className="mt-6 inline-flex"
              >
                <Button variant="outline">
                  Open winner queue
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </Link>

            </CardContent>
          </Card>

          {/* -------------------------------------------------------
              DRAW DESK
          ------------------------------------------------------- */}
          <Card className="bg-[#123d2d] text-white">
            <CardContent className="p-7">

              <p className="text-[10px] font-bold uppercase tracking-[.18em] text-emerald-100/45">
                Draw desk
              </p>

              <h2 className="mt-3 text-3xl font-semibold">
                {draws?.[0]
                  ? new Date(
                      `${draws[0].draw_month}T00:00:00`
                    ).toLocaleDateString("en-IN", {
                      month: "long",
                      year: "numeric",
                    })
                  : "No draw yet"}
              </h2>

              <p className="mt-2 text-sm text-emerald-100/55">
                {draws?.[0]
                  ? `Latest status: ${draws[0].status}`
                  : "Create the first monthly draw."}
              </p>

              <div className="mt-8 flex gap-2">

                <Link href="/admin/draws">
                  <Button
                    variant="success"
                    size="sm"
                  >
                    Manage draws
                  </Button>
                </Link>

                <Link href="/admin/reports">
                  <Button
                    size="sm"
                    className="border border-white/10 bg-white/10 text-white"
                  >
                    Reports
                  </Button>
                </Link>

              </div>

            </CardContent>
          </Card>

        </section>

        {/* =========================================================
            RECENT DRAWS
        ========================================================= */}
        <section className="mt-6">
          <Card>
            <CardContent className="p-7">

              <div className="flex items-center justify-between">

                <div>
                  <p className="eyebrow">
                    Recent draws
                  </p>

                  <h2 className="mt-2 text-2xl font-semibold">
                    The monthly pulse.
                  </h2>
                </div>

                <Link
                  href="/admin/draws"
                  className="text-xs font-bold text-emerald-700"
                >
                  View all →
                </Link>

              </div>

              <div className="mt-6 divide-y divide-black/[.06]">

                {(draws ?? [])
                  .slice(0, 5)
                  .map((draw) => (
                    <div
                      key={draw.id}
                      className="flex items-center justify-between gap-4 py-4"
                    >

                      <div>
                        <p className="font-semibold">
                          {new Date(
                            `${draw.draw_month}T00:00:00`
                          ).toLocaleDateString(
                            "en-IN",
                            {
                              month: "long",
                              year: "numeric",
                            }
                          )}
                        </p>

                        <p className="mt-1 text-xs text-neutral-400">
                          Prize pool{" "}
                          {inr(
                            Number(
                              draw.prize_pool || 0
                            )
                          )}
                        </p>
                      </div>

                      <Badge
                        className={
                          draw.status === "completed"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : draw.status === "open"
                              ? "border-blue-200 bg-blue-50 text-blue-700"
                              : ""
                        }
                      >
                        {draw.status}
                      </Badge>

                    </div>
                  ))}

                {/* Empty state */}
                {!draws?.length && (
                  <p className="py-8 text-center text-sm text-neutral-400">
                    No draws yet.
                  </p>
                )}

              </div>

            </CardContent>
          </Card>
        </section>

      </div>
    </main>
  );
}