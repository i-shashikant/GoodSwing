"use client";

import {
  useMemo,
  useState,
  useTransition,
} from "react";

import {
  Check,
  ExternalLink,
  Heart,
  Search,
  Sparkles,
} from "lucide-react";

import {
  saveCharityPreference,
} from "@/app/dashboard/charity/actions";

import { toast } from "sonner";

type Charity = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string | null;
  category: string | null;
  website_url: string | null;
  featured: boolean;
};

type Props = {
  charities: Charity[];
  selectedId?: string;
};

export function CharityDirectory({
  charities,
  selectedId,
}: Props) {
  const [query, setQuery] =
    useState("");

  const [category, setCategory] =
    useState("all");

  const [selected, setSelected] =
    useState(selectedId ?? "");

  const [pending, startTransition] =
    useTransition();

  // Build the filter options directly from
  // the charities returned by Supabase.
  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          charities
            .map((charity) => charity.category)
            .filter(Boolean) as string[]
        )
      ).sort(),
    [charities]
  );

  // Search and category filtering remain completely
  // data-driven — no charity names are hardcoded.
  const filtered = charities.filter(
    (charity) => {
      const searchableText = [
        charity.name,
        charity.description,
        charity.category ?? "",
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        searchableText.includes(
          query.toLowerCase()
        );

      const matchesCategory =
        category === "all" ||
        charity.category === category;

      return (
        matchesSearch &&
        matchesCategory
      );
    }
  );

  function chooseCharity(id: string) {
    startTransition(async () => {
      try {
        await saveCharityPreference(id);

        // Update the visual state immediately after
        // the server action succeeds.
        setSelected(id);

        toast.success(
          "Charity selected"
        );
      } catch (error) {
        toast.error(
          "Couldn't select charity",
          {
            description:
              error instanceof Error
                ? error.message
                : "Could not save charity.",
          }
        );
      }
    });
  }

  return (
    <div>
      {/* =========================================================
          SEARCH + FILTER
          ========================================================= */}

      <div className="grid gap-3 md:grid-cols-[1fr_220px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/30" />

          <input
            value={query}
            onChange={(event) =>
              setQuery(event.target.value)
            }
            placeholder="Search charities..."
            className="w-full rounded-2xl border border-white/[0.1] bg-white/[0.025] py-4 pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-emerald-400/50 focus:bg-emerald-400/[0.025] focus:ring-4 focus:ring-emerald-400/10"
          />
        </div>

        <select
          value={category}
          onChange={(event) =>
            setCategory(event.target.value)
          }
          className="rounded-2xl border border-white/[0.1] bg-[#0c120f] px-4 py-4 text-sm text-white/70 outline-none transition focus:border-emerald-400/50"
        >
          <option value="all">
            All causes
          </option>

          {categories.map(
            (item) => (
              <option
                key={item}
                value={item}
              >
                {item}
              </option>
            )
          )}
        </select>
      </div>

      {/* =========================================================
          RESULT COUNT
          ========================================================= */}

      <div className="mt-6 flex items-center justify-between">
        <p className="text-xs text-white/30">
          Showing{" "}
          <span className="font-semibold text-white/60">
            {filtered.length}
          </span>{" "}
          {filtered.length === 1
            ? "cause"
            : "causes"}
        </p>

        {selected && (
          <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
            <Check className="h-3.5 w-3.5" />
            Cause selected
          </p>
        )}
      </div>

      {/* =========================================================
          CHARITY CARDS
          ========================================================= */}

      <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map(
          (charity) => {
            const active =
              selected === charity.id;

            return (
              <article
                key={charity.id}
                className={`group relative overflow-hidden rounded-3xl border bg-white/[0.025] transition-all duration-300 ${
                  active
                    ? "border-emerald-400/70 bg-emerald-400/[0.055] shadow-[0_0_35px_rgba(52,211,153,0.08)]"
                    : "border-white/[0.09] hover:-translate-y-1 hover:border-emerald-400/30 hover:bg-white/[0.04]"
                }`}
              >
                {/* Selected indicator */}
                {active && (
                  <div className="absolute right-4 top-4 z-10 flex items-center gap-1.5 rounded-full bg-emerald-400 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#06100b] shadow-[0_0_20px_rgba(52,211,153,0.25)]">
                    <Check className="h-3 w-3" />
                    Selected
                  </div>
                )}

                {/* Image */}
                <div className="relative h-48 overflow-hidden">
                  {charity.image_url ? (
                    <img
                      src={charity.image_url}
                      alt={charity.name}
                      className="h-full w-full object-cover opacity-80 transition duration-700 group-hover:scale-105 group-hover:opacity-95"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-emerald-400/[0.12] via-teal-400/[0.06] to-amber-300/[0.04]">
                      <span className="text-7xl font-black text-emerald-300/60">
                        {charity.name.charAt(0)}
                      </span>
                    </div>
                  )}

                  {/* Image overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#080c0a] via-transparent to-transparent" />

                  {charity.featured && (
                    <div className="absolute bottom-4 left-4 flex items-center gap-1.5 rounded-full border border-amber-300/20 bg-black/50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-200 backdrop-blur-md">
                      <Sparkles className="h-3 w-3" />
                      Featured
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-center gap-2">
                    <div className="grid h-8 w-8 place-items-center rounded-xl bg-rose-400/10 text-rose-300">
                      <Heart className="h-4 w-4" />
                    </div>

                    {charity.category && (
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/35">
                        {charity.category}
                      </p>
                    )}
                  </div>

                  <h2 className="mt-4 text-xl font-bold tracking-tight">
                    {charity.name}
                  </h2>

                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-white/45">
                    {charity.description}
                  </p>

                  {/* Actions */}
                  <div className="mt-6 flex items-center gap-2">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() =>
                        chooseCharity(
                          charity.id
                        )
                      }
                      className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all duration-200 ${
                        active
                          ? "border border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                          : "bg-emerald-400 text-[#06100b] hover:-translate-y-0.5 hover:bg-emerald-300 hover:shadow-[0_0_25px_rgba(52,211,153,0.18)]"
                      } disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      {active ? (
                        <>
                          <Check className="h-4 w-4" />
                          Your charity
                        </>
                      ) : (
                        "Choose charity"
                      )}
                    </button>

                    {charity.website_url && (
                      <a
                        href={
                          charity.website_url
                        }
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Visit ${charity.name} website`}
                        className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/[0.08] text-white/35 transition hover:border-teal-300/30 hover:bg-teal-300/[0.05] hover:text-teal-300"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              </article>
            );
          }
        )}
      </div>

      {/* =========================================================
          EMPTY SEARCH STATE
          ========================================================= */}

      {filtered.length === 0 && (
        <div className="mt-8 rounded-3xl border border-dashed border-white/[0.12] bg-white/[0.02] p-12 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white/[0.04] text-white/30">
            <Search className="h-6 w-6" />
          </div>

          <h3 className="mt-5 text-lg font-bold">
            No causes found
          </h3>

          <p className="mt-2 text-sm text-white/35">
            Try another search term or category.
          </p>
        </div>
      )}
    </div>
  );
}