import { createAdminClient } from "@/lib/supabase/admin";

export type DrawMethod = "random" | "weighted";

export type DrawSimulationResult = {
  drawId: string;
  drawMonth: string;
  drawMethod: DrawMethod;
  drawnNumbers: [number, number, number, number, number];
  totalSubscribers: number;
  eligibleSubscribers: number;
  totalPrizePool: number;
  incomingRollover: number;
  tier1: {
    poolSharePct: 40;
    allocatedAmount: number;
    winnerCount: number;
    prizePerWinner: number;
    rolledOver: boolean;
    rolloverAmount: number;
    winners: { userId: string; fullName: string; email: string; scores: number[] }[];
  };
  tier2: {
    poolSharePct: 35;
    allocatedAmount: number;
    winnerCount: number;
    prizePerWinner: number;
    winners: { userId: string; fullName: string; email: string; scores: number[] }[];
  };
  tier3: {
    poolSharePct: 25;
    allocatedAmount: number;
    winnerCount: number;
    prizePerWinner: number;
    winners: { userId: string; fullName: string; email: string; scores: number[] }[];
  };
  frequencyTable: Record<number, number>;
};

/**
 * Generates 5 unique numbers between 1 and 45.
 * Method 'random': Uniform lottery-style.
 * Method 'weighted': Probability proportional to player Stableford score frequency.
 */
export function generateDrawNumbers(
  method: DrawMethod,
  playerScores: number[][]
): [number, number, number, number, number] {
  if (method === "random") {
    const pool = Array.from({ length: 45 }, (_, i) => i + 1);
    const selected: number[] = [];
    while (selected.length < 5) {
      const idx = Math.floor(Math.random() * pool.length);
      selected.push(pool.splice(idx, 1)[0]);
    }
    selected.sort((a, b) => a - b);
    return selected as [number, number, number, number, number];
  }

  // Algorithmic: weighted by score frequency
  // Count frequency of each score 1..45 among active players
  const frequencies: Record<number, number> = {};
  for (let i = 1; i <= 45; i++) {
    frequencies[i] = 1; // Laplace smoothing so every number 1-45 has non-zero chance
  }

  for (const round of playerScores) {
    for (const score of round) {
      if (score >= 1 && score <= 45) {
        frequencies[score] = (frequencies[score] || 1) + 1;
      }
    }
  }

  const pool = Array.from({ length: 45 }, (_, i) => i + 1);
  const selected: number[] = [];

  while (selected.length < 5) {
    const totalWeight = pool.reduce((sum, num) => sum + frequencies[num], 0);
    let randomWeight = Math.random() * totalWeight;

    for (let i = 0; i < pool.length; i++) {
      const num = pool[i];
      randomWeight -= frequencies[num];
      if (randomWeight <= 0) {
        selected.push(pool.splice(i, 1)[0]);
        break;
      }
    }
  }

  selected.sort((a, b) => a - b);
  return selected as [number, number, number, number, number];
}

/**
 * Fetch all eligible subscribers with their current 5 Stableford scores.
 */
