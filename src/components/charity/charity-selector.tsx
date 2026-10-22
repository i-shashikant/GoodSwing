"use client";

import { useState, useTransition } from "react";
import { Heart, ExternalLink, Check } from "lucide-react";
import { toast } from "sonner";
import { saveCharityPreference } from "@/app/dashboard/charity/actions";

type Charity = {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  category: string | null;
  website_url: string | null;
};

export function CharitySelector({
  charities,
  selectedCharityId,
}: {
  charities: Charity[];
  selectedCharityId: string | null;
}) {
  const [selected, setSelected] = useState(selectedCharityId);
  const [isPending, startTransition] = useTransition();

  function handleSelect(charityId: string) {
    setSelected(charityId);

    startTransition(async () => {
      try {
        await saveCharityPreference(charityId);

        toast.success("Charity preference saved", {
          description: "Your GoodSwing contribution will support this cause.",
        });
      } catch (error) {
        setSelected(selectedCharityId);

        toast.error("Couldn't save preference", {
          description:
            error instanceof Error
              ? error.message
              : "Something went wrong.",
        });
      }
    });
  }

  if (charities.length === 0) {
    return (
      <div className="mt-10 rounded-2xl border border-dashed p-10 text-center">
        <Heart className="mx-auto h-8 w-8 text-muted-foreground" />

        <h2 className="mt-4 text-xl font-semibold">
          No charities available
        </h2>

        <p className="mt-2 text-sm text-muted-foreground">
          Charities will appear here once an administrator adds them.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-10 grid gap-5 md:grid-cols-2">
      {charities.map((charity) => {
        const isSelected = selected === charity.id;

        return (
          <button
            key={charity.id}
            type="button"
            disabled={isPending}
            onClick={() => handleSelect(charity.id)}
            className={`group relative rounded-2xl border p-6 text-left transition ${
              isSelected
                ? "border-foreground ring-1 ring-foreground"
                : "hover:-translate-y-0.5 hover:border-foreground/40"
            } disabled:cursor-wait disabled:opacity-70`}
          >
            {isSelected && (
              <div className="absolute right-5 top-5 flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-background">
                <Check className="h-4 w-4" />
              </div>
            )}

            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted">
                <Heart className="h-5 w-5" />
              </div>

              <div className="pr-8">
                {charity.category && (
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {charity.category}
                  </p>
                )}

                <h2 className="mt-1 text-xl font-semibold">
                  {charity.name}
                </h2>

                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {charity.description}
                </p>
              </div>
            </div>

            {charity.website_url && (
              <a
                href={charity.website_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(event) => event.stopPropagation()}
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
              >
                Visit website
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </button>
        );
      })}
    </div>
  );
}