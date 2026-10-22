"use client";

import { useTransition } from "react";
import { deleteScore } from "@/app/dashboard/scores/actions";
import { toast } from "sonner";

type Score = {
  id: string;
  score: number;
  played_at: string;
};

export function ScoreList({ scores }: { scores: Score[] }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete(id: string) {
    if (!window.confirm("Delete this score?")) return;

    startTransition(async () => {
      try {
        await deleteScore(id);

        toast.success("Score deleted");
      } catch (error) {
        toast.error("Couldn't delete score", {
          description:
            error instanceof Error
              ? error.message
              : "Something went wrong.",
        });
      }
    });
  }

  return (
    <div className="rounded-2xl border p-6">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="text-sm font-medium">
            Your recent rounds
          </p>

          <h2 className="mt-1 text-2xl font-semibold">
            Score history
          </h2>
        </div>

        <span className="text-sm text-muted-foreground">
          {scores.length} / 5
        </span>
      </div>

      {scores.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <p className="font-medium">No scores yet</p>

          <p className="mt-1 text-sm text-muted-foreground">
            Add your first round above.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {scores.map((score, index) => (
            <div
              key={score.id}
              className="flex items-center justify-between rounded-xl border p-4"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-lg font-semibold">
                  {score.score}
                </div>

                <div>
                  <p className="font-medium">
                    Stableford {score.score}
                  </p>

                  <p className="text-sm text-muted-foreground">
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

              <div className="flex items-center gap-3">
                {index === 0 && (
                  <span className="hidden rounded-full bg-foreground px-3 py-1 text-xs text-background sm:inline">
                    Latest
                  </span>
                )}

                <button
                  onClick={() => handleDelete(score.id)}
                  disabled={isPending}
                  className="text-sm text-muted-foreground transition hover:text-red-500 disabled:opacity-50"
                >
                  {isPending ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}