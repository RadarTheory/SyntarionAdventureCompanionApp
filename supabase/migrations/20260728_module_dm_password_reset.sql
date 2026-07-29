-- Lets a module's owner, or a creator/architect/admin (via the Gate role
-- system in 20260728_gate_roles.sql), reset the DM-mode sigil for a module
-- without needing the old password. Mirrors create_module's exact hashing
-- convention (crypt/gen_salt('bf') from the pgcrypto extension) so it stays
-- compatible with whatever verify_module_dm already checks.
--
-- Run this AFTER 20260728_gate_roles.sql.

create or replace function public.set_module_dm_password(
  p_module_id bigint,
  p_new_password text
)
returns void
language plpgsql
security definer
set search_path = 'public', 'extensions'
as $$
declare
  v_owner_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not signed in.';
  end if;

  select owner_id into v_owner_id from public.modules where id = p_module_id;
  if not found then
    raise exception 'Module not found.';
  end if;

  if v_owner_id is distinct from auth.uid() and public.current_gate_role() not in ('creator', 'architect', 'admin') then
    raise exception 'Not authorized to reset this module''s DM password.' using errcode = '42501';
  end if;

  if length(p_new_password) < 6 then
    raise exception 'Password must be at least 6 characters.';
  end if;

  update public.modules
  set dm_pass_hash = crypt(p_new_password, gen_salt('bf'))
  where id = p_module_id;
end;
$$;

revoke all on function public.set_module_dm_password(bigint, text) from public;
grant execute on function public.set_module_dm_password(bigint, text) to authenticated;