export async function getEligibleParticipants() {
  const admin = createAdminClient();

  // 1. Get active subscriptions
  const { data: subs, error: subError } = await admin
    .from("subscriptions")
    .select("user_id, plan, amount, status, current_period_end")
    .eq("status", "active");

  if (subError) throw new Error(subError.message);

  const activeUserIds = (subs ?? [])
    .filter((s) => !s.current_period_end || new Date(s.current_period_end) > new Date())
    .map((s) => s.user_id);

  if (activeUserIds.length === 0) {
    return {
      participants: [],
      totalSubscribers: 0,
      activeSubscriptions: subs ?? [],
    };
  }

  // 2. Fetch profiles
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name, role")
    .in("id", activeUserIds);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  // 3. Fetch latest 5 scores per user
  const { data: scores, error: scoresError } = await admin
    .from("scores")
    .select("id, user_id, score, played_at")
    .in("user_id", activeUserIds)
    .order("played_at", { ascending: false });

  if (scoresError) throw new Error(scoresError.message);

  const userScoresMap = new Map<string, number[]>();
  for (const s of scores ?? []) {
    const list = userScoresMap.get(s.user_id) ?? [];
    if (list.length < 5) {
      list.push(s.score);
      userScoresMap.set(s.user_id, list);
    }
  }

  // Filter participants who have logged 5 rounds
  const participants: {
    userId: string;
    fullName: string;
    email: string;
    scores: [number, number, number, number, number];
  }[] = [];

  for (const userId of activeUserIds) {
    const userScores = userScoresMap.get(userId) ?? [];
    if (userScores.length === 5) {
      const profile = profileMap.get(userId);
      participants.push({
        userId,
        fullName: profile?.full_name || "Golfer",
        email: "",
        scores: userScores as [number, number, number, number, number],
      });
    }
  }

  return {
    participants,
    totalSubscribers: activeUserIds.length,
    activeSubscriptions: subs ?? [],
  };
}

/**
 * Simulates a draw without persisting any changes.
 */
export async function simulateDraw(
  drawId: string,
  methodOverride?: DrawMethod,
  numbersOverride?: [number, number, number, number, number]
): Promise<DrawSimulationResult> {
  const admin = createAdminClient();

  const { data: draw, error: drawError } = await admin
    .from("draws")
    .select("*")
    .eq("id", drawId)
    .single();

  if (drawError || !draw) throw new Error("Draw not found");

  const method: DrawMethod = methodOverride || (draw.draw_method as DrawMethod) || "random";

  const { participants, totalSubscribers } = await getEligibleParticipants();

  // Compute frequency table for diagnostic display
  const frequencyTable: Record<number, number> = {};
  for (let i = 1; i <= 45; i++) frequencyTable[i] = 0;
  for (const p of participants) {
    for (const s of p.scores) {
      if (s >= 1 && s <= 45) {
        frequencyTable[s] = (frequencyTable[s] || 0) + 1;
      }
    }
  }

  // Generate or use numbers
  const drawnNumbers =
    numbersOverride ||
    generateDrawNumbers(
      method,
      participants.map((p) => p.scores)
    );

  const winningSet = new Set(drawnNumbers);

  // Group winners by tier
  const tier5Winners: DrawSimulationResult["tier1"]["winners"] = [];
  const tier4Winners: DrawSimulationResult["tier2"]["winners"] = [];
  const tier3Winners: DrawSimulationResult["tier3"]["winners"] = [];

  for (const p of participants) {
    const matches = p.scores.filter((score) => winningSet.has(score)).length;
    if (matches === 5) {
      tier5Winners.push(p);
    } else if (matches === 4) {
      tier4Winners.push(p);
    } else if (matches === 3) {
      tier3Winners.push(p);
    }
  }

  // Calculate prize pool: based on active subscriber count or draw prize_pool
  const incomingRollover = Number(draw.jackpot_rollover) || 0;
  let totalPrizePool = Number(draw.prize_pool) || 0;

  // If prize_pool was 0, auto-calculate based on PRD § 07: active subscribers * base pool
  if (totalPrizePool === 0 && totalSubscribers > 0) {
    // 50% of ₹499 membership fee allocated to prize pool
    totalPrizePool = totalSubscribers * 250;
  }

  const effectivePool = totalPrizePool + incomingRollover;

  // PRD § 07 Distribution:
  // 5-Number match: 40% (Rollover: Yes - jackpot)
  // 4-Number match: 35% (Rollover: No)
  // 3-Number match: 25% (Rollover: No)
  const tier1Amount = Math.round(effectivePool * 0.4);
  const tier2Amount = Math.round(effectivePool * 0.35);
  const tier3Amount = Math.round(effectivePool * 0.25);

  const tier1WinnerCount = tier5Winners.length;
  const tier2WinnerCount = tier4Winners.length;
  const tier3WinnerCount = tier3Winners.length;

  const rolloverAmount = tier1WinnerCount === 0 ? tier1Amount : 0;

  return {
    drawId: draw.id,
    drawMonth: draw.draw_month,
    drawMethod: method,
    drawnNumbers,
    totalSubscribers,
    eligibleSubscribers: participants.length,
    totalPrizePool: effectivePool,
    incomingRollover,
    tier1: {
      poolSharePct: 40,
      allocatedAmount: tier1Amount,
      winnerCount: tier1WinnerCount,
      prizePerWinner:
        tier1WinnerCount > 0 ? Math.floor(tier1Amount / tier1WinnerCount) : 0,
      rolledOver: tier1WinnerCount === 0,
      rolloverAmount,
      winners: tier5Winners,
    },
    tier2: {
      poolSharePct: 35,
      allocatedAmount: tier2Amount,
      winnerCount: tier2WinnerCount,
      prizePerWinner:
        tier2WinnerCount > 0 ? Math.floor(tier2Amount / tier2WinnerCount) : 0,
      winners: tier4Winners,
    },
    tier3: {
      poolSharePct: 25,
      allocatedAmount: tier3Amount,
      winnerCount: tier3WinnerCount,
      prizePerWinner:
        tier3WinnerCount > 0 ? Math.floor(tier3Amount / tier3WinnerCount) : 0,
      winners: tier3Winners,
    },
    frequencyTable,
  };
}

