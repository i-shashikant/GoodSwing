"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Submit proof for a winner claim.
 *
 * The action:
 * 1. Verifies the user is authenticated.
 * 2. Validates the uploaded proof image.
 * 3. Confirms the winner belongs to the current user.
 * 4. Uploads the proof to Supabase Storage.
 * 5. Updates the winner record with the proof URL.
 */
export async function submitWinnerProof(formData: FormData) {
  // Create a Supabase client using the current user's session.
  const supabase = await createClient();

  // Get the currently authenticated user.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Proof submission requires authentication.
  if (!user) {
    throw new Error("Unauthorized");
  }

  // Get the winner ID and uploaded proof file from the form.
  const winnerId = String(formData.get("winnerId") || "");
  const file = formData.get("proof");

  // Validate that a winner ID and file were provided.
  if (
    !winnerId ||
    !(file instanceof File) ||
    file.size === 0
  ) {
    throw new Error("Please choose a proof image.");
  }

  // Limit proof uploads to 5 MB.
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Proof image must be 5MB or smaller.");
  }

  // Only image files are accepted as winner proof.
  if (!file.type.startsWith("image/")) {
    throw new Error("Proof must be an image.");
  }

  // Use the admin client for storage and winner updates.
  const admin = createAdminClient();

  // Confirm that this winner:
  // - exists,
  // - belongs to the current user, and
  // - is currently eligible to submit proof.
  const {
    data: winner,
    error,
  } = await admin
    .from("winners")
    .select("id")
    .eq("id", winnerId)
    .eq("user_id", user.id)
    .in("verification_status", [
      "pending",
      "awaiting_proof",
      "rejected",
    ])
    .single();

  // Prevent users from submitting proof for an invalid
  // or ineligible winner record.
  if (error || !winner) {
    throw new Error(
      "Winner is not eligible for proof submission."
    );
  }

  // Generate a unique storage path for the proof image.
  const extension =
    file.name.split(".").pop() || "png";

  const path = `${user.id}/${winnerId}-${Date.now()}.${extension}`;

  // Upload the proof image to the private/admin-managed
  // "winner-proofs" storage bucket.
  const { error: uploadError } = await admin.storage
    .from("winner-proofs")
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
    });

  // Handle storage upload errors.
  if (uploadError) {
    throw new Error(uploadError.message);
  }

  // Generate the public URL for the uploaded proof.
  const { data: urlData } = admin.storage
    .from("winner-proofs")
    .getPublicUrl(path);

  // Update the winner record with the proof URL and move
  // the verification state to "submitted".
  const { error: updateError } = await admin
    .from("winners")
    .update({
      proof_path: urlData.publicUrl,
      verification_status: "submitted",
      admin_note: null,
    })
    .eq("id", winnerId)
    .eq("user_id", user.id);

  // Handle database update errors.
  if (updateError) {
    throw new Error(updateError.message);
  }

  // Refresh the winnings dashboard so the new proof status
  // is displayed immediately.
  revalidatePath("/dashboard/winnings");
}