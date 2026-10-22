import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CreateCharityForm } from "@/components/charity/create-charity-form";
import { CharityAdminList } from "@/components/charity/charity-admin-list";

export default async function AdminCharitiesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  const [{ data: charities, error: charityError }, { data: events, error: eventError }] = await Promise.all([
    supabase.from("charities").select("id,name,description,category,website_url,image_url,featured,active,created_at").order("created_at", { ascending: false }),
    supabase.from("charity_events").select("id,charity_id,title,description,event_date,amount_paise").order("event_date", { ascending: false }),
  ]);

  if (charityError) throw new Error("Unable to load charities.");
  if (eventError) throw new Error("Unable to load charity events.");

  return (
    <main className="admin-main">
      <div className="admin-container">
        <header>
          <p className="eyebrow">GoodSwing causes</p>
          <h1 className="admin-title">Charity management</h1>
          <p className="admin-subtitle">Create, curate and track the causes supported by GoodSwing.</p>
        </header>

        <CreateCharityForm />

        <section className="mt-10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div><p className="eyebrow">Directory</p><h2 className="mt-2 text-2xl font-semibold text-white">Existing charities</h2></div>
            <p className="text-xs text-white/35">{charities?.length ?? 0} total · {events?.length ?? 0} events</p>
          </div>
          <div className="mt-5"><CharityAdminList charities={charities ?? []} events={events ?? []} /></div>
        </section>
      </div>
    </main>
  );
}
