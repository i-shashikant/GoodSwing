import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";

import { requireSubscriber } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

import { ScoreForm } from "@/components/scores/score-form";
import { ScoreList } from "@/components/scores/score-list";

export default async function ScoresPage() {
  // -------------------------------------------------------------
  // Authentication
  // -------------------------------------------------------------
  // Only active subscribers should be able to manage scores.
  const user = await requireSubscriber();

  // -------------------------------------------------------------
  // Supabase
  // -------------------------------------------------------------
  const supabase = await createClient();

  // Fetch the five most recent Stableford rounds.
  const { data: scores, error } = await supabase
    .from("scores")
    .select("id, score, played_at")
    .eq("user_id", user.id)
    .order("played_at", { ascending: false })
    .limit(5);

  // Surface database errors instead of rendering broken data.
  if (error) {
    throw new Error("Unable to load your scores.");
  }

  const currentScores = scores ?? [];

  // Five scores are required for draw eligibility.
  const isReady = currentScores.length === 5;

  // Calculate a useful average for the dashboard.
  const averageScore =
    currentScores.length > 0
      ? Math.round(
          currentScores.reduce(
            (total, item) => total + Number(item.score),
            0
          ) / currentScores.length
        )
      : 0;

  const progress = Math.min(
    (currentScores.length / 5) * 100,
    100
  );

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080c0a] text-white">
      {/* =========================================================
          AMBIENT BACKGROUND
          ========================================================= */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-20 h-96 w-96 rounded-full bg-emerald-500/10 blur-[120px]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-0 h-[420px] w-[420px] rounded-full bg-teal-400/[0.07] blur-[130px]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-amber-300/[0.035] blur-[120px]"
      />

      <div className="relative mx-auto max-w-7xl px-5 py-8 md:px-10 md:py-12">
        {/* =========================================================
            HEADER
            ========================================================= */}

        <header className="border-b border-white/[0.08] pb-10">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-white/50 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>

          <div className="mt-10 max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.8)]" />
              Your game
            </div>

            <h1 className="mt-4 text-4xl font-bold tracking-[-0.04em] md:text-6xl">
              Your scores.
              <br />
              <span className="text-emerald-400">
                Your progress.
              </span>
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-white/55 md:text-lg">
              Keep your latest five Stableford rounds ready for
              GoodSwing. Your scores help unlock your participation
              in the monthly draw.
            </p>
          </div>
        </header>

        {/* =========================================================
            PERFORMANCE OVERVIEW
            ========================================================= */}

        <section className="mt-8 grid gap-4 lg:grid-cols-[1.5fr_0.75fr_0.75fr]">
          {/* Eligibility */}
          <div className="relative overflow-hidden rounded-3xl border border-emerald-400/20 bg-emerald-400/[0.055] p-7">
            <div
              aria-hidden="true"
              className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-400/10 blur-3xl"
            />

            <div className="relative">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-400/10 text-emerald-300">
                    {isReady ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Target className="h-5 w-5" />
                    )}
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/40">
                      Draw eligibility
                    </p>

                    <p className="mt-1 text-sm text-emerald-300">
                      {isReady
                        ? "You're ready"
                        : "Almost there"}
                    </p>
                  </div>
                </div>

                <span className="rounded-full border border-emerald-400/20 bg-black/20 px-3 py-1 text-xs font-semibold text-emerald-300">
                  {currentScores.length}/5
                </span>
              </div>

              <h2 className="mt-8 text-2xl font-bold md:text-3xl">
                {isReady
                  ? "You're ready to play."
                  : "Keep adding your rounds."}
              </h2>

              <p className="mt-3 max-w-xl text-sm leading-6 text-white/50">
                {isReady
                  ? "You've recorded the five scores needed for monthly draw eligibility."
                  : `Add ${
                      5 - currentScores.length
                    } more ${
                      5 - currentScores.length === 1
                        ? "score"
                        : "scores"
                    } to complete your profile.`}
              </p>

              {/* Progress bar */}
              <div className="mt-7">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="text-white/35">
                    Profile progress
                  </span>
                  <span className="font-semibold text-emerald-300">
                    {Math.round(progress)}%
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-300 transition-all duration-700"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Score count */}
          <div className="rounded-3xl border border-white/[0.09] bg-white/[0.025] p-7 transition duration-300 hover:border-emerald-400/20 hover:bg-white/[0.04]">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-teal-400/10 text-teal-300">
              <BarChart3 className="h-5 w-5" />
            </div>

            <p className="mt-8 text-xs font-bold uppercase tracking-[0.18em] text-white/40">
              Scores stored
            </p>

            <p className="mt-2 text-5xl font-bold tracking-tight">
              {currentScores.length}
            </p>

            <p className="mt-2 text-sm text-white/40">
              Latest five are kept
            </p>
          </div>

          {/* Average */}
          <div className="rounded-3xl border border-white/[0.09] bg-white/[0.025] p-7 transition duration-300 hover:border-amber-300/20 hover:bg-white/[0.04]">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-300/10 text-amber-300">
              <Trophy className="h-5 w-5" />
            </div>

            <p className="mt-8 text-xs font-bold uppercase tracking-[0.18em] text-white/40">
              Average
            </p>

            <p className="mt-2 text-5xl font-bold tracking-tight">
              {averageScore || "—"}
            </p>

            <p className="mt-2 text-sm text-white/40">
              Stableford points
            </p>
          </div>
        </section>

        {/* =========================================================
            SCORE ENTRY
            ========================================================= */}

        <section className="mt-8">
          <ScoreForm />
        </section>

        {/* =========================================================
            SCORE HISTORY
            ========================================================= */}

        <section className="mt-8">
          <ScoreList scores={currentScores} />
        </section>

        {/* =========================================================
            FOOTER MESSAGE
            ========================================================= */}

        <div className="mt-8 flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 text-sm text-white/45">
          <Sparkles className="h-4 w-4 shrink-0 text-emerald-400" />

          <p>
            Your scores are more than numbers — they help connect
            your game to the GoodSwing reward experience.
          </p>
        </div>
      </div>
    </main>
  );
}