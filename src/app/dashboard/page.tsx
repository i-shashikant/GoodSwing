import Link from "next/link";
import {
  getProfile,
  getSubscription,
  requireUser,
} from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const user =
    await requireUser();

  const profile =
    await getProfile();

  const subscription =
    await getSubscription();

  const supabase =
    await createClient();

  const { data: scores } =
    await supabase
      .from("scores")
      .select(
        "id, score, played_at"
      )
      .eq(
        "user_id",
        user.id
      )
      .order(
        "played_at",
        {
          ascending: false,
        }
      )
      .limit(5);

  let charity = null;

  if (
    subscription?.charity_id
  ) {
    const { data } =
      await supabase
        .from("charities")
        .select(
          "id, name, description, category"
        )
        .eq(
          "id",
          subscription.charity_id
        )
        .maybeSingle();

    charity = data;
  }

  const isActive =
    subscription?.status ===
      "active" &&
    (!subscription.current_period_end ||
      new Date(
        subscription.current_period_end
      ) > new Date());

  return (
    <main className="min-h-screen px-6 py-10 md:px-10">
      <div className="mx-auto max-w-6xl">
        {/* Header */}

        <header className="border-b pb-8">
          <p className="text-sm font-medium text-muted-foreground">
            GoodSwing
          </p>

          <h1 className="mt-2 text-4xl font-semibold tracking-tight">
            Welcome
            {profile?.full_name
              ? `, ${profile.full_name}`
              : ""}
          </h1>

          <p className="mt-3 max-w-2xl text-muted-foreground">
            Play your game. Make an
            impact.
          </p>
        </header>

        {/* Membership */}

        <section className="mt-8 grid gap-5 md:grid-cols-3">
          <div className="rounded-2xl border p-6 md:col-span-2">
            <p className="text-sm text-muted-foreground">
              Membership
            </p>

            {subscription ? (
              <>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-semibold capitalize">
                    {subscription.plan}
                  </h2>

                  <span
                    className={`rounded-full border px-3 py-1 text-xs capitalize ${
                      isActive
                        ? "border-green-500/40"
                        : ""
                    }`}
                  >
                    {isActive
                      ? "Active"
                      : "Expired"}
                  </span>
                </div>

                <p className="mt-3 text-sm text-muted-foreground">
                  ₹
                  {Number(
                    subscription.amount
                  ).toLocaleString(
                    "en-IN"
                  )}{" "}
                  membership
                </p>

                {subscription.current_period_end && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Period ends{" "}
                    {new Date(
                      subscription.current_period_end
                    ).toLocaleDateString(
                      "en-IN"
                    )}
                  </p>
                )}
              </>
            ) : (
              <>
                <h2 className="mt-3 text-2xl font-semibold">
                  No active membership
                </h2>

                <p className="mt-2 text-sm text-muted-foreground">
                  Choose a plan to
                  participate in
                  GoodSwing.
                </p>

                <Link
                  href="/dashboard/subscription"
                  className="mt-5 inline-block rounded-xl bg-foreground px-5 py-3 text-sm font-medium text-background"
                >
                  Become a member
                </Link>
              </>
            )}
          </div>

          {/* Charity */}

          <div className="rounded-2xl border p-6">
            <p className="text-sm text-muted-foreground">
              Your charity
            </p>

            {charity ? (
              <>
                <h2 className="mt-3 text-xl font-semibold">
                  {charity.name}
                </h2>

                <p className="mt-2 text-sm text-muted-foreground">
                  {subscription?.charity_percentage ??
                    0}
                  % contribution
                </p>

                <Link
                  href="/dashboard/charity"
                  className="mt-5 inline-block text-sm font-medium underline underline-offset-4"
                >
                  Change charity
                </Link>
              </>
            ) : (
              <>
                <h2 className="mt-3 text-xl font-semibold">
                  Not selected
                </h2>

                <Link
                  href="/dashboard/charity"
                  className="mt-5 inline-block text-sm font-medium underline underline-offset-4"
                >
                  Choose a charity
                </Link>
              </>
            )}
          </div>
        </section>

        {/* Scores */}

        <section className="mt-8 rounded-2xl border p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Your game
              </p>

              <h2 className="mt-1 text-2xl font-semibold">
                Recent Stableford scores
              </h2>
            </div>

            <Link
              href="/dashboard/scores"
              className="text-sm font-medium underline underline-offset-4"
            >
              Manage scores
            </Link>
          </div>

          {scores &&
          scores.length > 0 ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {scores.map(
                (score) => (
                  <div
                    key={score.id}
                    className="rounded-xl border p-4"
                  >
                    <p className="text-3xl font-semibold">
                      {score.score}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(
                        `${score.played_at}T00:00:00`
                      ).toLocaleDateString(
                        "en-IN"
                      )}
                    </p>
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="mt-6 rounded-xl border border-dashed p-6">
              <p className="font-medium">
                No scores yet.
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Add your recent Stableford
                rounds to get started.
              </p>

              <Link
                href="/dashboard/scores"
                className="mt-4 inline-block text-sm font-medium underline underline-offset-4"
              >
                Add a score
              </Link>
            </div>
          )}
        </section>

        {/* Draw */}

        <section className="mt-8 rounded-2xl border p-6">
          <p className="text-sm text-muted-foreground">
            GoodSwing Draw
          </p>

          <h2 className="mt-1 text-2xl font-semibold">
            Monthly prize draw
          </h2>

          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Eligible active members can
            participate in the monthly
            GoodSwing draw.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/dashboard/charity"
              className="rounded-xl border px-4 py-2 text-sm font-medium"
            >
              View impact
            </Link>

            {!isActive && (
              <Link
                href="/dashboard/subscription"
                className="rounded-xl bg-foreground px-4 py-2 text-sm font-medium text-background"
              >
                Renew membership
              </Link>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}