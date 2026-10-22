import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DonationForm } from "@/components/charity/donation-form";

export default async function CharityDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  // Get the charity slug from the dynamic route.
  const { slug } = await params;

  // Create a Supabase server client.
  const supabase = await createClient();

  // Fetch the active charity matching the requested slug.
  const { data: charity } = await supabase
    .from("charities")
    .select(
      "id,name,slug,description,category,image_url,website_url"
    )
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();

  // Show Next.js 404 page if the charity does not exist
  // or is not currently active.
  if (!charity) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#171918] px-6 py-10 text-[#f4f3ee] md:px-10">
      <div className="mx-auto max-w-5xl">

        {/* Back to the charity listing */}
        <Link
          href="/charities"
          className="text-sm text-white/50"
        >
          ← All charities
        </Link>

        {/* =========================================================
            CHARITY DETAILS
            ========================================================= */}
        <div className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-white/[.03]">

          {/* Charity image */}
          {charity.image_url ? (
            <img
              src={charity.image_url}
              alt=""
              className="h-72 w-full object-cover"
            />
          ) : (
            // Fallback when the charity does not have an image.
            <div className="flex h-72 items-center justify-center bg-[#087f4e]/10 text-8xl font-semibold text-[#70c99e]">
              {charity.name.charAt(0)}
            </div>
          )}

          <div className="p-8 md:p-10">

            {/* Charity category */}
            {charity.category && (
              <p className="text-xs font-bold uppercase tracking-[.2em] text-[#70c99e]">
                {charity.category}
              </p>
            )}

            {/* Charity name */}
            <h1 className="mt-3 text-5xl font-medium tracking-[-.05em]">
              {charity.name}
            </h1>

            {/* Charity description */}
            <p className="mt-5 max-w-3xl text-lg leading-8 text-white/60">
              {charity.description}
            </p>

            {/* External charity website */}
            {charity.website_url && (
              <a
                href={charity.website_url}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-block text-sm font-semibold text-[#70c99e]"
              >
                Visit charity website →
              </a>
            )}

            {/* =====================================================
                DONATION FORM
                ===================================================== */}
            <div className="mt-10">
              <DonationForm
                charityId={charity.id}
                charityName={charity.name}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}