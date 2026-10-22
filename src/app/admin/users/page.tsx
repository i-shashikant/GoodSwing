import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  ShieldCheck,
  UserRound,
  UsersRound,
} from "lucide-react";

import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  setUserRole,
  setSubscriptionStatus,
} from "./actions";

function membershipClasses(status?: string) {
  if (status === "active") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700";
  }

  if (status === "expired") {
    return "border-red-500/20 bg-red-500/10 text-red-700";
  }

  return "border-black/10 bg-black/[0.03] text-black/50";
}

export default async function AdminUsersPage() {
  await requireAdmin();

  const supabase = await createClient();

  const [
    { data: users, error },
    { data: subscriptions },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id,full_name,email,role,created_at")
      .order("created_at", { ascending: false }),

    supabase
      .from("subscriptions")
      .select("user_id,plan,status,current_period_end"),
  ]);

  if (error) {
    throw new Error(error.message);
  }

  const subMap = new Map(
    (subscriptions ?? []).map((subscription) => [
      subscription.user_id,
      subscription,
    ])
  );

  const allUsers = users ?? [];

  const activeMembers = allUsers.filter(
    (user) => subMap.get(user.id)?.status === "active"
  ).length;

  const admins = allUsers.filter(
    (user) => user.role === "admin"
  ).length;

  return (
    <main className="min-h-screen bg-[#f7f7f2] px-5 py-8 md:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="border-b border-black/10 pb-8">
          <Link
            href="/admin"
            className="mb-5 inline-flex items-center gap-2 text-sm text-black/50 transition hover:text-black"
          >
            ← Admin overview
          </Link>

          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="eyebrow text-[#176b45]">
                GoodSwing Members
              </p>

              <h1 className="mt-2 text-4xl font-semibold tracking-tight md:text-5xl">
                Users & memberships.
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-black/55 md:text-base">
                Manage member profiles, subscription state, roles and golf
                activity from one place.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-black/10 bg-white px-5 py-4">
                <p className="text-xs uppercase tracking-[0.14em] text-black/40">
                  Members
                </p>
                <p className="mt-1 text-2xl font-semibold">
                  {activeMembers}
                </p>
              </div>

              <div className="rounded-2xl border border-black/10 bg-white px-5 py-4">
                <p className="text-xs uppercase tracking-[0.14em] text-black/40">
                  Admins
                </p>
                <p className="mt-1 text-2xl font-semibold">
                  {admins}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Member list */}
        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="eyebrow text-[#176b45]">Directory</p>
              <h2 className="mt-1 text-2xl font-semibold">
                All users
              </h2>
            </div>

            <span className="text-sm text-black/40">
              {allUsers.length} total
            </span>
          </div>

          <div className="space-y-3">
            {allUsers.map((user) => {
              const sub = subMap.get(user.id);
              const isActive = sub?.status === "active";

              return (
                <article
                  key={user.id}
                  className="rounded-2xl border border-black/10 bg-white p-5 transition hover:border-black/20"
                >
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-center">
                    {/* Identity */}
                    <div className="flex min-w-0 flex-1 items-center gap-4">
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#e5f2eb] text-[#176b45]">
                        <UserRound className="h-5 w-5" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold">
                            {user.full_name || "Unnamed member"}
                          </h3>

                          {user.role === "admin" && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                              <ShieldCheck className="h-3 w-3" />
                              Admin
                            </span>
                          )}
                        </div>

                        <p className="mt-1 truncate text-sm text-black/45">
                          {user.email}
                        </p>
                      </div>
                    </div>

                    {/* Role */}
                    <div className="min-w-[120px]">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-black/35">
                        Role
                      </p>

                      <p className="mt-1 text-sm font-medium capitalize">
                        {user.role}
                      </p>
                    </div>

                    {/* Membership */}
                    <div className="min-w-[180px]">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-black/35">
                        Membership
                      </p>

                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize ${membershipClasses(
                            sub?.status
                          )}`}
                        >
                          {sub?.status ?? "none"}
                        </span>

                        {sub?.plan && (
                          <span className="text-xs text-black/45">
                            {sub.plan}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Renewal */}
                    <div className="hidden min-w-[150px] lg:block">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-black/35">
                        Period end
                      </p>

                      <div className="mt-1 flex items-center gap-1.5 text-sm text-black/60">
                        <CalendarDays className="h-3.5 w-3.5" />

                        {sub?.current_period_end
                          ? new Date(
                              sub.current_period_end
                            ).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#176b45] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0f4d32]"
                      >
                        Manage
                        <ArrowRight className="h-4 w-4" />
                      </Link>

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

                        <button
                          type="submit"
                          className="rounded-xl border border-black/15 px-3.5 py-2.5 text-xs font-semibold transition hover:bg-black/[0.03]"
                        >
                          {user.role === "admin"
                            ? "Remove admin"
                            : "Make admin"}
                        </button>
                      </form>

                      {isActive && (
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

                          <button
                            type="submit"
                            className="rounded-xl border border-red-500/20 px-3.5 py-2.5 text-xs font-semibold text-red-700 transition hover:bg-red-50"
                          >
                            Expire
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}

            {!allUsers.length && (
              <div className="rounded-2xl border border-dashed border-black/15 bg-white/50 p-12 text-center">
                <UsersRound className="mx-auto h-7 w-7 text-black/30" />

                <h3 className="mt-4 font-semibold">
                  No users found
                </h3>

                <p className="mt-1 text-sm text-black/45">
                  New GoodSwing members will appear here.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}