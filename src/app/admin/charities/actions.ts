"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("You must be logged in.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") throw new Error("Admin access required.");
  return supabase;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function revalidateCharitySurfaces() {
  revalidatePath("/");
  revalidatePath("/charities");
  revalidatePath("/dashboard/charity");
  revalidatePath("/admin");
  revalidatePath("/admin/charities");
}

export async function createCharity(formData: FormData) {
  const supabase = await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const websiteUrl = String(formData.get("website_url") ?? "").trim();
  const imageUrl = String(formData.get("image_url") ?? "").trim();
  const featured = formData.get("featured") === "on";

  if (!name || !description) {
    throw new Error("Name and description are required.");
  }

  const slug = `${slugify(name)}-${Date.now().toString(36)}`;
  const { error } = await supabase.from("charities").insert({
    name,
    slug,
    description,
    category: category || null,
    website_url: websiteUrl || null,
    image_url: imageUrl || null,
    featured,
    active: true,
  });

  if (error) throw new Error(error.message);
  revalidateCharitySurfaces();
}

export async function toggleCharity(charityId: string, active: boolean) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("charities").update({ active }).eq("id", charityId);
  if (error) throw new Error(error.message);
  revalidateCharitySurfaces();
}

export async function toggleFeatured(charityId: string, featured: boolean) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("charities").update({ featured }).eq("id", charityId);
  if (error) throw new Error(error.message);
  revalidateCharitySurfaces();
}

export async function updateCharity(formData: FormData) {
  const supabase = await requireAdmin();

  const id = String(formData.get("id") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const category = String(formData.get("category") || "").trim();
  const websiteUrl = String(formData.get("website_url") || "").trim();
  const imageUrl = String(formData.get("image_url") || "").trim();
  const featured = formData.get("featured") === "on";

  if (!id || !name || !description) {
    throw new Error("Name and description are required.");
  }

  const { error } = await supabase
    .from("charities")
    .update({
      name,
      description,
      category: category || null,
      website_url: websiteUrl || null,
      image_url: imageUrl || null,
      featured,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidateCharitySurfaces();
}

export async function deleteCharity(charityId: string) {
  const supabase = await requireAdmin();

  // Contributions reference charities with ON DELETE RESTRICT, so a charity
  // with financial history cannot be physically deleted. Deactivation is the
  // safe operational alternative in that case.
  const { error } = await supabase.from("charities").delete().eq("id", charityId);

  if (error) {
    if (error.code === "23503") {
      throw new Error("This charity has contribution history and cannot be deleted. Deactivate it instead.");
    }
    throw new Error(error.message);
  }

  revalidateCharitySurfaces();
}

export async function createCharityEvent(formData: FormData) {
  const supabase = await requireAdmin();

  const charityId = String(formData.get("charity_id") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const eventDate = String(formData.get("event_date") || "").trim();
  const amount = String(formData.get("amount") || "").trim();

  if (!charityId || !title) throw new Error("Charity and event title are required.");

  const amountPaise = amount ? Math.round(Number(amount) * 100) : null;
  if (amountPaise !== null && (!Number.isFinite(amountPaise) || amountPaise < 0)) {
    throw new Error("Event amount must be a valid positive amount.");
  }

  const { error } = await supabase.from("charity_events").insert({
    charity_id: charityId,
    title,
    description: description || null,
    event_date: eventDate || null,
    amount_paise: amountPaise,
  });

  if (error) throw new Error(error.message);
  revalidateCharitySurfaces();
}

export async function updateCharityEvent(formData: FormData) {
  const supabase = await requireAdmin();

  const id = String(formData.get("id") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const eventDate = String(formData.get("event_date") || "").trim();
  const amount = String(formData.get("amount") || "").trim();

  if (!id || !title) throw new Error("Event title is required.");

  const amountPaise = amount ? Math.round(Number(amount) * 100) : null;
  if (amountPaise !== null && (!Number.isFinite(amountPaise) || amountPaise < 0)) {
    throw new Error("Event amount must be a valid positive amount.");
  }

  const { error } = await supabase
    .from("charity_events")
    .update({
      title,
      description: description || null,
      event_date: eventDate || null,
      amount_paise: amountPaise,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidateCharitySurfaces();
}

export async function deleteCharityEvent(eventId: string) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("charity_events").delete().eq("id", eventId);
  if (error) throw new Error(error.message);
  revalidateCharitySurfaces();
}
