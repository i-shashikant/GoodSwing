import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const inr = (value: number) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

export default async function ReportsPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [
    { count: users },
    { count: activeMembers },
    { data: payments },
    { data: contributions },
    { data: draws, error: drawError },
    { data: entries, error: entryError },
    { data: winners, error: winnerError },
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("payments").select("amount_paise,paid_at"),
    supabase.from("charity_contributions").select("amount_paise,status"),
    supabase.from("draws").select("id,draw_month,draw_date,status,draw_method,prize_pool,jackpot_rollover,jackpot_rollover_out,number_1,number_2,number_3,number_4,number_5").order("draw_month", { ascending: false }),
    supabase.from("draw_entries").select("id,draw_id,match_count"),
    supabase.from("winners").select("id,draw_id,user_id,match_count,prize_amount,verification_status,payment_status"),
  ]);

  if (drawError || entryError || winnerError) throw new Error("Unable to load report data.");

  const revenue = (payments ?? []).reduce((sum, row) => sum + Number(row.amount_paise || 0), 0) / 100;
  const impact = (contributions ?? []).filter((row) => row.status !== "cancelled").reduce((sum, row) => sum + Number(row.amount_paise || 0), 0) / 100;
  const configuredPool = (draws ?? []).reduce((sum, row) => sum + Number(row.prize_pool || 0), 0);
  const rollover = (draws ?? []).reduce((sum, row) => sum + Number(row.jackpot_rollover_out || 0), 0);
  const completedDraws = (draws ?? []).filter((row) => row.status === "completed").length;
  const paidWinners = (winners ?? []).filter((row) => row.payment_status === "paid").length;
  const awarded = (winners ?? []).reduce((sum, row) => sum + Number(row.prize_amount || 0), 0);

  const entryCountByDraw = new Map<string, number>();
  for (const entry of entries ?? []) entryCountByDraw.set(entry.draw_id, (entryCountByDraw.get(entry.draw_id) ?? 0) + 1);

  const winnerCountByDraw = new Map<string, number>();
  for (const winner of winners ?? []) winnerCountByDraw.set(winner.draw_id, (winnerCountByDraw.get(winner.draw_id) ?? 0) + 1);

  return (
    <main className="admin-main">
      <div className="admin-container">
        <Link href="/admin" className="text-sm text-white/45 hover:text-white">← Admin overview</Link>
        <header className="mt-7">
          <p className="eyebrow">Operational intelligence</p>
          <h1 className="admin-title">Reports & analytics</h1>
          <p className="admin-subtitle">A compact view of membership, money, charity impact and the monthly draw engine.</p>
        </header>

        <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Total users" value={users ?? 0} />
          <Stat label="Active members" value={activeMembers ?? 0} />
          <Stat label="Payments" value={inr(revenue)} />
          <Stat label="Charity allocated" value={inr(impact)} />
        </section>

        <section className="mt-6 rounded-3xl border border-white/10 bg-white/[.018] p-5 md:p-7">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Mini label="Configured pool" value={inr(configuredPool)} />
            <Mini label="Completed draws" value={completedDraws} />
            <Mini label="Winners paid" value={paidWinners} />
            <Mini label="Prizes awarded" value={inr(awarded)} />
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-white/10 bg-white/[.018] p-5 md:p-7">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Draw statistics</p>
              <h2 className="mt-2 text-2xl font-semibold">Monthly draw performance</h2>
              <p className="mt-2 text-sm text-white/40">Entries, winners, pool value, rollover, method and published numbers for every configured draw.</p>
            </div>
            <div className="text-right text-xs text-white/35">Total rollover out: <span className="font-semibold text-white/60">{inr(rollover)}</span></div>
          </div>

          <div className="mt-6 overflow-x-auto rounded-2xl border border-white/8">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-white/[.025] text-[10px] uppercase tracking-[.14em] text-white/35">
                <tr>
                  <th className="px-4 py-3 font-bold">Draw</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                  <th className="px-4 py-3 font-bold">Method</th>
                  <th className="px-4 py-3 font-bold">Entries</th>
                  <th className="px-4 py-3 font-bold">Winners</th>
                  <th className="px-4 py-3 font-bold">Pool</th>
                  <th className="px-4 py-3 font-bold">Rollover</th>
                  <th className="px-4 py-3 font-bold">Numbers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/8">
                {(draws ?? []).map((draw) => {
                  const numbers = [draw.number_1, draw.number_2, draw.number_3, draw.number_4, draw.number_5].filter((n): n is number => typeof n === "number");
                  return (
                    <tr key={draw.id} className="text-white/75">
                      <td className="px-4 py-4 font-semibold">{new Date(`${draw.draw_month}T00:00:00`).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</td>
                      <td className="px-4 py-4"><span className="admin-chip">{draw.status}</span></td>
                      <td className="px-4 py-4 capitalize">{draw.draw_method}</td>
                      <td className="px-4 py-4">{entryCountByDraw.get(draw.id) ?? 0}</td>
                      <td className="px-4 py-4">{winnerCountByDraw.get(draw.id) ?? 0}</td>
                      <td className="px-4 py-4">{inr(Number(draw.prize_pool))}</td>
                      <td className="px-4 py-4">{inr(Number(draw.jackpot_rollover_out))}</td>
                      <td className="px-4 py-4">{numbers.length ? numbers.join(" · ") : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {!draws?.length && <div className="mt-6 rounded-2xl border border-dashed border-white/10 p-10 text-center text-white/40">No draw data yet.</div>}
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-2xl border border-white/8 bg-white/[.018] p-5"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-white/35">{label}</p><p className="mt-4 text-2xl font-semibold">{value}</p></div>;
}
function Mini({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-2xl border border-white/8 bg-black/10 p-4"><p className="text-xs text-white/40">{label}</p><p className="mt-2 text-lg font-semibold">{value}</p></div>;
}
