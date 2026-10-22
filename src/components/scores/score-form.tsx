"use client";

import { useState } from "react";
import { addScore } from "@/app/dashboard/scores/actions";

export function ScoreForm() {
  const [error, setError] = useState("");

  async function handleSubmit(formData: FormData) {
    setError("");

    try {
      await addScore(formData);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    }
  }

  return (
    <form
      action={handleSubmit}
      className="rounded-2xl border p-6"
    >
      <div className="mb-6">
        <p className="text-sm font-medium">Add a round</p>

        <h2 className="mt-1 text-2xl font-semibold">
          Record your Stableford score
        </h2>

        <p className="mt-2 text-sm text-muted-foreground">
          Keep your five most recent rounds ready for GoodSwing.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
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
            className="w-full rounded-xl border bg-transparent px-4 py-3 outline-none focus:ring-2"
            placeholder="e.g. 32"
          />

          <p className="mt-1 text-xs text-muted-foreground">
            Enter a score from 1 to 45.
          </p>
        </div>

        <div>
          <label
            htmlFor="playedAt"
            className="mb-2 block text-sm font-medium"
          >
            Date played
          </label>

          <input
            id="playedAt"
            name="playedAt"
            type="date"
            required
            max={new Date().toISOString().split("T")[0]}
            className="w-full rounded-xl border bg-transparent px-4 py-3 outline-none focus:ring-2"
          />
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">
          {error}
        </p>
      )}

      <button
        type="submit"
        className="mt-6 rounded-xl bg-foreground px-5 py-3 font-medium text-background transition hover:opacity-90"
      >
        Add score
      </button>
    </form>
  );
}