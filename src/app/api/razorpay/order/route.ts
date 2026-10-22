import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { razorpay } from "@/lib/razorpay";

const PLANS = {
  monthly: {
    amount: 49900,
    name: "GoodSwing Monthly",
  },

  yearly: {
    amount: 499000,
    name: "GoodSwing Yearly",
  },
} as const;

export async function POST(
  request: Request
) {
  try {
    // -----------------------------------------
    // 1. Authenticate user
    // -----------------------------------------

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

    // -----------------------------------------
    // 2. Prevent duplicate active membership
    // -----------------------------------------

    const admin =
      createAdminClient();

    const {
      data: currentSubscription,
    } = await admin
      .from("subscriptions")
      .select(
        "id, status, current_period_end"
      )
      .eq(
        "user_id",
        user.id
      )
      .maybeSingle();

    if (
      currentSubscription?.status ===
      "active"
    ) {
      const hasNotExpired =
        !currentSubscription.current_period_end ||
        new Date(
          currentSubscription.current_period_end
        ) > new Date();

      if (hasNotExpired) {
        return NextResponse.json(
          {
            error:
              "You already have an active GoodSwing membership.",
          },
          {
            status: 409,
          }
        );
      }
    }

    // -----------------------------------------
    // 3. Read request
    // -----------------------------------------

    const body =
      await request.json();

    const plan =
      body.plan as keyof typeof PLANS;

    const charityId =
      String(
        body.charityId || ""
      );

    const charityPercentage =
      Number(
        body.charityPercentage
      );

    // -----------------------------------------
    // 4. Validate plan
    // -----------------------------------------

    if (!PLANS[plan]) {
      return NextResponse.json(
        {
          error:
            "Invalid subscription plan.",
        },
        {
          status: 400,
        }
      );
    }

    // -----------------------------------------
    // 5. Validate charity
    // -----------------------------------------

    if (!charityId) {
      return NextResponse.json(
        {
          error:
            "Please select a charity.",
        },
        {
          status: 400,
        }
      );
    }

    // -----------------------------------------
    // 6. Validate charity percentage
    // -----------------------------------------

    if (
      !Number.isInteger(
        charityPercentage
      ) ||
      charityPercentage < 10 ||
      charityPercentage > 100
    ) {
      return NextResponse.json(
        {
          error:
            "Charity percentage must be between 10% and 100%.",
        },
        {
          status: 400,
        }
      );
    }

    // -----------------------------------------
    // 7. Validate charity exists
    // -----------------------------------------

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
            "Selected charity is not available.",
        },
        {
          status: 400,
        }
      );
    }

    // -----------------------------------------
    // 8. Create Razorpay order
    // -----------------------------------------

    const selectedPlan =
      PLANS[plan];

    const order =
      await razorpay.orders.create({
        amount:
          selectedPlan.amount,

        currency:
          "INR",

        receipt:
          `gs_${user.id.slice(
            0,
            8
          )}_${Date.now()}`,

        notes: {
          user_id:
            user.id,

          plan,

          charity_id:
            charity.id,

          charity_percentage:
            String(
              charityPercentage
            ),
        },
      });

    // -----------------------------------------
    // 9. Return checkout data
    // -----------------------------------------

    return NextResponse.json({
      orderId:
        order.id,

      amount:
        selectedPlan.amount,

      currency:
        "INR",

      keyId:
        process.env
          .RAZORPAY_KEY_ID,

      plan,

      charity:
        charity.name,

      charityPercentage,
    });
  } catch (error) {
    console.error(
      "Razorpay order creation failed:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to create payment order.",
      },
      {
        status: 500,
      }
    );
  }
}