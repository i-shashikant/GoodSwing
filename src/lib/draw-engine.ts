import { createAdminClient } from "@/lib/supabase/admin";

export type DrawMethod = "random" | "weighted";

type Participant = {
  userId: string;
  fullName: string;
  email: string;
  scores: [number, number, number, number, number];
};

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
    winners: Participant[];
  };

  tier2: {
    poolSharePct: 35;
    allocatedAmount: number;
    winnerCount: number;
    prizePerWinner: number;
    winners: Participant[];
  };

  tier3: {
    poolSharePct: 25;
    allocatedAmount: number;
    winnerCount: number;
    prizePerWinner: number;
    winners: Participant[];
  };

  frequencyTable: Record<number, number>;
};

/**
 * Generates 5 unique numbers between 1 and 45.
 *
 * random:
 *   Uniform lottery-style selection.
 *
 * weighted:
 *   Probability is proportional to the frequency of each
 *   Stableford score among eligible participants.
 */
export function generateDrawNumbers(
  method: DrawMethod,
  playerScores: number[][]
): [number, number, number, number, number] {
  if (method === "random") {
    const pool = Array.from(
      { length: 45 },
      (_, index) => index + 1
    );

    const selected: number[] = [];

    while (selected.length < 5) {
      const index = Math.floor(
        Math.random() * pool.length
      );

      selected.push(
        pool.splice(index, 1)[0]
      );
    }

    selected.sort((a, b) => a - b);

    return selected as [
      number,
      number,
      number,
      number,
      number
    ];
  }

  // ----------------------------------------------------------
  // Weighted / algorithmic draw
  // ----------------------------------------------------------

  const frequencies: Record<number, number> = {};

  // Laplace smoothing:
  // every number from 1-45 starts with weight 1.
  for (let number = 1; number <= 45; number++) {
    frequencies[number] = 1;
  }

  for (const round of playerScores) {
    for (const score of round) {
      if (score >= 1 && score <= 45) {
        frequencies[score] += 1;
      }
    }
  }

  const pool = Array.from(
    { length: 45 },
    (_, index) => index + 1
  );

  const selected: number[] = [];

  while (selected.length < 5) {
    const totalWeight = pool.reduce(
      (sum, number) =>
        sum + frequencies[number],
      0
    );

    let randomWeight =
      Math.random() * totalWeight;

    for (let index = 0; index < pool.length; index++) {
      const number = pool[index];

      randomWeight -=
        frequencies[number];

      if (randomWeight <= 0) {
        selected.push(
          pool.splice(index, 1)[0]
        );

        break;
      }
    }
  }

  selected.sort((a, b) => a - b);

  return selected as [
    number,
    number,
    number,
    number,
    number
  ];
}

/**
 * Fetch all participants eligible for a particular draw.
 *
 * A participant must:
 *
 * 1. Have an active subscription on the draw date.
 * 2. Have exactly/latest 5 recorded Stableford scores.
 */
