"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in.");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    throw new Error("Admin access required.");
  }

  return supabase;
}

export async function createCharity(formData: FormData) {
  const supabase = await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const websiteUrl = String(formData.get("website_url") ?? "").trim();
  const featured = formData.get("featured") === "on";

  if (!name || !description) {
    throw new Error("Name and description are required.");
  }

  const { error } = await supabase.from("charities").insert({
    name,
    description,
    category: category || null,
    website_url: websiteUrl || null,
    featured,
    active: true,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/charity");
  revalidatePath("/admin/charities");
}

export async function toggleCharity(
  charityId: string,
  active: boolean
) {
  const supabase = await requireAdmin();

  const { error } = await supabase
    .from("charities")
    .update({ active })
    .eq("id", charityId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/charity");
  revalidatePath("/admin/charities");
}