import Link from "next/link";
import { ArrowRight, Users, Wallet, Heart, Trophy, Sparkles, BadgeCheck } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { FadeIn } from "@/components/ui/fade-in";

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export default async function AdminPage() {
  const { profile, user } = await requireAdmin();
  const supabase = await createClient();

  const [
    { count: users },
    { count: activeSubs },
    { data: payments },
    { data: contributions },
    { data: draws },
    { data: winners },
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("payments").select("amount_paise"),
    supabase.from("charity_contributions").select("amount_paise"),
    supabase.from("draws").select("id,draw_month,status,prize_pool").order("draw_month", { ascending: false }),
    supabase
      .from("winners")
      .select("id,prize_amount,verification_status,payment_status,match_count,profiles(full_name,email)")
      .order("created_at", { ascending: false }),
  ]);

  const revenue = (payments ?? []).reduce((s, p) => s + Number(p.amount_paise || 0), 0) / 100;
  const charityTotal = (contributions ?? []).reduce((s, c) => s + Number(c.amount_paise || 0), 0) / 100;
  const totalPool = (draws ?? []).reduce((s, d) => s + Number(d.prize_pool || 0), 0);
  const published = (draws ?? []).filter((d) => d.status === "completed").length;

  const toReview = (winners ?? []).filter((w) => w.verification_status === "pending");
  const toPay = (winners ?? []).filter(
    (w) => w.verification_status === "approved" && w.payment_status !== "paid"
  );

  const stats = [
    { label: "Total users", value: String(users ?? 0), icon: Users },
    { label: "Active members", value: String(activeSubs ?? 0), icon: BadgeCheck },
    { label: "Revenue", value: inr(revenue), icon: Wallet },
    { label: "Total prize pool", value: inr(totalPool), icon: Trophy },
    { label: "Charity contributions", value: inr(charityTotal), icon: Heart },
    { label: "Draws published", value: `${published} / ${draws?.length ?? 0}`, icon: Sparkles },
  ];

  return (
    <main className="px-6 py-8 md:px-10">
      <div className="mx-auto max-w-6xl">
        <FadeIn>
          <p className="text-sm font-medium text-[#087f4e]">Control room</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-4xl">
            Welcome back, {(profile?.full_name || user.email || "admin").split(" ")[0]}.
          </h1>
        </FadeIn>

        {/* Stats */}
        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map(({ label, value, icon: Icon }, i) => (
            <FadeIn key={label} delay={i * 0.05}>
              <div className="group rounded-2xl border bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-900/5">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-neutral-500">{label}</p>
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-[#176b45] transition group-hover:bg-[#176b45] group-hover:text-white">
                    <Icon className="h-4 w-4" />
                  </span>
                </div>
                <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
              </div>
            </FadeIn>
          ))}
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* Needs attention */}
          <FadeIn delay={0.2}>
            <section className="rounded-2xl border bg-white p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Needs attention</h2>
                <Link href="/admin/winners" className="flex items-center gap-1 text-sm font-medium text-[#176b45]">
                  Winners <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-amber-50 p-4">
                  <p className="text-2xl font-semibold">{toReview.length}</p>
                  <p className="text-xs text-amber-800">Proofs to review</p>
                </div>
                <div className="rounded-xl bg-blue-50 p-4">
                  <p className="text-2xl font-semibold">{toPay.length}</p>
                  <p className="text-xs text-blue-800">Payouts pending</p>
                </div>
              </div>

              <ul className="mt-4 space-y-2">
                {[...toReview, ...toPay].slice(0, 4).map((w: any) => (
                  <li key={w.id} className="flex items-center justify-between rounded-xl border px-4 py-3 text-sm">
                    <span className="font-medium">{w.profiles?.full_name || w.profiles?.email || "Winner"}</span>
                    <span className="text-neutral-500">
                      {w.match_count}-match · {inr(Number(w.prize_amount))}
                    </span>
                  </li>
                ))}
                {toReview.length + toPay.length === 0 && (
                  <li className="rounded-xl border border-dashed p-4 text-center text-sm text-neutral-500">
                    All caught up 🎉
                  </li>
                )}
              </ul>
            </section>
          </FadeIn>

          {/* Recent draws */}
          <FadeIn delay={0.25}>
            <section className="rounded-2xl border bg-white p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Recent draws</h2>
                <Link href="/admin/draws" className="flex items-center gap-1 text-sm font-medium text-[#176b45]">
                  Manage <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <ul className="mt-4 space-y-2">
                {(draws ?? []).slice(0, 5).map((d) => (
                  <li key={d.id} className="flex items-center justify-between rounded-xl border px-4 py-3 text-sm">
                    <div>
                      <p className="font-medium">
                        {new Date(`${d.draw_month}T00:00:00`).toLocaleDateString("en-IN", {
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                      <p className="text-xs text-neutral-500">Pool {inr(Number(d.prize_pool))}</p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                        d.status === "completed"
                          ? "bg-emerald-100 text-emerald-800"
                          : d.status === "open"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-neutral-100 text-neutral-600"
                      }`}
                    >
                      {d.status}
                    </span>
                  </li>
                ))}
                {!draws?.length && (
                  <li className="rounded-xl border border-dashed p-4 text-center text-sm text-neutral-500">
                    No draws yet.
                  </li>
                )}
              </ul>
            </section>
          </FadeIn>
        </div>
      </div>
    </main>
  );
}