import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createCharity } from "./charities/actions";

export default async function AdminPage() {
  // Ensure that only authenticated admins can access the admin area.
  const { user, profile } = await requireAdmin();

  // Create a Supabase server client.
  const supabase = await createClient();

  // Fetch all dashboard data in parallel.
  const [
    { data: charities },
    { count: users },
    { count: activeSubs },
    { data: draws },
    { data: winners },
  ] = await Promise.all([
    // Fetch charities, newest first.
    supabase
      .from("charities")
      .select("id,name,category,active,featured,created_at")
      .order("created_at", { ascending: false }),

    // Count all registered users.
    supabase
      .from("profiles")
      .select("id", {
        count: "exact",
        head: true,
      }),

    // Count users with an active subscription.
    supabase
      .from("subscriptions")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("status", "active"),

    // Fetch the five most recent draws.
    supabase
      .from("draws")
      .select("id,draw_month,status,prize_pool")
      .order("draw_month", { ascending: false })
      .limit(5),

    // Fetch winner verification and payment statuses.
    supabase
      .from("winners")
      .select(
        "id,verification_status,payment_status,prize_amount",
        {
          count: "exact",
        }
      ),
  ]);

  // A winner is considered pending if:
  // - they have not been approved yet, OR
  // - they have been approved but have not been paid.
  const pending =
    winners?.filter(
      (winner) =>
        winner.verification_status !== "approved" ||
        winner.payment_status !== "paid"
    ).length ?? 0;

  return (
    <main className="min-h-screen px-6 py-10 md:px-10">
      <div className="mx-auto max-w-6xl">

        {/* =========================================================
            ADMIN HEADER
            ========================================================= */}
        <header className="flex flex-col gap-5 border-b pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-[#087f4e]">
              GOODSWING ADMIN
            </p>

            <h1 className="mt-2 text-4xl font-semibold tracking-tight">
              Control room.
            </h1>

            <p className="mt-2 text-muted-foreground">
              Manage people, charities, draws and winner payouts.
            </p>
          </div>

          {/* Logged-in admin's name/email */}
          <div className="rounded-full border px-4 py-2 text-sm">
            {profile?.full_name || user.email}
          </div>
        </header>

        {/* =========================================================
            ADMIN NAVIGATION
            ========================================================= */}
        <nav className="mt-6 flex flex-wrap gap-2">
          <Link
            className="rounded-xl bg-foreground px-4 py-2 text-sm font-medium text-background"
            href="/admin"
          >
            Overview
          </Link>

          <Link
            className="rounded-xl border px-4 py-2 text-sm"
            href="/admin/charities"
          >
            Charities
          </Link>

          <Link
            className="rounded-xl border px-4 py-2 text-sm"
            href="/admin/draws"
          >
            Draws
          </Link>

          <Link
            className="rounded-xl border px-4 py-2 text-sm"
            href="/admin/winners"
          >
            Winners
          </Link>

          <Link
            className="rounded-xl border px-4 py-2 text-sm"
            href="/admin/users"
          >
            Users
          </Link>

          <Link
            className="rounded-xl border px-4 py-2 text-sm"
            href="/admin/reports"
          >
            Reports
          </Link>
        </nav>

        {/* =========================================================
            DASHBOARD STATISTICS
            ========================================================= */}
        <section className="grid gap-4 py-8 md:grid-cols-4">
          {[
            ["Users", users ?? 0],
            ["Active members", activeSubs ?? 0],
            ["Charities", charities?.length ?? 0],
            ["Pending winners", pending],
          ].map(([label, value]) => (
            <div
              key={String(label)}
              className="rounded-2xl border p-6 transition hover:-translate-y-1"
            >
              <p className="text-sm text-muted-foreground">
                {label}
              </p>

              <p className="mt-2 text-3xl font-semibold">
                {value}
              </p>
            </div>
          ))}
        </section>

        {/* =========================================================
            CHARITY MANAGEMENT
            ========================================================= */}
        <section className="rounded-2xl border p-6">
          <p className="text-sm font-medium text-muted-foreground">
            CHARITY MANAGEMENT
          </p>

          <h2 className="mt-1 text-2xl font-semibold">
            Add a cause
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Charities are data-driven and created by administrators.
          </p>

          {/* Charity creation form */}
          <form
            action={createCharity}
            className="mt-6 grid gap-5 md:grid-cols-2"
          >
            {/* Charity name */}
            <input
              name="name"
              required
              placeholder="Charity name"
              className="rounded-xl border bg-transparent px-4 py-3 outline-none focus:ring-2"
            />

            {/* Charity category */}
            <input
              name="category"
              placeholder="Category"
              className="rounded-xl border bg-transparent px-4 py-3 outline-none focus:ring-2"
            />

            {/* Charity description */}
            <textarea
              name="description"
              required
              rows={3}
              placeholder="What does this charity support?"
              className="resize-none rounded-xl border bg-transparent px-4 py-3 outline-none focus:ring-2 md:col-span-2"
            />

            {/* Charity website */}
            <input
              name="website_url"
              type="url"
              placeholder="https://example.org"
              className="rounded-xl border bg-transparent px-4 py-3 outline-none focus:ring-2"
            />

            {/* Optional charity image */}
            <input
              name="image_url"
              type="url"
              placeholder="Image URL (optional)"
              className="rounded-xl border bg-transparent px-4 py-3 outline-none focus:ring-2"
            />

            {/* Submit charity */}
            <button className="rounded-xl bg-foreground px-5 py-3 font-medium text-background md:col-span-2 md:w-fit">
              Add charity
            </button>
          </form>
        </section>

        {/* =========================================================
            RECENT DRAWS
            ========================================================= */}
        <section className="mt-8 rounded-2xl border p-6">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                RECENT DRAWS
              </p>

              <h2 className="mt-1 text-2xl font-semibold">
                Draw operations
              </h2>
            </div>

            {/* Link to complete draw management */}
            <Link
              href="/admin/draws"
              className="text-sm font-semibold underline"
            >
              Manage draws
            </Link>
          </div>

          {/* Recent draws list */}
          <div className="mt-5 space-y-3">
            {draws?.map((draw) => (
              <div
                key={draw.id}
                className="flex flex-col gap-2 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  {/* Format draw month as "October 2026" */}
                  <p className="font-semibold">
                    {new Date(
                      `${draw.draw_month}T00:00:00`
                    ).toLocaleDateString("en-IN", {
                      month: "long",
                      year: "numeric",
                    })}
                  </p>

                  {/* Display prize pool */}
                  <p className="text-sm text-muted-foreground">
                    Pool ₹
                    {Number(
                      draw.prize_pool
                    ).toLocaleString("en-IN")}
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