/**
 * Commits and publishes a completed draw to the database.
 * Records draw_entries, creates winners, updates rollover, and marks draw completed.
 */
export async function executeAndPublishDraw(
  drawId: string,
  method: DrawMethod,
  drawnNumbers: [number, number, number, number, number]
) {
  const admin = createAdminClient();

  const simulation = await simulateDraw(drawId, method, drawnNumbers);

  const { participants } = await getEligibleParticipants();

  // 1. Record draw_entries for all eligible participants
  if (participants.length > 0) {
    const entriesData = participants.map((p) => ({
      draw_id: drawId,
      user_id: p.userId,
      score_1: p.scores[0],
      score_2: p.scores[1],
      score_3: p.scores[2],
      score_4: p.scores[3],
      score_5: p.scores[4],
    }));

    await admin.from("draw_entries").insert(entriesData);
  }

  // 2. Record winners
  const winnersToInsert: {
    user_id: string;
    draw_id: string;
    match_count: number;
    prize_amount: number;
    verification_status: string;
    payment_status: string;
  }[] = [];

  for (const w of simulation.tier1.winners) {
    winnersToInsert.push({
      user_id: w.userId,
      draw_id: drawId,
      match_count: 5,
      prize_amount: simulation.tier1.prizePerWinner,
      verification_status: "pending",
      payment_status: "pending",
    });
  }

  for (const w of simulation.tier2.winners) {
    winnersToInsert.push({
      user_id: w.userId,
      draw_id: drawId,
      match_count: 4,
      prize_amount: simulation.tier2.prizePerWinner,
      verification_status: "pending",
      payment_status: "pending",
    });
  }

  for (const w of simulation.tier3.winners) {
    winnersToInsert.push({
      user_id: w.userId,
      draw_id: drawId,
      match_count: 3,
      prize_amount: simulation.tier3.prizePerWinner,
      verification_status: "pending",
      payment_status: "pending",
    });
  }

  if (winnersToInsert.length > 0) {
    const { error: winError } = await admin.from("winners").insert(winnersToInsert);
    if (winError) throw new Error(winError.message);
  }

  // 3. Update the draw status to 'completed' with numbers
  const { error: updateError } = await admin
    .from("draws")
    .update({
      status: "completed",
      draw_method: method,
      number_1: drawnNumbers[0],
      number_2: drawnNumbers[1],
      number_3: drawnNumbers[2],
      number_4: drawnNumbers[3],
      number_5: drawnNumbers[4],
      prize_pool: simulation.totalPrizePool,
      updated_at: new Date().toISOString(),
    })
    .eq("id", drawId);

  if (updateError) throw new Error(updateError.message);

  return simulation;
}
