import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createDraw, updateDrawStatus } from "./actions";
import { DrawSimulator } from "@/components/admin/draw-simulator";
import {
  CalendarDays,
  ChevronRight,
  Clock3,
  Dice5,
  LockKeyhole,
  Plus,
  Sparkles,
  Trophy,
} from "lucide-react";

function formatMonth(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusClasses(status: string) {
  switch (status) {
    case "completed":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
    case "open":
      return "border-sky-500/20 bg-sky-500/10 text-sky-300";
    case "closed":
      return "border-amber-500/20 bg-amber-500/10 text-amber-300";
    default:
      return "border-white/10 bg-white/[0.04] text-white/60";
  }
}

export default async function AdminDrawsPage() {
  await requireAdmin();

  const supabase = await createClient();

  const { data: draws, error } = await supabase
    .from("draws")
    .select("*")
    .order("draw_month", { ascending: false });

  if (error) {
    throw new Error("Unable to load draws.");
  }

  const allDraws = draws ?? [];

  const completed = allDraws.filter(
    (draw) => draw.status === "completed"
  ).length;

  const open = allDraws.filter(
    (draw) => draw.status === "open"
  ).length;

  const draft = allDraws.filter(
    (draw) => draw.status === "draft"
  ).length;

  const totalPool = allDraws.reduce(
    (sum, draw) => sum + Number(draw.prize_pool || 0),
    0
  );

  return (
    <main className="min-h-screen bg-[#f7f7f2] px-5 py-8 md:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col gap-6 border-b border-black/10 pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <Link
              href="/admin"
              className="mb-5 inline-flex items-center gap-2 text-sm text-black/50 transition hover:text-black"
            >
              ← Admin overview
            </Link>

            <p className="eyebrow text-[#176b45]">
              GoodSwing Operations
            </p>

            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-[#151515] md:text-5xl">
              Monthly prize draws.
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-black/55 md:text-base">
              Configure each monthly draw, review eligibility, simulate
              outcomes and publish the final winning numbers.
            </p>
          </div>

          <div className="hidden text-right md:block">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-black/35">
              Draw operations
            </p>
            <p className="mt-1 text-sm font-medium text-black/70">
              {allDraws.length} configured draw
              {allDraws.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        {/* Overview stats */}
        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-black/10 bg-white p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/40">
                Total draws
              </p>
              <Sparkles className="h-5 w-5 text-[#176b45]" />
            </div>
            <p className="mt-4 text-3xl font-semibold">{allDraws.length}</p>
            <p className="mt-1 text-xs text-black/45">
              All configured monthly draws
            </p>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/40">
                Open
              </p>
              <Clock3 className="h-5 w-5 text-sky-600" />
            </div>
            <p className="mt-4 text-3xl font-semibold">{open}</p>
            <p className="mt-1 text-xs text-black/45">
              Currently accepting entries
            </p>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/40">
                Completed
              </p>
              <Trophy className="h-5 w-5 text-amber-600" />
            </div>
            <p className="mt-4 text-3xl font-semibold">{completed}</p>
            <p className="mt-1 text-xs text-black/45">
              Published and finalized
            </p>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/40">
                Configured pool
              </p>
              <Dice5 className="h-5 w-5 text-[#176b45]" />
            </div>
            <p className="mt-4 text-3xl font-semibold">
              ₹{totalPool.toLocaleString("en-IN")}
            </p>
            <p className="mt-1 text-xs text-black/45">
              Across all configured draws
            </p>
          </div>
        </section>

        {/* Create draw */}
        <section className="mt-8 overflow-hidden rounded-3xl bg-[#123d2d] text-white shadow-sm">
          <div className="border-b border-white/10 px-6 py-6 md:px-8">
            <div className="flex items-start gap-4">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#f0c95b] text-[#123d2d]">
                <Plus className="h-5 w-5" />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-200/70">
                  New draw
                </p>
                <h2 className="mt-1 text-2xl font-semibold">
                  Create a monthly draw
                </h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-emerald-100/65">
                  Start with a draft. You can open entries, close the draw,
                  simulate results and publish only when everything looks right.
                </p>
              </div>
            </div>
          </div>

          <form
            action={createDraw}
            className="grid gap-5 px-6 py-6 md:grid-cols-2 md:px-8"
          >
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-emerald-100/60">
                Draw month
              </label>

              <input
                name="draw_month"
                type="month"
                required
                className="w-full rounded-xl border border-white/15 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-emerald-300/60 focus:ring-4 focus:ring-emerald-300/10"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-emerald-100/60">
                Draw date
              </label>

              <input
                name="draw_date"
                type="datetime-local"
                required
                className="w-full rounded-xl border border-white/15 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-300/60 focus:ring-4 focus:ring-emerald-300/10"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-emerald-100/60">
                Draw method
              </label>

              <select
                name="draw_method"
                defaultValue="random"
                className="w-full rounded-xl border border-white/15 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none focus:border-emerald-300/60"
              >
                <option value="random">
                  Random — lottery style
                </option>
                <option value="weighted">
                  Algorithmic — score weighted
                </option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-emerald-100/60">
                Prize pool base
              </label>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-white/45">
                  ₹
                </span>

                <input
                  name="prize_pool"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue="0"
                  className="w-full rounded-xl border border-white/15 bg-white/[0.06] py-3 pl-8 pr-4 text-sm text-white outline-none focus:border-emerald-300/60 focus:ring-4 focus:ring-emerald-300/10"
                />
              </div>

              <p className="mt-2 text-xs text-emerald-100/45">
                Use 0 to automatically calculate from active subscribers.
              </p>
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#f0c95b] px-5 py-3 text-sm font-semibold text-[#123d2d] transition hover:bg-[#f5d777] md:w-auto"
              >
                <Plus className="h-4 w-4" />
                Create draft draw
              </button>
            </div>
          </form>
        </section>

        {/* Existing draws */}
        <section className="mt-10">
          <div className="flex items-end justify-between">
            <div>
              <p className="eyebrow text-[#176b45]">Draw history</p>
              <h2 className="mt-1 text-2xl font-semibold">
                Configured draws
              </h2>
            </div>

            <span className="text-sm text-black/40">
              {draft} draft{draft === 1 ? "" : "s"}
            </span>
          </div>

          <div className="mt-5 space-y-5">
            {allDraws.map((draw) => (
              <article
                key={draw.id}
                className="overflow-hidden rounded-2xl border border-black/10 bg-white"
              >
                {/* Draw header */}
                <div className="flex flex-col gap-5 border-b border-black/10 p-6 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-semibold">
                        {formatMonth(draw.draw_month)}
                      </h3>

                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${statusClasses(
                          draw.status
                        )}`}
                      >
                        {draw.status}
                      </span>

                      <span className="rounded-full border border-black/10 bg-black/[0.02] px-3 py-1 text-xs font-medium text-black/55">
                        {draw.draw_method === "weighted"
                          ? "Algorithmic"
                          : "Random"}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-black/50">
                      <span>
                        Prize pool{" "}
                        <strong className="font-semibold text-black/75">
                          ₹
                          {Number(draw.prize_pool).toLocaleString("en-IN")}
                        </strong>
                      </span>

                      <span>
                        Rollover{" "}
                        <strong className="font-semibold text-black/75">
                          ₹
                          {Number(draw.jackpot_rollover).toLocaleString(
                            "en-IN"
                          )}
                        </strong>
                      </span>

                      <span>
                        Draw date{" "}
                        <strong className="font-semibold text-black/75">
                          {formatDate(draw.draw_date)}
                        </strong>
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
                          className="inline-flex items-center gap-2 rounded-xl bg-[#176b45] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0f4d32]"
                        >
                          Open for entries
                          <ChevronRight className="h-4 w-4" />
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
                          className="inline-flex items-center gap-2 rounded-xl border border-black/15 px-4 py-2.5 text-sm font-semibold transition hover:bg-black/[0.03]"
                        >
                          <LockKeyhole className="h-4 w-4" />
                          Close entries
                        </button>
                      </form>
                    )}
                  </div>
                </div>

                {/* Simulator */}
                <div className="p-4 md:p-6">
                  <DrawSimulator draw={draw} />
                </div>
              </article>
            ))}

            {!allDraws.length && (
              <div className="rounded-2xl border border-dashed border-black/15 bg-white/50 p-12 text-center">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#e5f2eb] text-[#176b45]">
                  <CalendarDays className="h-5 w-5" />
                </div>

                <h3 className="mt-4 font-semibold">
                  No draws configured
                </h3>

                <p className="mt-1 text-sm text-black/45">
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