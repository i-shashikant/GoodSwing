import {
  requireUser,
  getSubscription,
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
        <div className="border-b pb-8">
          <p className="text-sm font-medium text-muted-foreground">
            GoodSwing Membership
          </p>

          <h1 className="mt-2 text-4xl font-semibold tracking-tight">
            Play your game. Make an
            impact.
          </h1>

          <p className="mt-3 max-w-2xl text-muted-foreground">
            Choose your membership plan
            and the charity you want your
            contribution to support.
          </p>
        </div>

        {subscription && (
          <section className="mt-8 rounded-2xl border p-6">
            <p className="text-sm text-muted-foreground">
              Current subscription
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
                Current period ends{" "}
                {new Date(
                  subscription.current_period_end
                ).toLocaleDateString(
                  "en-IN"
                )}
              </p>
            )}
          </section>
        )}

        <div className="mt-8">
          <SubscriptionCheckout
            plans={PLANS}
            charities={
              charities ?? []
            }
          />
        </div>
      </div>
    </main>
  );
}