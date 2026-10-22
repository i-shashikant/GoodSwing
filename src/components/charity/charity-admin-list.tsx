"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { toggleCharity } from "@/app/admin/charities/actions";

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
          </div>

          <div className="mt-4 text-xs text-muted-foreground">
            Status: {charity.active ? "Active" : "Inactive"}
          </div>
        </div>
      ))}
    </div>
  );
}