export async function getEligibleParticipants(
  drawDate?: string
) {
  const admin = createAdminClient();

  const eligibilityDate = drawDate
    ? new Date(drawDate)
    : new Date();

  if (Number.isNaN(eligibilityDate.getTime())) {
    throw new Error(
      "Invalid draw eligibility date."
    );
  }

  // ----------------------------------------------------------
  // 1. Get active subscriptions
  // ----------------------------------------------------------

  const {
    data: subscriptions,
    error: subscriptionError,
  } = await admin
    .from("subscriptions")
    .select(
      [
        "user_id",
        "plan",
        "amount",
        "status",
        "current_period_start",
        "current_period_end",
      ].join(", ")
    )
    .eq("status", "active");

  if (subscriptionError) {
    throw new Error(
      subscriptionError.message
    );
  }

  type SubscriptionRow = {
  user_id: string;
  current_period_start: string | null;
  current_period_end: string | null;
};

  const activeSubscriptions: SubscriptionRow[] = [];

  for (const row of subscriptions ?? []) {
    const subscription = row as unknown as SubscriptionRow;

    const startsBeforeDraw =
      !subscription.current_period_start ||
      new Date(subscription.current_period_start) <= eligibilityDate;

    const endsAfterDraw =
      !subscription.current_period_end ||
      new Date(subscription.current_period_end) >= eligibilityDate;

    if (startsBeforeDraw && endsAfterDraw) {
      activeSubscriptions.push(subscription);
    }
  }

  const activeUserIds = activeSubscriptions.map(
    (subscription) => subscription.user_id
  );

    if (activeUserIds.length === 0) {
      return {
        participants: [] as Participant[],
        totalSubscribers: 0,
        activeSubscriptions,
      };
    }

  // ----------------------------------------------------------
  // 2. Fetch profiles
  // ----------------------------------------------------------

  const {
    data: profiles,
    error: profileError,
  } = await admin
    .from("profiles")
    .select(
      "id, full_name, email, role"
    )
    .in("id", activeUserIds);

  if (profileError) {
    throw new Error(
      profileError.message
    );
  }

  const profileMap = new Map(
    (profiles ?? []).map(
      (profile) => [
        profile.id,
        profile,
      ]
    )
  );

  // ----------------------------------------------------------
  // 3. Fetch scores
  // ----------------------------------------------------------

  const {
    data: scores,
    error: scoresError,
  } = await admin
    .from("scores")
    .select(
      "id, user_id, score, played_at"
    )
    .in("user_id", activeUserIds)
    .order("played_at", {
      ascending: false,
    });

  if (scoresError) {
    throw new Error(
      scoresError.message
    );
  }

  // Keep only the latest 5 scores per user.
  const userScoresMap =
    new Map<string, number[]>();

  for (const score of scores ?? []) {
    const existing =
      userScoresMap.get(
        score.user_id
      ) ?? [];

    if (existing.length < 5) {
      existing.push(score.score);

      userScoresMap.set(
        score.user_id,
        existing
      );
    }
  }

  // ----------------------------------------------------------
  // 4. Build eligible participants
  // ----------------------------------------------------------

  const participants: Participant[] =
    [];

  for (const userId of activeUserIds) {
    const userScores =
      userScoresMap.get(userId) ?? [];

    // A user needs 5 scores to participate.
    if (userScores.length !== 5) {
      continue;
    }

    const profile =
      profileMap.get(userId);

    participants.push({
      userId,
      fullName:
        profile?.full_name ||
        "Golfer",
      email:
        profile?.email ||
        "",
      scores:
        userScores as [
          number,
          number,
          number,
          number,
          number
        ],
    });
  }

  return {
    participants,
    totalSubscribers:
      activeUserIds.length,
    activeSubscriptions,
  };
}

/**
 * Simulates a draw without persisting anything.
 */
