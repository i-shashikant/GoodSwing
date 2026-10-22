-- ============================================================
-- GoodSwing — CORE DATABASE
-- ============================================================


-- ------------------------------------------------------------
-- 1. UPDATED_AT HELPER
-- ------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ------------------------------------------------------------
-- 2. PROFILES
-- ------------------------------------------------------------

create table public.profiles (
  id uuid primary key
    references auth.users(id)
    on delete cascade,

  full_name text,

  email text,

  role text not null
    default 'subscriber'
    check (
      role in (
        'subscriber',
        'admin'
      )
    ),

  created_at timestamptz not null
    default now(),

  updated_at timestamptz not null
    default now()
);

create trigger profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();


-- ------------------------------------------------------------
-- 3. AUTOMATIC PROFILE CREATION
-- ------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin

  insert into public.profiles (
    id,
    full_name,
    email,
    role
  )
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      ''
    ),
    new.email,
    'subscriber'
  );

  return new;

end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();


-- ------------------------------------------------------------
-- 4. BACKFILL EXISTING AUTH USERS
-- ------------------------------------------------------------

insert into public.profiles (
  id,
  full_name,
  email,
  role
)
select
  u.id,
  coalesce(
    u.raw_user_meta_data ->> 'full_name',
    ''
  ),
  u.email,
  'subscriber'
from auth.users u
where not exists (
  select 1
  from public.profiles p
  where p.id = u.id
);


-- ------------------------------------------------------------
-- 5. ADMIN CHECK
-- ------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;


-- ------------------------------------------------------------
-- 6. PLANS
-- ------------------------------------------------------------

-- Plans are database data.
-- The application can read these instead of hardcoding
-- plan definitions everywhere.

create table public.plans (
  id text primary key,

  name text not null,

  interval text not null
    check (
      interval in (
        'month',
        'year'
      )
    ),

  price_paise integer not null
    check (
      price_paise > 0
    ),

  active boolean not null
    default true,

  sort_order integer not null
    default 0,

  created_at timestamptz not null
    default now(),

  updated_at timestamptz not null
    default now()
);

create trigger plans_updated_at
before update on public.plans
for each row
execute function public.set_updated_at();


-- ------------------------------------------------------------
-- 7. APPLICATION SETTINGS
-- ------------------------------------------------------------

create table public.app_settings (
  key text primary key,

  value jsonb not null,

  updated_at timestamptz not null
    default now()
);

create trigger app_settings_updated_at
before update on public.app_settings
for each row
execute function public.set_updated_at();


-- ------------------------------------------------------------
-- 8. PRIZE TIERS
-- ------------------------------------------------------------

create table public.prize_tiers (
  match_count integer primary key,

  pool_share_pct integer not null
    check (
      pool_share_pct > 0
      and pool_share_pct <= 100
    ),

  rolls_over boolean not null
    default false,

  check (
    match_count in (
      3,
      4,
      5
    )
  )
);


-- ------------------------------------------------------------
-- 9. SUBSCRIPTIONS
-- ------------------------------------------------------------

create table public.subscriptions (
  id uuid primary key
    default gen_random_uuid(),

  user_id uuid not null unique
    references public.profiles(id)
    on delete cascade,

  plan text not null
    references public.plans(id),

  amount numeric(12,2) not null
    check (
      amount > 0
    ),

  status text not null
    check (
      status in (
        'active',
        'cancelled',
        'past_due',
        'expired'
      )
    ),

  charity_id uuid,

  charity_percentage integer
    check (
      charity_percentage between 10 and 100
    ),

  stripe_customer_id text,

  stripe_subscription_id text,

  current_period_start timestamptz,

  current_period_end timestamptz,

  cancel_at_period_end boolean not null
    default false,

  created_at timestamptz not null
    default now(),

  updated_at timestamptz not null
    default now()
);

create trigger subscriptions_updated_at
before update on public.subscriptions
for each row
execute function public.set_updated_at();


-- ------------------------------------------------------------
-- 10. SCORES
-- ------------------------------------------------------------

create table public.scores (
  id uuid primary key
    default gen_random_uuid(),

  user_id uuid not null
    references public.profiles(id)
    on delete cascade,

  score integer not null
    check (
      score between 1 and 45
    ),

  played_at date not null,

  created_at timestamptz not null
    default now(),

  updated_at timestamptz not null
    default now(),

  unique (
    user_id,
    played_at
  )
);

create trigger scores_updated_at
before update on public.scores
for each row
execute function public.set_updated_at();


-- ------------------------------------------------------------
-- 11. KEEP ONLY LATEST FIVE SCORES
-- ------------------------------------------------------------

create or replace function public.keep_latest_five_scores()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin

  delete from public.scores
  where id in (
    select id
    from public.scores
    where user_id = new.user_id
    order by played_at desc, created_at desc
    offset 5
  );

  return new;

end;
$$;

create trigger scores_keep_latest_five
after insert or update on public.scores
for each row
execute function public.keep_latest_five_scores();


-- ------------------------------------------------------------
-- 12. PAYMENTS
-- ------------------------------------------------------------

