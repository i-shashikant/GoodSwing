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
        toast.error(error instanceof Error ? error.message : "Couldn't create charity.");
      }
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="mt-10 rounded-3xl border border-white/10 bg-white/[.025] p-6 md:p-7">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[.2em] text-emerald-300">New cause</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Add a charity</h2>
        <p className="mt-1 text-sm text-white/45">Create a cause that members can discover and support.</p>
      </div>

      <div className="mt-7 grid gap-5 md:grid-cols-2">
        <Field label="Charity name">
          <input name="name" required placeholder="e.g. Green Horizons Foundation" className="admin-input" />
        </Field>
        <Field label="Category">
          <input name="category" placeholder="Environment" className="admin-input" />
        </Field>
        <Field label="Description" className="md:col-span-2">
          <textarea name="description" required rows={3} placeholder="What does this charity support?" className="admin-input min-h-28 resize-y" />
        </Field>
        <Field label="Website">
          <input name="website_url" type="url" placeholder="https://example.org" className="admin-input" />
        </Field>
        <Field label="Image URL">
          <input name="image_url" type="url" placeholder="https://example.org/image.jpg" className="admin-input" />
        </Field>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
        <label className="flex items-center gap-3 text-sm text-white/70">
          <input type="checkbox" name="featured" className="h-4 w-4 accent-emerald-400" />
          Featured charity
        </label>
        <button type="submit" disabled={isPending} className="admin-primary-button">
          {isPending ? "Creating…" : "Create charity"}
        </button>
      </div>
    </form>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={className}>
      <span className="text-sm font-medium text-white/80">{label}</span>
      <span className="mt-2 block">{children}</span>
    </label>
  );
}
