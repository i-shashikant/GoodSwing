-- ============================================================
-- GoodSwing — DRAW DATABASE
-- ============================================================


-- ------------------------------------------------------------
-- 1. DRAWS
-- ------------------------------------------------------------

create table public.draws (
  id uuid primary key
    default gen_random_uuid(),

  draw_month date not null unique,

  draw_date timestamptz not null,

  status text not null
    default 'draft'
    check (
      status in (
        'draft',
        'open',
        'closed',
        'completed'
      )
    ),

  draw_method text not null
    default 'random'
    check (
      draw_method in (
        'random',
        'weighted'
      )
    ),

  prize_pool numeric(12,2) not null
    default 0
    check (
      prize_pool >= 0
    ),

  jackpot_rollover numeric(12,2) not null
    default 0
    check (
      jackpot_rollover >= 0
    ),

  jackpot_rollover_out numeric(12,2) not null
    default 0
    check (
      jackpot_rollover_out >= 0
    ),

  number_1 integer
    check (
      number_1 between 1 and 45
    ),

  number_2 integer
    check (
      number_2 between 1 and 45
    ),

  number_3 integer
    check (
      number_3 between 1 and 45
    ),

  number_4 integer
    check (
      number_4 between 1 and 45
    ),

  number_5 integer
    check (
      number_5 between 1 and 45
    ),

  created_by uuid
    references public.profiles(id)
    on delete set null,

  simulated_at timestamptz,

  published_at timestamptz,

  created_at timestamptz not null
    default now(),

  updated_at timestamptz not null
    default now(),

  check (
    draw_month = date_trunc(
      'month',
      draw_month
    )::date
  )
);

create trigger draws_updated_at
before update on public.draws
for each row
execute function public.set_updated_at();


-- ------------------------------------------------------------
-- 2. DRAW ENTRIES
-- ------------------------------------------------------------

-- Stores a frozen copy of the user's five scores
-- for a particular draw.

create table public.draw_entries (
  id uuid primary key
    default gen_random_uuid(),

  draw_id uuid not null
    references public.draws(id)
    on delete cascade,

  user_id uuid not null
    references public.profiles(id)
    on delete cascade,

  score_1 integer not null
    check (score_1 between 1 and 45),

  score_2 integer not null
    check (score_2 between 1 and 45),

  score_3 integer not null
    check (score_3 between 1 and 45),

  score_4 integer not null
    check (score_4 between 1 and 45),

  score_5 integer not null
    check (score_5 between 1 and 45),

  matched_numbers integer[]
    default '{}',

  match_count integer not null
    default 0
    check (
      match_count between 0 and 5
    ),

  created_at timestamptz not null
    default now(),

  unique (
    draw_id,
    user_id
  )
);


-- ------------------------------------------------------------
-- 3. WINNERS
-- ------------------------------------------------------------

create table public.winners (
  id uuid primary key
    default gen_random_uuid(),

  draw_id uuid not null
    references public.draws(id)
    on delete cascade,

  user_id uuid not null
    references public.profiles(id)
    on delete cascade,

  entry_id uuid
    references public.draw_entries(id)
    on delete cascade,

  match_count integer not null
    check (
      match_count in (
        3,
        4,
        5
      )
    ),

  prize_amount numeric(12,2) not null
    default 0
    check (
      prize_amount >= 0
    ),

  verification_status text not null
    default 'pending'
    check (
      verification_status in (
        'pending',
        'awaiting_proof',
        'submitted',
        'approved',
        'rejected'
      )
    ),

  proof_path text,

  admin_note text,

  payment_status text not null
    default 'pending'
    check (
      payment_status in (
        'pending',
        'processing',
        'paid',
        'failed'
      )
    ),

  reviewed_by uuid
    references public.profiles(id)
    on delete set null,

  reviewed_at timestamptz,

  paid_at timestamptz,

  created_at timestamptz not null
    default now(),

  updated_at timestamptz not null
    default now(),

  unique (
    draw_id,
    user_id
  )
);

create trigger winners_updated_at
before update on public.winners
for each row
execute function public.set_updated_at();


-- ------------------------------------------------------------
-- 4. WINNER PROOF FUNCTION
-- ------------------------------------------------------------

create or replace function public.submit_winner_proof(
  p_winner_id uuid,
  p_proof_path text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin

  update public.winners
  set
    proof_path = p_proof_path,
    verification_status = 'submitted',
    admin_note = null,
    updated_at = now()

  where id = p_winner_id
    and user_id = auth.uid()

    and verification_status in (
      'pending',
      'awaiting_proof',
      'rejected'
    )

    and exists (
      select 1
      from public.draws d
      where d.id = winners.draw_id
        and d.status = 'completed'
    );

  if not found then
    raise exception
      'Proof cannot be submitted for this winning.';
  end if;

end;
$$;


-- ------------------------------------------------------------
-- 5. INDEXES
-- ------------------------------------------------------------

create index draws_status_idx
on public.draws (
  status,
  draw_date desc
);

create index draw_entries_draw_idx
on public.draw_entries (
  draw_id
);

create index draw_entries_user_idx
on public.draw_entries (
  user_id
);

create index winners_draw_idx
on public.winners (
  draw_id
);

create index winners_user_idx
on public.winners (
  user_id
);

create index winners_status_idx
on public.winners (
  verification_status,
  payment_status
);


-- ------------------------------------------------------------
-- 6. RLS
-- ------------------------------------------------------------

alter table public.draws
enable row level security;

alter table public.draw_entries
enable row level security;

alter table public.winners
enable row level security;


-- ------------------------------------------------------------
-- DRAWS
-- ------------------------------------------------------------

create policy draws_public_read
on public.draws
for select
using (
  status = 'completed'
  or public.is_admin()
);

create policy draws_admin_write
on public.draws
for all
to authenticated
using (
  public.is_admin()
)
with check (
  public.is_admin()
);


-- ------------------------------------------------------------
-- DRAW ENTRIES
-- ------------------------------------------------------------

create policy draw_entries_user_read
on public.draw_entries
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_admin()
);

create policy draw_entries_admin_write
on public.draw_entries
for all
to authenticated
using (
  public.is_admin()
)
with check (
  public.is_admin()
);


-- ------------------------------------------------------------
-- WINNERS
-- ------------------------------------------------------------

create policy winners_user_read
on public.winners
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_admin()
);

create policy winners_admin_write
on public.winners
for all
to authenticated
using (
  public.is_admin()
)
with check (
  public.is_admin()
);


-- ------------------------------------------------------------
-- 7. GRANTS
-- ------------------------------------------------------------

grant select
on public.draws
to anon, authenticated;

grant select
on public.draw_entries,
   public.winners
to authenticated;

grant execute
on function public.submit_winner_proof(uuid, text)
to authenticated;