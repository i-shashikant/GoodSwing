import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { submitWinnerProof } from "./actions";

export default async function WinningsPage() {
  // Ensure that only authenticated users can access
  // their winnings page.
  const user = await requireUser();

  // Create a Supabase server client.
  const supabase = await createClient();

  // Fetch all winning entries belonging to the current user.
  // The related draw information is fetched at the same time.
  const { data: winners, error } = await supabase
    .from("winners")
    .select(
      "id,match_count,prize_amount,verification_status,payment_status,proof_path,admin_note,draws(draw_month,number_1,number_2,number_3,number_4,number_5)"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Handle database errors.
  if (error) {
    throw new Error(error.message);
  }

  // Calculate the total prize amount won across all entries.
  const total = (winners ?? []).reduce(
    (sum, winner) =>
      sum + Number(winner.prize_amount || 0),
    0
  );

  // Calculate the total amount that has already been paid.
  const paid = (winners ?? [])
    .filter((winner) => winner.payment_status === "paid")
    .reduce(
      (sum, winner) =>
        sum + Number(winner.prize_amount || 0),
      0
    );

  return (
    <main className="min-h-screen px-6 py-10 md:px-10">
      <div className="mx-auto max-w-5xl">

        {/* Back to dashboard */}
        <Link
          href="/dashboard"
          className="text-sm text-muted-foreground"
        >
          ← Dashboard
        </Link>

        {/* =========================================================
            PAGE HEADER
            ========================================================= */}
        <header className="mt-8 border-b pb-8">
          <p className="text-sm font-medium text-[#087f4e]">
            YOUR WINNINGS
          </p>

          <h1 className="mt-2 text-4xl font-semibold tracking-tight">
            Results & payouts
          </h1>

          <p className="mt-3 text-muted-foreground">
            View winning draws, submit proof and track payment status.
          </p>
        </header>

        {/* =========================================================
            WINNINGS SUMMARY
            ========================================================= */}
        <section className="mt-8 grid gap-4 md:grid-cols-3">

          {/* Total winnings */}
          <div className="rounded-2xl border p-6">
            <p className="text-sm text-muted-foreground">
              Total won
            </p>

            <p className="mt-2 text-3xl font-semibold">
              ₹{total.toLocaleString("en-IN")}
            </p>
          </div>

          {/* Total paid winnings */}
          <div className="rounded-2xl border p-6">
            <p className="text-sm text-muted-foreground">
              Paid
            </p>

            <p className="mt-2 text-3xl font-semibold">
              ₹{paid.toLocaleString("en-IN")}
            </p>
          </div>

          {/* Number of winning entries */}
          <div className="rounded-2xl border p-6">
            <p className="text-sm text-muted-foreground">
              Winning entries
            </p>

            <p className="mt-2 text-3xl font-semibold">
              {winners?.length ?? 0}
            </p>
          </div>
        </section>

        {/* =========================================================
            WINNING ENTRIES
            ========================================================= */}
        <section className="mt-8 space-y-4">
          {winners?.map((winner) => (
            <article
              key={winner.id}
              className="rounded-2xl border p-6"
            >
              <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">

                {/* =================================================
                    WINNER DETAILS
                    ================================================= */}
                <div>
                  {/* Draw month */}
                  <p className="text-sm text-muted-foreground">
                    {winner.draws?.[0]?.draw_month}
                  </p>

                  {/* Match result */}
                  <h2 className="mt-1 text-2xl font-semibold">
                    {winner.match_count}-number match
                  </h2>

                  {/* Prize amount */}
                  <p className="mt-2 text-lg font-medium">
                    ₹
                    {Number(
                      winner.prize_amount
                    ).toLocaleString("en-IN")}
                  </p>

                  {/* Verification and payment states */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full border px-3 py-1 text-xs capitalize">
                      Verification:{" "}
                      {winner.verification_status}
                    </span>

                    <span className="rounded-full border px-3 py-1 text-xs capitalize">
                      Payment:{" "}
                      {winner.payment_status}
                    </span>
                  </div>
                </div>

                {/* =================================================
                    PROOF SUBMISSION
                    ================================================= */}
                <div className="w-full md:max-w-sm">

                  {/* Allow proof submission when the winner
                      has not yet been approved or submitted. */}
                  {winner.verification_status !== "approved" &&
                    winner.verification_status !== "submitted" && (
                      <form
                        action={submitWinnerProof}
                        className="rounded-xl border p-4"
                      >
                        {/* Identify the winner being updated */}
                        <input
                          type="hidden"
                          name="winnerId"
                          value={winner.id}
                        />

                        {/* Proof upload */}
                        <label className="text-sm font-medium">
                          Upload score proof
                        </label>

                        <input
                          name="proof"
                          type="file"
                          accept="image/*"
                          required
                          className="mt-3 block w-full text-sm"
                        />

                        <button
                          className="mt-4 rounded-xl bg-foreground px-4 py-2 text-sm font-medium text-background"
                        >
                          Submit proof
                        </button>
                      </form>
                    )}

                  {/* Explain why the user can resubmit proof. */}
                  {winner.verification_status === "rejected" && (
                    <p className="mt-3 text-sm text-red-600">
                      Your previous proof was rejected. Please submit
                      a clearer screenshot.
                    </p>
                  )}

                  {/* Show the previously submitted proof. */}
                  {winner.proof_path && (
                    <a
                      href={winner.proof_path}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-block text-sm font-semibold underline"
                    >
                      View submitted proof
                    </a>
                  )}
                </div>
              </div>
            </article>
          ))}

          {/* =======================================================
              EMPTY STATE
              ======================================================= */}
          {!winners?.length && (
            <div className="rounded-2xl border border-dashed p-10 text-center">
              <h2 className="font-semibold">
                No winnings yet.
              </h2>

              <p className="mt-2 text-sm text-muted-foreground">
                Keep your five latest scores up to date and watch
                the monthly draw.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}