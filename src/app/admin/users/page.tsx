import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  setUserRole,
  setSubscriptionStatus,
} from "./actions";

export default async function AdminUsersPage() {
  // Ensure that only authenticated admins can access this page.
  await requireAdmin();

  // Create a Supabase server client.
  const supabase = await createClient();

  // Fetch users and subscriptions in parallel.
  const [
    { data: users, error },
    { data: subscriptions },
  ] = await Promise.all([
    // Fetch all user profiles, newest users first.
    supabase
      .from("profiles")
      .select("id,full_name,email,role,created_at")
      .order("created_at", { ascending: false }),

    // Fetch subscription information for all users.
    supabase
      .from("subscriptions")
      .select("user_id,plan,status,current_period_end"),
  ]);

  // Throw an error if fetching users fails.
  if (error) {
    throw new Error(error.message);
  }

  // Create a Map so subscriptions can be looked up quickly
  // using the corresponding user's ID.
  const subMap = new Map(
    (subscriptions ?? []).map((subscription) => [
      subscription.user_id,
      subscription,
    ])
  );

  return (
    <main className="min-h-screen px-6 py-10 md:px-10">
      <div className="mx-auto max-w-6xl">
        {/* Back link to the main admin dashboard */}
        <Link
          href="/admin"
          className="text-sm text-muted-foreground"
        >
          ← Admin overview
        </Link>

        {/* Page heading */}
        <h1 className="mt-6 text-4xl font-semibold tracking-tight">
          Users & memberships
        </h1>

        <p className="mt-2 text-muted-foreground">
          View users, roles and subscription state.
        </p>

        {/* =========================================================
            USERS LIST
            ========================================================= */}
        <div className="mt-8 overflow-hidden rounded-2xl border">
          {users?.map((user) => {
            // Find this user's subscription using the Map.
            const sub = subMap.get(user.id);

            return (
              <div
                key={user.id}
                className="grid gap-4 border-b p-5 last:border-b-0 md:grid-cols-[1.5fr_1fr_1fr_auto] md:items-center"
              >
                {/* =================================================
                    USER INFORMATION
                    ================================================= */}
                <div>
                  <p className="font-semibold">
                    {user.full_name || "Unnamed member"}
                  </p>

                  <p className="text-sm text-muted-foreground">
                    {user.email}
                  </p>
                </div>

                {/* =================================================
                    USER ROLE
                    ================================================= */}
                <div className="text-sm">
                  <p className="text-muted-foreground">
                    Role
                  </p>

                  <p className="font-medium capitalize">
                    {user.role}
                  </p>
                </div>

                {/* =================================================
                    SUBSCRIPTION INFORMATION
                    ================================================= */}
                <div className="text-sm">
                  <p className="text-muted-foreground">
                    Membership
                  </p>

                  <p className="font-medium capitalize">
                    {sub?.status ?? "none"}

                    {sub?.plan
                      ? ` · ${sub.plan}`
                      : ""}
                  </p>
                </div>

                {/* =================================================
                    ADMIN ACTIONS
                    ================================================= */}
                <div className="flex flex-wrap gap-2">
                  {/* Toggle between admin and subscriber roles */}
                  <form action={setUserRole}>
                    <input
                      type="hidden"
                      name="userId"
                      value={user.id}
                    />

                    <input
                      type="hidden"
                      name="role"
                      value={
                        user.role === "admin"
                          ? "subscriber"
                          : "admin"
                      }
                    />

                    <button className="rounded-lg border px-3 py-2 text-xs">
                      {user.role === "admin"
                        ? "Remove admin"
                        : "Make admin"}
                    </button>
                  </form>

                  {/* Expire an active membership */}
                  {sub?.status === "active" && (
                    <form action={setSubscriptionStatus}>
                      <input
                        type="hidden"
                        name="userId"
                        value={user.id}
                      />

                      <input
                        type="hidden"
                        name="status"
                        value="expired"
                      />

                      <button className="rounded-lg border px-3 py-2 text-xs">
                        Expire membership
                      </button>
                    </form>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}