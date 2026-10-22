
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type Score = {
  id: string;
  score: number;
  played_at: string;
};

export default async function ScoresPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: scores, error } = await supabase
    .from("scores")
    .select("id, score, played_at")
    .eq("user_id", user.id)
    .order("played_at", { ascending: false })
    .limit(5);

  if (error) {
    throw new Error("Unable to load your scores.");
  }

  const currentScores = (scores ?? []) as Score[];
  const scoreCount = currentScores.length;
  const isReady = scoreCount === 5;

  return (
    <main className="min-h-screen px-6 py-10 md:px-10">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <header className="border-b pb-8">
          <Link
            href="/dashboard"
            className="text-sm text-muted-foreground transition hover:text-foreground"
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
            Add your latest five Stableford scores. These scores are used to
            determine your eligibility for the monthly GoodSwing draw.
          </p>
        </header>

        {/* Status */}
        <section className="mt-8 grid gap-5 md:grid-cols-3">
          <div className="rounded-2xl border p-6 md:col-span-2">
            <p className="text-sm text-muted-foreground">
              Draw eligibility
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-semibold">
                {isReady ? "You're ready to play" : "Keep adding scores"}
              </h2>

              <span
                className={`rounded-full border px-3 py-1 text-xs font-medium ${
                  isReady ? "border-green-500/40" : ""
                }`}
              >
                {scoreCount}/5 scores
              </span>
            </div>

            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {isReady
                ? "You have five recorded scores and can be considered for the monthly draw while your membership is active."
                : `You need ${5 - scoreCount} more ${
                    5 - scoreCount === 1 ? "score" : "scores"
                  } before you can participate in the draw.`}
            </p>
          </div>

          <div className="rounded-2xl border p-6">
            <p className="text-sm text-muted-foreground">
              Scores stored
            </p>

            <p className="mt-2 text-4xl font-semibold">
              {scoreCount}
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Latest five are kept
            </p>
          </div>
        </section>

        {/* Add score */}
        <section className="mt-8 rounded-2xl border p-6">
          <div>
            <p className="text-sm text-muted-foreground">
              Add a round
            </p>

            <h2 className="mt-1 text-2xl font-semibold">
              Record a Stableford score
            </h2>

            <p className="mt-2 text-sm text-muted-foreground">
              Enter a score from 1 to 45 and the date you played.
            </p>
          </div>

          <form
            action="/dashboard/scores"
            method="post"
            className="mt-6 grid gap-4 sm:grid-cols-[1fr_1fr_auto]"
          >
            <div>
              <label
                htmlFor="score"
                className="mb-2 block text-sm font-medium"
              >
                Stableford score
              </label>

              <input
                id="score"
                name="score"
                type="number"
                min="1"
                max="45"
                required
                placeholder="e.g. 36"
                className="w-full rounded-xl border bg-transparent px-4 py-3 text-sm outline-none transition focus:border-foreground"
              />
            </div>

            <div>
              <label
                htmlFor="played_at"
                className="mb-2 block text-sm font-medium"
              >
                Date played
              </label>

              <input
                id="played_at"
                name="played_at"
                type="date"
                required
                className="w-full rounded-xl border bg-transparent px-4 py-3 text-sm outline-none transition focus:border-foreground"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full rounded-xl bg-foreground px-5 py-3 text-sm font-medium text-background transition hover:opacity-90 sm:w-auto"
              >
                Add score
              </button>
            </div>
          </form>

          <p className="mt-4 text-xs text-muted-foreground">
            You can only have one score for a given date. When you add a
            sixth round, your oldest score is automatically removed.
          </p>
        </section>

        {/* Score history */}
        <section className="mt-8 rounded-2xl border p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Score history
              </p>

              <h2 className="mt-1 text-2xl font-semibold">
                Your latest rounds
              </h2>
            </div>

            <span className="text-sm text-muted-foreground">
              {scoreCount} of 5
            </span>
          </div>

          {currentScores.length > 0 ? (
            <div className="mt-6 overflow-hidden rounded-xl border">
              {currentScores.map((score, index) => (
                <div
                  key={score.id}
                  className={`flex items-center justify-between px-5 py-4 transition hover:bg-muted/40 ${
                    index !== currentScores.length - 1
                      ? "border-b"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold">
                      {index + 1}
                    </div>

                    <div>
                      <p className="font-medium">
                        Stableford round
                      </p>

                      <p className="text-xs text-muted-foreground">
                        {new Date(
                          `${score.played_at}T00:00:00`
                        ).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-semibold">
                      {score.score}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      points
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-xl border border-dashed p-8 text-center">
              <p className="font-medium">
                No scores yet.
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Add your first Stableford round above.
              </p>
            </div>
          )}
        </section>

        {/* Draw explanation */}
        <section className="mt-8 rounded-2xl border p-6">
          <p className="text-sm text-muted-foreground">
            How it works
          </p>

          <h2 className="mt-1 text-2xl font-semibold">
            Your scores power the draw
          </h2>

          <div className="mt-6 grid gap-5 sm:grid-cols-3">
            <div>
              <p className="text-lg font-semibold">01</p>
              <p className="mt-2 text-sm font-medium">
                Record five rounds
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Keep your latest five Stableford scores up to date.
              </p>
            </div>

            <div>
              <p className="text-lg font-semibold">02</p>
              <p className="mt-2 text-sm font-medium">
                Stay active
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                An active GoodSwing membership is required on draw day.
              </p>
            </div>

            <div>
              <p className="text-lg font-semibold">03</p>
              <p className="mt-2 text-sm font-medium">
                Enter the draw
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Your five scores become your entry for the monthly draw.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
