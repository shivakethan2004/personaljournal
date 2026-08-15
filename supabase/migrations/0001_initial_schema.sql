-- 0001_initial_schema.sql
-- Process Journal — core schema + row-level security.
-- Every table is scoped to its owning user via RLS, except
-- problem_patterns and metrics_library, which are public read-only
-- seeded content shared by everyone.

-- ============================================================
-- profiles
-- ============================================================
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "profiles: select own" on profiles
  for select using (auth.uid() = id);
create policy "profiles: insert own" on profiles
  for insert with check (auth.uid() = id);
create policy "profiles: update own" on profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Auto-create a profile row whenever a new auth user signs up.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- problem_patterns — predefined library (~10-12 rows), public read-only
-- ============================================================
create table problem_patterns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null
);

alter table problem_patterns enable row level security;

create policy "problem_patterns: public read" on problem_patterns
  for select using (true);

-- ============================================================
-- metrics_library — predefined metrics, seeded once, public read-only
-- ============================================================
create table metrics_library (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  why_it_helps text not null,
  input_type text not null check (input_type in ('number', 'text', 'timer', 'tally')),
  problem_pattern_id uuid references problem_patterns (id)
);

alter table metrics_library enable row level security;

create policy "metrics_library: public read" on metrics_library
  for select using (true);

-- ============================================================
-- custom_metrics — user-created metrics
-- ============================================================
create table custom_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  description text,
  input_type text not null check (input_type in ('number', 'text', 'timer', 'tally'))
);

alter table custom_metrics enable row level security;

create policy "custom_metrics: select own" on custom_metrics
  for select using (auth.uid() = user_id);
create policy "custom_metrics: insert own" on custom_metrics
  for insert with check (auth.uid() = user_id);
create policy "custom_metrics: update own" on custom_metrics
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "custom_metrics: delete own" on custom_metrics
  for delete using (auth.uid() = user_id);

-- ============================================================
-- user_metrics — which metrics a user actually tracks
-- ============================================================
create table user_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  metric_id uuid references metrics_library (id),
  custom_metric_id uuid references custom_metrics (id),
  active boolean not null default true,
  constraint user_metrics_exactly_one_source check (
    (metric_id is not null and custom_metric_id is null)
    or (metric_id is null and custom_metric_id is not null)
  )
);

alter table user_metrics enable row level security;

create policy "user_metrics: select own" on user_metrics
  for select using (auth.uid() = user_id);
create policy "user_metrics: insert own" on user_metrics
  for insert with check (auth.uid() = user_id);
create policy "user_metrics: update own" on user_metrics
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "user_metrics: delete own" on user_metrics
  for delete using (auth.uid() = user_id);

-- ============================================================
-- activities — user-defined life domains
-- ============================================================
create table activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table activities enable row level security;

create policy "activities: select own" on activities
  for select using (auth.uid() = user_id);
create policy "activities: insert own" on activities
  for insert with check (auth.uid() = user_id);
create policy "activities: update own" on activities
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "activities: delete own" on activities
  for delete using (auth.uid() = user_id);

-- ============================================================
-- onboarding_responses
-- ============================================================
create table onboarding_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  quiz_answers jsonb not null default '{}'::jsonb,
  matched_pattern_ids uuid[] not null default '{}'::uuid[],
  completed_at timestamptz
);

alter table onboarding_responses enable row level security;

create policy "onboarding_responses: select own" on onboarding_responses
  for select using (auth.uid() = user_id);
create policy "onboarding_responses: insert own" on onboarding_responses
  for insert with check (auth.uid() = user_id);
create policy "onboarding_responses: update own" on onboarding_responses
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- daily_plans — morning, context only, one row per (date, activity)
-- ============================================================
create table daily_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  entry_date date not null,
  activity_id uuid not null references activities (id) on delete cascade,
  objective_text text,
  motivation int check (motivation between 0 and 10),
  created_at timestamptz not null default now(),
  unique (user_id, entry_date, activity_id)
);

