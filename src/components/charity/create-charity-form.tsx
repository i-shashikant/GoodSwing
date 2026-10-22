"use client";

import { useRef, useTransition } from "react";
import { toast } from "sonner";
import { createCharity } from "@/app/admin/charities/actions";

export function CreateCharityForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await createCharity(formData);

        formRef.current?.reset();

        toast.success("Charity created");
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Couldn't create charity."
        );
      }
    });
  }

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="mt-10 rounded-2xl border p-6"
    >
      <h2 className="text-xl font-semibold">
        Add a charity
      </h2>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium">
            Charity name
          </label>

          <input
            name="name"
            required
            placeholder="e.g. Green Horizons Foundation"
            className="mt-2 w-full rounded-xl border bg-transparent px-4 py-3 outline-none focus:ring-2"
          />
        </div>

        <div>
          <label className="text-sm font-medium">
            Category
          </label>

          <input
            name="category"
            placeholder="Environment"
            className="mt-2 w-full rounded-xl border bg-transparent px-4 py-3 outline-none focus:ring-2"
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-sm font-medium">
            Description
          </label>

          <textarea
            name="description"
            required
            rows={3}
            placeholder="What does this charity support?"
            className="mt-2 w-full rounded-xl border bg-transparent px-4 py-3 outline-none focus:ring-2"
          />
        </div>

        <div>
          <label className="text-sm font-medium">
            Website
          </label>

          <input
            name="website_url"
            type="url"
            placeholder="https://example.org"
            className="mt-2 w-full rounded-xl border bg-transparent px-4 py-3 outline-none focus:ring-2"
          />
        </div>

        <label className="flex items-center gap-3 self-end pb-3">
          <input
            type="checkbox"
            name="featured"
            className="h-4 w-4"
          />

          <span className="text-sm">
            Featured charity
          </span>
        </label>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="mt-6 rounded-xl bg-foreground px-5 py-3 font-medium text-background disabled:opacity-50"
      >
        {isPending ? "Creating..." : "Create charity"}
      </button>
    </form>
  );
}