-- 1. Prevent non-admin users from changing roles
create or replace function public._prevent_role_change_()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not public._is_admin() then
    raise exception 'Only admins can change roles';
  end if;

  return new;
end;
$$;

-- 2. Replace any existing role-protection trigger
drop trigger if exists profiles_prevent_role_change
on public.profiles;

create trigger profiles_prevent_role_change
before update on public.profiles
for each row
execute function public._prevent_role_change_();

-- 3. Promote the initial administrator
-- REPLACE THIS EMAIL with Shashikant's actual Supabase account email
update public.profiles
set role = 'admin'
where email = 'shashi873kant@gmail.com';

-- 4. Verify
select id, full_name, email, role
from public.profiles
where email = 'shashi873kant@gmail.com';