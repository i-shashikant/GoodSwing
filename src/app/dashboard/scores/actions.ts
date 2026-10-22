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
  const playedAt = String(formData.get("playedAt") ?? "").trim();

  if (
    !Number.isInteger(score) ||
    score < 1 ||
    score > 45 ||
    !playedAt
  ) {
    throw new Error("Please enter a valid Stableford score (1–45) and date.");
  }

  // Check if date is in future
  const playedDate = new Date(`${playedAt}T00:00:00`);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (playedDate > today) {
    throw new Error("Score date cannot be in the future.");
  }

  // Insert the new score
  const { error: insertError } = await supabase.from("scores").insert({
    user_id: user.id,
    score,
    played_at: playedAt,
  });

  if (insertError) {
    if (insertError.code === "23505") {
      throw new Error(
        "A score for this date already exists. Duplicate scores for the same date are not allowed — please edit or delete the existing round."
      );
    }
    throw new Error(insertError.message);
  }

  // PRD § 05: "Only the latest 5 scores are retained at any time. A new score replaces the oldest stored score automatically."
  const { data: allScores } = await supabase
    .from("scores")
    .select("id, played_at")
    .eq("user_id", user.id)
    .order("played_at", { ascending: false });

  if (allScores && allScores.length > 5) {
    const idsToDelete = allScores.slice(5).map((item) => item.id);
    if (idsToDelete.length > 0) {
      await supabase.from("scores").delete().in("id", idsToDelete);
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/scores");
}

export async function updateScore(id: string, formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const score = Number(formData.get("score"));
  const playedAt = String(formData.get("playedAt") ?? "").trim();

  if (
    !Number.isInteger(score) ||
    score < 1 ||
    score > 45 ||
    !playedAt
  ) {
    throw new Error("Please enter a valid Stableford score (1–45) and date.");
  }

  const playedDate = new Date(`${playedAt}T00:00:00`);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (playedDate > today) {
    throw new Error("Score date cannot be in the future.");
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
        "Another round is already recorded for this date. Duplicate scores for the same date are not allowed."
      );
    }
    throw new Error(error.message);
  }

  // Keep top 5 latest in case date update shifts order
  const { data: allScores } = await supabase
    .from("scores")
    .select("id, played_at")
    .eq("user_id", user.id)
    .order("played_at", { ascending: false });

  if (allScores && allScores.length > 5) {
    const idsToDelete = allScores.slice(5).map((item) => item.id);
    if (idsToDelete.length > 0) {
      await supabase.from("scores").delete().in("id", idsToDelete);
    }
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