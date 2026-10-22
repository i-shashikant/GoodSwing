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
    description:
      "Flexible month-to-month access.",
  },

  {
    id: "yearly" as const,
    name: "Yearly",
    price: 4990,
    description:
      "Best value for long-term members.",
  },
];

export default async function SubscriptionPage() {
  await requireUser();

  const subscription =
    await getSubscription();

  const active =
    await hasActiveSubscription();

  const supabase =
    await createClient();

  const {
    data: charities,
    error,
  } = await supabase
    .from("charities")
    .select(
      "id, name, description, category"
    )
    .eq("active", true)
    .order("featured", {
      ascending: false,
    })
    .order("name");

  if (error) {
    throw new Error(
      "Unable to load charities."
    );
  }

  return (
    <main className="min-h-screen px-6 py-10 md:px-10">
      <div className="mx-auto max-w-5xl">
        {/* Header */}

        <div className="border-b pb-8">
          <p className="text-sm font-medium text-muted-foreground">
            GoodSwing Membership
          </p>

          <h1 className="mt-2 text-4xl font-semibold tracking-tight">
            Play your game. Make an
            impact.
          </h1>

          <p className="mt-3 max-w-2xl text-muted-foreground">
            Your GoodSwing membership
            controls your participation
            in the monthly prize draw.
          </p>
        </div>

        {/* Active membership */}

        {active && subscription ? (
          <section className="mt-8 rounded-2xl border p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  CURRENT MEMBERSHIP
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <h2 className="text-3xl font-semibold capitalize">
                    {subscription.plan}
                  </h2>

                  <span className="rounded-full border border-green-500/40 px-3 py-1 text-xs font-medium">
                    Active
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

                {subscription.current_period_start && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Started{" "}
                    {new Date(
                      subscription.current_period_start
                    ).toLocaleDateString(
                      "en-IN"
                    )}
                  </p>
                )}

                {subscription.current_period_end && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Current period ends{" "}
                    {new Date(
                      subscription.current_period_end
                    ).toLocaleDateString(
                      "en-IN"
                    )}
                  </p>
                )}
              </div>

              <div className="rounded-xl border px-5 py-4">
                <p className="text-xs text-muted-foreground">
                  Charity contribution
                </p>

                <p className="mt-1 text-2xl font-semibold">
                  {subscription.charity_percentage ??
                    0}
                  %
                </p>
              </div>
            </div>

            <div className="mt-8 border-t pt-6">
              <p className="text-sm text-muted-foreground">
                Your membership is active.
                You do not need to make
                another payment right now.
              </p>

              <a
                href="/dashboard"
                className="mt-4 inline-block rounded-xl bg-foreground px-5 py-3 text-sm font-medium text-background transition hover:opacity-90"
              >
                Back to dashboard
              </a>
            </div>
          </section>
        ) : (
          <>
            {/* Existing / expired subscription */}

            {subscription && (
              <section className="mt-8 rounded-2xl border p-6">
                <p className="text-sm text-muted-foreground">
                  Previous subscription
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-semibold capitalize">
                    {subscription.plan}
                  </h2>

                  <span className="rounded-full border px-3 py-1 text-xs capitalize">
                    {subscription.status}
                  </span>
                </div>

                <p className="mt-2 text-sm text-muted-foreground">
                  ₹
                  {Number(
                    subscription.amount
                  ).toLocaleString(
                    "en-IN"
                  )}
                </p>

                {subscription.current_period_end && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Previous period ended{" "}
                    {new Date(
                      subscription.current_period_end
                    ).toLocaleDateString(
                      "en-IN"
                    )}
                  </p>
                )}
              </section>
            )}

            {/* Checkout */}

            <div className="mt-8">
              <SubscriptionCheckout
                plans={PLANS}
                charities={
                  charities ?? []
                }
              />
            </div>
          </>
        )}
      </div>
    </main>
  );
}