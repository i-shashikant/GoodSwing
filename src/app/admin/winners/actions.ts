"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Review a winner's verification status.
 *
 * Allowed statuses:
 * - approved
 * - rejected
 */
export async function reviewWinner(formData: FormData) {
  // Ensure that only an authenticated admin can review winners.
  const { user } = await requireAdmin();

  // Get the winner ID and requested review status from the form.
  const id = String(formData.get("winnerId") || "");
  const status = String(formData.get("status") || "");

  // Validate the submitted values.
  if (!id || !["approved", "rejected"].includes(status)) {
    throw new Error("Invalid winner review");
  }

  // Use the Supabase admin client for the administrative update.
  const admin = createAdminClient();

  // Update the winner's verification information.
  const { error } = await admin
    .from("winners")
    .update({
      verification_status: status,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);

  // Surface any database error.
  if (error) {
    throw new Error(error.message);
  }

  // Refresh the admin winners page and user's winnings dashboard.
  revalidatePath("/admin/winners");
  revalidatePath("/dashboard/winnings");
}

/**
 * Mark an approved winner's prize as paid.
 */
export async function markWinnerPaid(formData: FormData) {
  // Ensure that only an authenticated admin can perform this action.
  await requireAdmin();

  // Get the winner ID from the submitted form.
  const id = String(formData.get("winnerId") || "");

  // Use the Supabase admin client for the update.
  const admin = createAdminClient();

  // Mark the winner's payment as completed.
  // The verification_status condition ensures that only
  // approved winners can be marked as paid.
  const { error } = await admin
    .from("winners")
    .update({
      payment_status: "paid",
      paid_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("verification_status", "approved");

  // Surface any database error.
  if (error) {
    throw new Error(error.message);
  }

  // Refresh the relevant pages so the new payment status is visible.
  revalidatePath("/admin/winners");
  revalidatePath("/dashboard/winnings");
}