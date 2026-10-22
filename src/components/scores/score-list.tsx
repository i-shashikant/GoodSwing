"use client";

import { useState, useTransition } from "react";
import {
  CalendarDays,
  Check,
  Edit2,
  History,
  Trash2,
  Trophy,
  X,
} from "lucide-react";

import {
  deleteScore,
  updateScore,
} from "@/app/dashboard/scores/actions";

import { toast } from "sonner";

type Score = {
  id: string;
  score: number;
  played_at: string;
};

export function ScoreList({
  scores,
}: {
  scores: Score[];
}) {
  const [isPending, startTransition] =
    useTransition();

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [editScoreValue, setEditScoreValue] =
    useState<number>(30);

  const [editDateValue, setEditDateValue] =
    useState<string>("");

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

    formData.append(
      "score",
      String(editScoreValue)
    );

    formData.append(
      "playedAt",
      editDateValue
    );

    startTransition(async () => {
      try {
        await updateScore(id, formData);

        setEditingId(null);

        toast.success(
          "Score updated successfully"
        );
      } catch (error) {
        toast.error("Couldn't update score", {
          description:
            error instanceof Error
              ? error.message
              : "Something went wrong.",
        });
      }
    });
  }

  function handleDelete(id: string) {
    if (
      !window.confirm(
        "Are you sure you want to delete this score?"
      )
    ) {
      return;
    }

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
    <div className="overflow-hidden rounded-3xl border border-white/[0.09] bg-white/[0.025]">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-white/[0.07] p-6 md:flex-row md:items-end md:justify-between md:p-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-white/40">
            <History className="h-4 w-4 text-teal-300" />
            Your recent rounds
          </div>

          <h2 className="mt-3 text-2xl font-bold">
            Score history
          </h2>

          <p className="mt-2 text-sm text-white/40">
            Your five latest Stableford rounds.
          </p>
        </div>

        <span className="w-fit rounded-full border border-white/[0.08] bg-white/[0.025] px-3 py-1.5 text-xs font-semibold text-white/50">
          {scores.length} / 5 rounds
        </span>
      </div>

      {/* Empty state */}
      {scores.length === 0 ? (
        <div className="p-10 text-center md:p-16">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-400/10 text-emerald-300">
            <Trophy className="h-6 w-6" />
          </div>

          <h3 className="mt-5 text-lg font-bold">
            No scores logged yet.
          </h3>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/40">
            Add your first Stableford round above and
            start building your GoodSwing profile.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-white/[0.06]">
          {scores.map((score, index) => {
            const isEditing =
              editingId === score.id;

            if (isEditing) {
              return (
                <div
                  key={score.id}
                  className="bg-emerald-400/[0.025] p-5 md:p-6"
                >
                  <div className="grid gap-5 md:grid-cols-[1fr_1fr_auto] md:items-end">
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/40">
                        Score
                      </label>

                      <input
                        type="number"
                        min="1"
                        max="45"
                        value={editScoreValue}
                        onChange={(e) =>
                          setEditScoreValue(
                            Number(e.target.value)
                          )
                        }
                        disabled={isPending}
                        className="w-full rounded-xl border border-white/[0.1] bg-black/20 px-4 py-3 text-white outline-none focus:border-emerald-400/60"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/40">
                        Date played
                      </label>

                      <input
                        type="date"
                        max={
                          new Date()
                            .toISOString()
                            .split("T")[0]
                        }
                        value={editDateValue}
                        onChange={(e) =>
                          setEditDateValue(
                            e.target.value
                          )
                        }
                        disabled={isPending}
                        className="w-full rounded-xl border border-white/[0.1] bg-black/20 px-4 py-3 text-white outline-none focus:border-teal-400/60"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleSaveEdit(
                            score.id
                          )
                        }
                        disabled={isPending}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 text-sm font-bold text-[#06100b] transition hover:bg-emerald-300 disabled:opacity-50"
                      >
                        <Check className="h-4 w-4" />
                        Save
                      </button>

                      <button
                        type="button"
                        onClick={cancelEdit}
                        disabled={isPending}
                        className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] px-4 py-3 text-sm font-semibold text-white/60 transition hover:bg-white/[0.04] hover:text-white disabled:opacity-50"
                      >
                        <X className="h-4 w-4" />
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
                className="group flex flex-col gap-5 p-5 transition duration-200 hover:bg-white/[0.025] md:flex-row md:items-center md:justify-between md:p-6"
              >
                <div className="flex items-center gap-4">
                  {/* Score bubble */}
                  <div className="relative grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.07]">
                    <span className="text-xl font-bold text-emerald-300">
                      {score.score}
                    </span>

                    {index === 0 && (
                      <span className="absolute -right-2 -top-2 rounded-full bg-emerald-400 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-[#06100b]">
                        New
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold">
                        Stableford {score.score}
                      </p>

                      {index === 0 && (
                        <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white/45">
                          Latest
                        </span>
                      )}
                    </div>

                    <p className="mt-1 flex items-center gap-1.5 text-xs text-white/35">
                      <CalendarDays className="h-3.5 w-3.5" />

                      {new Date(
                        `${score.played_at}T00:00:00`
                      ).toLocaleDateString(
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

                {/* Actions */}
                <div className="flex items-center gap-2 md:opacity-60 md:transition md:group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() =>
                      startEdit(score)
                    }
                    disabled={isPending}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] px-3 py-2 text-xs font-semibold text-white/55 transition hover:border-emerald-400/30 hover:bg-emerald-400/[0.05] hover:text-emerald-300 disabled:opacity-50"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleDelete(score.id)
                    }
                    disabled={isPending}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] px-3 py-2 text-xs font-semibold text-white/40 transition hover:border-red-400/30 hover:bg-red-400/[0.05] hover:text-red-300 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
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