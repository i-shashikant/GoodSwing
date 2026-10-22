import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { logout } from "@/app/auth/actions";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, { data: scores }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, email, role")
        .eq("id", user.id)
        .single(),

      supabase
        .from("scores")
        .select("id, score, played_at")
        .eq("user_id", user.id)
        .order("played_at", { ascending: false }),
    ]);

  const latestScore = scores?.[0];

  return (
    <main className="min-h-screen px-6 py-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              GoodSwing
            </p>

            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              Welcome, {profile?.full_name ?? "Golfer"}
            </h1>
          </div>

          <form action={logout}>
            <button
              type="submit"
              className="rounded-xl border px-4 py-2 text-sm font-medium transition hover:bg-muted"
            >
              Log out
            </button>
          </form>
        </header>

        {/* Stats */}
        <section className="mt-10 grid gap-4 md:grid-cols-3">
          <Link
            href="/dashboard/subscription"
            className="rounded-2xl border p-6 transition hover:-translate-y-1 hover:shadow-lg"
          >
            <p className="text-sm text-muted-foreground">
              Subscription
            </p>

            <p className="mt-3 text-2xl font-semibold">
              Not active
            </p>

            <p className="mt-2 text-sm text-muted-foreground">
              Choose a plan →
            </p>
          </Link>

          <Link
            href="/dashboard/scores"
            className="rounded-2xl border p-6 transition hover:-translate-y-1 hover:shadow-lg"
          >
            <p className="text-sm text-muted-foreground">
              Golf scores
            </p>

            <p className="mt-3 text-2xl font-semibold">
              {scores?.length ?? 0} / 5
            </p>

            <p className="mt-2 text-sm text-muted-foreground">
              {latestScore
                ? `Latest: ${latestScore.score} points`
                : "Add your first round →"}
            </p>
          </Link>

          <Link
            href="/dashboard/charity"
            className="rounded-2xl border p-6 transition hover:-translate-y-1 hover:shadow-lg"
          >
            <p className="text-sm text-muted-foreground">
              Charity
            </p>

            <p className="mt-3 text-2xl font-semibold">
              Not selected
            </p>

            <p className="mt-2 text-sm text-muted-foreground">
              Choose your cause →
            </p>
          </Link>
        </section>

        {/* Main content */}
        <section className="mt-10 grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
          <div className="rounded-2xl border p-8">
            <p className="text-sm font-medium text-muted-foreground">
              Your GoodSwing journey
            </p>

            <h2 className="mt-3 text-3xl font-semibold">
              Play your game.
              <br />
              Make an impact.
            </h2>

            <p className="mt-4 max-w-xl leading-7 text-muted-foreground">
              Keep your game up to date, choose a cause you care
              about, and participate in monthly GoodSwing rewards.
            </p>

            <Link
              href="/dashboard/scores"
              className="mt-8 inline-flex rounded-xl bg-foreground px-5 py-3 font-medium text-background transition hover:opacity-90"
            >
              Add a score
            </Link>
          </div>

          <div className="rounded-2xl border p-8">
            <p className="text-sm font-medium text-muted-foreground">
              Monthly draw
            </p>

            <p className="mt-3 text-2xl font-semibold">
              Coming soon
            </p>

            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Your participation and prize history will appear here
              once draws are available.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}