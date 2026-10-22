
import type { ReactNode } from "react";

import { requireUser, getProfile } from "@/lib/auth";
import { MemberSidebar } from "@/components/dashboard/member-sidebar";

/**
 * Dashboard Layout
 *
 * This layout wraps all member dashboard pages.
 *
 * Authentication and profile data are intentionally fetched separately:
 *
 * - `requireUser()` returns the authenticated Supabase user.
 * - `getProfile()` returns the corresponding GoodSwing profile.
 *
 * Keeping these responsibilities separate matches the existing auth.ts
 * implementation and avoids incorrectly destructuring `requireUser()`.
 */
export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  /**
   * requireUser() guarantees that a logged-in user exists.
   *
   * If there is no authenticated user, requireUser() redirects to /login.
   */
  const user = await requireUser();

  /**
   * Fetch the GoodSwing profile associated with the authenticated user.
   *
   * getProfile() can return null if a profile hasn't been created yet,
   * so we safely handle that case below.
   */
  const profile = await getProfile();

  /**
   * Determine the name displayed in the member sidebar.
   *
   * Priority:
   * 1. Profile full name
   * 2. Supabase user's email
   * 3. Generic "Member" fallback
   *
   * Optional chaining protects us if the profile is unavailable.
   */
  const memberName =
    profile?.full_name?.trim() ||
    user?.email ||
    "Member";

  return (
    <div className="min-h-screen bg-[#f7f6ef] md:flex">
      {/* Member navigation */}
      <MemberSidebar name={memberName} />

      {/* Main dashboard content */}
      <main className="min-w-0 flex-1">
        {children}
      </main>
    </div>
  );
}
