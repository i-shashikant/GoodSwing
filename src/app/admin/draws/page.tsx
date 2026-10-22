import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createDraw, updateDrawStatus } from "./actions";
import { DrawSimulator } from "@/components/admin/draw-simulator";

export default async function AdminDrawsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  const { data: draws, error } = await supabase
    .from("draws")
    .select("*")
    .order("draw_month", { ascending: false });

  if (error) {
    throw new Error("Unable to load draws.");
  }

  return (
    <main className="min-h-screen px-6 py-10 md:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between border-b pb-8">
          <div>
            <Link
              href="/admin"
              className="text-xs font-medium text-muted-foreground hover:text-foreground mb-2 inline-block"
            >
              ← Back to Admin Overview
            </Link>
            <p className="text-sm font-medium text-muted-foreground">
              GoodSwing Admin / Engine
            </p>

            <h1 className="mt-1 text-4xl font-semibold tracking-tight">
              Monthly Prize Draws
            </h1>

            <p className="mt-2 text-muted-foreground">
              Configure draw logic (Random vs Algorithmic), simulate outcomes, and publish results (§ 06 & § 07).
            </p>
          </div>
        </div>

        {/* Create draw */}
        <section className="mt-8 rounded-2xl border p-6">
          <h2 className="text-2xl font-semibold">Create a draw</h2>

          <p className="mt-1 text-sm text-muted-foreground">
            New draws start as drafts and can be opened for entries or simulated before publishing.
          </p>

          <form action={createDraw} className="mt-6 grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">Draw month</label>

              <input
                name="draw_month"
                type="month"
                required
                className="w-full rounded-xl border bg-transparent px-4 py-3 outline-none focus:ring-2"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Draw date</label>

              <input
                name="draw_date"
                type="datetime-local"
                required
                className="w-full rounded-xl border bg-transparent px-4 py-3 outline-none focus:ring-2"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Draw method</label>

              <select
                name="draw_method"
                defaultValue="random"
                className="w-full rounded-xl border bg-background px-4 py-3 outline-none focus:ring-2"
              >
                <option value="random">Random (Standard lottery-style)</option>
                <option value="weighted">Algorithmic (Score-frequency weighted)</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Prize pool base (₹)
              </label>

              <input
                name="prize_pool"
                type="number"
                min="0"
                step="1"
                defaultValue="0"
                placeholder="0 (Auto-calculated from active subscriptions)"
                className="w-full rounded-xl border bg-transparent px-4 py-3 outline-none focus:ring-2"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Set 0 to auto-calculate from active subscriber count.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Jackpot rollover (₹)
              </label>

              <input
                name="jackpot_rollover"
                type="number"
                min="0"
                step="1"
                defaultValue="0"
                className="w-full rounded-xl border bg-transparent px-4 py-3 outline-none focus:ring-2"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full rounded-xl bg-foreground px-6 py-3 font-medium text-background transition hover:opacity-90"
              >
                Create draft draw
              </button>
            </div>
          </form>
        </section>

        {/* Existing draws */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold">Configured draws</h2>

          <div className="mt-5 space-y-6">
            {draws?.map((draw) => (
              <div key={draw.id} className="rounded-2xl border p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-semibold">
                        {new Date(`${draw.draw_month}T00:00:00`).toLocaleDateString(
                          "en-IN",
                          {
                            month: "long",
                            year: "numeric",
                          }
                        )}
                      </h3>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
                          draw.status === "completed"
                            ? "bg-emerald-100 text-emerald-800"
                            : draw.status === "open"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {draw.status}
                      </span>

                      <span className="rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground">
                        Method: {draw.draw_method === "weighted" ? "Algorithmic (Weighted)" : "Random"}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-5 text-sm text-muted-foreground">
                      <span>
                        Prize pool: ₹
                        {Number(draw.prize_pool).toLocaleString("en-IN")}
                      </span>

                      <span>
                        Rollover: ₹
                        {Number(draw.jackpot_rollover).toLocaleString("en-IN")}
                      </span>

                      <span>
                        Draw date:{" "}
                        {new Date(draw.draw_date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {draw.status === "draft" && (
                      <form
                        action={async () => {
                          "use server";
                          await updateDrawStatus(draw.id, "open");
                        }}
                      >
                        <button
                          type="submit"
                          className="rounded-xl bg-foreground px-4 py-2 text-sm font-medium text-background"
                        >
                          Open draw for entries
                        </button>
                      </form>
                    )}

                    {draw.status === "open" && (
                      <form
                        action={async () => {
                          "use server";
                          await updateDrawStatus(draw.id, "closed");
                        }}
                      >
                        <button
                          type="submit"
                          className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-muted"
                        >
                          Close entries
                        </button>
                      </form>
                    )}
                  </div>
                </div>

                {/* Simulator & Publisher interface */}
                <DrawSimulator draw={draw} />
              </div>
            ))}

            {(!draws || draws.length === 0) && (
              <div className="rounded-2xl border border-dashed p-10 text-center">
                <p className="font-medium">No draws created yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Create your first monthly draw above.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}