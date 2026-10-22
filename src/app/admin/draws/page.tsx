import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { createDraw, updateDrawStatus } from "./actions";

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
        <div className="border-b pb-8">
          <p className="text-sm font-medium text-muted-foreground">
            GoodSwing Admin
          </p>

          <h1 className="mt-2 text-4xl font-semibold tracking-tight">
            Monthly draws
          </h1>

          <p className="mt-3 max-w-2xl text-muted-foreground">
            Create and manage GoodSwing monthly prize draws.
          </p>
        </div>

        {/* Create draw */}
        <section className="mt-8 rounded-2xl border p-6">
          <h2 className="text-2xl font-semibold">
            Create a draw
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            New draws start as drafts and can be opened when ready.
          </p>

          <form
            action={createDraw}
            className="mt-6 grid gap-5 md:grid-cols-2"
          >
            <div>
              <label className="mb-2 block text-sm font-medium">
                Draw month
              </label>

              <input
                name="draw_month"
                type="month"
                required
                className="w-full rounded-xl border bg-transparent px-4 py-3 outline-none focus:ring-2"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Draw date
              </label>

              <input
                name="draw_date"
                type="datetime-local"
                required
                className="w-full rounded-xl border bg-transparent px-4 py-3 outline-none focus:ring-2"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Draw method
              </label>

              <select
                name="draw_method"
                defaultValue="random"
                className="w-full rounded-xl border bg-background px-4 py-3 outline-none focus:ring-2"
              >
                <option value="random">
                  Random
                </option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Prize pool
              </label>

              <input
                name="prize_pool"
                type="number"
                min="0"
                step="0.01"
                defaultValue="0"
                className="w-full rounded-xl border bg-transparent px-4 py-3 outline-none focus:ring-2"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Jackpot rollover
              </label>

              <input
                name="jackpot_rollover"
                type="number"
                min="0"
                step="0.01"
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
          <h2 className="text-2xl font-semibold">
            Existing draws
          </h2>

          <div className="mt-5 space-y-4">
            {draws?.map((draw) => (
              <div
                key={draw.id}
                className="rounded-2xl border p-6"
              >
                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-semibold">
                        {new Date(
                          `${draw.draw_month}T00:00:00`
                        ).toLocaleDateString("en-IN", {
                          month: "long",
                          year: "numeric",
                        })}
                      </h3>

                      <span className="rounded-full border px-3 py-1 text-xs capitalize">
                        {draw.status}
                      </span>
                    </div>

                    <div className="mt-3 grid gap-1 text-sm text-muted-foreground sm:grid-cols-3 sm:gap-5">
                      <span>
                        Prize: ₹
                        {Number(draw.prize_pool).toLocaleString(
                          "en-IN"
                        )}
                      </span>

                      <span>
                        Rollover: ₹
                        {Number(
                          draw.jackpot_rollover
                        ).toLocaleString("en-IN")}
                      </span>

                      <span>
                        Method: {draw.draw_method}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {draw.status === "draft" && (
                      <form
                        action={async () => {
                          "use server";
                          await updateDrawStatus(
                            draw.id,
                            "open"
                          );
                        }}
                      >
                        <button
                          type="submit"
                          className="rounded-xl bg-foreground px-4 py-2 text-sm font-medium text-background"
                        >
                          Open draw
                        </button>
                      </form>
                    )}

                    {draw.status === "open" && (
                      <form
                        action={async () => {
                          "use server";
                          await updateDrawStatus(
                            draw.id,
                            "closed"
                          );
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
              </div>
            ))}

            {(!draws || draws.length === 0) && (
              <div className="rounded-2xl border border-dashed p-10 text-center">
                <p className="font-medium">
                  No draws created yet
                </p>

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