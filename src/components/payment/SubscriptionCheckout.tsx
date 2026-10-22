"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  Check,
  Crown,
  Gift,
  Heart,
  Loader2,
  Lock,
  Sparkles,
  Users,
} from "lucide-react";

type Plan = {
  id: "monthly" | "yearly";
  name: string;
  price: number;
  description: string;
};

type Charity = {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
};

type Props = {
  plans: Plan[];
  charities: Charity[];
};

type RazorpayResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (
    response: RazorpayResponse
  ) => Promise<void> | void;
  modal?: {
    ondismiss?: () => void;
  };
};

declare global {
  interface Window {
    Razorpay: new (
      options: RazorpayOptions
    ) => {
      open: () => void;
    };
  }
}

export default function SubscriptionCheckout({
  plans,
  charities,
}: Props) {
  const router = useRouter();

  // -------------------------------------------------------------
  // Local selection state
  // -------------------------------------------------------------

  const [plan, setPlan] =
    useState<"monthly" | "yearly">(
      "monthly"
    );

  const [charityId, setCharityId] =
    useState("");

  const [
    charityPercentage,
    setCharityPercentage,
  ] = useState(10);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  // Find the currently selected plan from
  // database-backed plan data.
  const selectedPlan =
    plans.find(
      (item) => item.id === plan
    ) ?? plans[0];

  // Find the selected charity.
  const selectedCharity =
    charities.find(
      (item) => item.id === charityId
    );

  // -------------------------------------------------------------
  // Payment
  // -------------------------------------------------------------

  async function handlePayment() {
    setError("");

    if (!charityId) {
      setError(
        "Please select a charity."
      );
      return;
    }

    if (!selectedPlan) {
      setError(
        "Please select a membership plan."
      );
      return;
    }

    setLoading(true);

    try {
      // Create the Razorpay order on the server.
      const response =
        await fetch(
          "/api/razorpay/order",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              plan,
              charityId,
              charityPercentage,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to create payment order."
        );
      }

      // Load Razorpay only when payment is
      // actually required.
      if (!window.Razorpay) {
        await new Promise<void>(
          (resolve, reject) => {
            const script =
              document.createElement(
                "script"
              );

            script.src =
              "https://checkout.razorpay.com/v1/checkout.js";

            script.onload = () =>
              resolve();

            script.onerror = () =>
              reject(
                new Error(
                  "Unable to load Razorpay."
                )
              );

            document.body.appendChild(
              script
            );
          }
        );
      }

      const razorpay =
        new window.Razorpay({
          key: data.keyId,
          amount: data.amount,
          currency: data.currency,
          name: "GoodSwing",

          description:
            plan === "monthly"
              ? "GoodSwing Monthly Membership"
              : "GoodSwing Yearly Membership",

          order_id: data.orderId,

          // -------------------------------------------------------
          // Payment verification
          // -------------------------------------------------------
          handler:
            async function (
              paymentResponse
            ) {
              try {
                setError("");

                const verifyResponse =
                  await fetch(
                    "/api/razorpay/verify",
                    {
                      method: "POST",

                      headers: {
                        "Content-Type":
                          "application/json",
                      },

                      body: JSON.stringify({
                        ...paymentResponse,
                        plan,
                        charityId,
                        charityPercentage,
                      }),
                    }
                  );

                const verifyData =
                  await verifyResponse.json();

                if (!verifyResponse.ok) {
                  throw new Error(
                    verifyData.error ||
                      "Payment verification failed."
                  );
                }

                setLoading(false);

                router.push(
                  "/dashboard"
                );

                router.refresh();
              } catch (err) {
                setError(
                  err instanceof Error
                    ? err.message
                    : "Payment verification failed."
                );

                setLoading(false);
              }
            },

          modal: {
            ondismiss:
              function () {
                setLoading(false);
              },
          },
        });

      razorpay.open();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to start payment."
      );

      setLoading(false);
    }
  }

  return (
    <div className="space-y-12">
      {/* =========================================================
          01 — MEMBERSHIP PLAN
          ========================================================= */}

      <section>
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/35">
              01 / Membership
            </p>

            <h2 className="mt-2 text-2xl font-bold">
              Choose your plan
            </h2>

            <p className="mt-2 text-sm text-white/40">
              Pick the membership that fits you.
            </p>
          </div>

          {plan === "yearly" && (
            <span className="rounded-full bg-amber-300/10 px-3 py-1.5 text-xs font-bold text-amber-200">
              Best value
            </span>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {plans.map((item) => {
            const isSelected =
              plan === item.id;

            const isYearly =
              item.id === "yearly";

            return (
              <button
                key={item.id}
                type="button"
                disabled={loading}
                onClick={() =>
                  setPlan(item.id)
                }
                className={`group relative overflow-hidden rounded-3xl border p-6 text-left transition-all duration-300 ${
                  isSelected
                    ? isYearly
                      ? "border-amber-300/70 bg-amber-300/[0.055] shadow-[0_0_35px_rgba(252,211,77,0.08)]"
                      : "border-emerald-400/70 bg-emerald-400/[0.055] shadow-[0_0_35px_rgba(52,211,153,0.08)]"
                    : "border-white/[0.09] bg-white/[0.02] hover:-translate-y-1 hover:border-emerald-400/30 hover:bg-white/[0.035]"
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                {/* Selection glow */}
                {isSelected && (
                  <div
                    aria-hidden="true"
                    className={`absolute -right-12 -top-12 h-36 w-36 rounded-full blur-3xl ${
                      isYearly
                        ? "bg-amber-300/15"
                        : "bg-emerald-400/15"
                    }`}
                  />
                )}

                <div className="relative">
                  <div className="flex items-start justify-between">
                    <div
                      className={`grid h-11 w-11 place-items-center rounded-2xl ${
                        isYearly
                          ? "bg-amber-300/10 text-amber-200"
                          : "bg-emerald-400/10 text-emerald-300"
                      }`}
                    >
                      {isYearly ? (
                        <Crown className="h-5 w-5" />
                      ) : (
                        <Gift className="h-5 w-5" />
                      )}
                    </div>

                    <div
                      className={`grid h-7 w-7 place-items-center rounded-full border transition ${
                        isSelected
                          ? isYearly
                            ? "border-amber-300 bg-amber-300 text-[#171207]"
                            : "border-emerald-400 bg-emerald-400 text-[#06100b]"
                          : "border-white/[0.12] text-transparent"
                      }`}
                    >
                      <Check className="h-4 w-4" />
                    </div>
                  </div>

                  <div className="mt-8 flex items-center gap-2">
                    <h3 className="text-xl font-bold">
                      {item.name}
                    </h3>

                    {isYearly && (
                      <span className="rounded-full bg-amber-300/10 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-amber-200">
                        Best value
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex items-end gap-2">
                    <span className="text-4xl font-black tracking-tight">
                      ₹
                      {item.price.toLocaleString(
                        "en-IN"
                      )}
                    </span>

                    <span className="mb-1 text-sm text-white/35">
                      /
                      {isYearly
                        ? "year"
                        : "month"}
                    </span>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-white/40">
                    {item.description}
                  </p>

                  <div
                    className={`mt-6 text-xs font-bold ${
                      isSelected
                        ? isYearly
                          ? "text-amber-200"
                          : "text-emerald-300"
                        : "text-white/30"
                    }`}
                  >
                    {isSelected
                      ? "Selected"
                      : "Select this plan"}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* =========================================================
          02 — CHARITY
          ========================================================= */}

      <section>
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/35">
              02 / Your cause
            </p>

            <span className="rounded-full bg-rose-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-300">
              Your choice
            </span>
          </div>

          <h2 className="mt-2 text-2xl font-bold">
            Choose your charity
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/40">
            Pick the cause your membership will support.
            Your contribution stays connected to your choice.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {charities.map((charity) => {
            const isSelected =
              charityId === charity.id;

            return (
              <button
                key={charity.id}
                type="button"
                disabled={loading}
                onClick={() =>
                  setCharityId(
                    charity.id
                  )
                }
                className={`group relative overflow-hidden rounded-3xl border p-5 text-left transition-all duration-300 ${
                  isSelected
                    ? "border-rose-300/60 bg-rose-300/[0.045] shadow-[0_0_30px_rgba(251,113,133,0.06)]"
                    : "border-white/[0.09] bg-white/[0.02] hover:-translate-y-1 hover:border-rose-300/25 hover:bg-white/[0.035]"
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                {isSelected && (
                  <div className="absolute right-5 top-5 grid h-7 w-7 place-items-center rounded-full bg-rose-300 text-[#18090d]">
                    <Check className="h-4 w-4" />
                  </div>
                )}

                <div className="flex items-start gap-4">
                  <div
                    className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl transition ${
                      isSelected
                        ? "bg-rose-300/15 text-rose-300"
                        : "bg-white/[0.04] text-white/35 group-hover:bg-rose-300/10 group-hover:text-rose-300"
                    }`}
                  >
                    <Heart className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 pr-8">
                    <h3 className="font-bold">
                      {charity.name}
                    </h3>

                    {charity.category && (
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-rose-300/60">
                        {charity.category}
                      </p>
                    )}

                    {charity.description && (
                      <p className="mt-3 text-sm leading-6 text-white/40">
                        {charity.description}
                      </p>
                    )}
                  </div>
                </div>

                <div
                  className={`mt-5 text-xs font-bold ${
                    isSelected
                      ? "text-rose-300"
                      : "text-white/25 group-hover:text-rose-300"
                  }`}
                >
                  {isSelected
                    ? "Your selected cause"
                    : "Choose this cause"}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected charity summary */}
        {selectedCharity && (
          <div className="mt-5 flex items-center gap-3 rounded-2xl border border-rose-300/15 bg-rose-300/[0.035] p-4">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-300/10 text-rose-300">
              <Heart className="h-4 w-4" />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-rose-300/60">
                Your cause
              </p>

              <p className="mt-1 text-sm font-bold">
                {selectedCharity.name}
              </p>
            </div>
          </div>
        )}
      </section>

      {/* =========================================================
          03 — CONTRIBUTION
          ========================================================= */}

      <section>
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/35">
            03 / Your impact
          </p>

          <h2 className="mt-2 text-2xl font-bold">
            Decide how much you give.
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/40">
            Choose the percentage of your membership that should
            support your selected cause.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[10, 25, 50, 75, 100].map(
            (percentage) => {
              const isSelected =
                charityPercentage ===
                percentage;

              return (
                <button
                  key={percentage}
                  type="button"
                  disabled={loading}
                  onClick={() =>
                    setCharityPercentage(
                      percentage
                    )
                  }
                  className={`rounded-2xl border px-4 py-4 text-sm font-bold transition-all duration-200 ${
                    isSelected
                      ? "border-amber-300/60 bg-amber-300/10 text-amber-200 shadow-[0_0_25px_rgba(252,211,77,0.06)]"
                      : "border-white/[0.08] bg-white/[0.02] text-white/40 hover:border-amber-300/25 hover:bg-amber-300/[0.03] hover:text-amber-200"
                  }`}
                >
                  {percentage}%
                </button>
              );
            }
          )}
        </div>
      </section>

      {/* =========================================================
          PAYMENT SUMMARY
          ========================================================= */}

      <section className="border-t border-white/[0.08] pt-8">
        {/* Error */}
        {error && (
          <div className="mb-5 rounded-2xl border border-red-400/20 bg-red-400/[0.04] p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-3xl border border-emerald-400/20 bg-gradient-to-br from-emerald-400/[0.06] via-white/[0.02] to-teal-300/[0.035]">
          <div className="grid gap-0 lg:grid-cols-[1fr_0.7fr]">
            {/* Summary */}
            <div className="p-6 md:p-8">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
                <Sparkles className="h-4 w-4" />
                Your membership
              </div>

              <h3 className="mt-5 text-3xl font-bold">
                One membership.
                <br />
                <span className="text-emerald-400">
                  More meaning.
                </span>
              </h3>

              <div className="mt-7 space-y-4">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                  <span className="text-sm text-white/40">
                    Plan
                  </span>

                  <span className="text-sm font-bold capitalize">
                    {selectedPlan?.name ??
                      plan}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                  <span className="text-sm text-white/40">
                    Membership
                  </span>

                  <span className="text-sm font-bold">
                    ₹
                    {selectedPlan?.price.toLocaleString(
                      "en-IN"
                    ) ?? "—"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/40">
                    Charity contribution
                  </span>

                  <span className="text-sm font-bold text-amber-200">
                    {charityPercentage}%
                  </span>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="border-t border-white/[0.07] bg-black/10 p-6 md:p-8 lg:border-l lg:border-t-0">
              <div className="flex h-full flex-col justify-between">
                <div>
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-400/10 text-emerald-300">
                    <Lock className="h-5 w-5" />
                  </div>

                  <p className="mt-5 text-sm font-bold">
                    Secure checkout
                  </p>

                  <p className="mt-2 text-xs leading-5 text-white/35">
                    Your payment is securely processed through
                    Razorpay.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={
                    loading ||
                    !selectedPlan
                  }
                  onClick={
                    handlePayment
                  }
                  className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-6 py-4 text-sm font-black text-[#06100b] shadow-[0_0_35px_rgba(52,211,153,0.12)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-300 hover:shadow-[0_0_45px_rgba(52,211,153,0.2)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Continue to payment
                      <Sparkles className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Trust note */}
        <div className="mt-5 flex flex-col gap-3 text-xs text-white/25 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Secure payment • Membership access • Monthly rewards
          </span>

          <span className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Join the GoodSwing community
          </span>
        </div>
      </section>
    </div>
  );
}