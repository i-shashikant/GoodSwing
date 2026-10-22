"use client";

import { useState, useTransition } from "react";
import { runSimulation, publishDraw } from "@/app/admin/draws/actions";
import { DrawMethod, DrawSimulationResult } from "@/lib/draw-engine";
import { toast } from "sonner";
import { Sparkles, CheckCircle2, RotateCcw, AlertTriangle } from "lucide-react";

type Draw = {
  id: string;
  draw_month: string;
  draw_date: string;
  status: string;
  draw_method: string;
  prize_pool: number;
  jackpot_rollover: number;
  number_1?: number | null;
  number_2?: number | null;
  number_3?: number | null;
  number_4?: number | null;
  number_5?: number | null;
};

export function DrawSimulator({ draw }: { draw: Draw }) {
  const [method, setMethod] = useState<DrawMethod>(
    (draw.draw_method as DrawMethod) || "random"
  );
  const [simulation, setSimulation] = useState<DrawSimulationResult | null>(null);
  const [isSimulating, startSimulating] = useTransition();
  const [isPublishing, startPublishing] = useTransition();

  function handleSimulate() {
    startSimulating(async () => {
      try {
        const result = await runSimulation(draw.id, method);
        setSimulation(result);
        toast.success("Simulation complete", {
          description: `Generated 5 numbers with ${result.eligibleSubscribers} eligible golfers evaluated.`,
        });
      } catch (err) {
        toast.error("Simulation failed", {
          description: err instanceof Error ? err.message : "Error running simulation",
        });
      }
    });
  }

  function handlePublish() {
    if (!simulation) {
      toast.error("Please run a simulation before publishing.");
      return;
    }

    if (
      !window.confirm(
        `Publish draw for ${new Date(`${draw.draw_month}T00:00:00`).toLocaleDateString("en-IN", {
          month: "long",
          year: "numeric",
        })} with numbers [${simulation.drawnNumbers.join(", ")}]? This will record official winners and entries.`
      )
    ) {
      return;
    }

    startPublishing(async () => {
      try {
        await publishDraw(draw.id, simulation.drawMethod, simulation.drawnNumbers);
        toast.success("Draw published successfully!", {
          description: "Winners and entries have been recorded.",
        });
        setSimulation(null);
      } catch (err) {
        toast.error("Failed to publish draw", {
          description: err instanceof Error ? err.message : "Error publishing draw",
        });
      }
    });
  }

  const isCompleted = draw.status === "completed";

  return (
    <div className="rounded-2xl border border-black/10 bg-[#fafaf7] p-5">
      <div className="flex flex-col gap-4 border-b border-black/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="font-semibold">
            {isCompleted ? "Draw Results" : "Draw Control & Simulation"}
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isCompleted
              ? "This draw has been published and results are finalized."
              : "Simulate numbers, test winner distribution, and publish when satisfied."}
          </p>
        </div>

        {!isCompleted && (
          <div className="flex items-center gap-2">
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as DrawMethod)}
              disabled={isSimulating || isPublishing}
              className="rounded-lg border bg-background px-3 py-1.5 text-xs font-medium outline-none"
            >
              <option value="random">Random (Lottery-style)</option>
              <option value="weighted">Algorithmic (Score-frequency weighted)</option>
            </select>

            <button
              type="button"
              onClick={handleSimulate}
              disabled={isSimulating || isPublishing}
              className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              {isSimulating ? "Simulating..." : "Simulate Draw"}
            </button>
          </div>
        )}
      </div>

      {/* If draw is completed, show published numbers */}
      {isCompleted && draw.number_1 !== null && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground mr-2 font-medium">
            Winning numbers:
          </span>
          {[
            draw.number_1,
            draw.number_2,
            draw.number_3,
            draw.number_4,
            draw.number_5,
          ].map((n, i) => (
            <span
              key={i}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-sm font-bold text-background shadow-sm"
            >
              {n}
            </span>
          ))}
          <span className="ml-2 rounded-full border bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
            Published
          </span>
        </div>
      )}

      {/* Simulation results card */}
      {simulation && !isCompleted && (
        <div className="mt-5 rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Simulated Winning Numbers ({simulation.drawMethod.toUpperCase()})
              </p>
              <div className="mt-2 flex items-center gap-2">
                {simulation.drawnNumbers.map((num, i) => (
                  <span
                    key={i}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-sm font-bold text-background"
                  >
                    {num}
                  </span>
                ))}
              </div>
            </div>

            <div className="text-right">
              <p className="text-xs text-muted-foreground">Eligible Golfers</p>
              <p className="text-xl font-bold">{simulation.eligibleSubscribers}</p>
              <p className="text-[11px] text-muted-foreground">
                Total Pool: ₹{simulation.totalPrizePool.toLocaleString("en-IN")}
              </p>
            </div>
          </div>

          {/* Tier breakdown (§ 07) */}
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {/* Tier 1: 5-Match */}
            <div className="rounded-lg border p-3 bg-muted/10">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold">5-Match (40%)</span>
                <span className="text-muted-foreground">Jackpot</span>
              </div>
              <p className="mt-2 text-lg font-bold">
                {simulation.tier1.winnerCount} winners
              </p>
              <p className="text-xs text-muted-foreground">
                {simulation.tier1.winnerCount > 0
                  ? `₹${simulation.tier1.prizePerWinner.toLocaleString("en-IN")} each`
                  : `₹${simulation.tier1.rolloverAmount.toLocaleString("en-IN")} rolls over!`}
              </p>
            </div>

            {/* Tier 2: 4-Match */}
            <div className="rounded-lg border p-3 bg-muted/10">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold">4-Match (35%)</span>
                <span className="text-muted-foreground">Tier 2</span>
              </div>
              <p className="mt-2 text-lg font-bold">
                {simulation.tier2.winnerCount} winners
              </p>
              <p className="text-xs text-muted-foreground">
                {simulation.tier2.winnerCount > 0
                  ? `₹${simulation.tier2.prizePerWinner.toLocaleString("en-IN")} each`
                  : "No winners"}
              </p>
            </div>

            {/* Tier 3: 3-Match */}
            <div className="rounded-lg border p-3 bg-muted/10">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold">3-Match (25%)</span>
                <span className="text-muted-foreground">Tier 3</span>
              </div>
              <p className="mt-2 text-lg font-bold">
                {simulation.tier3.winnerCount} winners
              </p>
              <p className="text-xs text-muted-foreground">
                {simulation.tier3.winnerCount > 0
                  ? `₹${simulation.tier3.prizePerWinner.toLocaleString("en-IN")} each`
                  : "No winners"}
              </p>
            </div>
          </div>

          {/* Rollover notice */}
          {simulation.tier1.rolledOver && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-50 p-2.5 text-xs text-amber-800">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>
                <strong>Jackpot Rollover:</strong> Because there are 0 5-match
                winners, ₹{simulation.tier1.rolloverAmount.toLocaleString("en-IN")} will
                carry over to next month (§ 07).
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t pt-3">
            <button
              type="button"
              onClick={handleSimulate}
              disabled={isSimulating || isPublishing}
              className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Re-roll Simulation
            </button>

            <button
              type="button"
              onClick={handlePublish}
              disabled={isSimulating || isPublishing}
              className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-4 py-1.5 text-xs font-medium text-background hover:opacity-90 disabled:opacity-50"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {isPublishing ? "Publishing..." : "Confirm & Publish Results"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
