import Link from "next/link";

import {
  ArrowLeft,
  CheckCircle2,
  Heart,
  ShieldCheck,
  Sparkles,
  Trophy,
} from "lucide-react";

import {
  requireUser,
  getSubscription,
  hasActiveSubscription,
} from "@/lib/auth";

import { createClient } from "@/lib/supabase/server";

import SubscriptionCheckout from "@/components/payment/SubscriptionCheckout";

export default async function SubscriptionPage() {
  // Make sure the visitor is authenticated.
  await requireUser();

  // Load the user's current membership.
  const subscription =
    await getSubscription();

  const active =
    await hasActiveSubscription();

  const supabase =
    await createClient();

  // -------------------------------------------------------------
  // Plans
  // -------------------------------------------------------------
  const {
    data: plans,
    error: plansError,
  } = await supabase
    .from("plans")
    .select(
      "id, name, price_paise, interval"
    )
    .eq("active", true)
    .order("sort_order");

  if (plansError) {
    throw new Error(
      "Unable to load membership plans."
    );
  }

  // Convert database pricing into the shape
  // expected by the checkout component.
  const checkoutPlans =
    (plans ?? []).map((plan) => ({
      id: plan.id,
      name: plan.name,
      price:
        Number(plan.price_paise) / 100,
      description:
        plan.interval === "year"
          ? "Best value for long-term members."
          : "Flexible month-to-month access.",
    }));

  // -------------------------------------------------------------
  // Charities
  // -------------------------------------------------------------
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
    <main className="relative min-h-screen overflow-hidden bg-[#080c0a] text-white">
      {/* =========================================================
          AMBIENT BACKGROUND
          ========================================================= */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-emerald-400/[0.08] blur-[140px]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-20 h-[420px] w-[420px] rounded-full bg-teal-300/[0.055] blur-[130px]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-1/3 h-[320px] w-[320px] rounded-full bg-amber-300/[0.04] blur-[120px]"
      />

      <div className="relative mx-auto max-w-7xl px-5 py-8 md:px-10 md:py-12">
        {/* =========================================================
            HEADER
            ========================================================= */}

        <header className="border-b border-white/[0.08] pb-12">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-white/45 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>

          <div className="mt-10 max-w-4xl">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-emerald-400">
              <Sparkles className="h-4 w-4" />
              GoodSwing membership
            </div>

            <h1 className="mt-5 text-4xl font-bold tracking-[-0.05em] md:text-6xl lg:text-7xl">
              Play your game.
              <br />
              <span className="text-emerald-400">
                Make it matter.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-7 text-white/50 md:text-lg">
              Choose your membership, support a cause you care
              about, and become eligible for the monthly GoodSwing
              prize draw.
            </p>
          </div>
        </header>

        {/* =========================================================
            ACTIVE MEMBERSHIP
            ========================================================= */}

        {active && subscription ? (
          <section className="relative mt-10 overflow-hidden rounded-3xl border border-emerald-400/20 bg-gradient-to-br from-emerald-400/[0.07] via-white/[0.02] to-teal-300/[0.035]">
            <div
              aria-hidden="true"
              className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-emerald-400/10 blur-[100px]"
            />

            <div className="relative p-7 md:p-10">
              <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/40">
                      Current membership
                    </p>

                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-300">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Active
                    </span>
                  </div>

                  <h2 className="mt-5 text-4xl font-bold capitalize tracking-tight">
                    {subscription.plan}
                  </h2>

                  <p className="mt-3 text-lg text-white/60">
                    ₹
                    {Number(
                      subscription.amount
                    ).toLocaleString(
                      "en-IN"
                    )}{" "}
                    membership
                  </p>

                  <div className="mt-6 space-y-2 text-sm text-white/40">
                    {subscription.current_period_start && (
                      <p>
                        Started{" "}
                        {new Date(
                          subscription.current_period_start
                        ).toLocaleDateString(
                          "en-IN"
                        )}
                      </p>
                    )}

                    {subscription.current_period_end && (
                      <p>
                        Current period ends{" "}
                        {new Date(
                          subscription.current_period_end
                        ).toLocaleDateString(
                          "en-IN"
                        )}
                      </p>
                    )}
                  </div>
                </div>

                {/* Contribution */}
                <div className="min-w-[240px] rounded-3xl border border-amber-300/15 bg-amber-300/[0.045] p-6">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-200/60">
                    <Heart className="h-4 w-4 text-rose-300" />
                    Charity contribution
                  </div>

                  <p className="mt-5 text-5xl font-bold text-amber-200">
                    {subscription.charity_percentage ??
                      0}
                    %
                  </p>

                  <p className="mt-2 text-sm text-white/40">
                    of your membership
                  </p>
                </div>
              </div>

              <div className="mt-10 grid gap-4 border-t border-white/[0.07] pt-7 md:grid-cols-3">
                <div className="flex gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-400/10 text-emerald-300">
                    <Trophy className="h-4 w-4" />
                  </div>

                  <div>
                    <p className="text-sm font-bold">
                      Monthly rewards
                    </p>

                    <p className="mt-1 text-xs leading-5 text-white/35">
                      Active members can participate in the monthly draw.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-400/10 text-rose-300">
                    <Heart className="h-4 w-4" />
                  </div>

                  <div>
                    <p className="text-sm font-bold">
                      Your chosen cause
                    </p>

                    <p className="mt-1 text-xs leading-5 text-white/35">
                      Your contribution remains connected to your selected charity.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal-300/10 text-teal-300">
                    <ShieldCheck className="h-4 w-4" />
                  </div>

                  <div>
                    <p className="text-sm font-bold">
                      Secure membership
                    </p>

                    <p className="mt-1 text-xs leading-5 text-white/35">
                      Payments and membership status are handled securely.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-white/40">
                  Your membership is active and you're eligible
                  for the GoodSwing experience.
                </p>

                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center rounded-xl bg-emerald-400 px-5 py-3 text-sm font-bold text-[#06100b] transition hover:-translate-y-0.5 hover:bg-emerald-300"
                >
                  Back to dashboard
                </Link>
              </div>
            </div>
          </section>
        ) : (
          <>
            {/* =====================================================
                PREVIOUS MEMBERSHIP
                ===================================================== */}

            {subscription && (
              <section className="mt-10 rounded-3xl border border-white/[0.08] bg-white/[0.025] p-7 md:p-8">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/35">
                      Previous membership
                    </p>

                    <h2 className="mt-3 text-2xl font-bold capitalize">
                      {subscription.plan}
                    </h2>

                    <p className="mt-2 text-sm text-white/45">
                      ₹
                      {Number(
                        subscription.amount
                      ).toLocaleString(
                        "en-IN"
                      )}
                    </p>

                    {subscription.current_period_end && (
                      <p className="mt-1 text-xs text-white/30">
                        Previous period ended{" "}
                        {new Date(
                          subscription.current_period_end
                        ).toLocaleDateString(
                          "en-IN"
                        )}
                      </p>
                    )}
                  </div>

                  <span className="w-fit rounded-full border border-white/[0.08] px-3 py-1.5 text-xs font-semibold capitalize text-white/45">
                    {subscription.status}
                  </span>
                </div>
              </section>
            )}

            {/* =====================================================
                CHECKOUT
                ===================================================== */}

            <section className="mt-10">
              <div className="mb-7">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-400">
                  Membership
                </p>

                <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
                  Choose how you play.
                </h2>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/45">
                  One membership gives you access to GoodSwing,
                  monthly rewards and the chance to direct part of
                  your membership toward a cause you care about.
                </p>
              </div>

              <div className="relative overflow-hidden rounded-3xl border border-white/[0.09] bg-white/[0.025] p-6 md:p-8">
                <SubscriptionCheckout
                  plans={checkoutPlans}
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