"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

import {
  simulateDraw,
  executeAndPublishDraw,
  DrawMethod,
} from "@/lib/draw-engine";

/**
 * --------------------------------------------------------------------------
 * ADMIN AUTHENTICATION
 * --------------------------------------------------------------------------
 *
 * Makes sure:
 * 1. A user is logged in.
 * 2. The logged-in user's profile has the "admin" role.
 *
 * All admin server actions use this function before touching admin data.
 */
async function requireAdmin() {
  const supabase = await createClient();

  // Get the currently authenticated Supabase user.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Check the user's role in our profiles table.
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error) {
    throw new Error("Unable to verify admin access.");
  }

  if (profile?.role !== "admin") {
    throw new Error("Admin access required");
  }

  return {
    supabase,
    user,
  };
}

/**
 * --------------------------------------------------------------------------
 * CREATE DRAW
 * --------------------------------------------------------------------------
 *
 * Creates a new monthly draw in "draft" status.
 *
 * Important:
 * Expected validation problems are returned as structured errors instead
 * of being thrown. This prevents the admin page from falling into a
 * Next.js error state for normal user mistakes.
 */
export async function createDraw(formData: FormData) {
  const { supabase, user } = await requireAdmin();

  // ------------------------------------------------------------------------
  // Read form values
  // ------------------------------------------------------------------------

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

  // ------------------------------------------------------------------------
  // Validation
  // ------------------------------------------------------------------------

  if (!drawMonth) {
    return {
      success: false,
      error: "Draw month is required.",
    };
  }

  if (!drawDate) {
    return {
      success: false,
      error: "Draw date is required.",
    };
  }

  if (!["random", "weighted"].includes(drawMethod)) {
    return {
      success: false,
      error: "Invalid draw method. Must be random or weighted.",
    };
  }

  if (!Number.isFinite(prizePool) || prizePool < 0) {
    return {
      success: false,
      error: "Prize pool cannot be negative.",
    };
  }

  // ------------------------------------------------------------------------
  // Convert the month into the database format.
  //
  // Example:
  // "2026-10" -> "2026-10-01"
  // ------------------------------------------------------------------------

  const drawMonthDate = `${drawMonth}-01`;

  // Parse the draw date.
  const parsedDrawDate = new Date(drawDate);

  if (Number.isNaN(parsedDrawDate.getTime())) {
    return {
      success: false,
      error: "Invalid draw date.",
    };
  }

  // ------------------------------------------------------------------------
  // Prevent duplicate monthly draws
  // ------------------------------------------------------------------------
  //
  // We only need to know whether ONE matching draw exists.
  //
  // The `.limit(1)` is important because it makes this lookup safer even
  // if the database somehow contains duplicate rows already.
  // ------------------------------------------------------------------------

  const {
    data: existingDraw,
    error: existingDrawError,
  } = await supabase
    .from("draws")
    .select("id")
    .eq("draw_month", drawMonthDate)
    .limit(1)
    .maybeSingle();

  // If Supabase itself failed while checking for the draw, return a normal
  // application error rather than allowing an unexplained crash.
  if (existingDrawError) {
    console.error(
      "Error checking for existing draw:",
      existingDrawError
    );

    return {
      success: false,
      error: "Unable to check whether a draw already exists.",
    };
  }

  // ------------------------------------------------------------------------
  // DUPLICATE DRAW
  // ------------------------------------------------------------------------
  //
  // This is an expected user error.
  //
  // DO NOT throw here.
  //
  // Returning an object allows the client-side form to show a toast instead
  // of Next.js rendering an error page.
  // ------------------------------------------------------------------------

  if (existingDraw) {
    return {
      success: false,
      error: "A draw already exists for this month.",
    };
  }

  // ------------------------------------------------------------------------
  // Automatically get previous jackpot rollover
  // ------------------------------------------------------------------------
  //
  // We look for the most recent completed draw before the current month.
  // Its jackpot_rollover_out becomes the rollover amount for this draw.
  // ------------------------------------------------------------------------

  const {
    data: previousDraw,
    error: previousDrawError,
  } = await supabase
    .from("draws")
    .select("jackpot_rollover_out")
    .eq("status", "completed")
    .lt("draw_month", drawMonthDate)
    .order("draw_month", {
      ascending: false,
    })
    .limit(1)
    .maybeSingle();

  if (previousDrawError) {
    console.error(
      "Error fetching previous draw:",
      previousDrawError
    );

    return {
      success: false,
      error: "Unable to calculate the previous jackpot rollover.",
    };
  }

  const jackpotRollover = Number(
    previousDraw?.jackpot_rollover_out ?? 0
  );

  // ------------------------------------------------------------------------
  // Create the new draft draw
  // ------------------------------------------------------------------------

  const { error } = await supabase
    .from("draws")
    .insert({
      // Example: 2026-10-01
      draw_month: drawMonthDate,

      // Actual draw date.
      draw_date: parsedDrawDate.toISOString(),

      // New draws always start as drafts.
      status: "draft",

      // random / weighted
      draw_method: drawMethod,

      // Prize pool supplied by admin.
      prize_pool: prizePool,

      // Previous month's rollover.
      jackpot_rollover: jackpotRollover,

      // New draw has not rolled anything out yet.
      jackpot_rollover_out: 0,

      // Admin who created the draw.
      created_by: user.id,
    });

  // ------------------------------------------------------------------------
  // Handle database errors
  // ------------------------------------------------------------------------

  if (error) {
    console.error("Error creating draw:", error);

    return {
      success: false,
      error: error.message || "Unable to create draw.",
    };
  }

  // ------------------------------------------------------------------------
  // Refresh pages that display draw information
  // ------------------------------------------------------------------------

  revalidatePath("/admin");
  revalidatePath("/admin/draws");
  revalidatePath("/dashboard");

  // ------------------------------------------------------------------------
  // Success response
  // ------------------------------------------------------------------------

  return {
    success: true,
    message: "Draw created successfully.",
  };
}

