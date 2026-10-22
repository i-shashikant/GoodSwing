"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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

  const [plan, setPlan] =
    useState<"monthly" | "yearly">("monthly");

  const [charityId, setCharityId] =
    useState("");

  const [charityPercentage, setCharityPercentage] =
    useState(10);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const selectedPlan =
    plans.find(
      (item) => item.id === plan
    ) ?? plans[0];

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

          amount:
            data.amount,

          currency:
            data.currency,

          name:
            "GoodSwing",

          description:
            plan === "monthly"
              ? "GoodSwing Monthly Membership"
              : "GoodSwing Yearly Membership",

          order_id:
            data.orderId,

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

                      body:
                        JSON.stringify({
                          ...paymentResponse,

                          plan,

                          charityId,

                          charityPercentage,
                        }),
                    }
                  );

                const verifyData =
                  await verifyResponse.json();

                if (
                  !verifyResponse.ok
                ) {
                  throw new Error(
                    verifyData.error ||
                      "Payment verification failed."
                  );
                }

                /*
                 * Payment has now been verified
                 * and the subscription has been
                 * created/updated on the server.
                 *
                 * Stop the loading state before
                 * navigating away.
                 */
                setLoading(false);

                /*
                 * Use Next.js navigation instead
                 * of window.location.href.
                 */
                router.push(
                  "/dashboard"
                );

                /*
                 * Refresh the server-rendered
                 * dashboard so the new subscription
                 * status is immediately visible.
                 */
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
    <div className="space-y-8">
      {/* Plans */}

      <section>
        <h2 className="text-2xl font-semibold">
          Choose your plan
        </h2>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          {plans.map(
            (item) => (
              <button
                key={item.id}
                type="button"
                disabled={
                  loading
                }
                onClick={() =>
                  setPlan(
                    item.id
                  )
                }
                className={`rounded-2xl border p-6 text-left transition ${
                  plan ===
                  item.id
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
                  {
                    item.description
                  }
                </p>
              </button>
            )
          )}
        </div>
      </section>

      {/* Charity */}

      <section>
        <h2 className="text-2xl font-semibold">
          Choose your charity
        </h2>

        <p className="mt-2 text-sm text-muted-foreground">
          Select the cause
          your contribution
          will support.
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {charities.map(
            (charity) => (
              <button
                key={
                  charity.id
                }
                type="button"
                disabled={
                  loading
                }
                onClick={() =>
                  setCharityId(
                    charity.id
                  )
                }
                className={`rounded-xl border p-5 text-left transition ${
                  charityId ===
                  charity.id
                    ? "border-foreground"
                    : "hover:border-foreground/40"
                }`}
              >
                <h3 className="font-semibold">
                  {
                    charity.name
                  }
                </h3>

                {charity.category && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {
                      charity.category
                    }
                  </p>
                )}

                {charity.description && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {
                      charity.description
                    }
                  </p>
                )}
              </button>
            )
          )}
        </div>
      </section>

      {/* Charity percentage */}

      <section>
        <h2 className="text-2xl font-semibold">
          Charity contribution
        </h2>

        <p className="mt-2 text-sm text-muted-foreground">
          Choose how much
          of your membership
          should support your
          selected charity.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          {[10, 25, 50, 75, 100].map(
            (percentage) => (
              <button
                key={
                  percentage
                }
                type="button"
                disabled={
                  loading
                }
                onClick={() =>
                  setCharityPercentage(
                    percentage
                  )
                }
                className={`rounded-full border px-5 py-2 text-sm transition ${
                  charityPercentage ===
                  percentage
                    ? "border-foreground bg-foreground text-background"
                    : "hover:border-foreground/40"
                }`}
              >
                {
                  percentage
                }
                %
              </button>
            )
          )}
        </div>
      </section>

      {/* Payment */}

      <section className="border-t pt-8">
        {error && (
          <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-4 rounded-2xl border p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Selected membership
            </p>

            <p className="mt-1 text-xl font-semibold">
              {selectedPlan?.name}
            </p>

            {selectedPlan && (
              <p className="mt-1 text-sm text-muted-foreground">
                ₹
                {selectedPlan.price.toLocaleString(
                  "en-IN"
                )}
              </p>
            )}
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