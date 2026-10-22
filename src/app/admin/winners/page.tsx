import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  reviewWinner,
  markWinnerPaid,
} from "./actions";

export default async function AdminWinnersPage() {
  // Ensure that only authenticated admins can access this page.
  await requireAdmin();

  // Create a Supabase server client.
  const supabase = await createClient();

  // Fetch all winners along with their profile and draw information.
  const { data: winners, error } = await supabase
    .from("winners")
    .select(
      "id,user_id,match_count,prize_amount,verification_status,payment_status,proof_path,admin_note,created_at,profiles(full_name,email),draws(draw_month)"
    )
    .order("created_at", { ascending: false });

  // Handle database errors.
  if (error) {
    throw new Error(error.message);
  }

  return (
    <main className="min-h-screen px-6 py-10 md:px-10">
      <div className="mx-auto max-w-6xl">

        {/* Back to admin dashboard */}
        <Link
          href="/admin"
          className="text-sm text-muted-foreground"
        >
          ← Admin overview
        </Link>

        {/* Page heading */}
        <h1 className="mt-6 text-4xl font-semibold tracking-tight">
          Winner verification
        </h1>

        <p className="mt-2 text-muted-foreground">
          Review proof, approve winners and track payout state.
        </p>

        {/* =========================================================
            WINNERS
            ========================================================= */}
        <div className="mt-8 space-y-4">
          {winners?.map((winner: any) => (
            <div
              key={winner.id}
              className="rounded-2xl border p-6"
            >
              <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">

                {/* =================================================
                    WINNER DETAILS
                    ================================================= */}
                <div>
                  <p className="text-lg font-semibold">
                    {winner.profiles?.full_name ||
                      winner.profiles?.email ||
                      "Winner"}
                  </p>

                  {/* Match count, prize amount and draw month */}
                  <p className="mt-1 text-sm text-muted-foreground">
                    {winner.match_count}-number match · ₹
                    {Number(
                      winner.prize_amount
                    ).toLocaleString("en-IN")}{" "}
                    · {winner.draws?.draw_month}
                  </p>

                  {/* Verification and payment status */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full border px-3 py-1 text-xs capitalize">
                      Proof: {winner.verification_status}
                    </span>

                    <span className="rounded-full border px-3 py-1 text-xs capitalize">
                      Payout: {winner.payment_status}
                    </span>
                  </div>

                  {/* Display submitted proof if available */}
                  {winner.proof_path && (
                    <a
                      href={winner.proof_path}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-block text-sm font-semibold underline"
                    >
                      View proof
                    </a>
                  )}
                </div>

                {/* =================================================
                    ADMIN ACTIONS
                    ================================================= */}
                <div className="flex flex-wrap gap-2">

                  {/* Approve the winner */}
                  {winner.verification_status !== "approved" && (
                    <form action={reviewWinner}>
                      <input
                        type="hidden"
                        name="winnerId"
                        value={winner.id}
                      />

                      <input
                        type="hidden"
                        name="status"
                        value="approved"
                      />

                      <button className="rounded-xl bg-foreground px-4 py-2 text-sm font-medium text-background">
                        Approve
                      </button>
                    </form>
                  )}

                  {/* Reject the winner.
                      Only available while the winner is
                      still awaiting review. */}
                  {winner.verification_status !== "rejected" &&
                    winner.verification_status !== "approved" && (
                      <form action={reviewWinner}>
                        <input
                          type="hidden"
                          name="winnerId"
                          value={winner.id}
                        />

                        <input
                          type="hidden"
                          name="status"
                          value="rejected"
                        />

                        <button className="rounded-xl border px-4 py-2 text-sm">
                          Reject
                        </button>
                      </form>
                    )}

                  {/* Mark an approved winner as paid */}
                  {winner.verification_status === "approved" &&
                    winner.payment_status !== "paid" && (
                      <form action={markWinnerPaid}>
                        <input
                          type="hidden"
                          name="winnerId"
                          value={winner.id}
                        />

                        <button className="rounded-xl bg-[#087f4e] px-4 py-2 text-sm font-semibold text-white">
                          Mark paid
                        </button>
                      </form>
                    )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty state when there are no winners */}
        {!winners?.length && (
          <div className="mt-8 rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
            No winners yet.
          </div>
        )}
      </div>
    </main>
  );
}