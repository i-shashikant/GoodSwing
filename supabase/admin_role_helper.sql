-- =========================================================
-- ADMIN ROLE HELPER
-- =========================================================

create or replace function public._is_admin()
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


-- =========================================================
-- PREVENT NON-ADMINS FROM CHANGING ROLES
-- =========================================================

create or replace function public._prevent_role_change_()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not public._is_admin()
  then
    raise exception 'Only admins can change roles';
  end if;

  return new;
end;
$$;


-- =========================================================
-- ROLE PROTECTION TRIGGER
-- =========================================================

drop trigger if exists profiles_prevent_role_change
on public.profiles;

create trigger profiles_prevent_role_change
before update on public.profiles
for each row
execute function public._prevent_role_change_();