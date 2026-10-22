import { Heart, Sparkles, Users, ArrowRight } from "lucide-react";

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

import { CharityDirectory } from "@/components/charity/charity-directory";

export default async function CharityPage() {
  // Only authenticated users can access their charity preferences.
  const user = await requireUser();

  const supabase = await createClient();

  // Fetch charities and the current user's preference together.
  const [
    { data: charities, error },
    { data: preference },
  ] = await Promise.all([
    supabase
      .from("charities")
      .select(
        "id,name,slug,description,image_url,category,website_url,featured"
      )
      .eq("active", true)
      .order("featured", { ascending: false })
      .order("name"),

    supabase
      .from("user_charity_preferences")
      .select("charity_id")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if (error) {
    throw new Error("Unable to load charities.");
  }

  const activeCharities = charities ?? [];

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080c0a] text-white">
      {/* =========================================================
          AMBIENT BACKGROUND
          ========================================================= */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-emerald-400/[0.08] blur-[140px]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-40 h-[400px] w-[400px] rounded-full bg-rose-400/[0.045] blur-[130px]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-1/3 h-[350px] w-[350px] rounded-full bg-amber-300/[0.04] blur-[130px]"
      />

      <div className="relative mx-auto max-w-7xl px-5 py-8 md:px-10 md:py-12">
        {/* =========================================================
            HERO
            ========================================================= */}

        <header className="border-b border-white/[0.08] pb-12">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-emerald-400">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-400/10">
              <Heart className="h-3.5 w-3.5" />
            </span>

            Give with purpose
          </div>

          <div className="mt-6 grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <h1 className="text-4xl font-bold tracking-[-0.05em] md:text-6xl lg:text-7xl">
                Choose a cause.
                <br />
                <span className="text-emerald-400">
                  Make it matter.
                </span>
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-7 text-white/55 md:text-lg">
                Pick the cause you want your GoodSwing membership
                to support. Your choice stays connected to your
                membership and the impact you help create.
              </p>
            </div>

            {/* Impact card */}
            <div className="relative overflow-hidden rounded-3xl border border-emerald-400/15 bg-emerald-400/[0.045] p-6">
              <div
                aria-hidden="true"
                className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-emerald-400/10 blur-3xl"
              />

              <div className="relative">
                <div className="flex items-center justify-between">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-400/10 text-emerald-300">
                    <Sparkles className="h-5 w-5" />
                  </div>

                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                    Your impact
                  </span>
                </div>

                <p className="mt-8 text-2xl font-bold">
                  One membership.
                  <br />
                  <span className="text-emerald-400">
                    More meaning.
                  </span>
                </p>

                <div className="mt-6 flex items-center gap-3 border-t border-white/[0.07] pt-5">
                  <Users className="h-4 w-4 text-teal-300" />

                  <p className="text-xs leading-5 text-white/40">
                    Your contribution joins a community of
                    members supporting causes together.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* =========================================================
            DIRECTORY
            ========================================================= */}

        <section className="mt-10">
          <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/35">
                Partner causes
              </p>

              <h2 className="mt-2 text-3xl font-bold tracking-tight">
                Explore charities
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-white/40">
                Find a cause that feels meaningful to you.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-white/35">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              {activeCharities.length} active{" "}
              {activeCharities.length === 1
                ? "cause"
                : "causes"}
            </div>
          </div>

          {activeCharities.length ? (
            <CharityDirectory
              charities={activeCharities}
              selectedId={preference?.charity_id}
            />
          ) : (
            <section className="rounded-3xl border border-dashed border-white/[0.12] bg-white/[0.02] p-12 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-400/10 text-emerald-300">
                <Heart className="h-6 w-6" />
              </div>

              <h2 className="mt-5 text-xl font-bold">
                No charities available
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/40">
                There are currently no active charities. Please
                check back later.
              </p>
            </section>
          )}
        </section>

        {/* =========================================================
            CLOSING MESSAGE
            ========================================================= */}

        <section className="mt-10 overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-emerald-400/[0.08] via-transparent to-amber-300/[0.035] p-7 md:p-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-400">
                GoodSwing impact
              </p>

              <h2 className="mt-3 text-2xl font-bold md:text-3xl">
                Your choice is part of the experience.
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/40">
                Play, participate and support a cause you care
                about — all through one membership.
              </p>
            </div>

            <ArrowRight className="hidden h-6 w-6 text-emerald-400 md:block" />
          </div>
        </section>
      </div>
    </main>
  );
}