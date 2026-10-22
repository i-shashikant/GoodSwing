"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Update a user's role.
 *
 * Allowed roles:
 * - subscriber
 * - admin
 */
export async function setUserRole(formData: FormData) {
  // Ensure that only an authenticated admin can perform this action.
  await requireAdmin();

  // Extract values submitted through the form.
  const id = String(formData.get("userId") || "");
  const role = String(formData.get("role") || "");

  // Validate the user ID and requested role.
  if (!id || !["subscriber", "admin"].includes(role)) {
    throw new Error("Invalid user update");
  }

  // Use the Supabase admin client because this operation
  // modifies another user's account data.
  const admin = createAdminClient();

  // Update the user's role in the profiles table.
  const { error } = await admin
    .from("profiles")
    .update({ role })
    .eq("id", id);

  // Surface any database error.
  if (error) {
    throw new Error(error.message);
  }

  // Revalidate admin pages so the updated role appears immediately.
  revalidatePath("/admin/users");
  revalidatePath("/admin");
}

/**
 * Update a user's subscription status.
 *
 * Allowed statuses:
 * - active
 * - expired
 */
export async function setSubscriptionStatus(formData: FormData) {
  // Ensure that only an authenticated admin can perform this action.
  await requireAdmin();

  // Extract values submitted through the form.
  const id = String(formData.get("userId") || "");
  const status = String(formData.get("status") || "");

  // Validate the user ID and requested subscription status.
  if (!id || !["active", "expired"].includes(status)) {
    throw new Error("Invalid subscription update");
  }

  // Use the Supabase admin client for this administrative update.
  const admin = createAdminClient();

  // Update the subscription belonging to the specified user.
  const { error } = await admin
    .from("subscriptions")
    .update({ status })
    .eq("user_id", id);

  // Surface any database error.
  if (error) {
    throw new Error(error.message);
  }

  // Revalidate affected pages so the new subscription status
  // is reflected throughout the admin and user dashboards.
  revalidatePath("/admin/users");
  revalidatePath("/admin");
  revalidatePath("/dashboard");
}