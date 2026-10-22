import Link from "next/link";

import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileCheck2,
  Gift,
  Sparkles,
  Trophy,
  Upload,
} from "lucide-react";

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

import { submitWinnerProof } from "./actions";

export default async function WinningsPage() {
  // -------------------------------------------------------------
  // Authentication
  // -------------------------------------------------------------
  const user = await requireUser();

  const supabase = await createClient();

  // -------------------------------------------------------------
  // Fetch user's winnings
  // -------------------------------------------------------------
  const { data: winners, error } =
    await supabase
      .from("winners")
      .select(
        "id,match_count,prize_amount,verification_status,payment_status,proof_path,admin_note,draws(draw_month,number_1,number_2,number_3,number_4,number_5)"
      )
      .eq("user_id", user.id)
      .order("created_at", {
        ascending: false,
      });

  if (error) {
    throw new Error(error.message);
  }

  const entries = winners ?? [];

  // Total prize value.
  const total = entries.reduce(
    (sum, winner) =>
      sum +
      Number(
        winner.prize_amount || 0
      ),
    0
  );

  // Already paid prize value.
  const paid = entries
    .filter(
      (winner) =>
        winner.payment_status ===
        "paid"
    )
    .reduce(
      (sum, winner) =>
        sum +
        Number(
          winner.prize_amount || 0
        ),
      0
    );

  const pendingAmount =
    Math.max(total - paid, 0);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080c0a] text-white">
      {/* Ambient glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-0 h-[450px] w-[450px] rounded-full bg-amber-300/[0.06] blur-[140px]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-1/3 h-[400px] w-[400px] rounded-full bg-emerald-400/[0.07] blur-[130px]"
      />

      <div className="relative mx-auto max-w-7xl px-5 py-8 md:px-10 md:py-12">
        {/* Header */}
        <header className="border-b border-white/[0.08] pb-10">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-white/45 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>

          <div className="mt-10">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-amber-300">
              <Trophy className="h-4 w-4" />
              Your winnings
            </div>

            <h1 className="mt-4 text-4xl font-bold tracking-[-0.05em] md:text-6xl">
              Results.
              <br />
              <span className="text-amber-300">
                Rewards.
              </span>
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-white/50 md:text-lg">
              View winning draws, submit verification proof and
              keep track of your payout status.
            </p>
          </div>
        </header>

        {/* =========================================================
            SUMMARY CARDS
            ========================================================= */}

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {/* Total */}
          <div className="relative overflow-hidden rounded-3xl border border-amber-300/15 bg-amber-300/[0.045] p-7">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-amber-300/10 blur-3xl" />

            <div className="relative">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-300/10 text-amber-300">
                <Gift className="h-5 w-5" />
              </div>

              <p className="mt-8 text-xs font-bold uppercase tracking-[0.18em] text-white/40">
                Total won
              </p>

              <p className="mt-2 text-4xl font-bold">
                ₹{total.toLocaleString("en-IN")}
              </p>
            </div>
          </div>

          {/* Paid */}
          <div className="rounded-3xl border border-emerald-400/15 bg-emerald-400/[0.035] p-7">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-400/10 text-emerald-300">
              <CheckCircle2 className="h-5 w-5" />
            </div>

            <p className="mt-8 text-xs font-bold uppercase tracking-[0.18em] text-white/40">
              Paid
            </p>

            <p className="mt-2 text-4xl font-bold">
              ₹{paid.toLocaleString("en-IN")}
            </p>
          </div>

          {/* Pending */}
          <div className="rounded-3xl border border-teal-300/15 bg-teal-300/[0.035] p-7">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-teal-300/10 text-teal-300">
              <Clock3 className="h-5 w-5" />
            </div>

            <p className="mt-8 text-xs font-bold uppercase tracking-[0.18em] text-white/40">
              Awaiting payout
            </p>

            <p className="mt-2 text-4xl font-bold">
              ₹
              {pendingAmount.toLocaleString(
                "en-IN"
              )}
            </p>
          </div>
        </section>

        {/* =========================================================
            WINNING ENTRIES
            ========================================================= */}

        <section className="mt-8 overflow-hidden rounded-3xl border border-white/[0.09] bg-white/[0.025]">
          <div className="border-b border-white/[0.07] p-6 md:p-8">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-300/10 text-amber-300">
                <Trophy className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-xl font-bold">
                  Winning entries
                </h2>

                <p className="mt-1 text-sm text-white/35">
                  {entries.length}{" "}
                  {entries.length === 1
                    ? "winning entry"
                    : "winning entries"}
                </p>
              </div>
            </div>
          </div>

          {entries.length === 0 ? (
            <div className="p-12 text-center md:p-16">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-amber-300/10 text-amber-300">
                <Trophy className="h-7 w-7" />
              </div>

              <h3 className="mt-6 text-xl font-bold">
                No winnings yet.
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/40">
                Keep your five latest scores up to date and
                watch for the monthly GoodSwing draw.
              </p>

              <Link
                href="/dashboard/scores"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 text-sm font-bold text-[#06100b] transition hover:-translate-y-0.5 hover:bg-emerald-300"
              >
                Update your scores
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {entries.map(
                (winner) => {
                  const draw =
                    winner.draws?.[0];

                  const verification =
                    winner.verification_status;

                  const payment =
                    winner.payment_status;

                  return (
                    <article
                      key={winner.id}
                      className="p-6 transition hover:bg-white/[0.02] md:p-8"
                    >
                      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
                        {/* Winner information */}
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-amber-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-amber-200">
                              {draw?.draw_month ??
                                "Monthly draw"}
                            </span>

                            <span className="rounded-full border border-white/[0.08] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white/40">
                              {winner.match_count} number match
                            </span>
                          </div>

                          <h3 className="mt-5 text-3xl font-bold">
                            ₹
                            {Number(
                              winner.prize_amount
                            ).toLocaleString(
                              "en-IN"
                            )}
                          </h3>

                          <p className="mt-2 text-sm text-white/40">
                            Prize amount
                          </p>

                          {/* Statuses */}
                          <div className="mt-6 flex flex-wrap gap-3">
                            <div className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2">
                              <FileCheck2 className="h-4 w-4 text-teal-300" />

                              <div>
                                <p className="text-[10px] uppercase tracking-wider text-white/30">
                                  Verification
                                </p>

                                <p className="text-xs font-semibold capitalize text-white/70">
                                  {verification}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2">
                              <CreditCard className="h-4 w-4 text-emerald-300" />

                              <div>
                                <p className="text-[10px] uppercase tracking-wider text-white/30">
                                  Payment
                                </p>

                                <p className="text-xs font-semibold capitalize text-white/70">
                                  {payment}
                                </p>
                              </div>
                            </div>
                          </div>

                          {winner.admin_note && (
                            <div className="mt-6 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
                              <p className="text-xs font-bold uppercase tracking-wider text-white/30">
                                Admin note
                              </p>

                              <p className="mt-2 text-sm leading-6 text-white/50">
                                {winner.admin_note}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Proof */}
                        <div>
                          {verification !==
                            "approved" &&
                            verification !==
                              "submitted" && (
                              <form
                                action={
                                  submitWinnerProof
                                }
                                className="rounded-2xl border border-white/[0.08] bg-black/10 p-5"
                              >
                                <input
                                  type="hidden"
                                  name="winnerId"
                                  value={
                                    winner.id
                                  }
                                />

                                <div className="flex items-center gap-3">
                                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-teal-300/10 text-teal-300">
                                    <Upload className="h-4 w-4" />
                                  </div>

                                  <div>
                                    <p className="text-sm font-bold">
                                      Submit score proof
                                    </p>

                                    <p className="mt-0.5 text-xs text-white/35">
                                      Upload a screenshot for verification.
                                    </p>
                                  </div>
                                </div>

                                <input
                                  name="proof"
                                  type="file"
                                  accept="image/*"
                                  required
                                  className="mt-5 block w-full rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 text-xs text-white/50 file:mr-3 file:rounded-lg file:border-0 file:bg-white/[0.08] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white"
                                />

                                <button
                                  type="submit"
                                  className="mt-4 w-full rounded-xl bg-emerald-400 px-4 py-3 text-sm font-bold text-[#06100b] transition hover:-translate-y-0.5 hover:bg-emerald-300"
                                >
                                  Submit proof
                                </button>
                              </form>
                            )}

                          {verification ===
                            "rejected" && (
                            <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/[0.04] p-4">
                              <p className="text-sm font-semibold text-red-300">
                                Your previous proof was rejected.
                              </p>

                              <p className="mt-1 text-xs leading-5 text-white/40">
                                Please submit a clearer
                                screenshot.
                              </p>
                            </div>
                          )}

                          {winner.proof_path && (
                            <a
                              href={
                                winner.proof_path
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.08] px-4 py-3 text-sm font-semibold text-white/60 transition hover:border-teal-300/30 hover:bg-teal-300/[0.04] hover:text-teal-300"
                            >
                              <FileCheck2 className="h-4 w-4" />
                              View submitted proof
                            </a>
                          )}

                          {verification ===
                            "approved" && (
                            <div className="flex items-center gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.045] p-5">
                              <CheckCircle2 className="h-5 w-5 text-emerald-300" />

                              <div>
                                <p className="text-sm font-bold text-emerald-300">
                                  Proof approved
                                </p>

                                <p className="mt-1 text-xs text-white/35">
                                  Your winning entry has been verified.
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          )}
        </section>

        {/* Bottom message */}
        <div className="mt-8 flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 text-sm text-white/40">
          <Sparkles className="h-4 w-4 text-amber-300" />

          <p>
            GoodSwing rewards participation while keeping your
            experience connected to purpose.
          </p>
        </div>
      </div>
    </main>
  );
}