import Link from "next/link";
import { requireSubscriber } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ScoreForm } from "@/components/scores/score-form";
import { ScoreList } from "@/components/scores/score-list";

export default async function ScoresPage() {
  // Ensure that only active subscribers can access the scores page.
  const user = await requireSubscriber();

  // Create a Supabase server client.
  const supabase = await createClient();

  // Fetch the user's five most recent Stableford scores.
  const { data: scores, error } = await supabase
    .from("scores")
    .select("id, score, played_at")
    .eq("user_id", user.id)
    .order("played_at", { ascending: false })
    .limit(5);

  // Handle database errors.
  if (error) {
    throw new Error("Unable to load your scores.");
  }

  // Use an empty array when no scores have been recorded yet.
  const currentScores = scores ?? [];

  // A subscriber becomes eligible for the draw after
  // recording five Stableford scores.
  const isReady = currentScores.length === 5;

  return (
    <main className="min-h-screen px-6 py-10 md:px-10">
      <div className="mx-auto max-w-5xl">

        {/* =========================================================
            PAGE HEADER
            ========================================================= */}
        <header className="border-b pb-8">

          {/* Back to dashboard */}
          <Link
            href="/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Dashboard
          </Link>

          <p className="mt-8 text-sm font-medium text-muted-foreground">
            Your game
          </p>

          <h1 className="mt-2 text-4xl font-semibold tracking-tight">
            Stableford scores
          </h1>

          <p className="mt-3 max-w-2xl text-muted-foreground">
            Keep your latest five Stableford rounds. One score per date;
            adding a sixth round automatically removes the oldest.
          </p>
        </header>

        {/* =========================================================
            DRAW ELIGIBILITY SUMMARY
            ========================================================= */}
        <section className="mt-8 grid gap-5 md:grid-cols-3">

          {/* Eligibility status */}
          <div className="rounded-2xl border p-6 md:col-span-2">
            <p className="text-sm text-muted-foreground">
              Draw eligibility
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-semibold">
                {isReady
                  ? "You're ready to play"
                  : "Keep adding scores"}
              </h2>

              {/* Current score count */}
              <span className="rounded-full border px-3 py-1 text-xs font-medium">
                {currentScores.length}/5 scores
              </span>
            </div>

            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {isReady
                ? "With five scores and an active membership, you'll be eligible for the monthly draw."
                : `You need ${
                    5 - currentScores.length
                  } more ${
                    5 - currentScores.length === 1
                      ? "score"
                      : "scores"
                  } before you can participate.`}
            </p>
          </div>

          {/* Number of stored scores */}
          <div className="rounded-2xl border p-6">
            <p className="text-sm text-muted-foreground">
              Scores stored
            </p>

            <p className="mt-2 text-4xl font-semibold">
              {currentScores.length}
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Latest five are kept
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
      </div>
    </main>
  );
}