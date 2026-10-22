
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Submit proof for a winner claim.
 *
 * Important:
 * We store ONLY the Supabase Storage path in `proof_path`.
 * We do NOT store a public URL because the winner-proofs bucket
 * is private and should be accessed through signed URLs.
 */
export async function submitWinnerProof(formData: FormData) {
  // Create a Supabase client using the current user's session.
  const supabase = await createClient();

  // Get the currently authenticated user.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Get values from the submitted form.
  const winnerId = String(formData.get("winnerId") || "");
  const file = formData.get("proof");

  // Validate the uploaded file.
  if (
    !winnerId ||
    !(file instanceof File) ||
    file.size === 0
  ) {
    throw new Error("Please choose a proof image.");
  }

  // Maximum file size: 5 MB.
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Proof image must be 5MB or smaller.");
  }

  // Only images are allowed.
  if (!file.type.startsWith("image/")) {
    throw new Error("Proof must be an image.");
  }

  // Admin client is used for the private storage bucket
  // and protected winner record update.
  const admin = createAdminClient();

  // Verify that the winner belongs to the current user.
  const {
    data: winner,
    error: winnerError,
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

  if (winnerError || !winner) {
    throw new Error(
      "Winner is not eligible for proof submission."
    );
  }

  // Keep the extension from the uploaded file.
  const extension =
    file.name.split(".").pop()?.toLowerCase() || "png";

  // Create a unique storage path.
  //
  // IMPORTANT:
  // This is the value that will be stored in `proof_path`.
  // It is NOT a complete URL.
  const storagePath =
    `${user.id}/${winnerId}-${Date.now()}.${extension}`;

  // Upload to the private winner-proofs bucket.
  const { error: uploadError } = await admin.storage
    .from("winner-proofs")
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  // Store ONLY the storage path.
  //
  // Do NOT use getPublicUrl() here.
  const { error: updateError } = await admin
    .from("winners")
    .update({
      proof_path: storagePath,
      verification_status: "submitted",
      admin_note: null,
    })
    .eq("id", winnerId)
    .eq("user_id", user.id);

  if (updateError) {
    // If database update fails, remove the uploaded file
    // so we don't leave an orphaned object in Storage.
    await admin.storage
      .from("winner-proofs")
      .remove([storagePath]);

    throw new Error(updateError.message);
  }

  // Refresh the winnings page.
  revalidatePath("/dashboard/winnings");

  revalidatePath("/admin");

  // Also refresh the admin winner page.
  revalidatePath("/admin/winners");
}
