-- ============================================================
-- GoodSwing — PAYMENT DATABASE
-- ============================================================


-- ------------------------------------------------------------
-- 1. SUBSCRIPTION → CHARITY
-- ------------------------------------------------------------

alter table public.subscriptions
drop constraint if exists subscriptions_charity_id_fkey;

alter table public.subscriptions
add constraint subscriptions_charity_id_fkey
foreign key (charity_id)
references public.charities(id)
on delete set null;


-- ------------------------------------------------------------
-- 2. PAYMENT → CHARITY
-- ------------------------------------------------------------

alter table public.payments
drop constraint if exists payments_charity_id_fkey;

alter table public.payments
add constraint payments_charity_id_fkey
foreign key (charity_id)
references public.charities(id)
on delete set null;


-- ------------------------------------------------------------
-- 3. PAYMENT INDEXES
-- ------------------------------------------------------------

create index if not exists payments_order_idx
on public.payments (
  provider_order_id
);

create index if not exists payments_provider_payment_idx
on public.payments (
  provider_payment_id
);


-- ------------------------------------------------------------
-- 4. CHARITY CONTRIBUTION → PAYMENT
-- ------------------------------------------------------------

create index if not exists charity_contributions_payment_idx
on public.charity_contributions (
  payment_id
);


-- ------------------------------------------------------------
-- 5. PAYMENT AMOUNT
-- ------------------------------------------------------------

alter table public.payments
drop constraint if exists payments_amount_positive;

alter table public.payments
add constraint payments_amount_positive
check (
  amount_paise > 0
);


-- ------------------------------------------------------------
-- 6. CHARITY PERCENTAGE
-- ------------------------------------------------------------

alter table public.charity_contributions
drop constraint if exists charity_contribution_percentage_valid;

alter table public.charity_contributions
add constraint charity_contribution_percentage_valid
check (
  percentage between 10 and 100
);


-- ------------------------------------------------------------
-- 7. PAYMENT CHARITY AMOUNT
-- ------------------------------------------------------------

alter table public.payments
drop constraint if exists payments_charity_amount_valid;

alter table public.payments
add constraint payments_charity_amount_valid
check (
  charity_amount_paise >= 0
);


-- ------------------------------------------------------------
-- 8. PAYMENT CHARITY PERCENTAGE
-- ------------------------------------------------------------

alter table public.payments
drop constraint if exists payments_charity_pct_valid;

alter table public.payments
add constraint payments_charity_pct_valid
check (
  charity_pct is null
  or charity_pct between 10 and 100
);


-- ------------------------------------------------------------
-- 9. PAYMENT SECURITY
-- ------------------------------------------------------------

-- Payments are created and updated by the server using
-- SUPABASE_SERVICE_ROLE_KEY.
--
-- The browser is only allowed to read its own payments.
--
-- This prevents a user from:
--
--   - creating a fake payment
--   - changing a payment amount
--   - marking a payment as paid
--   - changing the payment provider ID
--   - changing the charity allocation
--
-- No INSERT / UPDATE / DELETE policy is created here.


-- ------------------------------------------------------------
-- 10. SUBSCRIPTION SECURITY
-- ------------------------------------------------------------

-- Subscriptions are also written by the server.
--
-- Users can read their own subscription.
-- Admins can read all subscriptions.
--
-- No browser INSERT / UPDATE / DELETE access is granted.


-- ------------------------------------------------------------
-- 11. RLS
-- ------------------------------------------------------------

alter table public.payments
enable row level security;

alter table public.subscriptions
enable row level security;


-- ------------------------------------------------------------
-- 12. PAYMENT READ POLICY
-- ------------------------------------------------------------

drop policy if exists payments_select
on public.payments;

create policy payments_select
on public.payments
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_admin()
);


-- ------------------------------------------------------------
-- 13. SUBSCRIPTION READ POLICY
-- ------------------------------------------------------------

drop policy if exists subscriptions_select
on public.subscriptions;

create policy subscriptions_select
on public.subscriptions
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_admin()
);


-- ------------------------------------------------------------
-- 14. GRANTS
-- ------------------------------------------------------------

grant select
on public.payments,
   public.subscriptions
to authenticated;