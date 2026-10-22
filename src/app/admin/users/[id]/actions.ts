"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

type Result = { error?: string };

export async function updateProfile(userId: string, fullName: string): Promise<Result> {
  await requireAdmin();
  const name = fullName.trim();
  if (!name) return { error: "Name is required." };

  const { error } = await createAdminClient()
    .from("profiles")
    .update({ full_name: name })
    .eq("id", userId);

  if (error) return { error: error.message };
  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/admin/users");
  return {};
}

// Insert (no scoreId) or edit (scoreId) a score. The DB trigger keeps only the latest 5.
export async function saveScore(input: {
  userId: string;
  scoreId?: string;
  score: number;
  playedAt: string;
}): Promise<Result> {
  await requireAdmin();
  const { userId, scoreId, score, playedAt } = input;

  if (!Number.isInteger(score) || score < 1 || score > 45) {
    return { error: "Score must be a whole number between 1 and 45." };
  }
  if (!playedAt || new Date(playedAt) > new Date()) {
    return { error: "Pick a valid date that is not in the future." };
  }

  const admin = createAdminClient();
  const { error } = scoreId
    ? await admin.from("scores").update({ score, played_at: playedAt }).eq("id", scoreId).eq("user_id", userId)
    : await admin.from("scores").insert({ user_id: userId, score, played_at: playedAt });

  if (error) {
    return {
      error:
        error.code === "23505"
          ? "A score already exists for that date. Edit or delete it instead."
          : error.message,
    };
  }

  revalidatePath(`/admin/users/${userId}`);
  return {};
}

export async function removeScore(userId: string, scoreId: string): Promise<Result> {
  await requireAdmin();
  const { error } = await createAdminClient()
    .from("scores")
    .delete()
    .eq("id", scoreId)
    .eq("user_id", userId);

  if (error) return { error: error.message };
  revalidatePath(`/admin/users/${userId}`);
  return {};
}

export async function setMembership(userId: string, status: "active" | "expired"): Promise<Result> {
  await requireAdmin();
  const { error } = await createAdminClient()
    .from("subscriptions")
    .update({ status })
    .eq("user_id", userId);

  if (error) return { error: error.message };
  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/admin/users");
  return {};
}