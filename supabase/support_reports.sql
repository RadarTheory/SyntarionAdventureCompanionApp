create table if not exists public.support_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  user_email text,
  category text not null default 'other',
  subject text not null,
  message text not null,
  status text not null default 'open',
  priority text not null default 'normal',
  page_path text,
  user_agent text,
  app_context jsonb not null default '{}'::jsonb,
  admin_notes text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists support_reports_status_created_idx
  on public.support_reports (status, created_at desc);

create index if not exists support_reports_user_created_idx
  on public.support_reports (user_id, created_at desc);

alter table public.support_reports enable row level security;

create policy if not exists "Users can create support reports"
  on public.support_reports
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy if not exists "Users can read their own support reports"
  on public.support_reports
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy if not exists "Theonhex admin can manage support reports"
  on public.support_reports
  for all
  to authenticated
  using (auth.uid() = 'fd2b5a52-e179-4234-9265-9b5ab36d6ace'::uuid)
  with check (auth.uid() = 'fd2b5a52-e179-4234-9265-9b5ab36d6ace'::uuid);
