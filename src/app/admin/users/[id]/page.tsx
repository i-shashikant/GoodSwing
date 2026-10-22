import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Mail,
  ShieldCheck,
  Trophy,
  UserRound,
} from "lucide-react";

import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { UserEditor } from "@/components/admin/user-editor";

export default async function AdminUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();

  const { id } = await params;
  const admin = createAdminClient();

  const [
    { data: profile },
    { data: sub },
    { data: scores },
  ] = await Promise.all([
    admin
      .from("profiles")
      .select("id,full_name,email,role")
      .eq("id", id)
      .maybeSingle(),

    admin
      .from("subscriptions")
      .select("status,plan,current_period_end")
      .eq("user_id", id)
      .maybeSingle(),

    admin
      .from("scores")
      .select("id,score,played_at")
      .eq("user_id", id)
      .order("played_at", { ascending: false }),
  ]);

  if (!profile) {
    notFound();
  }

  const scoreCount = scores?.length ?? 0;

  return (
    <main className="min-h-screen bg-[#f7f7f2] px-5 py-8 md:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        {/* Back */}
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-2 text-sm text-black/50 transition hover:text-black"
        >
          <ArrowLeft className="h-4 w-4" />
          All users
        </Link>

        {/* Profile header */}
        <section className="mt-6 overflow-hidden rounded-3xl bg-[#123d2d] text-white">
          <div className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between md:p-8">
            <div className="flex items-center gap-5">
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-[#f0c95b] text-2xl font-bold text-[#123d2d]">
                {(profile.full_name || "U")
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                    {profile.full_name || "Unnamed member"}
                  </h1>

                  {profile.role === "admin" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-100">
                      <ShieldCheck className="h-3 w-3" />
                      Admin
                    </span>
                  )}
                </div>

                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-emerald-100/65">
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" />
                    {profile.email}
                  </span>

                  {sub?.plan && (
                    <span className="inline-flex items-center gap-1.5">
                      <UserRound className="h-3.5 w-3.5" />
                      {sub.plan} membership
                    </span>
                  )}

                  {sub?.current_period_end && (
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5" />
                      Period ends{" "}
                      {new Date(
                        sub.current_period_end
                      ).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-100/50">
                  Golf scores
                </p>
                <p className="mt-1 text-2xl font-semibold">
                  {scoreCount}
                  <span className="text-sm font-normal text-emerald-100/40">
                    {" "}
                    / 5
                  </span>
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-100/50">
                  Membership
                </p>
                <p className="mt-1 text-sm font-semibold capitalize">
                  {sub?.status ?? "none"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Main editor */}
        <UserEditor
          userId={profile.id}
          fullName={profile.full_name ?? ""}
          email={profile.email ?? ""}
          scores={scores ?? []}
          membership={sub?.status ?? "none"}
        />
      </div>
    </main>
  );
}