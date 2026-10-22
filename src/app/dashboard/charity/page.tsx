import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CharityDirectory } from "@/components/charity/charity-directory";

export default async function CharityPage() {
  // Ensure that only authenticated users can access this page.
  const user = await requireUser();

  // Create a Supabase server client.
  const supabase = await createClient();

  // Fetch active charities and the current user's selected charity
  // preference in parallel for better performance.
  const [
    { data: charities, error },
    { data: preference },
  ] = await Promise.all([
    // Get all active charities.
    supabase
      .from("charities")
      .select(
        "id,name,slug,description,image_url,category,website_url,featured"
      )
      .eq("active", true)
      .order("featured", { ascending: false })
      .order("name"),

    // Get the current user's charity preference.
    supabase
      .from("user_charity_preferences")
      .select("charity_id")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  // Handle charity loading errors.
  if (error) {
    throw new Error("Unable to load charities.");
  }

  return (
    <main className="min-h-screen px-6 py-10 md:px-10">
      <div className="mx-auto max-w-6xl">

        {/* =========================================================
            PAGE HEADER
            ========================================================= */}
        <header className="border-b pb-8">
          <p className="text-sm font-medium text-[#087f4e]">
            GIVE WITH PURPOSE
          </p>

          <h1 className="mt-2 text-4xl font-semibold tracking-tight">
            Choose your charity.
          </h1>

          <p className="mt-3 max-w-2xl text-muted-foreground">
            Pick the cause you want your GoodSwing membership to support.
            Explore, search and change your preference anytime.
          </p>
        </header>

        {/* =========================================================
            CHARITY DIRECTORY
            =========================================================
            Display the charity directory when active charities exist.
            The user's existing preference is passed as selectedId so
            the directory can highlight their current selection.
            ========================================================= */}
        {charities?.length ? (
          <CharityDirectory
            charities={charities}
            selectedId={preference?.charity_id}
          />
        ) : (
          /* Empty state when no active charities are available. */
          <section className="mt-8 rounded-2xl border border-dashed p-10 text-center">
            <h2 className="text-xl font-semibold">
              No charities available
            </h2>

            <p className="mt-2 text-muted-foreground">
              There are currently no active charities. Please check back
              later.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}