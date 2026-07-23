-- Oracle foundation schema.
-- AI output is stored as proposals until explicitly approved by a user.

create extension if not exists pgcrypto;
create extension if not exists vector;

do $$
begin
  create type public.oracle_authority as enum ('Canon', 'Draft', 'Reference', 'Historical', 'Inspiration');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.oracle_scope as enum ('Global', 'Series', 'Campaign', 'Private');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.oracle_approval_status as enum ('pending', 'approved', 'rejected', 'superseded');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.oracle_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  title text not null,
  authority public.oracle_authority not null default 'Draft',
  scope public.oracle_scope not null default 'Private',
  campaign_id uuid,
  current_version integer not null default 1,
  status text not null default 'uploaded',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.oracle_document_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.oracle_documents(id) on delete cascade,
  version_number integer not null,
  storage_path text not null,
  file_name text not null,
  mime_type text,
  file_size bigint,
  content_hash text,
  extracted_text text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (document_id, version_number)
);

create table if not exists public.oracle_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.oracle_documents(id) on delete cascade,
  version_id uuid references public.oracle_document_versions(id) on delete cascade,
  chunk_index integer not null,
  content text not null,
  token_count integer,
  source_locator jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (version_id, chunk_index)
);

create table if not exists public.oracle_embeddings (
  id uuid primary key default gen_random_uuid(),
  chunk_id uuid not null references public.oracle_chunks(id) on delete cascade,
  embedding vector(1536) not null,
  embedding_model text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.oracle_entities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  canonical_name text not null,
  entity_type text not null,
  aliases text[] not null default '{}',
  scope public.oracle_scope not null default 'Global',
  campaign_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.oracle_facts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  entity_id uuid references public.oracle_entities(id) on delete set null,
  statement text not null,
  authority public.oracle_authority not null default 'Draft',
  scope public.oracle_scope not null default 'Private',
  approval_status public.oracle_approval_status not null default 'pending',
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  superseded_by uuid references public.oracle_facts(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.oracle_relationships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  subject_entity_id uuid not null references public.oracle_entities(id) on delete cascade,
  predicate text not null,
  object_entity_id uuid references public.oracle_entities(id) on delete cascade,
  object_text text,
  authority public.oracle_authority not null default 'Draft',
  scope public.oracle_scope not null default 'Private',
  approval_status public.oracle_approval_status not null default 'pending',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.oracle_source_references (
  id uuid primary key default gen_random_uuid(),
  fact_id uuid references public.oracle_facts(id) on delete cascade,
  relationship_id uuid references public.oracle_relationships(id) on delete cascade,
  chunk_id uuid references public.oracle_chunks(id) on delete set null,
  document_id uuid references public.oracle_documents(id) on delete set null,
  quote text,
  source_locator jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (fact_id is not null or relationship_id is not null)
);

create table if not exists public.oracle_conflicts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  status text not null default 'open',
  summary text not null,
  explanation text,
  left_fact_id uuid references public.oracle_facts(id) on delete cascade,
  right_fact_id uuid references public.oracle_facts(id) on delete cascade,
  severity text not null default 'needs_review',
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id) on delete set null
);

create table if not exists public.oracle_map_pins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  pin_type text not null default 'location',
  map_id text not null default 'soteria',
  x numeric not null,
  y numeric not null,
  latitude numeric,
  longitude numeric,
  entity_id uuid references public.oracle_entities(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.oracle_map_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  pin_id uuid references public.oracle_map_pins(id) on delete cascade,
  note text not null,
  authority public.oracle_authority not null default 'Draft',
  scope public.oracle_scope not null default 'Private',
  source_reference_id uuid references public.oracle_source_references(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.oracle_routes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  route_type text not null default 'travel',
  points jsonb not null default '[]'::jsonb,
  distance_units text,
  distance_value numeric,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.oracle_regions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  region_type text not null default 'region',
  polygon jsonb not null default '[]'::jsonb,
  entity_id uuid references public.oracle_entities(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.oracle_writing_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  project_type text not null default 'draft',
  body text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.oracle_writing_assistant_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  setting_key text not null,
  setting_value jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, setting_key)
);

create table if not exists public.oracle_drive_folder_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  folder_key text not null,
  folder_title text not null,
  drive_folder_id text not null,
  parent_drive_folder_id text,
  order_index integer,
  authority_default public.oracle_authority not null default 'Reference',
  scope_default public.oracle_scope not null default 'Global',
  purpose text,
  last_synced_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, folder_key)
);

create table if not exists public.oracle_writing_style_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  profile_key text not null,
  label text not null,
  is_default boolean not null default false,
  tone jsonb not null default '[]'::jsonb,
  avoid jsonb not null default '[]'::jsonb,
  continuity_priorities jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, profile_key)
);

create table if not exists public.oracle_writing_rubrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  rubric_key text not null,
  label text not null,
  checks jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, rubric_key)
);

create table if not exists public.oracle_writing_assistant_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  writing_project_id uuid references public.oracle_writing_projects(id) on delete set null,
  mode text not null,
  prompt text not null,
  retrieved_sources jsonb not null default '[]'::jsonb,
  output text,
  output_classification jsonb not null default '{}'::jsonb,
  approval_queue_ids jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create table if not exists public.oracle_approval_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  item_type text not null,
  item_id uuid,
  title text not null,
  proposed_change jsonb not null default '{}'::jsonb,
  supporting_sources jsonb not null default '[]'::jsonb,
  status public.oracle_approval_status not null default 'pending',
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.oracle_conversation_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  session_key text not null,
  role text not null check (role in ('user', 'assistant', 'system', 'tool')),
  content text not null,
  retrieved_sources jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.oracle_match_chunks(
  query_embedding vector(1536),
  match_count int default 8
)
returns table (
  chunk_id uuid,
  document_id uuid,
  content text,
  similarity float,
  title text,
  authority public.oracle_authority,
  scope public.oracle_scope
)
language sql
stable
as $$
  select
    c.id as chunk_id,
    c.document_id,
    c.content,
    1 - (e.embedding <=> query_embedding) as similarity,
    d.title,
    d.authority,
    d.scope
  from public.oracle_embeddings e
  join public.oracle_chunks c on c.id = e.chunk_id
  join public.oracle_documents d on d.id = c.document_id
  order by e.embedding <=> query_embedding
  limit match_count;
