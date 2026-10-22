import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(
      new URL("/login", request.url)
    );
  }

  const formData = await request.formData();

  const charityId = String(
    formData.get("charityId") ?? ""
  ).trim();

  if (!charityId) {
    return NextResponse.redirect(
      new URL("/dashboard/charity?error=Invalid%20charity", request.url)
    );
  }

  const { data: charity } = await supabase
    .from("charities")
    .select("id")
    .eq("id", charityId)
    .eq("active", true)
    .maybeSingle();

  if (!charity) {
    return NextResponse.redirect(
      new URL(
        "/dashboard/charity?error=Charity%20not%20available",
        request.url
      )
    );
  }

  const { error } = await supabase
    .from("user_charity_preferences")
    .upsert(
      {
        user_id: user.id,
        charity_id: charityId,
      },
      {
        onConflict: "user_id",
      }
    );

  if (error) {
    console.error("Failed to save charity preference:", error);

    return NextResponse.redirect(
      new URL(
        "/dashboard/charity?error=Could%20not%20save%20preference",
        request.url
      )
    );
  }

  await supabase.from("subscriptions").update({ charity_id: charityId }).eq("user_id", user.id);

  return NextResponse.redirect(
    new URL("/dashboard/charity?saved=true", request.url)
  );
}