alter table daily_plans enable row level security;

create policy "daily_plans: select own" on daily_plans
  for select using (auth.uid() = user_id);
create policy "daily_plans: insert own" on daily_plans
  for insert with check (auth.uid() = user_id);
create policy "daily_plans: update own" on daily_plans
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "daily_plans: delete own" on daily_plans
  for delete using (auth.uid() = user_id);

-- ============================================================
-- quick_logs — in-between, the core data stream
-- ============================================================
create table quick_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  "timestamp" timestamptz not null default now(),
  activity_id uuid not null references activities (id) on delete cascade,
  metric_id uuid references metrics_library (id),
  custom_metric_id uuid references custom_metrics (id),
  tag text check (tag in ('setback', 'resume')),
  content text,
  value numeric
);

alter table quick_logs enable row level security;

create policy "quick_logs: select own" on quick_logs
  for select using (auth.uid() = user_id);
create policy "quick_logs: insert own" on quick_logs
  for insert with check (auth.uid() = user_id);
create policy "quick_logs: update own" on quick_logs
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "quick_logs: delete own" on quick_logs
  for delete using (auth.uid() = user_id);

create index quick_logs_user_activity_ts_idx
  on quick_logs (user_id, activity_id, "timestamp" desc);

-- ============================================================
-- recovery_gap_confirmations — only created when a gap is ambiguous
-- ============================================================
create table recovery_gap_confirmations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  quick_log_id uuid not null references quick_logs (id) on delete cascade,
  gap_seconds int not null,
  user_confirmed text check (user_confirmed in ('recovering', 'break'))
);

alter table recovery_gap_confirmations enable row level security;

create policy "recovery_gap_confirmations: select own" on recovery_gap_confirmations
  for select using (auth.uid() = user_id);
create policy "recovery_gap_confirmations: insert own" on recovery_gap_confirmations
  for insert with check (auth.uid() = user_id);
create policy "recovery_gap_confirmations: update own" on recovery_gap_confirmations
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- evening_reflections — one per day, not per activity
-- ============================================================
create table evening_reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  entry_date date not null,
  responses jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, entry_date)
);

alter table evening_reflections enable row level security;

create policy "evening_reflections: select own" on evening_reflections
  for select using (auth.uid() = user_id);
create policy "evening_reflections: insert own" on evening_reflections
  for insert with check (auth.uid() = user_id);
create policy "evening_reflections: update own" on evening_reflections
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- level_up_tasks
-- ============================================================
create table level_up_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  task_text text not null,
  activity_id uuid references activities (id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'submitted', 'evaluated')),
  created_at timestamptz not null default now()
);

alter table level_up_tasks enable row level security;

create policy "level_up_tasks: select own" on level_up_tasks
  for select using (auth.uid() = user_id);
create policy "level_up_tasks: insert own" on level_up_tasks
  for insert with check (auth.uid() = user_id);
create policy "level_up_tasks: update own" on level_up_tasks
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- level_up_submissions
-- ============================================================
create table level_up_submissions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references level_up_tasks (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  submission_text text not null,
  ai_feedback text,
  points_awarded int check (points_awarded between 1 and 10),
  created_at timestamptz not null default now()
);

alter table level_up_submissions enable row level security;

create policy "level_up_submissions: select own" on level_up_submissions
  for select using (auth.uid() = user_id);
create policy "level_up_submissions: insert own" on level_up_submissions
  for insert with check (auth.uid() = user_id);
create policy "level_up_submissions: update own" on level_up_submissions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- weekly_summaries
-- ============================================================
create table weekly_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  week_start date not null,
  summary_text text not null,
  created_at timestamptz not null default now(),
  unique (user_id, week_start)
);

alter table weekly_summaries enable row level security;

create policy "weekly_summaries: select own" on weekly_summaries
  for select using (auth.uid() = user_id);
create policy "weekly_summaries: insert own" on weekly_summaries
  for insert with check (auth.uid() = user_id);
