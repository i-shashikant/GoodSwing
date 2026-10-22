"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    throw new Error("Admin access required");
  }

  return { supabase, user };
}

export async function createDraw(formData: FormData) {
  const { supabase, user } = await requireAdmin();

  const drawMonth = String(
    formData.get("draw_month") || ""
  ).trim();

  const drawDate = String(
    formData.get("draw_date") || ""
  ).trim();

  const drawMethod = String(
    formData.get("draw_method") || "random"
  ).trim();

  const prizePool = Number(
    formData.get("prize_pool") || 0
  );

  const jackpotRollover = Number(
    formData.get("jackpot_rollover") || 0
  );

  if (!drawMonth) {
    throw new Error("Draw month is required");
  }

  if (!drawDate) {
    throw new Error("Draw date is required");
  }

  if (!["random"].includes(drawMethod)) {
    throw new Error("Invalid draw method");
  }

  if (prizePool < 0 || jackpotRollover < 0) {
    throw new Error("Amounts cannot be negative");
  }

  const { data: existingDraw } = await supabase
    .from("draws")
    .select("id")
    .eq("draw_month", `${drawMonth}-01`)
    .maybeSingle();

  if (existingDraw) {
    throw new Error(
      "A draw already exists for this month."
    );
  }

  const { error } = await supabase
    .from("draws")
    .insert({
      draw_month: `${drawMonth}-01`,
      draw_date: new Date(drawDate).toISOString(),
      status: "draft",
      draw_method: drawMethod,
      prize_pool: prizePool,
      jackpot_rollover: jackpotRollover,
      created_by: user.id,
    });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/draws");
  revalidatePath("/dashboard");
}

export async function updateDrawStatus(
  drawId: string,
  status: string
) {
  const { supabase } = await requireAdmin();

  const allowedStatuses = [
    "draft",
    "open",
    "closed",
    "completed",
  ];

  if (!allowedStatuses.includes(status)) {
    throw new Error("Invalid draw status");
  }

  const { error } = await supabase
    .from("draws")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", drawId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/draws");
  revalidatePath("/dashboard");
}