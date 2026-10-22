import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { razorpay } from "@/lib/razorpay";

export async function POST(request: Request) {
  try {
    // Create a Supabase server client.
    const supabase = await createClient();

    // Get the currently authenticated user.
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Parse the incoming JSON request body.
    const body = await request.json();

    const amount = Number(body.amount);
    const charityId = String(body.charityId || "");

    // Validate the donation amount.
    // The amount must be an integer between ₹1 and ₹1,00,000.
    if (
      !Number.isInteger(amount) ||
      amount < 1 ||
      amount > 100000
    ) {
      return NextResponse.json(
        {
          error:
            "Donation must be between ₹1 and ₹1,00,000.",
        },
        { status: 400 }
      );
    }

    // Check that the selected charity exists
    // and is currently active.
    const { data: charity } = await supabase
      .from("charities")
      .select("id,name")
      .eq("id", charityId)
      .eq("active", true)
      .single();

    // Reject the donation if the charity is unavailable.
    if (!charity) {
      return NextResponse.json(
        {
          error: "Charity is not available.",
        },
        { status: 400 }
      );
    }

    // Create a Razorpay order.
    //
    // Razorpay expects amounts in paise,
    // so ₹1 = 100 paise.
    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",

      // Generate a unique receipt identifier.
      receipt: `don_${Date.now()}`,

      // Store application-specific metadata
      // alongside the Razorpay order.
      notes: {
        user_id: user?.id || "",
        charity_id: charity.id,
      },
    });

    // Return the information required by the frontend
    // to open the Razorpay checkout.
    return NextResponse.json({
      orderId: order.id,
      amount: amount * 100,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (e) {
    // Handle unexpected server or Razorpay errors.
    return NextResponse.json(
      {
        error:
          e instanceof Error
            ? e.message
            : "Unable to create donation order.",
      },
      { status: 500 }
    );
  }
}