/**
 * --------------------------------------------------------------------------
 * UPDATE DRAW STATUS
 * --------------------------------------------------------------------------
 *
 * Changes a draw between:
 *
 * draft -> open -> closed -> completed
 *
 * Completed draws cannot be modified.
 */
export async function updateDrawStatus(
  drawId: string,
  status: string
) {
  const { supabase } = await requireAdmin();

  // Only these statuses are allowed.
  const allowedStatuses = [
    "draft",
    "open",
    "closed",
    "completed",
  ];

  if (!allowedStatuses.includes(status)) {
    return {
      success: false,
      error: "Invalid draw status.",
    };
  }

  // ------------------------------------------------------------------------
  // Check existing draw
  // ------------------------------------------------------------------------

  const {
    data: existingDraw,
    error: existingDrawError,
  } = await supabase
    .from("draws")
    .select("status")
    .eq("id", drawId)
    .single();

  if (existingDrawError || !existingDraw) {
    return {
      success: false,
      error: "Draw not found.",
    };
  }

  // ------------------------------------------------------------------------
  // Completed draws are locked.
  // ------------------------------------------------------------------------

  if (
    existingDraw.status === "completed" &&
    status !== "completed"
  ) {
    return {
      success: false,
      error: "Completed draws cannot be modified.",
    };
  }

  // ------------------------------------------------------------------------
  // Update status
  // ------------------------------------------------------------------------

  const { error } = await supabase
    .from("draws")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", drawId);

  if (error) {
    console.error("Error updating draw status:", error);

    return {
      success: false,
      error: error.message || "Unable to update draw status.",
    };
  }

  // ------------------------------------------------------------------------
  // Revalidate affected pages
  // ------------------------------------------------------------------------

  revalidatePath("/admin");
  revalidatePath("/admin/draws");
  revalidatePath("/dashboard");

  return {
    success: true,
    message: "Draw status updated successfully.",
  };
}

/**
 * --------------------------------------------------------------------------
 * RUN DRAW SIMULATION
 * --------------------------------------------------------------------------
 *
 * Simulates a draw without publishing the final result.
 */
export async function runSimulation(
  drawId: string,
  method?: DrawMethod
) {
  // Make sure only an admin can run simulations.
  await requireAdmin();

  // The draw engine handles the actual simulation logic.
  return simulateDraw(drawId, method);
}

/**
 * --------------------------------------------------------------------------
 * PUBLISH DRAW
 * --------------------------------------------------------------------------
 *
 * Executes the final draw and publishes the winners.
 */
export async function publishDraw(
  drawId: string,
  method: DrawMethod,
  numbers: [
    number,
    number,
    number,
    number,
    number
  ]
) {
  // Make sure only an admin can publish a draw.
  await requireAdmin();

  // Execute the draw through the draw engine.
  const result = await executeAndPublishDraw(
    drawId,
    method,
    numbers
  );

  // Refresh all pages affected by the published draw.
  revalidatePath("/admin");
  revalidatePath("/admin/draws");
  revalidatePath("/admin/winners");
  revalidatePath("/dashboard");

  return result;
}