export async function simulateDraw(
  drawId: string,
  methodOverride?: DrawMethod,
  numbersOverride?: [
    number,
    number,
    number,
    number,
    number
  ]
): Promise<DrawSimulationResult> {
  const admin =
    createAdminClient();

  // ----------------------------------------------------------
  // 1. Load draw
  // ----------------------------------------------------------

  const {
    data: draw,
    error: drawError,
  } = await admin
    .from("draws")
    .select("*")
    .eq("id", drawId)
    .single();

  if (drawError || !draw) {
    throw new Error(
      "Draw not found."
    );
  }

  // Do not simulate an already completed draw.
  if (draw.status === "completed") {
    throw new Error(
      "This draw has already been completed."
    );
  }

  const method: DrawMethod =
    methodOverride ||
    (draw.draw_method as DrawMethod) ||
    "random";

  // ----------------------------------------------------------
  // 2. Get eligible participants
  // ----------------------------------------------------------

  const {
    participants,
    totalSubscribers,
  } =
    await getEligibleParticipants(
      draw.draw_date
    );

  // ----------------------------------------------------------
  // 3. Build frequency table
  // ----------------------------------------------------------

  const frequencyTable:
    Record<number, number> = {};

  for (
    let number = 1;
    number <= 45;
    number++
  ) {
    frequencyTable[number] = 0;
  }

  for (const participant of participants) {
    for (const score of participant.scores) {
      if (
        score >= 1 &&
        score <= 45
      ) {
        frequencyTable[score] += 1;
      }
    }
  }

  // ----------------------------------------------------------
  // 4. Generate / use winning numbers
  // ----------------------------------------------------------

  const drawnNumbers =
    numbersOverride ||
    generateDrawNumbers(
      method,
      participants.map(
        (participant) =>
          participant.scores
      )
    );

  const winningSet =
    new Set(drawnNumbers);

  // ----------------------------------------------------------
  // 5. Find winners
  // ----------------------------------------------------------

  const tier5Winners:
    Participant[] = [];

  const tier4Winners:
    Participant[] = [];

  const tier3Winners:
    Participant[] = [];

  for (const participant of participants) {
    const matches =
      participant.scores.filter(
        (score) =>
          winningSet.has(score)
      ).length;

    if (matches === 5) {
      tier5Winners.push(
        participant
      );
    } else if (matches === 4) {
      tier4Winners.push(
        participant
      );
    } else if (matches === 3) {
      tier3Winners.push(
        participant
      );
    }
  }

  // ----------------------------------------------------------
  // 6. Prize pool
  // ----------------------------------------------------------

  const incomingRollover =
    Number(
      draw.jackpot_rollover
    ) || 0;

  let basePrizePool =
    Number(draw.prize_pool) || 0;

  // If admin entered 0, calculate automatically.
  //
  // ₹499 membership × 50% allocated to prize pool
  // = approximately ₹250 per active subscriber.
  if (
    basePrizePool === 0 &&
    totalSubscribers > 0
  ) {
    basePrizePool =
      totalSubscribers * 250;
  }

  const effectivePool =
    basePrizePool +
    incomingRollover;

  // ----------------------------------------------------------
  // 7. Prize distribution
  // ----------------------------------------------------------

  const tier1Amount =
    Math.round(
      effectivePool * 0.4
    );

  const tier2Amount =
    Math.round(
      effectivePool * 0.35
    );

  const tier3Amount =
    Math.round(
      effectivePool * 0.25
    );

  const tier1WinnerCount =
    tier5Winners.length;

  const tier2WinnerCount =
    tier4Winners.length;

  const tier3WinnerCount =
    tier3Winners.length;

  const rolloverAmount =
    tier1WinnerCount === 0
      ? tier1Amount
      : 0;

  return {
    drawId: draw.id,
    drawMonth: draw.draw_month,
    drawMethod: method,
    drawnNumbers,

    totalSubscribers,
    eligibleSubscribers:
      participants.length,

    totalPrizePool:
      effectivePool,

    incomingRollover,

    tier1: {
      poolSharePct: 40,
      allocatedAmount:
        tier1Amount,
      winnerCount:
        tier1WinnerCount,
      prizePerWinner:
        tier1WinnerCount > 0
          ? Math.floor(
              tier1Amount /
                tier1WinnerCount
            )
          : 0,
      rolledOver:
        tier1WinnerCount === 0,
      rolloverAmount,
      winners:
        tier5Winners,
    },

    tier2: {
      poolSharePct: 35,
      allocatedAmount:
        tier2Amount,
      winnerCount:
        tier2WinnerCount,
      prizePerWinner:
        tier2WinnerCount > 0
          ? Math.floor(
              tier2Amount /
                tier2WinnerCount
            )
          : 0,
      winners:
        tier4Winners,
    },

    tier3: {
      poolSharePct: 25,
      allocatedAmount:
        tier3Amount,
      winnerCount:
        tier3WinnerCount,
      prizePerWinner:
        tier3WinnerCount > 0
          ? Math.floor(
              tier3Amount /
                tier3WinnerCount
            )
          : 0,
      winners:
        tier3Winners,
    },

    frequencyTable,
  };
}

/**
 * Commits and publishes a completed draw.
 *
 * This records:
 * - draw entries
 * - winners
 * - winning numbers
 * - prize pool
 * - jackpot rollover
 * - completed status
 */
