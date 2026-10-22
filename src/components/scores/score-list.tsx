"use client";

import { useState, useTransition } from "react";
import { deleteScore, updateScore } from "@/app/dashboard/scores/actions";
import { toast } from "sonner";
import { Edit2, Trash2, X, Check } from "lucide-react";

type Score = {
  id: string;
  score: number;
  played_at: string;
};

export function ScoreList({ scores }: { scores: Score[] }) {
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editScoreValue, setEditScoreValue] = useState<number>(30);
  const [editDateValue, setEditDateValue] = useState<string>("");

  function startEdit(score: Score) {
    setEditingId(score.id);
    setEditScoreValue(score.score);
    setEditDateValue(score.played_at);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  function handleSaveEdit(id: string) {
    const formData = new FormData();
    formData.append("score", String(editScoreValue));
    formData.append("playedAt", editDateValue);

    startTransition(async () => {
      try {
        await updateScore(id, formData);
        setEditingId(null);
        toast.success("Score updated successfully");
      } catch (error) {
        toast.error("Couldn't update score", {
          description:
            error instanceof Error ? error.message : "Something went wrong.",
        });
      }
    });
  }

  function handleDelete(id: string) {
    if (!window.confirm("Are you sure you want to delete this score?")) return;

    startTransition(async () => {
      try {
        await deleteScore(id);
        toast.success("Score deleted");
      } catch (error) {
        toast.error("Couldn't delete score", {
          description:
            error instanceof Error ? error.message : "Something went wrong.",
        });
      }
    });
  }

  return (
    <div className="rounded-2xl border p-6">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="text-sm font-medium">Your recent rounds</p>
          <h2 className="mt-1 text-2xl font-semibold">Score history</h2>
        </div>

        <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
          {scores.length} / 5 rounds stored
        </span>
      </div>

      {scores.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <p className="font-medium">No scores logged yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter your Stableford scores above to participate in GoodSwing.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {scores.map((score, index) => {
            const isEditing = editingId === score.id;

            if (isEditing) {
              return (
                <div
                  key={score.id}
                  className="rounded-xl border border-foreground/30 bg-muted/30 p-4"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-3">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-muted-foreground">
                          Score (1–45)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="45"
                          value={editScoreValue}
                          onChange={(e) => setEditScoreValue(Number(e.target.value))}
                          className="w-24 rounded-lg border bg-background px-3 py-1.5 text-sm font-semibold outline-none focus:ring-2"
                          disabled={isPending}
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-medium text-muted-foreground">
                          Date played
                        </label>
                        <input
                          type="date"
                          max={new Date().toISOString().split("T")[0]}
                          value={editDateValue}
                          onChange={(e) => setEditDateValue(e.target.value)}
                          className="rounded-lg border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2"
                          disabled={isPending}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(score.id)}
                        disabled={isPending}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:opacity-90 disabled:opacity-50"
                      >
                        <Check className="h-3.5 w-3.5" />
                        {isPending ? "Saving..." : "Save"}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        disabled={isPending}
                        className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                      >
                        <X className="h-3.5 w-3.5" />
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={score.id}
                className="flex items-center justify-between rounded-xl border p-4 transition hover:bg-muted/10"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-lg font-bold">
                    {score.score}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">Stableford {score.score}</p>
                      {index === 0 && (
                        <span className="rounded-full bg-foreground px-2.5 py-0.5 text-[11px] font-medium text-background">
                          Latest
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(`${score.played_at}T00:00:00`).toLocaleDateString(
                        "en-IN",
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        }
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => startEdit(score)}
                    disabled={isPending}
                    className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground disabled:opacity-50"
                    title="Edit score or date"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Edit</span>
                  </button>

                  <button
                    onClick={() => handleDelete(score.id)}
                    disabled={isPending}
                    className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-red-200 hover:text-red-600 disabled:opacity-50"
                    title="Delete score"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}