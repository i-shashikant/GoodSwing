import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  createCharity,
  toggleCharity,
  deleteCharity,
} from "./actions";

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  const { data: charities, error } = await supabase
    .from("charities")
    .select(
      "id, name, description, category, website_url, image_url, featured, active, created_at"
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Unable to load charities.");
  }

  return (
    <main className="min-h-screen px-6 py-10 md:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 border-b pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              GoodSwing Admin
            </p>

            <h1 className="mt-2 text-4xl font-semibold tracking-tight">
              Admin Dashboard
            </h1>

            <p className="mt-2 text-muted-foreground">
              Manage charities and GoodSwing operations.
            </p>
          </div>

          <div className="rounded-full border px-4 py-2 text-sm">
            {profile.full_name || user.email}
          </div>
        </div>

        {/* Overview */}
        <section className="grid gap-4 py-8 md:grid-cols-3">
          <div className="rounded-2xl border p-6">
            <p className="text-sm text-muted-foreground">
              Total charities
            </p>
            <p className="mt-2 text-3xl font-semibold">
              {charities?.length ?? 0}
            </p>
          </div>

          <div className="rounded-2xl border p-6">
            <p className="text-sm text-muted-foreground">
              Active charities
            </p>
            <p className="mt-2 text-3xl font-semibold">
              {charities?.filter((charity) => charity.active).length ?? 0}
            </p>
          </div>

          <div className="rounded-2xl border p-6">
            <p className="text-sm text-muted-foreground">
              Admin status
            </p>
            <p className="mt-2 text-3xl font-semibold">
              Active
            </p>
          </div>
        </section>

        {/* Create charity */}
        <section className="rounded-2xl border p-6">
          <div className="mb-6">
            <p className="text-sm font-medium text-muted-foreground">
              Charity management
            </p>

            <h2 className="mt-1 text-2xl font-semibold">
              Add a charity
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Charities are created dynamically by the administrator.
            </p>
          </div>

          <form action={createCharity} className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Charity name
              </label>

              <input
                name="name"
                required
                placeholder="e.g. Green Horizons Foundation"
                className="w-full rounded-xl border bg-transparent px-4 py-3 outline-none focus:ring-2"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Category
              </label>

              <input
                name="category"
                placeholder="Environment"
                className="w-full rounded-xl border bg-transparent px-4 py-3 outline-none focus:ring-2"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium">
                Description
              </label>

              <textarea
                name="description"
                required
                rows={3}
                placeholder="What does this charity support?"
                className="w-full resize-none rounded-xl border bg-transparent px-4 py-3 outline-none focus:ring-2"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Website URL
              </label>

              <input
                name="website_url"
                type="url"
                placeholder="https://example.org"
                className="w-full rounded-xl border bg-transparent px-4 py-3 outline-none focus:ring-2"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Image URL
              </label>

              <input
                name="image_url"
                type="url"
                placeholder="https://..."
                className="w-full rounded-xl border bg-transparent px-4 py-3 outline-none focus:ring-2"
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                className="rounded-xl bg-foreground px-6 py-3 font-medium text-background transition hover:opacity-90"
              >
                Add charity
              </button>
            </div>
          </form>
        </section>

        {/* Existing charities */}
        <section className="mt-8">
          <div className="mb-5">
            <h2 className="text-2xl font-semibold">
              Existing charities
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Manage charities currently available to GoodSwing members.
            </p>
          </div>

          <div className="space-y-4">
            {charities?.map((charity) => (
              <div
                key={charity.id}
                className="rounded-2xl border p-6"
              >
                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-semibold">
                        {charity.name}
                      </h3>

                      <span className="rounded-full border px-3 py-1 text-xs">
                        {charity.active ? "Active" : "Inactive"}
                      </span>

                      {charity.category && (
                        <span className="rounded-full border px-3 py-1 text-xs">
                          {charity.category}
                        </span>
                      )}
                    </div>

                    <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                      {charity.description}
                    </p>

                    {charity.website_url && (
                      <a
                        href={charity.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-block text-sm underline"
                      >
                        Visit website
                      </a>
                    )}
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <form
                      action={async () => {
                        "use server";
                        await toggleCharity(
                          charity.id,
                          !charity.active
                        );
                      }}
                    >
                      <button
                        type="submit"
                        className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-muted"
                      >
                        {charity.active ? "Deactivate" : "Activate"}
                      </button>
                    </form>

                    <form
                      action={async () => {
                        "use server";
                        await deleteCharity(charity.id);
                      }}
                    >
                      <button
                        type="submit"
                        className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-muted"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))}

            {(!charities || charities.length === 0) && (
              <div className="rounded-2xl border border-dashed p-10 text-center">
                <p className="font-medium">No charities yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add the first charity using the form above.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}