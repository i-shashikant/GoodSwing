"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  CalendarDays,
  Check,
  Plus,
  Save,
  Trash2,
  Trophy,
  UserRound,
} from "lucide-react";

import {
  updateProfile,
  saveScore,
  removeScore,
  setMembership,
} from "@/app/admin/users/[id]/actions";

type Score = {
  id: string;
  score: number;
  played_at: string;
};

export function UserEditor({
  userId,
  fullName,
  email,
  scores,
  membership,
}: {
  userId: string;
  fullName: string;
  email: string;
  scores: Score[];
  membership: string;
}) {
  const [pending, start] = useTransition();

  const [name, setName] = useState(fullName);

  const [newScore, setNewScore] = useState("");
  const [newDate, setNewDate] = useState("");

  const [edits, setEdits] = useState<
    Record<string, { score: string; date: string }>
  >({});

  const today = new Date().toISOString().slice(0, 10);

  const run = (
    fn: () => Promise<{ error?: string }>,
    successMessage: string,
    after?: () => void
  ) => {
    start(async () => {
      const result = await fn();

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(successMessage);
      after?.();
    });
  };

  const inputClass =
    "h-11 rounded-xl border border-black/10 bg-[#f8f8f5] px-3.5 text-sm outline-none transition placeholder:text-black/30 focus:border-[#176b45] focus:bg-white focus:ring-4 focus:ring-emerald-700/10";

  const membershipActive = membership === "active";

  return (
    <div className="mt-8 grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
      {/* =========================================================
          PROFILE / MEMBERSHIP
          ========================================================= */}
      <section className="overflow-hidden rounded-3xl border border-black/10 bg-white">
        <div className="border-b border-black/10 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#e5f2eb] text-[#176b45]">
              <UserRound className="h-4 w-4" />
            </div>

            <div>
              <p className="eyebrow text-[#176b45]">Member profile</p>
              <h2 className="mt-0.5 text-lg font-semibold">
                Account details
              </h2>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-black/40">
              Email
            </label>

            <div className="rounded-xl border border-black/10 bg-black/[0.025] px-4 py-3 text-sm text-black/60">
              {email}
            </div>
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-black/40">
              Full name
            </label>

            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className={`${inputClass} flex-1`}
                placeholder="Member name"
              />

              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  run(
                    () => updateProfile(userId, name),
                    "Profile updated"
                  )
                }
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#176b45] px-5 text-sm font-semibold text-white transition hover:bg-[#0f4d32] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                Save
              </button>
            </div>
          </div>

          {/* Membership card */}
          <div className="mt-8 rounded-2xl bg-[#123d2d] p-5 text-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-100/50">
                  Membership
                </p>

                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      membershipActive
                        ? "bg-emerald-300"
                        : "bg-white/25"
                    }`}
                  />

                  <p className="font-semibold capitalize">
                    {membership}
                  </p>
                </div>
              </div>

              <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-100/60">
                {membershipActive ? "Current" : "Inactive"}
              </span>
            </div>

            <div className="mt-5 border-t border-white/10 pt-4">
              <button
                type="button"
                disabled={pending || membership === "none"}
                onClick={() =>
                  run(
                    () =>
                      setMembership(
                        userId,
                        membershipActive ? "expired" : "active"
                      ),
                    membershipActive
                      ? "Membership expired"
                      : "Membership activated"
                  )
                }
                className="w-full rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#123d2d] transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {membershipActive
                  ? "Expire membership"
                  : "Activate membership"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          GOLF SCORES
          ========================================================= */}
      <section className="overflow-hidden rounded-3xl border border-black/10 bg-white">
        <div className="border-b border-black/10 px-6 py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#e5f2eb] text-[#176b45]">
                <CalendarDays className="h-4 w-4" />
              </div>

              <div>
                <p className="eyebrow text-[#176b45]">
                  Member activity
                </p>

                <h2 className="mt-0.5 text-lg font-semibold">
                  Golf scores
                </h2>
              </div>
            </div>

            <div className="rounded-full bg-black/[0.035] px-3 py-1.5 text-xs font-medium text-black/50">
              {scores.length} / 5 recorded
            </div>
          </div>

          <p className="mt-3 text-sm leading-5 text-black/45">
            The five most recent Stableford scores are retained. Adding a new
            sixth score automatically removes the oldest one.
          </p>
        </div>

        <div className="p-6">
          {/* Existing scores */}
          <div className="space-y-3">
            {scores.map((score, index) => {
              const existing = edits[score.id] ?? {
                score: String(score.score),
                date: score.played_at,
              };

              const updateEdit = (
                patch: Partial<typeof existing>
              ) => {
                setEdits((current) => ({
                  ...current,
                  [score.id]: {
                    ...existing,
                    ...patch,
                  },
                }));
              };

              return (
                <div
                  key={score.id}
                  className="rounded-2xl border border-black/10 bg-[#fafaf7] p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    {/* Number */}
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#123d2d] text-xs font-bold text-white">
                      {index + 1}
                    </div>

                    {/* Score */}
                    <div className="w-full sm:w-24">
                      <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-black/35">
                        Score
                      </label>

                      <input
                        type="number"
                        min={1}
                        max={45}
                        value={existing.score}
                        onChange={(event) =>
                          updateEdit({
                            score: event.target.value,
                          })
                        }
                        className={`${inputClass} w-full`}
                      />
                    </div>

                    {/* Date */}
                    <div className="flex-1">
                      <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-black/35">
                        Played on
                      </label>

                      <input
                        type="date"
                        max={today}
                        value={existing.date}
                        onChange={(event) =>
                          updateEdit({
                            date: event.target.value,
                          })
                        }
                        className={`${inputClass} w-full`}
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex items-end gap-2 sm:pt-5">
                      <button
                        type="button"
                        disabled={pending}
                        aria-label="Save score"
                        title="Save score"
                        onClick={() =>
                          run(
                            () =>
                              saveScore({
                                userId,
                                scoreId: score.id,
                                score: Number(existing.score),
                                playedAt: existing.date,
                              }),
                            "Score updated"
                          )
                        }
                        className="grid h-11 w-11 place-items-center rounded-xl border border-emerald-600/20 text-[#176b45] transition hover:bg-emerald-50 disabled:opacity-50"
                      >
                        <Save className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        disabled={pending}
                        aria-label="Delete score"
                        title="Delete score"
                        onClick={() => {
                          if (
                            !window.confirm(
                              "Delete this golf score?"
                            )
                          ) {
                            return;
                          }

                          run(
                            () =>
                              removeScore(
                                userId,
                                score.id
                              ),
                            "Score deleted"
                          );
                        }}
                        className="grid h-11 w-11 place-items-center rounded-xl border border-red-500/20 text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {!scores.length && (
              <div className="rounded-2xl border border-dashed border-black/15 bg-black/[0.015] px-6 py-10 text-center">
                <div className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-[#e5f2eb] text-[#176b45]">
                  <CalendarDays className="h-5 w-5" />
                </div>

                <h3 className="mt-3 text-sm font-semibold">
                  No golf scores yet
                </h3>

                <p className="mt-1 text-xs text-black/45">
                  Add the member's first Stableford score below.
                </p>
              </div>
            )}
          </div>

          {/* Add score */}
          <div className="mt-5 border-t border-black/10 pt-5">
            <div className="mb-3">
              <p className="text-sm font-semibold">
                Add a score
              </p>

              <p className="mt-0.5 text-xs text-black/45">
                Score must be between 1 and 45.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="sm:w-28">
                <input
                  type="number"
                  min={1}
                  max={45}
                  placeholder="1–45"
                  value={newScore}
                  onChange={(event) =>
                    setNewScore(event.target.value)
                  }
                  className={`${inputClass} w-full`}
                />
              </div>

              <div className="flex-1">
                <input
                  type="date"
                  max={today}
                  value={newDate}
                  onChange={(event) =>
                    setNewDate(event.target.value)
                  }
                  className={`${inputClass} w-full`}
                />
              </div>

              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  run(
                    () =>
                      saveScore({
                        userId,
                        score: Number(newScore),
                        playedAt: newDate,
                      }),
                    "Score added",
                    () => {
                      setNewScore("");
                      setNewDate("");
                    }
                  )
                }
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#176b45] px-5 text-sm font-semibold text-white transition hover:bg-[#0f4d32] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                Add score
              </button>
            </div>
          </div>

          {/* Small info footer */}
          <div className="mt-5 flex items-start gap-3 rounded-2xl bg-[#f7f7f2] p-4">
            <Trophy className="mt-0.5 h-4 w-4 shrink-0 text-[#176b45]" />

            <p className="text-xs leading-5 text-black/50">
              These scores are used by the GoodSwing draw engine when
              calculating member eligibility and, where applicable, the
              algorithmic draw weighting.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}