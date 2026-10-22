import { NextResponse } from "next/server";
import crypto from "crypto";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { razorpay } from "@/lib/razorpay";

const PLANS = {
  monthly: {
    amount: 49900,
    days: 31,
  },
  yearly: {
    amount: 499000,
    days: 365,
  },
} as const;

export async function POST(request: Request) {
  try {
    // ---------------------------------------------------------
    // 1. Authenticate user
    // ---------------------------------------------------------

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    // ---------------------------------------------------------
    // 2. Read request
    // ---------------------------------------------------------

    const body = await request.json();

    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      plan,
      charityId,
      charityPercentage,
    } = body;

    if (
      !razorpay_payment_id ||
      !razorpay_order_id ||
      !razorpay_signature
    ) {
      return NextResponse.json(
        { error: "Missing payment verification data." },
        { status: 400 }
      );
    }

    if (!(plan in PLANS)) {
      return NextResponse.json(
        { error: "Invalid subscription plan." },
        { status: 400 }
      );
    }

    const selectedPlan =
      PLANS[plan as keyof typeof PLANS];

    // ---------------------------------------------------------
    // 3. Validate charity percentage
    // ---------------------------------------------------------

    const percentage = Number(charityPercentage);

    if (
      !Number.isInteger(percentage) ||
      percentage < 10 ||
      percentage > 100
    ) {
      return NextResponse.json(
        {
          error:
            "Charity percentage must be between 10% and 100%.",
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // 4. Verify Razorpay signature
    // ---------------------------------------------------------

    const secret = process.env.RAZORPAY_KEY_SECRET;

    if (!secret) {
      throw new Error("RAZORPAY_KEY_SECRET is not configured.");
    }

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(
        `${razorpay_order_id}|${razorpay_payment_id}`
      )
      .digest("hex");

    if (
      expectedSignature.length !==
      razorpay_signature.length ||
      !crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(razorpay_signature)
      )
    ) {
      return NextResponse.json(
        { error: "Invalid payment signature." },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // 5. Fetch order directly from Razorpay
    // ---------------------------------------------------------

    const order = await razorpay.orders.fetch(
      razorpay_order_id
    );

    if (
      Number(order.amount) !== selectedPlan.amount ||
      order.currency !== "INR"
    ) {
      return NextResponse.json(
        {
          error:
            "Payment amount does not match the selected plan.",
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // 6. Make sure this order belongs to this user
    // ---------------------------------------------------------

    if (order.notes?.user_id !== user.id) {
      return NextResponse.json(
        {
          error:
            "Payment order does not belong to this user.",
        },
        { status: 403 }
      );
    }

    // ---------------------------------------------------------
    // 7. Verify charity
    // ---------------------------------------------------------

    const { data: charity, error: charityError } =
      await supabase
        .from("charities")
        .select("id, name")
        .eq("id", charityId)
        .eq("active", true)
        .single();

    if (charityError || !charity) {
      return NextResponse.json(
        {
          error:
            "Selected charity is no longer available.",
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // 8. Check duplicate payment
    // ---------------------------------------------------------

    const admin = createAdminClient();

    const { data: existingPayment } = await admin
      .from("payments")
      .select("id")
      .eq(
        "provider_payment_id",
        razorpay_payment_id
      )
      .maybeSingle();

    if (existingPayment) {
      return NextResponse.json({
        success: true,
        alreadyProcessed: true,
      });
    }

    // ---------------------------------------------------------
    // 9. Calculate charity amount
    // ---------------------------------------------------------

    const charityAmountPaise = Math.floor(
      (selectedPlan.amount * percentage) / 100
    );

    // Example:
    // ₹4,990 × 35% = ₹1,746.50
    //
    // Razorpay still charges ₹4,990.
    // Charity allocation is calculated separately.

    // ---------------------------------------------------------
    // 10. Calculate subscription period
    // ---------------------------------------------------------

    const now = new Date();

    const periodEnd = new Date(now);

    if (plan === "monthly") {
      periodEnd.setMonth(
        periodEnd.getMonth() + 1
      );
    } else {
      periodEnd.setFullYear(
        periodEnd.getFullYear() + 1
      );
    }

    // ---------------------------------------------------------
    // 11. Create/update subscription
    // ---------------------------------------------------------

    const { data: subscription, error: subscriptionError } =
      await admin
        .from("subscriptions")
        .upsert(
          {
            user_id: user.id,
            plan,
            status: "active",
            amount: selectedPlan.amount / 100,
            charity_id: charityId,
            charity_percentage: percentage,
            current_period_start: now.toISOString(),
            current_period_end: periodEnd.toISOString(),
            stripe_customer_id: null,
            stripe_subscription_id: null,
          },
          {
            onConflict: "user_id",
          }
        )
        .select("id")
        .single();

    if (subscriptionError || !subscription) {
      console.error(
        "Subscription creation failed:",
        subscriptionError
      );

      return NextResponse.json(
        {
          error:
            "Payment succeeded but subscription creation failed.",
        },
        { status: 500 }
      );
    }

    // ---------------------------------------------------------
    // 12. Record payment
    // ---------------------------------------------------------

    const { error: paymentError } =
      await admin.from("payments").insert({
        user_id: user.id,
        subscription_id: subscription.id,
        provider_payment_id: razorpay_payment_id,
        provider_order_id: razorpay_order_id,
        payment_provider: "razorpay",
        plan_id: plan,
        amount_paise: selectedPlan.amount,
        charity_id: charityId,
        charity_pct: percentage,
        charity_amount_paise: charityAmountPaise,
        paid_at: now.toISOString(),
      });

    if (paymentError) {
      console.error(
        "Payment record creation failed:",
        paymentError
      );

      return NextResponse.json(
        {
          error:
            "Payment succeeded but payment record failed.",
        },
        { status: 500 }
      );
    }

    // ---------------------------------------------------------
    // 13. Success
    // ---------------------------------------------------------

    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
      plan,
      amount: selectedPlan.amount,
      charityPercentage: percentage,
      charityAmountPaise,
    });
  } catch (error) {
    console.error(
      "Razorpay verification failed:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to verify payment.",
      },
      { status: 500 }
    );
  }
}