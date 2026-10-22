import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export const getCurrentUser =
  cache(async () => {
    const supabase =
      await createClient();

    const {
      data: { user },
    } =
      await supabase.auth.getUser();

    return user;
  });

export const getProfile =
  cache(async () => {
    const user =
      await getCurrentUser();

    if (!user) {
      return null;
    }

    const supabase =
      await createClient();

    const {
      data,
      error,
    } = await supabase
      .from("profiles")
      .select(
        "id, full_name, email, role, created_at"
      )
      .eq("id", user.id)
      .single();

    if (error) {
      return null;
    }

    return data;
  });

export const getSubscription =
  cache(async () => {
    const user =
      await getCurrentUser();

    if (!user) {
      return null;
    }

    const supabase =
      await createClient();

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
      .eq(
        "user_id",
        user.id
      )
      .maybeSingle();

    if (error) {
      return null;
    }

    return data;
  });

export const hasActiveSubscription =
  cache(async () => {
    const subscription =
      await getSubscription();

    if (!subscription) {
      return false;
    }

    if (
      subscription.status !==
      "active"
    ) {
      return false;
    }

    if (
      !subscription.current_period_end
    ) {
      return true;
    }

    return (
      new Date(
        subscription.current_period_end
      ) > new Date()
    );
  });

export async function requireUser() {
  const user =
    await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireAdmin() {
  const user =
    await requireUser();

  const profile =
    await getProfile();

  if (
    profile?.role !==
    "admin"
  ) {
    redirect("/dashboard");
  }

  return {
    user,
    profile,
  };
}

export async function requireSubscriber() {
  const user =
    await requireUser();

  const active =
    await hasActiveSubscription();

  if (!active) {
    redirect(
      "/dashboard/subscription"
    );
  }

  return user;
}