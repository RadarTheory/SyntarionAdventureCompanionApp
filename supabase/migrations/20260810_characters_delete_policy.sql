-- Fix: DM character deletes were silently doing nothing.
--
-- The public.characters table has row-level security enabled but no DELETE
-- policy. With RLS on, a missing policy = deletes are denied — and PostgREST
-- reports that as success with 0 rows removed (no error), so the Argus /
-- DMView "Delete Character Permanently" button appeared to work but the row
-- always came back on refresh.
--
-- This grants DELETE on characters to the DM tiers, matching the role model
-- from 20260728_gate_roles.sql (current_gate_role() -> admin/architect/creator).

drop policy if exists "characters_delete_privileged" on public.characters;
create policy "characters_delete_privileged" on public.characters
  for delete to authenticated
  using (public.current_gate_role() in ('admin', 'architect', 'creator'));

-- Optional: also let a player permanently delete their OWN character.
-- Uncomment if you want players (not just the DM) to be able to delete
-- characters they created.
--
-- drop policy if exists "characters_delete_own" on public.characters;
-- create policy "characters_delete_own" on public.characters
--   for delete to authenticated
--   using (user_id = auth.uid());
