-- Map grid (2026-11-17): each map's grid, fitted to its art by the DM (Set grid), saved with its ambience.
-- grid = { cell, ox, oy }: square size as a share of the map's width, and the grid's origin offset. One square is one
-- fathom (6 ft). See src/lib/grid.js. Safe to run more than once.
alter table public.map_ambience add column if not exists grid jsonb;
