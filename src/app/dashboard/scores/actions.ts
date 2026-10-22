"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addScore(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const score = Number(formData.get("score"));
  const playedAt = String(formData.get("playedAt"));

  if (
    !Number.isInteger(score) ||
    score < 1 ||
    score > 45 ||
    !playedAt
  ) {
    throw new Error("Invalid score data");
  }

  const { error } = await supabase.from("scores").insert({
    user_id: user.id,
    score,
    played_at: playedAt,
  });

  if (error) {
    if (error.code === "23505") {
      throw new Error(
        "You already have a score recorded for this date."
      );
    }

    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/scores");
}


export async function updateScore(
  id: string,
  formData: FormData
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const score = Number(formData.get("score"));
  const playedAt = String(formData.get("playedAt"));

  if (
    !Number.isInteger(score) ||
    score < 1 ||
    score > 45 ||
    !playedAt
  ) {
    throw new Error("Invalid score data");
  }

  const { error } = await supabase
    .from("scores")
    .update({
      score,
      played_at: playedAt,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    if (error.code === "23505") {
      throw new Error(
        "You already have a score recorded for this date."
      );
    }

    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/scores");
}


export async function deleteScore(id: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase
    .from("scores")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/scores");
}