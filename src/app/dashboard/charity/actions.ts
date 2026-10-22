"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function saveCharityPreference(charityId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in.");
  }

  const { data: charity, error: charityError } = await supabase
    .from("charities")
    .select("id")
    .eq("id", charityId)
    .eq("active", true)
    .single();

  if (charityError || !charity) {
    throw new Error("This charity is not available.");
  }

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

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/charity");
}