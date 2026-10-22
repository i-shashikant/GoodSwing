"use client";

import Script from "next/script";
import { useState } from "react";

type Plan = "monthly" | "yearly";

type Props = {
  plan: Plan;
  charityId: string;
  charityPercentage: number;
};

type RazorpayInstance = {
  open: () => void;
};

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

export default function RazorpayCheckout({
  plan,
  charityId,
  charityPercentage,
}: Props) {
  const [loading, setLoading] = useState(false);

  async function handlePayment() {
    if (!charityId) {
      alert("Please select a charity first.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/razorpay/order", {
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
        throw new Error(data.error || "Unable to create payment.");
      }

      if (!window.Razorpay) {
        throw new Error("Razorpay checkout has not loaded yet.");
      }

      const checkout = new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "GoodSwing",
        description:
          plan === "monthly"
            ? "GoodSwing Monthly Membership"
            : "GoodSwing Yearly Membership",
        order_id: data.orderId,

        handler: async (paymentResponse: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const verifyResponse = await fetch(
              "/api/razorpay/verify",
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

            const result = await verifyResponse.json();

            if (!verifyResponse.ok) {
              throw new Error(
                result.error || "Payment verification failed."
              );
            }

            window.location.href = "/dashboard";
          } catch (error) {
            console.error(error);

            alert(
              error instanceof Error
                ? error.message
                : "Payment verification failed."
            );

            setLoading(false);
          }
        },

        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
      });

      checkout.open();
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Unable to start payment."
      );

      setLoading(false);
    }
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
      />

      <button
        type="button"
        onClick={handlePayment}
        disabled={loading || !charityId}
        className="rounded-xl bg-foreground px-6 py-3 font-medium text-background transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Opening checkout..." : "Continue to payment"}
      </button>
    </>
  );
}