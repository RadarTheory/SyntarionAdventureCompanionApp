-- The world map graph (2026-11-18). A map the DM approves from the Map Forge becomes canon: a named point of interest
-- (POI) in Soteria, locked, and linked to the map it extends through an exit (an edge, door, stairway or passage).
-- Links live on each map's elements (map_ambience.lights, kinds door/stairsUp/stairsDown/passage/edge, with a link to
-- the other map and exit), so every campaign that takes the same exit reaches the same place.
-- Safe to run more than once.
alter table public.vtt_maps add column if not exists poi text;          -- e.g. 'Tarek''Mor · Flooded Gallery'
alter table public.vtt_maps add column if not exists region text;       -- e.g. 'Corren Range'
alter table public.vtt_maps add column if not exists parent_key text;   -- the map it was extended from
alter table public.vtt_maps add column if not exists via text;          -- how: 'edge:east', 'stairsDown', 'door'...
alter table public.vtt_maps add column if not exists brief text;        -- what the Scribe and DM described
alter table public.vtt_maps add column if not exists generated boolean not null default false;
alter table public.vtt_maps add column if not exists locked boolean not null default false;
