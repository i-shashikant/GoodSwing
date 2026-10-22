import { createClient } from "@/lib/supabase/server";
import { CharitySelector } from "@/components/charity/charity-selector";

export default async function CharityPage() {
  const supabase = await createClient();

  const { data: charities, error } = await supabase
    .from("charities")
    .select("id, name, description, image_url, category, website_url")
    .eq("active", true)
    .order("featured", { ascending: false })
    .order("name");

  if (error) {
    throw new Error("Unable to load charities.");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: preference } = await supabase
    .from("user_charity_preferences")
    .select("charity_id")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="max-w-2xl">
        <p className="text-sm font-medium text-muted-foreground">
          YOUR IMPACT
        </p>

        <h1 className="mt-2 text-4xl font-semibold tracking-tight">
          Choose your charity
        </h1>

        <p className="mt-3 text-muted-foreground">
          Pick the cause you want your GoodSwing participation to support.
          You can change your preference later.
        </p>
      </div>

      <CharitySelector
        charities={charities ?? []}
        selectedCharityId={preference?.charity_id ?? null}
      />
    </main>
  );
}