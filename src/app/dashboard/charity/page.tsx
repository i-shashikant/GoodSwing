import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function CharityPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: charities, error: charitiesError } = await supabase
    .from("charities")
    .select(
      "id, name, slug, description, image_url, category, website_url, featured"
    )
    .eq("active", true)
    .order("featured", { ascending: false })
    .order("name", { ascending: true });

  const { data: preference } = await supabase
    .from("user_charity_preferences")
    .select("charity_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (charitiesError) {
    return (
      <main className="min-h-screen bg-[#101211] px-6 py-12 text-white md:px-10">
        <div className="mx-auto max-w-6xl">
          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
              Charity
            </p>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              Something went wrong.
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-white/55">
              We could not load the available charities.
            </p>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#101211] px-5 py-10 text-white md:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <header className="border-b border-white/10 pb-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center rounded-full border border-emerald-400/25 bg-emerald-400/[0.06] px-4 py-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-300">
                  Give with purpose
                </span>
              </div>

              <h1 className="mt-6 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl lg:text-6xl">
                Choose your{" "}
                <span className="text-emerald-300">charity.</span>
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-white/55 sm:text-lg">
                Pick the cause you want your GoodSwing membership to support.
                Your contribution helps turn every round into something that
                matters.
              </p>
            </div>

            <div className="hidden text-right md:block">
              <p className="text-3xl font-semibold">
                {charities?.length ?? 0}
              </p>
              <p className="mt-1 text-xs uppercase tracking-[0.16em] text-white/40">
                Active causes
              </p>
            </div>
          </div>
        </header>

        {/* Empty state */}
        {!charities || charities.length === 0 ? (
          <section className="mt-10 rounded-3xl border border-dashed border-white/15 bg-white/[0.02] p-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-400/10 text-2xl text-emerald-300">
              ♥
            </div>

            <h2 className="mt-5 text-2xl font-semibold">
              No charities available
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/50">
              There are currently no active charities. Please check back later.
            </p>
          </section>
        ) : (
          <section className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {charities.map((charity) => {
              const selected = preference?.charity_id === charity.id;

              return (
                <article
                  key={charity.id}
                  className={`group relative overflow-hidden rounded-3xl border transition-all duration-300 ${
                    selected
                      ? "border-emerald-400/60 bg-emerald-400/[0.055] shadow-[0_0_0_1px_rgba(52,211,153,0.08)]"
                      : "border-white/10 bg-white/[0.025] hover:-translate-y-1 hover:border-emerald-300/30 hover:bg-white/[0.04]"
                  }`}
                >
                  {/* Image / visual */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-[#18211d]">
                    {charity.image_url ? (
                      <img
                        src={charity.image_url}
                        alt={charity.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.035]"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-950/80 via-[#18211d] to-[#111513]">
                        <span className="text-6xl font-semibold text-emerald-300/80">
                          {charity.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}

                    {/* Image overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />

                    {/* Featured */}
                    {charity.featured && (
                      <span className="absolute left-4 top-4 rounded-full border border-emerald-300/25 bg-[#101211]/80 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300 backdrop-blur-md">
                        Featured
                      </span>
                    )}

                    {/* Selected */}
                    {selected && (
                      <span className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full border border-emerald-300/30 bg-emerald-400/15 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-200 backdrop-blur-md">
                        <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-300 text-[9px] text-[#102019]">
                          ✓
                        </span>
                        Selected
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex min-h-[265px] flex-col p-6">
                    <div className="flex-1">
                      {charity.category && (
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300/80">
                          {charity.category}
                        </p>
                      )}

                      <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                        {charity.name}
                      </h2>

                      <p className="mt-3 text-sm leading-6 text-white/50">
                        {charity.description}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="mt-7 flex items-center gap-3">
                      <form
                        action="/api/charity/preference"
                        method="POST"
                        className="flex-1"
                      >
                        <input
                          type="hidden"
                          name="charityId"
                          value={charity.id}
                        />

                        <button
                          type="submit"
                          className={`group/button flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                            selected
                              ? "border border-emerald-400/30 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/15"
                              : "bg-emerald-400 text-[#07130d] hover:bg-emerald-300 hover:shadow-[0_8px_30px_rgba(52,211,153,0.12)]"
                          }`}
                        >
                          <span>
                            {selected ? "Selected" : "Choose charity"}
                          </span>

                          {!selected && (
                            <span className="transition-transform duration-200 group-hover/button:translate-x-1">
                              →
                            </span>
                          )}
                        </button>
                      </form>

                      {charity.website_url && (
                        <a
                          href={charity.website_url}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`Visit ${charity.name} website`}
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 text-white/45 transition-all duration-200 hover:border-white/20 hover:bg-white/[0.05] hover:text-white"
                        >
                          ↗
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Subtle hover accent */}
                  <div
                    className={`pointer-events-none absolute bottom-0 left-0 h-px w-full origin-left bg-emerald-300 transition-transform duration-500 ${
                      selected
                        ? "scale-x-100 opacity-100"
                        : "scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-70"
                    }`}
                  />
                </article>
              );
            })}
          </section>
        )}

        {/* Bottom note */}
        {charities && charities.length > 0 && (
          <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-white/40 sm:flex-row sm:items-center sm:justify-between">
            <p>
              Your selected cause can be changed whenever you like.
            </p>

            <p className="font-medium text-white/50">
              Play. Give. Win.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}