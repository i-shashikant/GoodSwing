"use client";

import { useRef, useTransition } from "react";
import {
  CalendarDays,
  Plus,
  Sparkles,
} from "lucide-react";

import { addScore } from "@/app/dashboard/scores/actions";
import { toast } from "sonner";

export function ScoreForm() {
  const [isPending, startTransition] = useTransition();

  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await addScore(formData);

        formRef.current?.reset();

        toast.success("Score added", {
          description:
            "Your round has been added to your GoodSwing profile.",
        });
      } catch (error) {
        toast.error("Couldn't add score", {
          description:
            error instanceof Error
              ? error.message
              : "Something went wrong.",
        });
      }
    });
  }

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="relative overflow-hidden rounded-3xl border border-white/[0.09] bg-white/[0.025] p-6 md:p-8"
    >
      {/* Ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-emerald-400/[0.07] blur-3xl"
      />

      <div className="relative">
        {/* Header */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-400">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-400/10">
                <Plus className="h-3.5 w-3.5" />
              </span>

              Add a round
            </div>

            <h2 className="mt-4 text-2xl font-bold tracking-tight md:text-3xl">
              Record your Stableford score
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-white/45">
              Keep your five most recent rounds ready for
              GoodSwing.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.025] px-3 py-2 text-xs text-white/45">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            1–45 points
          </div>
        </div>

        {/* Inputs */}
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {/* Score */}
          <div>
            <label
              htmlFor="score"
              className="mb-2 block text-sm font-semibold text-white/80"
            >
              Stableford score
            </label>

            <div className="relative">
              <input
                id="score"
                name="score"
                type="number"
                min="1"
                max="45"
                required
                disabled={isPending}
                placeholder="32"
                className="w-full rounded-2xl border border-white/[0.1] bg-black/20 px-5 py-4 text-lg font-semibold text-white outline-none transition placeholder:text-white/20 focus:border-emerald-400/60 focus:bg-emerald-400/[0.025] focus:ring-4 focus:ring-emerald-400/10 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <p className="mt-2 text-xs text-white/30">
              Enter a score from 1 to 45.
            </p>
          </div>

          {/* Date */}
          <div>
            <label
              htmlFor="playedAt"
              className="mb-2 block text-sm font-semibold text-white/80"
            >
              Date played
            </label>

            <div className="relative">
              <CalendarDays className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/30" />

              <input
                id="playedAt"
                name="playedAt"
                type="date"
                required
                max={
                  new Date()
                    .toISOString()
                    .split("T")[0]
                }
                disabled={isPending}
                className="w-full rounded-2xl border border-white/[0.1] bg-black/20 px-5 py-4 text-white outline-none transition focus:border-teal-400/60 focus:bg-teal-400/[0.025] focus:ring-4 focus:ring-teal-400/10 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-white/30">
            Your latest five rounds are used for GoodSwing draw
            eligibility.
          </p>

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-6 py-3.5 text-sm font-bold text-[#06100b] shadow-[0_0_30px_rgba(52,211,153,0.15)] transition duration-200 hover:-translate-y-0.5 hover:bg-emerald-300 hover:shadow-[0_0_40px_rgba(52,211,153,0.25)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "Adding score..." : "Add score"}

            {!isPending && (
              <Plus className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </form>
  );
}