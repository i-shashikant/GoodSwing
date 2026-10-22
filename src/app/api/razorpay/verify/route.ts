import { NextResponse } from "next/server";
import crypto from "crypto";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { razorpay } from "@/lib/razorpay";

const PLANS = {
  monthly: {
    amount: 49900,
  },

  yearly: {
    amount: 499000,
  },
} as const;

export async function POST(
  request: Request
) {
  try {
    // ========================================================
    // 1. Authenticate
    // ========================================================

    const supabase =
      await createClient();

    const {
      data: { user },
    } =
      await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          error:
            "You must be logged in.",
        },
        {
          status: 401,
        }
      );
    }

    // ========================================================
    // 2. Read Razorpay response
    // ========================================================

    const body =
      await request.json();

    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
    } = body;

    if (
      !razorpay_payment_id ||
      !razorpay_order_id ||
      !razorpay_signature
    ) {
      return NextResponse.json(
        {
          error:
            "Missing payment verification data.",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================================
    // 3. Verify Razorpay signature
    // ========================================================

    const secret =
      process.env
        .RAZORPAY_KEY_SECRET;

    if (!secret) {
      throw new Error(
        "RAZORPAY_KEY_SECRET is not configured."
      );
    }

    const expectedSignature =
      crypto
        .createHmac(
          "sha256",
          secret
        )
        .update(
          `${razorpay_order_id}|${razorpay_payment_id}`
        )
        .digest("hex");

    const providedBuffer =
      Buffer.from(
        razorpay_signature
      );

    const expectedBuffer =
      Buffer.from(
        expectedSignature
      );

    if (
      providedBuffer.length !==
        expectedBuffer.length ||
      !crypto.timingSafeEqual(
        providedBuffer,
        expectedBuffer
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid payment signature.",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================================
    // 4. Fetch order from Razorpay
    // ========================================================

    const order =
      await razorpay.orders.fetch(
        razorpay_order_id
      );

    const orderPlan =
      order.notes?.plan as
        | keyof typeof PLANS
        | undefined;

    const charityId =
      order.notes?.charity_id;

    const percentage =
      Number(
        order.notes
          ?.charity_percentage
      );

    if (
      !orderPlan ||
      !PLANS[orderPlan]
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid payment order metadata.",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================================
    // 5. Validate amount and currency
    // ========================================================

    const selectedPlan =
      PLANS[orderPlan];

    if (
      Number(order.amount) !==
        selectedPlan.amount ||
      order.currency !==
        "INR"
    ) {
      return NextResponse.json(
        {
          error:
            "Payment amount does not match the selected plan.",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================================
    // 6. Verify order ownership
    // ========================================================

    if (
      order.notes?.user_id !==
      user.id
    ) {
      return NextResponse.json(
        {
          error:
            "Payment order does not belong to this user.",
        },
        {
          status: 403,
        }
      );
    }

    // ========================================================
    // 7. Validate charity allocation
    // ========================================================

    if (
      !charityId ||
      !Number.isInteger(
        percentage
      ) ||
      percentage < 10 ||
      percentage > 100
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid charity allocation.",
        },
        {
          status: 400,
        }
      );
    }

    const {
      data: charity,
      error: charityError,
    } =
      await supabase
        .from("charities")
        .select(
          "id, name"
        )
        .eq(
          "id",
          charityId
        )
        .eq(
          "active",
          true
        )
        .single();

    if (
      charityError ||
      !charity
    ) {
      return NextResponse.json(
        {
          error:
            "Selected charity is no longer available.",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================================
    // 8. Admin client
    // ========================================================

    const admin =
      createAdminClient();

    // ========================================================
    // 9. Payment idempotency
    // ========================================================

    const {
      data: existingPayment,
      error:
        existingPaymentError,
    } =
      await admin
        .from("payments")
        .select("id")
        .eq(
          "provider_payment_id",
          razorpay_payment_id
        )
        .maybeSingle();

    if (
      existingPaymentError
    ) {
      throw new Error(
        existingPaymentError.message
      );
    }

    if (existingPayment) {
      return NextResponse.json({
        success: true,
        alreadyProcessed:
          true,
      });
    }

    // ========================================================
    // 10. Calculate charity allocation
    // ========================================================

    const charityAmountPaise =
      Math.floor(
        (selectedPlan.amount *
          percentage) /
          100
      );

    // ========================================================
    // 11. Calculate subscription period
    // ========================================================

    const now =
      new Date();

    const periodEnd =
      new Date(now);

    if (
      orderPlan ===
      "monthly"
    ) {
      periodEnd.setMonth(
        periodEnd.getMonth() +
          1
      );
    } else {
      periodEnd.setFullYear(
        periodEnd.getFullYear() +
          1
      );
    }

    // ========================================================
    // 12. Create/update subscription
    // ========================================================

    const {
      data: subscription,
      error:
        subscriptionError,
    } =
      await admin
        .from(
          "subscriptions"
        )
        .upsert(
          {
            user_id:
              user.id,

            plan:
              orderPlan,

            status:
              "active",

            amount:
              selectedPlan.amount /
              100,

            charity_id:
              charityId,

            charity_percentage:
              percentage,

            current_period_start:
              now.toISOString(),

            current_period_end:
              periodEnd.toISOString(),

            stripe_customer_id:
              null,

            stripe_subscription_id:
              null,
          },
          {
            onConflict:
              "user_id",
          }
        )
        .select("id")
        .single();

    if (
      subscriptionError ||
      !subscription
    ) {
      console.error(
        "Subscription creation failed:",
        subscriptionError
      );

      return NextResponse.json(
        {
          error:
            "Payment succeeded but subscription creation failed.",
        },
        {
          status: 500,
        }
      );
    }

    // ========================================================
    // 13. Record payment
    // ========================================================

    const {
      data: payment,
      error: paymentError,
    } =
      await admin
        .from("payments")
        .insert({
          user_id:
            user.id,

          subscription_id:
            subscription.id,

          provider_payment_id:
            razorpay_payment_id,

          provider_order_id:
            razorpay_order_id,

          payment_provider:
            "razorpay",

          plan_id:
            orderPlan,

          amount_paise:
            selectedPlan.amount,

          charity_id:
            charityId,

          charity_pct:
            percentage,

          charity_amount_paise:
            charityAmountPaise,

          paid_at:
            now.toISOString(),
        })
        .select("id")
        .single();

    if (
      paymentError ||
      !payment
    ) {
      console.error(
        "Payment record creation failed:",
        paymentError
      );

      return NextResponse.json(
        {
          error:
            "Payment succeeded but payment record failed.",
        },
        {
          status: 500,
        }
      );
    }

    // ========================================================
    // 14. Record charity contribution
    // ========================================================

    const {
      error:
        contributionError,
    } =
      await admin
        .from(
          "charity_contributions"
        )
        .insert({
          user_id:
            user.id,

          subscription_id:
            subscription.id,

          // IMPORTANT:
          // Link contribution to the actual payment.
          payment_id:
            payment.id,

          charity_id:
            charityId,

          percentage:
            percentage,

          amount_paise:
            charityAmountPaise,

          status:
            "allocated",

          allocated_at:
            now.toISOString(),
        });

    if (
      contributionError
    ) {
      console.error(
        "Charity contribution recording failed:",
        contributionError
      );

      // The Razorpay payment and subscription
      // have already succeeded.
      //
      // We return success but log the failed
      // contribution so it can be reconciled.
    }

    // ========================================================
    // 15. Return success
    // ========================================================

    return NextResponse.json({
      success: true,

      subscriptionId:
        subscription.id,

      paymentId:
        payment.id,

      plan:
        orderPlan,

      amount:
        selectedPlan.amount,

      charityId,

      charityPercentage:
        percentage,

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
      {
        status: 500,
      }
    );
  }
}