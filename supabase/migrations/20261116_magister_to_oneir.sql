-- Magister is renamed to its constellation calling, Oneir (decided 2026-11-16). The class id changes from 'magister'
-- to 'oneir' in src/constants.js, so every saved character (characters.data->>'cid') and NPC (npcs.cid) that has it
-- is moved across. Safe to run more than once.

update public.characters
set data = jsonb_set(data, '{cid}', '"oneir"')
where data->>'cid' = 'magister';

do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'npcs' and column_name = 'cid') then
    update public.npcs set cid = 'oneir' where cid = 'magister';
  end if;
end $$;
