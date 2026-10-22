"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Save the logged-in user's preferred charity.
 *
 * This updates both:
 * 1. The user's charity preference.
 * 2. The charity associated with their subscription.
 */
export async function saveCharityPreference(charityId: string) {
  // Create a Supabase server client.
  const supabase = await createClient();

  // Get the currently authenticated user.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // A charity preference can only be saved by a logged-in user.
  if (!user) {
    throw new Error("You must be logged in.");
  }

  // Verify that the selected charity exists and is active.
  const {
    data: charity,
    error: charityError,
  } = await supabase
    .from("charities")
    .select("id")
    .eq("id", charityId)
    .eq("active", true)
    .single();

  // Reject invalid or unavailable charities.
  if (charityError || !charity) {
    throw new Error("This charity is not available.");
  }

  // Save or update the user's charity preference.
  //
  // The "user_id" conflict target ensures that each user
  // has a single preference record.
  const { error } = await supabase
    .from("user_charity_preferences")
    .upsert(
      {
        user_id: user.id,
        charity_id: charityId,
      },
      {
        onConflict: "user_id",
      }
    );

  // Handle preference update errors.
  if (error) {
    throw new Error(error.message);
  }

  // Update the charity associated with the user's subscription.
  const { error: subscriptionError } = await supabase
    .from("subscriptions")
    .update({
      charity_id: charityId,
    })
    .eq("user_id", user.id);

  // Handle subscription update errors.
  if (subscriptionError) {
    throw new Error(subscriptionError.message);
  }

  // Revalidate pages that display the user's charity information.
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/charity");
  revalidatePath("/dashboard/subscription");
}