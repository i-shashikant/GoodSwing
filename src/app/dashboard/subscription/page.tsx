
import {
  requireUser,
  getSubscription,
  hasActiveSubscription,
} from "@/lib/auth";

import { createClient } from "@/lib/supabase/server";

import SubscriptionCheckout from "@/components/payment/SubscriptionCheckout";

const PLANS = [
  {
    id: "monthly" as const,
    name: "Monthly",
    price: 499,
    description: "Flexible month-to-month access.",
  },
  {
    id: "yearly" as const,
    name: "Yearly",
    price: 4990,
    description: "Best value for long-term members.",
  },
];

export default async function SubscriptionPage() {
  await requireUser();

  const subscription = await getSubscription();
  const active = await hasActiveSubscription();

  const supabase = await createClient();

  const { data: charities, error } = await supabase
    .from("charities")
    .select("id, name, description, category")
    .eq("active", true)
    .order("featured", {
      ascending: false,
    })
    .order("name");

  if (error) {
    throw new Error("Unable to load charities.");
  }

  return (
    <main className="min-h-screen bg-background px-5 py-8 md:px-8 md:py-12">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <header className="border-b pb-10">
          <div className="flex items-center gap-2 text-sm font-medium text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            GOODSWING MEMBERSHIP
          </div>

          <div className="mt-5 max-w-3xl">
            <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
              Play your game.
              <br />
              <span className="text-emerald-400">Make it matter.</span>
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
              Choose your membership, support a cause you care about, and
              become eligible for the monthly GoodSwing prize draw.
            </p>
          </div>
        </header>

        {/* Active membership */}
        {active && subscription ? (
          <section className="mt-10 overflow-hidden rounded-3xl border bg-card">
            <div className="p-7 md:p-10">
              <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground">
                      CURRENT MEMBERSHIP
                    </p>

                    <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-400">
                      Active
                    </span>
                  </div>

                  <h2 className="mt-5 text-4xl font-semibold capitalize tracking-tight">
                    {subscription.plan}
                  </h2>

                  <p className="mt-3 text-muted-foreground">
                    ₹
                    {Number(subscription.amount).toLocaleString("en-IN")}{" "}
                    membership
                  </p>

                  {subscription.current_period_start && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      Started{" "}
                      {new Date(
                        subscription.current_period_start
                      ).toLocaleDateString("en-IN")}
                    </p>
                  )}

                  {subscription.current_period_end && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      Current period ends{" "}
                      {new Date(
                        subscription.current_period_end
                      ).toLocaleDateString("en-IN")}
                    </p>
                  )}
                </div>

                <div className="min-w-[180px] rounded-2xl border bg-background p-5">
                  <p className="text-xs text-muted-foreground">
                    Charity contribution
                  </p>

                  <p className="mt-2 text-4xl font-semibold">
                    {subscription.charity_percentage ?? 0}%
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    of your membership
                  </p>
                </div>
              </div>

              <div className="mt-10 border-t pt-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="max-w-xl text-sm leading-6 text-muted-foreground">
                    Your membership is active. You are eligible to participate
                    in the monthly GoodSwing draw.
                  </p>

                  <a
                    href="/dashboard"
                    className="inline-flex items-center justify-center rounded-xl bg-foreground px-5 py-3 text-sm font-medium text-background transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90"
                  >
                    Back to dashboard
                  </a>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <>
            {/* Previous subscription */}
            {subscription && (
              <section className="mt-10 rounded-3xl border bg-card p-7 md:p-8">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground">
                      PREVIOUS MEMBERSHIP
                    </p>

                    <h2 className="mt-3 text-2xl font-semibold capitalize">
                      {subscription.plan}
                    </h2>

                    <p className="mt-2 text-sm text-muted-foreground">
                      ₹
                      {Number(subscription.amount).toLocaleString("en-IN")}
                    </p>

                    {subscription.current_period_end && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        Previous period ended{" "}
                        {new Date(
                          subscription.current_period_end
                        ).toLocaleDateString("en-IN")}
                      </p>
                    )}
                  </div>

                  <span className="w-fit rounded-full border px-3 py-1 text-xs font-medium capitalize text-muted-foreground">
                    {subscription.status}
                  </span>
                </div>
              </section>
            )}

            {/* Plans + charity */}
            <section className="mt-10">
              <div className="mb-6">
                <p className="text-xs font-semibold tracking-[0.18em] text-emerald-400">
                  MEMBERSHIP
                </p>

                <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                  Choose how you play.
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Every membership gives you access to GoodSwing and the
                  monthly prize draw. Your selected charity receives the
                  contribution defined by your membership.
                </p>
              </div>

              <div className="rounded-3xl border bg-card p-6 md:p-8">
                <SubscriptionCheckout
                  plans={PLANS}
                  charities={charities ?? []}
                />
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