export async function executeAndPublishDraw(
  drawId: string,
  method: DrawMethod,
  drawnNumbers: [
    number,
    number,
    number,
    number,
    number
  ]
) {
  const admin =
    createAdminClient();

  // ----------------------------------------------------------
  // 1. Make sure draw exists and isn't already completed
  // ----------------------------------------------------------

  const {
    data: currentDraw,
    error: currentDrawError,
  } = await admin
    .from("draws")
    .select(
      "id, status, draw_date"
    )
    .eq("id", drawId)
    .single();

  if (
    currentDrawError ||
    !currentDraw
  ) {
    throw new Error(
      "Draw not found."
    );
  }

  if (
    currentDraw.status ===
    "completed"
  ) {
    throw new Error(
      "This draw has already been completed."
    );
  }

  // ----------------------------------------------------------
  // 2. Simulate the exact numbers being published
  // ----------------------------------------------------------

  const simulation =
    await simulateDraw(
      drawId,
      method,
      drawnNumbers
    );

  // ----------------------------------------------------------
  // 3. Get the exact participant snapshot
  // ----------------------------------------------------------

  const {
    participants,
  } =
    await getEligibleParticipants(
      currentDraw.draw_date
    );

  // ----------------------------------------------------------
  // 4. Record draw entries
  // ----------------------------------------------------------

  if (participants.length > 0) {
    const entriesData =
      participants.map(
        (participant) => ({
          draw_id:
            drawId,

          user_id:
            participant.userId,

          score_1:
            participant.scores[0],

          score_2:
            participant.scores[1],

          score_3:
            participant.scores[2],

          score_4:
            participant.scores[3],

          score_5:
            participant.scores[4],
        })
      );

    const {
      error: entriesError,
    } = await admin
      .from("draw_entries")
      .upsert(
        entriesData,
        {
          onConflict:
            "draw_id,user_id",
          ignoreDuplicates:
            true,
        }
      );

    if (entriesError) {
      throw new Error(
        `Unable to record draw entries: ${entriesError.message}`
      );
    }
  }

  // ----------------------------------------------------------
  // 5. Prepare winners
  // ----------------------------------------------------------

  const winnersToInsert: {
    user_id: string;
    draw_id: string;
    match_count: number;
    prize_amount: number;
    verification_status: string;
    payment_status: string;
  }[] = [];

  for (
    const winner of
    simulation.tier1.winners
  ) {
    winnersToInsert.push({
      user_id:
        winner.userId,

      draw_id:
        drawId,

      match_count: 5,

      prize_amount:
        simulation.tier1
          .prizePerWinner,

      verification_status:
        "pending",

      payment_status:
        "pending",
    });
  }

  for (
    const winner of
    simulation.tier2.winners
  ) {
    winnersToInsert.push({
      user_id:
        winner.userId,

      draw_id:
        drawId,

      match_count: 4,

      prize_amount:
        simulation.tier2
          .prizePerWinner,

      verification_status:
        "pending",

      payment_status:
        "pending",
    });
  }

  for (
    const winner of
    simulation.tier3.winners
  ) {
    winnersToInsert.push({
      user_id:
        winner.userId,

      draw_id:
        drawId,

      match_count: 3,

      prize_amount:
        simulation.tier3
          .prizePerWinner,

      verification_status:
        "pending",

      payment_status:
        "pending",
    });
  }

  // ----------------------------------------------------------
  // 6. Save winners
  // ----------------------------------------------------------

  if (
    winnersToInsert.length > 0
  ) {
    const {
      error: winnersError,
    } = await admin
      .from("winners")
      .upsert(
        winnersToInsert,
        {
          onConflict:
            "draw_id,user_id",
          ignoreDuplicates:
            true,
        }
      );

    if (winnersError) {
      throw new Error(
        `Unable to record winners: ${winnersError.message}`
      );
    }
  }

  // ----------------------------------------------------------
  // 7. Complete draw
  // ----------------------------------------------------------

  const {
    error: updateError,
  } = await admin
    .from("draws")
    .update({
      status:
        "completed",

      draw_method:
        method,

      number_1:
        drawnNumbers[0],

      number_2:
        drawnNumbers[1],

      number_3:
        drawnNumbers[2],

      number_4:
        drawnNumbers[3],

      number_5:
        drawnNumbers[4],

      prize_pool:
        simulation.totalPrizePool,

      jackpot_rollover_out:
        simulation.tier1
          .rolloverAmount,

      updated_at:
        new Date().toISOString(),
    })
    .eq("id", drawId)
    .neq("status", "completed");

  if (updateError) {
    throw new Error(
      updateError.message
    );
  }

  return simulation;
}