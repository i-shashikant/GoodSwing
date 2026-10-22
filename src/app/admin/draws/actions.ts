"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

import {
  simulateDraw,
  executeAndPublishDraw,
  DrawMethod,
} from "@/lib/draw-engine";

async function requireAdmin() {
  const supabase =
    await createClient();

  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  if (!user) {
    throw new Error(
      "Unauthorized"
    );
  }

  const {
    data: profile,
  } =
    await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

  if (
    profile?.role !==
    "admin"
  ) {
    throw new Error(
      "Admin access required"
    );
  }

  return {
    supabase,
    user,
  };
}

export async function createDraw(
  formData: FormData
) {
  const {
    supabase,
    user,
  } = await requireAdmin();

  const drawMonth =
    String(
      formData.get(
        "draw_month"
      ) || ""
    ).trim();

  const drawDate =
    String(
      formData.get(
        "draw_date"
      ) || ""
    ).trim();

  const drawMethod =
    String(
      formData.get(
        "draw_method"
      ) || "random"
    ).trim();

  const prizePool =
    Number(
      formData.get(
        "prize_pool"
      ) || 0
    );

  // ----------------------------------------------------------
  // Validation
  // ----------------------------------------------------------

  if (!drawMonth) {
    throw new Error(
      "Draw month is required."
    );
  }

  if (!drawDate) {
    throw new Error(
      "Draw date is required."
    );
  }

  if (
    ![
      "random",
      "weighted",
    ].includes(drawMethod)
  ) {
    throw new Error(
      "Invalid draw method. Must be random or weighted."
    );
  }

  if (
    !Number.isFinite(
      prizePool
    ) ||
    prizePool < 0
  ) {
    throw new Error(
      "Prize pool cannot be negative."
    );
  }

  const drawMonthDate =
    `${drawMonth}-01`;

  const parsedDrawDate =
    new Date(drawDate);

  if (
    Number.isNaN(
      parsedDrawDate.getTime()
    )
  ) {
    throw new Error(
      "Invalid draw date."
    );
  }

  // ----------------------------------------------------------
  // Prevent duplicate monthly draws
  // ----------------------------------------------------------

  const {
    data: existingDraw,
  } =
    await supabase
      .from("draws")
      .select("id")
      .eq(
        "draw_month",
        drawMonthDate
      )
      .maybeSingle();

  if (existingDraw) {
    throw new Error(
      "A draw already exists for this month."
    );
  }

  // ----------------------------------------------------------
  // Automatically get previous jackpot rollover
  // ----------------------------------------------------------

  const {
    data: previousDraw,
  } =
    await supabase
      .from("draws")
      .select(
        "jackpot_rollover_out"
      )
      .eq(
        "status",
        "completed"
      )
      .lt(
        "draw_month",
        drawMonthDate
      )
      .order(
        "draw_month",
        {
          ascending:
            false,
        }
      )
      .limit(1)
      .maybeSingle();

  const jackpotRollover =
    Number(
      previousDraw
        ?.jackpot_rollover_out ??
        0
    );

  // ----------------------------------------------------------
  // Create draft
  // ----------------------------------------------------------

  const {
    error,
  } =
    await supabase
      .from("draws")
      .insert({
        draw_month:
          drawMonthDate,

        draw_date:
          parsedDrawDate.toISOString(),

        status:
          "draft",

        draw_method:
          drawMethod,

        prize_pool:
          prizePool,

        jackpot_rollover:
          jackpotRollover,

        jackpot_rollover_out:
          0,

        created_by:
          user.id,
      });

  if (error) {
    throw new Error(
      error.message
    );
  }

  revalidatePath(
    "/admin"
  );

  revalidatePath(
    "/admin/draws"
  );

  revalidatePath(
    "/dashboard"
  );
}

export async function updateDrawStatus(
  drawId: string,
  status: string
) {
  const {
    supabase,
  } = await requireAdmin();

  const allowedStatuses =
    [
      "draft",
      "open",
      "closed",
      "completed",
    ];

  if (
    !allowedStatuses.includes(
      status
    )
  ) {
    throw new Error(
      "Invalid draw status."
    );
  }

  // Don't allow changes to a completed draw.
  if (
    status !==
    "completed"
  ) {
    const {
      data: existingDraw,
    } =
      await supabase
        .from("draws")
        .select(
          "status"
        )
        .eq(
          "id",
          drawId
        )
        .single();

    if (
      existingDraw?.status ===
      "completed"
    ) {
      throw new Error(
        "Completed draws cannot be modified."
      );
    }
  }

  const {
    error,
  } =
    await supabase
      .from("draws")
      .update({
        status,

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "id",
        drawId
      );

  if (error) {
    throw new Error(
      error.message
    );
  }

  revalidatePath(
    "/admin"
  );

  revalidatePath(
    "/admin/draws"
  );

  revalidatePath(
    "/dashboard"
  );
}

export async function runSimulation(
  drawId: string,
  method?: DrawMethod
) {
  await requireAdmin();

  return simulateDraw(
    drawId,
    method
  );
}

export async function publishDraw(
  drawId: string,
  method: DrawMethod,
  numbers: [
    number,
    number,
    number,
    number,
    number
  ]
) {
  await requireAdmin();

  const result =
    await executeAndPublishDraw(
      drawId,
      method,
      numbers
    );

  revalidatePath(
    "/admin"
  );

  revalidatePath(
    "/admin/draws"
  );

  revalidatePath(
    "/admin/winners"
  );

  revalidatePath(
    "/dashboard"
  );

  return result;
}