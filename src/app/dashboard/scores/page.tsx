import { redirect } from "next/navigation";
import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { ScoreForm } from "@/components/scores/score-form";
import { ScoreList } from "@/components/scores/score-list";

export default async function ScoresPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: scores, error } = await supabase
    .from("scores")
    .select("id, score, played_at")
    .eq("user_id", user.id)
    .order("played_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/dashboard"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to dashboard
        </Link>

        <header className="mt-8 mb-8">
          <p className="text-sm font-medium text-muted-foreground">
            GoodSwing / Your game
          </p>

          <h1 className="mt-2 text-4xl font-semibold tracking-tight">
            Your scores
          </h1>

          <p className="mt-3 max-w-2xl text-muted-foreground">
            Keep your five most recent Stableford rounds up to date.
            Your latest scores are used for GoodSwing participation.
          </p>
        </header>

        <div className="space-y-6">
          <ScoreForm />

          <ScoreList scores={scores ?? []} />
        </div>
      </div>
    </main>
  );
}