create table public.payments (
  id uuid primary key
    default gen_random_uuid(),

  user_id uuid not null
    references public.profiles(id)
    on delete cascade,

  subscription_id uuid
    references public.subscriptions(id)
    on delete set null,

  provider_payment_id text not null unique,

  provider_order_id text not null,

  payment_provider text not null
    default 'razorpay',

  plan_id text not null
    references public.plans(id),

  amount_paise integer not null
    check (
      amount_paise > 0
    ),

  charity_id uuid,

  charity_pct integer
    check (
      charity_pct between 10 and 100
    ),

  charity_amount_paise integer
    default 0
    check (
      charity_amount_paise >= 0
    ),

  paid_at timestamptz not null
    default now(),

  created_at timestamptz not null
    default now()
);


-- ------------------------------------------------------------
-- 13. ACTIVE SUBSCRIPTION HELPER
-- ------------------------------------------------------------

create or replace function public.has_active_subscription(
  p_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.subscriptions s
    where s.user_id = p_user_id
      and s.status = 'active'
      and (
        s.current_period_end is null
        or s.current_period_end > now()
      )
  );
$$;


-- ------------------------------------------------------------
-- 14. SEED PLANS
-- ------------------------------------------------------------

insert into public.plans (
  id,
  name,
  interval,
  price_paise,
  active,
  sort_order
)
values
(
  'monthly',
  'Monthly',
  'month',
  49900,
  true,
  1
),
(
  'yearly',
  'Yearly',
  'year',
  499000,
  true,
  2
);


-- ------------------------------------------------------------
-- 15. SEED PRIZE TIERS
-- ------------------------------------------------------------

insert into public.prize_tiers (
  match_count,
  pool_share_pct,
  rolls_over
)
values
(5, 40, true),
(4, 35, false),
(3, 25, false);


-- ------------------------------------------------------------
-- 16. APPLICATION SETTINGS
-- ------------------------------------------------------------

insert into public.app_settings (
  key,
  value
)
values
(
  'pool_contribution_pct',
  '50'
),
(
  'min_charity_pct',
  '10'
);


-- ------------------------------------------------------------
-- 17. INDEXES
-- ------------------------------------------------------------

create index scores_user_played_idx
on public.scores(
  user_id,
  played_at desc
);

create index subscriptions_status_idx
on public.subscriptions(
  status,
  current_period_end
);

create index payments_user_idx
on public.payments(
  user_id,
  paid_at desc
);


-- ------------------------------------------------------------
-- 18. RLS
-- ------------------------------------------------------------

alter table public.profiles
enable row level security;

alter table public.plans
enable row level security;

alter table public.prize_tiers
enable row level security;

alter table public.app_settings
enable row level security;

alter table public.subscriptions
enable row level security;

alter table public.scores
enable row level security;

alter table public.payments
enable row level security;


-- ------------------------------------------------------------
-- PROFILES
-- ------------------------------------------------------------

create policy profiles_select
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or public.is_admin()
);

create policy profiles_update
on public.profiles
for update
to authenticated
using (
  id = auth.uid()
  or public.is_admin()
)
with check (
  id = auth.uid()
  or public.is_admin()
);


-- ------------------------------------------------------------
-- PLANS
-- ------------------------------------------------------------

create policy plans_public_read
on public.plans
for select
using (
  active = true
  or public.is_admin()
);

create policy plans_admin_write
on public.plans
for all
to authenticated
using (
  public.is_admin()
)
with check (
  public.is_admin()
);


-- ------------------------------------------------------------
-- PRIZE TIERS
-- ------------------------------------------------------------

create policy prize_tiers_public_read
on public.prize_tiers
for select
using (true);

create policy prize_tiers_admin
on public.prize_tiers
for all
to authenticated
using (
  public.is_admin()
)
with check (
  public.is_admin()
);


-- ------------------------------------------------------------
-- APPLICATION SETTINGS
-- ------------------------------------------------------------

create policy settings_public_read
on public.app_settings
for select
using (true);

create policy settings_admin
on public.app_settings
for all
to authenticated
using (
  public.is_admin()
)
with check (
  public.is_admin()
);


-- ------------------------------------------------------------
-- SUBSCRIPTIONS
-- ------------------------------------------------------------

create policy subscriptions_select
on public.subscriptions
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_admin()
);


-- ------------------------------------------------------------
-- SCORES
-- ------------------------------------------------------------

create policy scores_select
on public.scores
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_admin()
);

create policy scores_insert
on public.scores
for insert
to authenticated
with check (
  user_id = auth.uid()
);

create policy scores_update
on public.scores
for update
to authenticated
using (
  user_id = auth.uid()
  or public.is_admin()
)
with check (
  user_id = auth.uid()
  or public.is_admin()
);

create policy scores_delete
on public.scores
for delete
to authenticated
using (
  user_id = auth.uid()
  or public.is_admin()
);


-- ------------------------------------------------------------
-- PAYMENTS
-- ------------------------------------------------------------

create policy payments_select
on public.payments
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_admin()
);


-- ------------------------------------------------------------
-- 19. GRANTS
-- ------------------------------------------------------------

grant usage
on schema public
to anon, authenticated;

grant select
on public.plans,
   public.prize_tiers,
   public.app_settings
to anon, authenticated;

grant select
on public.profiles,
   public.subscriptions,
   public.payments
to authenticated;

grant select, insert, update, delete
on public.scores
to authenticated;

grant execute
on function public.is_admin()
to authenticated;

grant execute
on function public.has_active_subscription(uuid)
to authenticated;