$$;

create index if not exists oracle_documents_user_idx on public.oracle_documents (user_id, created_at desc);
create index if not exists oracle_chunks_document_idx on public.oracle_chunks (document_id, chunk_index);
create index if not exists oracle_embeddings_vector_idx on public.oracle_embeddings using ivfflat (embedding vector_cosine_ops);
create index if not exists oracle_facts_entity_idx on public.oracle_facts (entity_id, approval_status);
create index if not exists oracle_relationships_subject_idx on public.oracle_relationships (subject_entity_id, predicate);
create index if not exists oracle_conflicts_status_idx on public.oracle_conflicts (status, created_at desc);
create index if not exists oracle_map_pins_map_idx on public.oracle_map_pins (map_id, pin_type);
create index if not exists oracle_drive_folder_links_user_idx on public.oracle_drive_folder_links (user_id, order_index);
create index if not exists oracle_writing_assistant_runs_project_idx on public.oracle_writing_assistant_runs (writing_project_id, created_at desc);
create index if not exists oracle_approval_queue_status_idx on public.oracle_approval_queue (status, created_at desc);
create index if not exists oracle_conversation_history_session_idx on public.oracle_conversation_history (user_id, session_key, created_at);

alter table public.oracle_documents enable row level security;
alter table public.oracle_document_versions enable row level security;
alter table public.oracle_chunks enable row level security;
alter table public.oracle_embeddings enable row level security;
alter table public.oracle_entities enable row level security;
alter table public.oracle_facts enable row level security;
alter table public.oracle_relationships enable row level security;
alter table public.oracle_source_references enable row level security;
alter table public.oracle_conflicts enable row level security;
alter table public.oracle_map_pins enable row level security;
alter table public.oracle_map_notes enable row level security;
alter table public.oracle_routes enable row level security;
alter table public.oracle_regions enable row level security;
alter table public.oracle_writing_projects enable row level security;
alter table public.oracle_writing_assistant_settings enable row level security;
alter table public.oracle_drive_folder_links enable row level security;
alter table public.oracle_writing_style_profiles enable row level security;
alter table public.oracle_writing_rubrics enable row level security;
alter table public.oracle_writing_assistant_runs enable row level security;
alter table public.oracle_approval_queue enable row level security;
alter table public.oracle_conversation_history enable row level security;

create policy "oracle_documents_owner_all" on public.oracle_documents
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "oracle_document_versions_owner_all" on public.oracle_document_versions
  for all to authenticated
  using (exists (select 1 from public.oracle_documents d where d.id = document_id and d.user_id = auth.uid()))
  with check (exists (select 1 from public.oracle_documents d where d.id = document_id and d.user_id = auth.uid()));

create policy "oracle_chunks_owner_all" on public.oracle_chunks
  for all to authenticated
  using (exists (select 1 from public.oracle_documents d where d.id = document_id and d.user_id = auth.uid()))
  with check (exists (select 1 from public.oracle_documents d where d.id = document_id and d.user_id = auth.uid()));

create policy "oracle_embeddings_owner_all" on public.oracle_embeddings
  for all to authenticated
  using (exists (
    select 1 from public.oracle_chunks c
    join public.oracle_documents d on d.id = c.document_id
    where c.id = chunk_id and d.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.oracle_chunks c
    join public.oracle_documents d on d.id = c.document_id
    where c.id = chunk_id and d.user_id = auth.uid()
  ));

create policy "oracle_entities_owner_all" on public.oracle_entities
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "oracle_facts_owner_all" on public.oracle_facts
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "oracle_relationships_owner_all" on public.oracle_relationships
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "oracle_source_references_owner_all" on public.oracle_source_references
  for all to authenticated
  using (
    exists (select 1 from public.oracle_facts f where f.id = fact_id and f.user_id = auth.uid())
    or exists (select 1 from public.oracle_relationships r where r.id = relationship_id and r.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.oracle_facts f where f.id = fact_id and f.user_id = auth.uid())
    or exists (select 1 from public.oracle_relationships r where r.id = relationship_id and r.user_id = auth.uid())
  );

create policy "oracle_conflicts_owner_all" on public.oracle_conflicts
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "oracle_map_pins_owner_all" on public.oracle_map_pins
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "oracle_map_notes_owner_all" on public.oracle_map_notes
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "oracle_routes_owner_all" on public.oracle_routes
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "oracle_regions_owner_all" on public.oracle_regions
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "oracle_writing_projects_owner_all" on public.oracle_writing_projects
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "oracle_writing_assistant_settings_owner_all" on public.oracle_writing_assistant_settings
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "oracle_drive_folder_links_owner_all" on public.oracle_drive_folder_links
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "oracle_writing_style_profiles_owner_all" on public.oracle_writing_style_profiles
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "oracle_writing_rubrics_owner_all" on public.oracle_writing_rubrics
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "oracle_writing_assistant_runs_owner_all" on public.oracle_writing_assistant_runs
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "oracle_approval_queue_owner_all" on public.oracle_approval_queue
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "oracle_conversation_history_owner_all" on public.oracle_conversation_history
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
