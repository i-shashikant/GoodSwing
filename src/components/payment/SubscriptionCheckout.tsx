"use client";

import { useState } from "react";

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
  handler: (response: RazorpayResponse) => Promise<void> | void;
  modal?: {
    ondismiss?: () => void;
  };
};

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => { open: () => void };
  }
}

export default function SubscriptionCheckout({
  plans,
  charities,
}: Props) {
  const [plan, setPlan] =
    useState<"monthly" | "yearly">("monthly");

  const [charityId, setCharityId] = useState("");

  const [charityPercentage, setCharityPercentage] =
    useState(10);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const selectedPlan =
    plans.find((item) => item.id === plan) ?? plans[0];

  async function handlePayment() {
    setError("");

    if (!charityId) {
      setError("Please select a charity.");
      return;
    }

    if (!selectedPlan) {
      setError("Please select a membership plan.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "/api/razorpay/order",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            plan,
            charityId,
            charityPercentage,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to create payment order."
        );
      }

      if (!window.Razorpay) {
        await new Promise<void>(
          (resolve, reject) => {
            const script =
              document.createElement("script");

            script.src =
              "https://checkout.razorpay.com/v1/checkout.js";

            script.onload = () => resolve();

            script.onerror = () =>
              reject(
                new Error(
                  "Unable to load Razorpay."
                )
              );

            document.body.appendChild(script);
          }
        );
      }

      const razorpay = new window.Razorpay({
        key: data.keyId,

        amount: data.amount,

        currency: data.currency,

        name: "GoodSwing",

        description:
          plan === "monthly"
            ? "GoodSwing Monthly Membership"
            : "GoodSwing Yearly Membership",

        order_id: data.orderId,

        handler: async function (
          paymentResponse: RazorpayResponse
        ) {
          try {
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

            window.location.href =
              "/dashboard";
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
          ondismiss: function () {
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
    <div className="space-y-8">
      {/* Plans */}

      <section>
        <h2 className="text-2xl font-semibold">
          Choose your plan
        </h2>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          {plans.map((item) => (
            <button
              key={item.id}
              type="button"
              disabled={loading}
              onClick={() =>
                setPlan(item.id)
              }
              className={`rounded-2xl border p-6 text-left transition ${
                plan === item.id
                  ? "border-foreground"
                  : "hover:border-foreground/40"
              }`}
            >
              <h3 className="text-xl font-semibold">
                {item.name}
              </h3>

              <p className="mt-2 text-2xl font-semibold">
                ₹
                {item.price.toLocaleString(
                  "en-IN"
                )}
              </p>

              <p className="mt-2 text-sm text-muted-foreground">
                {item.description}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* Charity */}

      <section>
        <h2 className="text-2xl font-semibold">
          Choose your charity
        </h2>

        <p className="mt-2 text-sm text-muted-foreground">
          Select the cause your contribution
          will support.
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {charities.map((charity) => (
            <button
              key={charity.id}
              type="button"
              disabled={loading}
              onClick={() =>
                setCharityId(charity.id)
              }
              className={`rounded-xl border p-5 text-left transition ${
                charityId === charity.id
                  ? "border-foreground"
                  : "hover:border-foreground/40"
              }`}
            >
              <p className="font-semibold">
                {charity.name}
              </p>

              {charity.category && (
                <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
                  {charity.category}
                </p>
              )}

              {charity.description && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {charity.description}
                </p>
              )}
            </button>
          ))}
        </div>

        {charities.length === 0 && (
          <div className="mt-5 rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
            No active charities are available
            right now.
          </div>
        )}
      </section>

      {/* Contribution */}

      <section className="rounded-2xl border p-6">
        <div className="flex justify-between text-sm font-medium">
          <span>
            Charity contribution
          </span>

          <span>
            {charityPercentage}%
          </span>
        </div>

        <input
          type="range"
          min="10"
          max="100"
          step="1"
          value={charityPercentage}
          disabled={loading}
          onChange={(event) =>
            setCharityPercentage(
              Number(event.target.value)
            )
          }
          className="mt-4 w-full"
        />

        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <span>10%</span>
          <span>100%</span>
        </div>
      </section>

      {/* Error */}

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-300 p-4 text-sm"
        >
          {error}
        </div>
      )}

      {/* Payment */}

      <section className="rounded-2xl border p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold">
              Ready to join GoodSwing?
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              You will pay ₹
              {selectedPlan?.price.toLocaleString(
                "en-IN"
              )}{" "}
              and allocate{" "}
              {charityPercentage}% of your
              membership amount to your selected
              charity.
            </p>
          </div>

          <button
            type="button"
            onClick={handlePayment}
            disabled={
              loading ||
              charities.length === 0
            }
            className="rounded-xl bg-foreground px-6 py-3 font-medium text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Processing..."
              : "Continue to payment"}
          </button>
        </div>
      </section>
    </div>
  );
}