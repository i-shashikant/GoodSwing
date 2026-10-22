import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
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
    const supabase =
      await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          error:
            "You must be logged in.",
        },
        { status: 401 }
      );
    }

    const body =
      await request.json();

    const plan =
      body.plan as keyof typeof PLANS;

    const charityId =
      String(body.charityId || "");

    const charityPercentage =
      Number(
        body.charityPercentage
      );

    if (!PLANS[plan]) {
      return NextResponse.json(
        {
          error:
            "Invalid subscription plan.",
        },
        { status: 400 }
      );
    }

    if (!charityId) {
      return NextResponse.json(
        {
          error:
            "Please select a charity.",
        },
        { status: 400 }
      );
    }

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
        { status: 400 }
      );
    }

    const {
      data: charity,
      error: charityError,
    } = await supabase
      .from("charities")
      .select("id, name")
      .eq("id", charityId)
      .eq("active", true)
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
        { status: 400 }
      );
    }

    const selectedPlan =
      PLANS[plan];

    const order =
      await razorpay.orders.create({
        amount:
          selectedPlan.amount,

        currency: "INR",

        receipt:
          `gs_${user.id.slice(
            0,
            8
          )}_${Date.now()}`,

        notes: {
          user_id: user.id,

          plan,

          charity_id:
            charity.id,

          charity_percentage:
            String(
              charityPercentage
            ),
        },
      });

    return NextResponse.json({
      orderId: order.id,

      amount:
        selectedPlan.amount,

      currency: "INR",

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
      { status: 500 }
    );
  }
}