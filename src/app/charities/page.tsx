import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function PublicCharitiesPage() {
  // Create a Supabase server client.
  const supabase = await createClient();

  // Fetch all active charities.
  // Featured charities appear first, followed by alphabetical order.
  const { data: charities, error } = await supabase
    .from("charities")
    .select(
      "id,name,slug,description,category,image_url,website_url,featured"
    )
    .eq("active", true)
    .order("featured", { ascending: false })
    .order("name");

  // Handle database errors.
  if (error) {
    throw new Error("Unable to load charities.");
  }

  return (
    <main className="min-h-screen bg-[#171918] px-6 py-10 text-[#f4f3ee] md:px-10">
      <div className="mx-auto max-w-6xl">

        {/* Back to the GoodSwing homepage */}
        <Link
          href="/"
          className="text-sm text-white/50 hover:text-white"
        >
          ← GoodSwing
        </Link>

        {/* =========================================================
            PAGE HEADER
            ========================================================= */}
        <header className="mt-8 border-b border-white/10 pb-8">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-[#70c99e]">
            OUR CAUSES
          </p>

          <h1 className="mt-3 text-5xl font-medium tracking-[-.05em]">
            Good starts here.
          </h1>

          <p className="mt-4 max-w-2xl text-white/55">
            Explore the charities available through GoodSwing.
            Members can choose a cause during signup and change
            their preference later.
          </p>
        </header>

        {/* =========================================================
            CHARITY GRID
            ========================================================= */}
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {charities?.map((charity) => (
            <article
              key={charity.id}
              className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[.03] transition hover:-translate-y-1 hover:border-[#70c99e]/40"
            >
              {/* Charity image */}
              {charity.image_url ? (
                <img
                  src={charity.image_url}
                  alt=""
                  className="h-48 w-full object-cover transition duration-500 group-hover:scale-105"
                />
              ) : (
                // Fallback when no charity image exists.
                <div className="flex h-48 items-center justify-center bg-[#087f4e]/10 text-6xl font-semibold text-[#70c99e]">
                  {charity.name.charAt(0)}
                </div>
              )}

              <div className="p-6">

                {/* Charity category */}
                {charity.category && (
                  <p className="text-xs font-bold uppercase tracking-[.14em] text-white/35">
                    {charity.category}
                  </p>
                )}

                {/* Charity name */}
                <h2 className="mt-3 text-2xl font-medium">
                  <Link
                    href={`/charities/${charity.slug}`}
                    className="hover:text-[#70c99e]"
                  >
                    {charity.name}
                  </Link>
                </h2>

                {/* Charity description */}
                <p className="mt-3 text-sm leading-6 text-white/45">
                  {charity.description}
                </p>

                {/* External charity website */}
                {charity.website_url && (
                  <a
                    href={charity.website_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-6 inline-block text-sm font-semibold text-[#70c99e] hover:text-white"
                  >
                    Visit website →
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>

        {/* =========================================================
            CALL TO ACTION
            ========================================================= */}
        <div className="mt-12 rounded-2xl border border-white/10 bg-[#087f4e] p-8 md:p-10">
          <h2 className="text-3xl font-medium">
            Want your membership to support one?
          </h2>

          <p className="mt-2 text-white/70">
            Create your account, pick a cause and start playing
            with purpose.
          </p>

          {/* Link to signup */}
          <Link
            href="/signup"
            className="mt-6 inline-flex rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#087f4e]"
          >
            Get started
          </Link>
        </div>
      </div>
    </main>
  );
}