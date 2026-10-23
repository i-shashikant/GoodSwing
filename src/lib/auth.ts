import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

/**
 * ---------------------------------------------------------------------------
 * GoodSwing Authentication Helpers
 * ---------------------------------------------------------------------------
 *
 * This file contains the server-side authentication and authorization
 * helpers used throughout the application.
 *
 * There are three different concepts here:
 *
 * 1. Supabase user
 *    - Comes from Supabase Auth.
 *    - Contains authentication information such as id/email.
 *
 * 2. GoodSwing profile
 *    - Comes from our `profiles` table.
 *    - Contains application-specific information such as full_name and role.
 *
 * 3. Subscription
 *    - Comes from our `subscriptions` table.
 *    - Determines whether a member currently has an active membership.
 *
 * IMPORTANT PERFORMANCE NOTE
 * ---------------------------
 *
 * These helpers use React's `cache()` so that repeated calls to the same
 * helper during a single server render can be deduplicated.
 *
 * For example, if both:
 *
 *   requireUser()
 *
 * and
 *
 *   getProfile()
 *
 * need the current user, React can reuse the result of getCurrentUser()
 * instead of unnecessarily performing the same work again.
 *
 * We are deliberately keeping these helpers server-only.
 * Authentication and authorization should NOT be moved into client-side
 * JavaScript.
 */

/**
 * ---------------------------------------------------------------------------
 * Get the currently authenticated Supabase user
 * ---------------------------------------------------------------------------
 *
 * `getUser()` validates the user's session with Supabase Auth.
 *
 * `cache()` prevents repeated calls to this helper from creating duplicate
 * work during the same React server render.
 *
 * Returns:
 * - User object when authenticated
 * - null when no authenticated user exists
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
});

/**
 * ---------------------------------------------------------------------------
 * Get the GoodSwing profile
 * ---------------------------------------------------------------------------
 *
 * The profile is associated with the authenticated Supabase user's ID.
 *
 * We only select the fields that the application actually needs.
 * Avoiding `select("*")` keeps the response smaller and makes the query
 * more explicit.
 */
export const getProfile = cache(async () => {
  const user = await getCurrentUser();

  /**
   * No authenticated user means there cannot be a corresponding
   * GoodSwing profile for the current request.
   */
  if (!user) {
    return null;
  }

  const supabase = await createClient();

  const {
    data,
    error,
  } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, created_at")
    .eq("id", user.id)
    .single();

  /**
   * We don't expose database errors from this helper.
   *
   * Returning null allows pages to safely handle a missing profile.
   */
  if (error) {
    return null;
  }

  return data;
});

/**
 * ---------------------------------------------------------------------------
 * Get the current user's subscription
 * ---------------------------------------------------------------------------
 *
 * Only one subscription row is expected per user.
 *
 * Again, we explicitly select the fields required by GoodSwing instead of
 * fetching the complete database row.
 */
export const getSubscription = cache(async () => {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const supabase = await createClient();

  const {
    data,
    error,
  } = await supabase
    .from("subscriptions")
    .select(
      `
      id,
      user_id,
      plan,
      status,
      amount,
      charity_id,
      charity_percentage,
      stripe_customer_id,
      stripe_subscription_id,
      current_period_start,
      current_period_end
      `
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return null;
  }

  return data;
});

/**
 * ---------------------------------------------------------------------------
 * Check whether the current user's subscription is active
 * ---------------------------------------------------------------------------
 *
 * Previously this function was called separately from getSubscription()
 * by pages that ALSO needed the subscription object.
 *
 * Because getSubscription() is already cached, the database query can be
 * deduplicated during the same render, but we can still make the helper
 * itself very small and predictable.
 *
 * IMPORTANT:
 * This function does NOT perform a separate database query.
 * It reuses getSubscription().
 */
export const hasActiveSubscription = cache(async () => {
  const subscription = await getSubscription();

  /**
   * No subscription = inactive.
   */
  if (!subscription) {
    return false;
  }

  /**
   * The database status must explicitly be active.
   */
  if (subscription.status !== "active") {
    return false;
  }

  /**
   * If there is no expiration date, the active subscription is treated
   * as currently valid.
   */
  if (!subscription.current_period_end) {
    return true;
  }

  /**
   * Compare the subscription expiration against the current time.
   */
  return new Date(subscription.current_period_end) > new Date();
});

/**
 * ---------------------------------------------------------------------------
 * Require an authenticated user
 * ---------------------------------------------------------------------------
 *
 * Use this helper on pages/routes that require login.
 *
 * If the visitor is not authenticated, they are redirected to /login.
 *
 * Because getCurrentUser() is cached, calling requireUser() from multiple
 * server components in the same render does not necessarily mean multiple
 * independent getCurrentUser() operations.
 */
export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

/**
 * ---------------------------------------------------------------------------
 * Require an administrator
 * ---------------------------------------------------------------------------
 *
 * Admin authorization is intentionally performed here rather than inside
 * the global proxy.
 *
 * This is important for both security and performance:
 *
 * - proxy.ts handles session/protected-route concerns.
 * - requireAdmin() handles application-level authorization.
 *
 * The profile lookup is cached through getProfile().
 */
export async function requireAdmin() {
  const user = await requireUser();

  const profile = await getProfile();

  /**
   * Only profiles explicitly marked as admin can access the admin area.
   */
  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  return {
    user,
    profile,
  };
}

/**
 * ---------------------------------------------------------------------------
 * Require an active subscriber
 * ---------------------------------------------------------------------------
 *
 * Used by pages that should only be accessible to members with an active
 * GoodSwing subscription.
 *
 * If the user is authenticated but does not have an active membership,
 * redirect them to the subscription page.
 */
export async function requireSubscriber() {
  const user = await requireUser();

  const active = await hasActiveSubscription();

  if (!active) {
    redirect("/dashboard/subscription");
  }

  return user;
}