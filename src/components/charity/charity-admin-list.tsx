"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { toggleCharity, toggleFeatured, updateCharity } from "@/app/admin/charities/actions";

type Charity = {
  id: string;
  name: string;
  description: string;
  category: string | null;
  website_url: string | null;
  featured: boolean;
  active: boolean;
  created_at: string;
};

export function CharityAdminList({
  charities,
}: {
  charities: Charity[];
}) {
  const [isPending, startTransition] = useTransition();

  if (charities.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
        No charities have been created yet.
      </div>
    );
  }

  function handleFeatured(id: string, featured: boolean) {
    startTransition(async () => {
      try { await toggleFeatured(id, !featured); toast.success(!featured ? "Charity featured" : "Charity unfeatured"); }
      catch (error) { toast.error(error instanceof Error ? error.message : "Couldn't update charity."); }
    });
  }

  function handleToggle(id: string, active: boolean) {
    startTransition(async () => {
      try {
        await toggleCharity(id, !active);

        toast.success(
          active ? "Charity deactivated" : "Charity activated"
        );
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Couldn't update charity."
        );
      }
    });
  }

  return (
    <div className="space-y-4">
      {charities.map((charity) => (
        <div
          key={charity.id}
          className="rounded-2xl border p-5"
        >
          <div className="flex flex-col justify-between gap-4 md:flex-row">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold">
                  {charity.name}
                </h3>

                {charity.category && (
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs">
                    {charity.category}
                  </span>
                )}

                {charity.featured && (
                  <span className="rounded-full border px-2.5 py-1 text-xs">
                    Featured
                  </span>
                )}
              </div>

              <p className="mt-2 text-sm text-muted-foreground">
                {charity.description}
              </p>
            </div>

            <button
              type="button"
              disabled={isPending}
              onClick={() =>
                handleToggle(charity.id, charity.active)
              }
              className="h-fit rounded-xl border px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {charity.active ? "Deactivate" : "Activate"}
            </button>

            <button
              type="button"
              disabled={isPending}
              onClick={() => handleFeatured(charity.id, charity.featured)}
              className="h-fit rounded-xl border px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {charity.featured ? "Unfeature" : "Feature"}
            </button>

            <details className="group">
              <summary className="h-fit cursor-pointer list-none rounded-xl border px-4 py-2 text-sm font-medium">Edit</summary>
              <form action={updateCharity} className="absolute right-0 z-10 mt-2 w-[min(420px,90vw)] rounded-2xl border bg-background p-5 shadow-2xl">
                <input type="hidden" name="id" value={charity.id} />
                <input name="name" defaultValue={charity.name} required className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm" />
                <input name="category" defaultValue={charity.category ?? ""} placeholder="Category" className="mt-2 w-full rounded-lg border bg-transparent px-3 py-2 text-sm" />
                <textarea name="description" defaultValue={charity.description} required rows={3} className="mt-2 w-full rounded-lg border bg-transparent px-3 py-2 text-sm" />
                <input name="website_url" defaultValue={charity.website_url ?? ""} placeholder="Website URL" className="mt-2 w-full rounded-lg border bg-transparent px-3 py-2 text-sm" />
                <input name="image_url" placeholder="Image URL" className="mt-2 w-full rounded-lg border bg-transparent px-3 py-2 text-sm" />
                <button className="mt-3 rounded-lg bg-foreground px-3 py-2 text-xs font-medium text-background">Save changes</button>
              </form>
            </details>
          </div>

          <div className="mt-4 text-xs text-muted-foreground">
            Status: {charity.active ? "Active" : "Inactive"}
          </div>
        </div>
      ))}
    </div>
  );
}