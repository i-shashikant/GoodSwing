import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { UserEditor } from "@/components/admin/user-editor";

export default async function AdminUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const admin = createAdminClient();

  const [{ data: profile }, { data: sub }, { data: scores }] = await Promise.all([
    admin.from("profiles").select("id,full_name,email,role").eq("id", id).maybeSingle(),
    admin.from("subscriptions").select("status,plan").eq("user_id", id).maybeSingle(),
    admin
      .from("scores")
      .select("id,score,played_at")
      .eq("user_id", id)
      .order("played_at", { ascending: false }),
  ]);

  if (!profile) notFound();

  return (
    <main className="px-6 py-8 md:px-10">
      <div className="mx-auto max-w-6xl">
        <Link href="/admin/users" className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900">
          <ArrowLeft className="h-4 w-4" /> All users
        </Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">
          {profile.full_name || "Unnamed member"}
        </h1>

        <UserEditor
          userId={profile.id}
          fullName={profile.full_name ?? ""}
          email={profile.email ?? ""}
          scores={scores ?? []}
          membership={sub?.status ?? "none"}
        />
      </div>
    </main>
  );
}