-- ============================================================
-- GoodSwing — CHARITY DATABASE
-- ============================================================


-- ------------------------------------------------------------
-- 1. CHARITIES
-- ------------------------------------------------------------

create table public.charities (
  id uuid primary key
    default gen_random_uuid(),

  name text not null,

  slug text not null unique,

  description text not null,

  image_url text,

  category text,

  website_url text,

  featured boolean not null
    default false,

  active boolean not null
    default true,

  created_at timestamptz not null
    default now(),

  updated_at timestamptz not null
    default now()
);

create trigger charities_updated_at
before update on public.charities
for each row
execute function public.set_updated_at();


-- ------------------------------------------------------------
-- 2. USER CHARITY PREFERENCE
-- ------------------------------------------------------------

create table public.user_charity_preferences (
  id uuid primary key
    default gen_random_uuid(),

  user_id uuid not null unique
    references public.profiles(id)
    on delete cascade,

  charity_id uuid not null
    references public.charities(id)
    on delete restrict,

  created_at timestamptz not null
    default now(),

  updated_at timestamptz not null
    default now()
);

create trigger user_charity_preferences_updated_at
before update
on public.user_charity_preferences
for each row
execute function public.set_updated_at();


-- ------------------------------------------------------------
-- 3. CHARITY EVENTS
-- ------------------------------------------------------------

create table public.charity_events (
  id uuid primary key
    default gen_random_uuid(),

  charity_id uuid not null
    references public.charities(id)
    on delete cascade,

  title text not null,

  description text,

  event_date date,

  amount_paise integer
    check (
      amount_paise >= 0
    ),

  created_at timestamptz not null
    default now()
);


-- ------------------------------------------------------------
-- 4. CHARITY CONTRIBUTIONS
-- ------------------------------------------------------------

create table public.charity_contributions (
  id uuid primary key
    default gen_random_uuid(),

  user_id uuid not null
    references public.profiles(id)
    on delete cascade,

  subscription_id uuid
    references public.subscriptions(id)
    on delete set null,

  payment_id uuid
    references public.payments(id)
    on delete set null,

  charity_id uuid not null
    references public.charities(id)
    on delete restrict,

  percentage integer not null
    check (
      percentage between 10 and 100
    ),

  amount_paise integer not null
    check (
      amount_paise >= 0
    ),

  status text not null
    default 'allocated'
    check (
      status in (
        'allocated',
        'confirmed',
        'cancelled'
      )
    ),

  allocated_at timestamptz not null
    default now(),

  created_at timestamptz not null
    default now()
);


-- ------------------------------------------------------------
-- 5. INDEPENDENT DONATIONS
-- ------------------------------------------------------------

create table public.donations (
  id uuid primary key
    default gen_random_uuid(),

  user_id uuid
    references public.profiles(id)
    on delete set null,

  charity_id uuid not null
    references public.charities(id)
    on delete restrict,

  amount_paise integer not null
    check (
      amount_paise > 0
    ),

  payment_provider text
    default 'razorpay',

  provider_payment_id text unique,

  provider_order_id text,

  status text not null
    default 'pending'
    check (
      status in (
        'pending',
        'paid',
        'failed',
        'refunded'
      )
    ),

  created_at timestamptz not null
    default now(),

  paid_at timestamptz
);


-- ------------------------------------------------------------
-- 6. INDEXES
-- ------------------------------------------------------------

create index charities_active_idx
on public.charities(active);

create index charities_featured_idx
on public.charities(featured);

create index charity_contributions_charity_idx
on public.charity_contributions(
  charity_id,
  created_at desc
);

create index charity_contributions_user_idx
on public.charity_contributions(
  user_id,
  created_at desc
);

create index donations_charity_idx
on public.donations(
  charity_id,
  created_at desc
);


-- ------------------------------------------------------------
-- 7. RLS
-- ------------------------------------------------------------

alter table public.charities
enable row level security;

alter table public.user_charity_preferences
enable row level security;

alter table public.charity_events
enable row level security;

alter table public.charity_contributions
enable row level security;

alter table public.donations
enable row level security;


-- ------------------------------------------------------------
-- CHARITIES
-- ------------------------------------------------------------

create policy charities_public_read
on public.charities
for select
using (
  active = true
  or public.is_admin()
);

create policy charities_admin
on public.charities
for all
to authenticated
using (
  public.is_admin()
)
with check (
  public.is_admin()
);


-- ------------------------------------------------------------
-- USER CHARITY PREFERENCES
-- ------------------------------------------------------------

create policy charity_preferences_own
on public.user_charity_preferences
for all
to authenticated
using (
  user_id = auth.uid()
)
with check (
  user_id = auth.uid()
);

create policy charity_preferences_admin_read
on public.user_charity_preferences
for select
to authenticated
using (
  public.is_admin()
);


-- ------------------------------------------------------------
-- CHARITY EVENTS
-- ------------------------------------------------------------

create policy charity_events_public_read
on public.charity_events
for select
using (true);

create policy charity_events_admin
on public.charity_events
for all
to authenticated
using (
  public.is_admin()
)
with check (
  public.is_admin()
);


-- ------------------------------------------------------------
-- CHARITY CONTRIBUTIONS
-- ------------------------------------------------------------

create policy charity_contributions_own_read
on public.charity_contributions
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_admin()
);


-- ------------------------------------------------------------
-- DONATIONS
-- ------------------------------------------------------------

create policy donations_own_read
on public.donations
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_admin()
);


-- ------------------------------------------------------------
-- 8. GRANTS
-- ------------------------------------------------------------

grant select
on public.charities,
   public.charity_events
to anon, authenticated;

grant select, insert, update, delete
on public.user_charity_preferences
to authenticated;

grant select
on public.charity_contributions,
   public.donations
to authenticated;


-- ------------------------------------------------------------
-- 9. DEMO CHARITIES
-- ------------------------------------------------------------

insert into public.charities (
  name,
  slug,
  description,
  category,
  featured,
  active
)
values
(
  'Clean Water Collective',
  'clean-water-collective',
  'Builds wells and filtration systems for communities without reliable access to safe drinking water.',
  'Water & Sanitation',
  true,
  true
),
(
  'Bright Minds Foundation',
  'bright-minds-foundation',
  'Funds school supplies, scholarships and learning opportunities for children in underserved communities.',
  'Education',
  false,
  true
),
(
  'Second Roots',
  'second-roots',
  'Restores degraded land by planting native trees and supporting local green jobs.',
  'Environment',
  false,
  true
),
(
  'Open Doors Shelter',
  'open-doors-shelter',
  'Provides safe accommodation, meals and employment support for people experiencing homelessness.',
  'Housing',
  false,
  true
),
(
  'Steady Hands Health',
  'steady-hands-health',
  'Runs mobile health camps that provide free check-ups and essential medicines.',
  'Healthcare',
  false,
  true
),
(
  'Every Paw Counts',
  'every-paw-counts',
  'Rescues, vaccinates and rehomes street animals through community-run clinics.',
  'Animal Welfare',
  false,
  true
);