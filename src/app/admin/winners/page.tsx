import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { reviewWinner, markWinnerPaid } from "./actions";

function money(value: number) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function month(value: string | null | undefined) {
  if (!value) return "Unknown draw";
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

const statusClass: Record<string, string> = {
  pending: "border-amber-300/20 bg-amber-300/10 text-amber-200",
  awaiting_proof: "border-amber-300/20 bg-amber-300/10 text-amber-200",
  submitted: "border-blue-300/20 bg-blue-300/10 text-blue-200",
  approved: "border-emerald-300/20 bg-emerald-300/10 text-emerald-200",
  rejected: "border-red-300/20 bg-red-300/10 text-red-200",
  paid: "border-emerald-300/20 bg-emerald-300/10 text-emerald-200",
};

export default async function AdminWinnersPage() {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: winners, error } = await admin
    .from("winners")
    .select(
      "id,user_id,match_count,prize_amount,verification_status,payment_status,proof_path,admin_note,payment_reference,created_at,profiles(full_name,email),draws(draw_month,draw_date,number_1,number_2,number_3,number_4,number_5)"
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = winners ?? [];
  const pending = rows.filter((w) => ["pending", "awaiting_proof", "submitted"].includes(w.verification_status));
  const approved = rows.filter((w) => w.verification_status === "approved" && w.payment_status !== "paid");
  const paid = rows.filter((w) => w.payment_status === "paid");
  const totalAwarded = rows.reduce((sum, w) => sum + Number(w.prize_amount || 0), 0);

  const proofUrlResults = await Promise.all(
  rows
    .filter((winner) => winner.proof_path)
    .map(async (winner) => {
      const { data } = await admin.storage
        .from("winner-proofs")
        .createSignedUrl(
          winner.proof_path!,
          60 * 60
        );

      return {
        winnerId: winner.id,
        signedUrl: data?.signedUrl ?? null,
      };
    })
);

const proofUrls = new Map<string, string>();

for (const result of proofUrlResults) {
  if (result.signedUrl) {
    proofUrls.set(
      result.winnerId,
      result.signedUrl
    );
  }
}

  return (
    <main className="admin-main">
      <div className="admin-container">
        <Link href="/admin" className="text-sm text-white/45 hover:text-white">← Admin overview</Link>
        <header className="mt-7">
          <p className="eyebrow">Payout operations</p>
          <h1 className="admin-title">Winner verification</h1>
          <p className="admin-subtitle">Review proof, approve legitimate winners and close the payout loop with a payment reference.</p>
        </header>

        <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Total winners" value={rows.length} />
          <Stat label="Awaiting action" value={pending.length} />
          <Stat label="Approved to pay" value={approved.length} />
          <Stat label="Awarded" value={money(totalAwarded)} />
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[.018] p-5 md:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div><p className="eyebrow">Winner queue</p><h2 className="mt-2 text-2xl font-semibold">Claims & payouts</h2></div>
            <p className="text-xs text-white/35">{paid.length} paid · {rows.length} total</p>
          </div>

          <div className="mt-6 space-y-3">
            {rows.map((winner) => {
              const profile = Array.isArray(winner.profiles) ? winner.profiles[0] : winner.profiles;
              const draw = Array.isArray(winner.draws) ? winner.draws[0] : winner.draws;
              const proofUrl = proofUrls.get(winner.id);

              return (
                <article key={winner.id} className="rounded-2xl border border-white/8 bg-black/10 p-5">
                  <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto]">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold">{profile?.full_name || profile?.email || "Winner"}</h3>
                        <span className={`admin-chip ${statusClass[winner.verification_status] ?? ""}`}>Proof: {winner.verification_status.replaceAll("_", " ")}</span>
                        <span className={`admin-chip ${statusClass[winner.payment_status] ?? ""}`}>Payout: {winner.payment_status}</span>
                      </div>
                      <p className="mt-2 text-sm text-white/45">{profile?.email || "No email"}</p>
                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <Info label="Draw" value={month(draw?.draw_month)} />
                        <Info label="Match" value={`${winner.match_count}/5`} />
                        <Info label="Prize" value={money(Number(winner.prize_amount))} />
                      </div>
                      {winner.admin_note && <div className="mt-4 rounded-xl border border-white/8 bg-white/[.02] p-3 text-sm text-white/60"><span className="font-semibold text-white/80">Admin note:</span> {winner.admin_note}</div>}
                      {winner.payment_reference && <p className="mt-3 text-xs text-white/40">Payment reference: <span className="font-medium text-white/65">{winner.payment_reference}</span></p>}
                      {proofUrl ? (
                        <a
                          href={proofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-4 inline-flex text-sm font-semibold text-emerald-300 hover:underline"
                        >
                          View submitted proof ↗
                        </a>
                      ) : winner.proof_path ? (
                        <p className="mt-4 text-xs text-amber-200/70">
                          Proof exists but could not be opened.
                        </p>
                      ) : (
                        <p className="mt-4 text-xs text-white/35">
                          No proof submitted.
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap content-start gap-2 lg:max-w-[310px] lg:justify-end">
                      {winner.verification_status !== "approved" && winner.verification_status !== "rejected" && (
                        <>
                          <form action={reviewWinner}>
                            <input type="hidden" name="winnerId" value={winner.id} />
                            <input type="hidden" name="status" value="approved" />
                            <button className="admin-primary-button">Approve</button>
                          </form>
                          <form action={reviewWinner}>
                            <input type="hidden" name="winnerId" value={winner.id} />
                            <input type="hidden" name="status" value="rejected" />
                            <button className="admin-outline-button">Reject</button>
                          </form>
                        </>
                      )}

                      {winner.verification_status === "approved" && winner.payment_status !== "paid" && (
                        <form action={markWinnerPaid} className="flex w-full flex-wrap gap-2 sm:w-auto">
                          <input type="hidden" name="winnerId" value={winner.id} />
                          <input name="paymentReference" required placeholder="Payment reference" className="admin-input min-w-48 flex-1 sm:w-48" />
                          <button className="admin-primary-button">Mark paid</button>
                        </form>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {!rows.length && <div className="mt-6 rounded-2xl border border-dashed border-white/10 p-10 text-center text-white/40">No winners yet. Published draws will appear here when they produce 3-, 4- or 5-number matches.</div>}
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-2xl border border-white/8 bg-white/[.018] p-5"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-white/35">{label}</p><p className="mt-4 text-2xl font-semibold">{value}</p></div>;
}
function Info({ label, value }: { label: string; value: string }) {
  return <div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-white/30">{label}</p><p className="mt-1 text-sm font-medium text-white/80">{value}</p></div>;
}
