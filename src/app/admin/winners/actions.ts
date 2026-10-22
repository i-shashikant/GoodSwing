"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function reviewWinner(formData: FormData) {
  const { user } = await requireAdmin();
  const id = String(formData.get("winnerId") || "").trim();
  const status = String(formData.get("status") || "").trim();
  const adminNote = String(formData.get("adminNote") || "").trim();

  if (!id || !["approved", "rejected"].includes(status)) {
    throw new Error("Invalid winner review.");
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("winners")
    .update({
      verification_status: status,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      admin_note: adminNote || null,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/winners");
  revalidatePath("/admin");
  revalidatePath("/dashboard/winnings");
}

export async function markWinnerPaid(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("winnerId") || "").trim();
  const paymentReference = String(formData.get("paymentReference") || "").trim();
  if (!id) throw new Error("Winner ID is required.");
  if (!paymentReference) throw new Error("Payment reference is required.");

  const admin = createAdminClient();
  const { error } = await admin
    .from("winners")
    .update({
      payment_status: "paid",
      paid_at: new Date().toISOString(),
      payment_reference: paymentReference,
    })
    .eq("id", id)
    .eq("verification_status", "approved");

  if (error) throw new Error(error.message);

  revalidatePath("/admin/winners");
  revalidatePath("/dashboard/winnings");
}
