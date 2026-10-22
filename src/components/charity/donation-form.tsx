"use client";

import { useState } from "react";

type DonationFormProps = {
  charityId: string;
  charityName: string;
};

export function DonationForm({
  charityId,
  charityName,
}: DonationFormProps) {
  // Default donation amount.
  const [amount, setAmount] = useState(500);

  // Tracks whether the Razorpay checkout process is running.
  const [loading, setLoading] = useState(false);

  // Stores any error or success message displayed to the user.
  const [error, setError] = useState("");

  /**
   * Creates a Razorpay order and opens the Razorpay checkout.
   */
  async function donate() {
    setError("");
    setLoading(true);

    try {
      // Create a donation order on the server.
      const response = await fetch("/api/razorpay/donation/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          charityId,
          amount,
        }),
      });

      const data = await response.json();

      // Stop if the server could not create the order.
      if (!response.ok) {
        throw new Error(data.error);
      }

      // Razorpay's checkout script is loaded dynamically so it
      // does not need to be included globally in the application.
      if (!(window as any).Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");

          script.src = "https://checkout.razorpay.com/v1/checkout.js";

          script.onload = () => resolve();
          script.onerror = () =>
            reject(new Error("Unable to load Razorpay checkout."));

          document.body.appendChild(script);
        });
      }

      // Open the Razorpay payment modal.
      new (window as any).Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: "INR",
        name: "GoodSwing",
        description: `Donation to ${charityName}`,
        order_id: data.orderId,

        // Called by Razorpay after the payment is completed.
        handler: async (paymentResponse: any) => {
          // Send the Razorpay response to the server so that
          // the payment can be verified securely.
          const verifyResponse = await fetch(
            "/api/razorpay/donation/verify",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(paymentResponse),
            }
          );

          const verifyData = await verifyResponse.json();

          // Payment verification failed.
          if (!verifyResponse.ok) {
            throw new Error(verifyData.error);
          }

          // Payment was successfully verified.
          setError(
            "Donation received. Thank you for playing with purpose."
          );

          setLoading(false);
        },
      }).open();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Donation failed"
      );

      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border bg-card p-6">
      {/* Donation heading */}
      <p className="text-sm text-muted-foreground">
        Independent donation
      </p>

      <h2 className="mt-1 text-2xl font-semibold">
        Give directly to this cause.
      </h2>

      {/* Preset donation amounts */}
      <div className="mt-5 flex flex-wrap gap-2">
        {[250, 500, 1000, 2500].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setAmount(value)}
            className={`rounded-full border px-4 py-2 text-sm ${
              amount === value
                ? "bg-foreground text-background"
                : ""
            }`}
          >
            ₹{value.toLocaleString("en-IN")}
          </button>
        ))}
      </div>

      {/* Custom amount and donation button */}
      <div className="mt-4 flex gap-3">
        <input
          type="number"
          min="1"
          value={amount}
          onChange={(event) =>
            setAmount(Number(event.target.value))
          }
          className="w-full rounded-xl border bg-transparent px-4 py-3"
        />

        <button
          type="button"
          disabled={loading || amount < 1}
          onClick={donate}
          className="rounded-xl bg-[#087f4e] px-5 py-3 font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Opening…" : "Donate"}
        </button>
      </div>

      {/* Error or success message */}
      {error && (
        <p className="mt-3 text-sm text-muted-foreground">
          {error}
        </p>
      )}
    </div>
  );
}