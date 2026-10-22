"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Trash2, Save, Plus } from "lucide-react";
import {
  updateProfile, saveScore, removeScore, setMembership,
} from "@/app/admin/users/[id]/actions";

type Score = { id: string; score: number; played_at: string };

export function UserEditor({
  userId, fullName, email, scores, membership,
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
  const [edits, setEdits] = useState<Record<string, { score: string; date: string }>>({});
  const today = new Date().toISOString().slice(0, 10);

  const run = (fn: () => Promise<{ error?: string }>, ok: string, after?: () => void) =>
    start(async () => {
      const res = await fn();
      if (res.error) toast.error(res.error);
      else {
        toast.success(ok);
        after?.();
      }
    });

  const input =
    "rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:border-[#176b45] focus:ring-4 focus:ring-emerald-700/10";

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-2">
      {/* Profile + membership */}
      <section className="rounded-2xl border bg-white p-6">
        <h2 className="text-lg font-semibold">Profile</h2>
        <p className="text-sm text-neutral-500">{email}</p>

        <label className="mt-5 block text-sm font-medium">Full name</label>
        <div className="mt-1.5 flex gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} className={`${input} flex-1`} />
          <button
            disabled={pending}
            onClick={() => run(() => updateProfile(userId, name), "Profile updated")}
            className="flex items-center gap-1.5 rounded-xl bg-[#176b45] px-4 text-sm font-medium text-white transition hover:bg-[#0f4d32] disabled:opacity-60"
          >
            <Save className="h-4 w-4" /> Save
          </button>
        </div>

        <div className="mt-6 flex items-center justify-between rounded-xl bg-neutral-50 p-4">
          <div>
            <p className="text-xs text-neutral-500">Membership</p>
            <p className="font-medium capitalize">{membership}</p>
          </div>
          <button
            disabled={pending || membership === "none"}
            onClick={() =>
              run(
                () => setMembership(userId, membership === "active" ? "expired" : "active"),
                "Membership updated"
              )
            }
            className="rounded-xl border bg-white px-4 py-2 text-sm font-medium transition hover:bg-neutral-100 disabled:opacity-50"
          >
            {membership === "active" ? "Expire" : "Activate"}
          </button>
        </div>
      </section>

      {/* Scores */}
      <section className="rounded-2xl border bg-white p-6">
        <h2 className="text-lg font-semibold">Golf scores</h2>
        <p className="text-sm text-neutral-500">Latest 5 only. Adding a 6th removes the oldest.</p>

        <ul className="mt-4 space-y-2">
          {scores.map((s) => {
            const e = edits[s.id] ?? { score: String(s.score), date: s.played_at };
            const set = (patch: Partial<typeof e>) => setEdits({ ...edits, [s.id]: { ...e, ...patch } });
            return (
              <li key={s.id} className="flex flex-wrap items-center gap-2">
                <input
                  type="number" min={1} max={45} value={e.score}
                  onChange={(ev) => set({ score: ev.target.value })}
                  className={`${input} w-20`}
                />
                <input
                  type="date" max={today} value={e.date}
                  onChange={(ev) => set({ date: ev.target.value })}
                  className={`${input} flex-1`}
                />
                <button
                  disabled={pending}
                  aria-label="Save score"
                  onClick={() =>
                    run(
                      () => saveScore({ userId, scoreId: s.id, score: Number(e.score), playedAt: e.date }),
                      "Score updated"
                    )
                  }
                  className="rounded-xl border p-2 text-[#176b45] transition hover:bg-emerald-50"
                >
                  <Save className="h-4 w-4" />
                </button>
                <button
                  disabled={pending}
                  aria-label="Delete score"
                  onClick={() => run(() => removeScore(userId, s.id), "Score deleted")}
                  className="rounded-xl border p-2 text-red-600 transition hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            );
          })}
          {!scores.length && (
            <li className="rounded-xl border border-dashed p-4 text-center text-sm text-neutral-500">
              No scores yet.
            </li>
          )}
        </ul>

        <div className="mt-5 flex flex-wrap items-center gap-2 border-t pt-5">
          <input
            type="number" min={1} max={45} placeholder="1–45" value={newScore}
            onChange={(e) => setNewScore(e.target.value)} className={`${input} w-20`}
          />
          <input
            type="date" max={today} value={newDate}
            onChange={(e) => setNewDate(e.target.value)} className={`${input} flex-1`}
          />
          <button
            disabled={pending}
            onClick={() =>
              run(
                () => saveScore({ userId, score: Number(newScore), playedAt: newDate }),
                "Score added",
                () => { setNewScore(""); setNewDate(""); }
              )
            }
            className="flex items-center gap-1.5 rounded-xl bg-[#176b45] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#0f4d32] disabled:opacity-60"
          >
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>
      </section>
    </div>
  );
}