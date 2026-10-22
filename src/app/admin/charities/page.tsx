import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CreateCharityForm } from "@/components/charity/create-charity-form";
import { CharityAdminList } from "@/components/charity/charity-admin-list";

export default async function AdminCharitiesPage() {
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

  const { data: charities, error } = await supabase
    .from("charities")
    .select(
      "id, name, description, category, website_url, featured, active, created_at"
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Unable to load charities.");
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div>
        <p className="text-sm font-medium text-muted-foreground">
          ADMIN
        </p>

        <h1 className="mt-2 text-4xl font-semibold tracking-tight">
          Charity management
        </h1>

        <p className="mt-3 max-w-2xl text-muted-foreground">
          Create and manage the causes supported by GoodSwing.
        </p>
      </div>

      <CreateCharityForm />

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">
          Existing charities
        </h2>

        <div className="mt-5">
          <CharityAdminList charities={charities ?? []} />
        </div>
      </section>
    </main>
  );
}