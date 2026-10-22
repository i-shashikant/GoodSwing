"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  createCharityEvent,
  deleteCharity,
  deleteCharityEvent,
  toggleCharity,
  toggleFeatured,
  updateCharity,
  updateCharityEvent,
} from "@/app/admin/charities/actions";

export type Charity = {
  id: string;
  name: string;
  description: string;
  category: string | null;
  website_url: string | null;
  image_url?: string | null;
  featured: boolean;
  active: boolean;
  created_at: string;
};

export type CharityEvent = {
  id: string;
  charity_id: string;
  title: string;
  description: string | null;
  event_date: string | null;
  amount_paise: number | null;
};

export function CharityAdminList({ charities, events }: { charities: Charity[]; events: CharityEvent[] }) {
  const [editing, setEditing] = useState<Charity | null>(null);
  const [eventCharity, setEventCharity] = useState<Charity | null>(null);
  const [editingEvent, setEditingEvent] = useState<CharityEvent | null>(null);
  const [isPending, startTransition] = useTransition();

  const eventMap = new Map<string, CharityEvent[]>();
  for (const event of events) {
    const list = eventMap.get(event.charity_id) ?? [];
    list.push(event);
    eventMap.set(event.charity_id, list);
  }

  if (charities.length === 0) {
    return <div className="rounded-3xl border border-dashed border-white/10 p-10 text-center text-white/45">No charities have been created yet.</div>;
  }

  function run(action: () => Promise<void>, success: string) {
    startTransition(async () => {
      try {
        await action();
        toast.success(success);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Something went wrong.");
      }
    });
  }

  return (
    <>
      <div className="space-y-4">
        {charities.map((charity) => {
          const charityEvents = eventMap.get(charity.id) ?? [];

          return (
            <article key={charity.id} className="rounded-3xl border border-white/10 bg-white/[.018] p-5 md:p-6">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto]">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-semibold text-white">{charity.name}</h3>
                    {charity.category && <span className="admin-chip">{charity.category}</span>}
                    {charity.featured && <span className="admin-chip border-amber-300/20 bg-amber-300/10 text-amber-200">Featured</span>}
                    <span className={`admin-chip ${charity.active ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-200" : "border-red-300/20 bg-red-300/10 text-red-200"}`}>
                      {charity.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-white/55">{charity.description}</p>
                  {charity.website_url && <a href={charity.website_url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-emerald-300 hover:underline">Visit website ↗</a>}

                  <div className="mt-5 rounded-2xl border border-white/8 bg-black/10 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[.14em] text-white/35">Events & impact</p>
                        <p className="mt-1 text-sm text-white/60">{charityEvents.length ? `${charityEvents.length} event${charityEvents.length === 1 ? "" : "s"} published` : "No events yet"}</p>
                      </div>
                      <button type="button" onClick={() => setEventCharity(charity)} className="admin-outline-button">+ Add event</button>
                    </div>

                    {charityEvents.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {charityEvents.map((event) => (
                          <div key={event.id} className="flex flex-col gap-3 rounded-xl border border-white/8 bg-white/[.02] p-3 md:flex-row md:items-center md:justify-between">
                            <div className="min-w-0">
                              <p className="font-medium text-white">{event.title}</p>
                              <p className="mt-1 text-xs text-white/40">
                                {event.event_date ? new Date(`${event.event_date}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Date not set"}
                                {event.amount_paise != null ? ` · ₹${(Number(event.amount_paise) / 100).toLocaleString("en-IN")}` : ""}
                              </p>
                            </div>
                            <div className="flex shrink-0 gap-2">
                              <button type="button" onClick={() => setEditingEvent(event)} className="admin-outline-button">Edit</button>
                              <button type="button" disabled={isPending} onClick={() => { if (window.confirm(`Delete “${event.title}”?`)) run(() => deleteCharityEvent(event.id), "Event deleted"); }} className="admin-danger-button">Delete</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap content-start gap-2 lg:max-w-[360px] lg:justify-end">
                  <button type="button" disabled={isPending} onClick={() => run(() => toggleCharity(charity.id, !charity.active), charity.active ? "Charity deactivated" : "Charity activated")} className="admin-outline-button">
                    {charity.active ? "Deactivate" : "Activate"}
                  </button>
                  <button type="button" disabled={isPending} onClick={() => run(() => toggleFeatured(charity.id, !charity.featured), charity.featured ? "Charity unfeatured" : "Charity featured")} className="admin-outline-button">
                    {charity.featured ? "Unfeature" : "Feature"}
                  </button>
                  <button type="button" onClick={() => setEditing(charity)} className="admin-outline-button">Edit</button>
                  <button type="button" disabled={isPending} onClick={() => { if (window.confirm(`Delete “${charity.name}”? This cannot be undone.`)) run(() => deleteCharity(charity.id), "Charity deleted"); }} className="admin-danger-button">Delete</button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {editing && (
        <Modal title="Edit charity" onClose={() => setEditing(null)}>
          <form action={(formData) => { startTransition(async () => { try { await updateCharity(formData); setEditing(null); toast.success("Charity updated"); } catch (error) { toast.error(error instanceof Error ? error.message : "Couldn't update charity."); } }); }} className="space-y-4">
            <input type="hidden" name="id" value={editing.id} />
            <Field label="Charity name"><input name="name" defaultValue={editing.name} required className="admin-input" /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Category"><input name="category" defaultValue={editing.category ?? ""} className="admin-input" /></Field>
              <Field label="Website"><input name="website_url" type="url" defaultValue={editing.website_url ?? ""} className="admin-input" /></Field>
            </div>
            <Field label="Image URL"><input name="image_url" type="url" defaultValue={editing.image_url ?? ""} className="admin-input" /></Field>
            <Field label="Description"><textarea name="description" defaultValue={editing.description} required rows={4} className="admin-input min-h-32 resize-y" /></Field>
            <label className="flex items-center gap-3 text-sm text-white/70"><input type="checkbox" name="featured" defaultChecked={editing.featured} className="h-4 w-4 accent-emerald-400" /> Featured charity</label>
            <ModalActions onCancel={() => setEditing(null)} pending={isPending} submit="Save changes" />
          </form>
        </Modal>
      )}

      {eventCharity && (
        <Modal title={`Add event · ${eventCharity.name}`} onClose={() => setEventCharity(null)}>
          <form action={(formData) => { startTransition(async () => { try { await createCharityEvent(formData); setEventCharity(null); toast.success("Event created"); } catch (error) { toast.error(error instanceof Error ? error.message : "Couldn't create event."); } }); }} className="space-y-4">
            <input type="hidden" name="charity_id" value={eventCharity.id} />
            <Field label="Event title"><input name="title" required placeholder="e.g. Community tree planting day" className="admin-input" /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Event date"><input name="event_date" type="date" className="admin-input" /></Field>
              <Field label="Impact amount (₹)"><input name="amount" type="number" min="0" step="0.01" placeholder="Optional" className="admin-input" /></Field>
            </div>
            <Field label="Description"><textarea name="description" rows={4} placeholder="What happened or what will this event fund?" className="admin-input min-h-28 resize-y" /></Field>
            <ModalActions onCancel={() => setEventCharity(null)} pending={isPending} submit="Create event" />
          </form>
        </Modal>
      )}

      {editingEvent && (
        <Modal title="Edit event" onClose={() => setEditingEvent(null)}>
          <form action={(formData) => { startTransition(async () => { try { await updateCharityEvent(formData); setEditingEvent(null); toast.success("Event updated"); } catch (error) { toast.error(error instanceof Error ? error.message : "Couldn't update event."); } }); }} className="space-y-4">
            <input type="hidden" name="id" value={editingEvent.id} />
            <Field label="Event title"><input name="title" required defaultValue={editingEvent.title} className="admin-input" /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Event date"><input name="event_date" type="date" defaultValue={editingEvent.event_date ?? ""} className="admin-input" /></Field>
              <Field label="Impact amount (₹)"><input name="amount" type="number" min="0" step="0.01" defaultValue={editingEvent.amount_paise == null ? "" : Number(editingEvent.amount_paise) / 100} className="admin-input" /></Field>
            </div>
            <Field label="Description"><textarea name="description" rows={4} defaultValue={editingEvent.description ?? ""} className="admin-input min-h-28 resize-y" /></Field>
            <ModalActions onCancel={() => setEditingEvent(null)} pending={isPending} submit="Save changes" />
          </form>
        </Modal>
      )}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-sm font-medium text-white/75">{label}</span><span className="mt-2 block">{children}</span></label>;
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/10 bg-[#141615] p-6 shadow-2xl md:p-7">
        <div className="flex items-start justify-between gap-4">
          <div><p className="text-[10px] font-black uppercase tracking-[.2em] text-emerald-300">Admin</p><h2 className="mt-2 text-2xl font-semibold text-white">{title}</h2></div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-white/60 hover:bg-white/5 hover:text-white" aria-label="Close">×</button>
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

function ModalActions({ onCancel, pending, submit }: { onCancel: () => void; pending: boolean; submit: string }) {
  return <div className="flex justify-end gap-2 border-t border-white/8 pt-5"><button type="button" onClick={onCancel} className="admin-outline-button">Cancel</button><button type="submit" disabled={pending} className="admin-primary-button">{pending ? "Saving…" : submit}</button></div>;
}
