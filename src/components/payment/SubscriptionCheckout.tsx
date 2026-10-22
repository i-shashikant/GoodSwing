"use client";

import { useState } from "react";

type Charity = {
  id: string;
  name: string;
};

type Props = {
  charities: Charity[];
};

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function SubscriptionCheckout({ charities }: Props) {
  const [plan, setPlan] = useState<"monthly" | "yearly">("monthly");
  const [charityId, setCharityId] = useState("");
  const [charityPercentage, setCharityPercentage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handlePayment() {
    setError("");

    if (!charityId) {
      setError("Please select a charity.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan,
          charityId,
          charityPercentage,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to create payment order.");
      }

      // Load Razorpay checkout script if it isn't already loaded.
      if (!window.Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");

          script.src = "https://checkout.razorpay.com/v1/checkout.js";

          script.onload = () => resolve();
          script.onerror = () =>
            reject(new Error("Unable to load Razorpay."));

          document.body.appendChild(script);
        });
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

        handler: async function (paymentResponse: any) {
          try {
            const verifyResponse = await fetch(
              "/api/payments/verify",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  ...paymentResponse,
                  plan,
                  charityId,
                  charityPercentage,
                }),
              }
            );

            const verifyData = await verifyResponse.json();

            if (!verifyResponse.ok) {
              throw new Error(
                verifyData.error || "Payment verification failed."
              );
            }

            window.location.href = "/dashboard";
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
      {/* Plan */}
      <section>
        <h2 className="text-2xl font-semibold">
          Choose your plan
        </h2>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <button
            type="button"
            onClick={() => setPlan("monthly")}
            className={`rounded-2xl border p-6 text-left ${
              plan === "monthly"
                ? "border-foreground"
                : ""
            }`}
          >
            <h3 className="text-xl font-semibold">
              Monthly
            </h3>

            <p className="mt-2 text-2xl font-semibold">
              ₹499
            </p>

            <p className="mt-2 text-sm text-muted-foreground">
              Flexible month-to-month access.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setPlan("yearly")}
            className={`rounded-2xl border p-6 text-left ${
              plan === "yearly"
                ? "border-foreground"
                : ""
            }`}
          >
            <h3 className="text-xl font-semibold">
              Yearly
            </h3>

            <p className="mt-2 text-2xl font-semibold">
              ₹4,990
            </p>

            <p className="mt-2 text-sm text-muted-foreground">
              Best value for long-term members.
            </p>
          </button>
        </div>
      </section>

      {/* Charity */}
      <section>
        <h2 className="text-2xl font-semibold">
          Choose your charity
        </h2>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {charities.map((charity) => (
            <button
              key={charity.id}
              type="button"
              onClick={() => setCharityId(charity.id)}
              className={`rounded-xl border p-5 text-left ${
                charityId === charity.id
                  ? "border-foreground"
                  : ""
              }`}
            >
              <p className="font-semibold">
                {charity.name}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* Percentage */}
      <section className="rounded-2xl border p-6">
        <div className="flex justify-between text-sm font-medium">
          <span>Charity contribution</span>
          <span>{charityPercentage}%</span>
        </div>

        <input
          type="range"
          min="10"
          max="100"
          value={charityPercentage}
          onChange={(e) =>
            setCharityPercentage(Number(e.target.value))
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
        <div className="rounded-xl border border-red-300 p-4 text-sm">
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
              {plan === "monthly" ? "499" : "4,990"}{" "}
              through Razorpay test mode.
            </p>
          </div>

          <button
            type="button"
            onClick={handlePayment}
            disabled={loading}
            className="rounded-xl bg-foreground px-6 py-3 font-medium text-background disabled:opacity-50"
          >
            {loading
              ? "Opening payment..."
              : "Continue to payment"}
          </button>
        </div>
      </section>
    </div>
  );
}