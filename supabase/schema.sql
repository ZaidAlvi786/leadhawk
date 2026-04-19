-- =============================================
-- LeadHawk - Supabase schema
-- Run this once in your Supabase project's SQL Editor.
-- Every table is scoped to auth.uid() via RLS.
-- =============================================

-- ---------- user_profiles ----------
create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  title text not null default '',
  service text not null default '',
  target_audience text not null default '',
  skills text[] not null default '{}',
  updated_at timestamptz not null default now()
);

-- ---------- lead_filters ----------
create table if not exists public.lead_filters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  job_titles text[] not null default '{}',
  industries text[] not null default '{}',
  company_size text[] not null default '{}',
  locations text[] not null default '{}',
  seniority_levels text[] not null default '{}',
  keywords text[] not null default '{}',
  years_of_experience text,
  technologies text[],
  created_at timestamptz not null default now()
);
create index if not exists lead_filters_user_id_idx on public.lead_filters(user_id);

-- ---------- message_templates ----------
create table if not exists public.message_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  subject text,
  body text not null,
  tone text not null check (tone in ('professional','casual','value-driven','problem-solving')),
  target_role text not null default '',
  industry text not null default '',
  open_rate int,
  response_rate int,
  created_at timestamptz not null default now()
);
create index if not exists message_templates_user_id_idx on public.message_templates(user_id);

-- ---------- linkedin_posts ----------
create table if not exists public.linkedin_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  hook text not null default '',
  hashtags text[] not null default '{}',
  post_type text not null check (post_type in ('thought-leadership','case-study','tips','story','poll','engagement')),
  estimated_reach int not null default 0,
  best_time_to_post text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists linkedin_posts_user_id_idx on public.linkedin_posts(user_id);

-- ---------- growth_plans ----------
create table if not exists public.growth_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week int not null,
  theme text not null default '',
  goals text[] not null default '{}',
  actions jsonb not null default '[]'::jsonb,
  posts jsonb not null default '[]'::jsonb,
  target_connections int not null default 0,
  target_impressions int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists growth_plans_user_id_idx on public.growth_plans(user_id);

-- ---------- email_sequences ----------
create table if not exists public.email_sequences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  target_role text not null default '',
  industry text not null default '',
  tone text not null check (tone in ('professional','casual','value-driven','problem-solving')),
  steps jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists email_sequences_user_id_idx on public.email_sequences(user_id);

-- ---------- pipeline_leads ----------
create table if not exists public.pipeline_leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  first_name text not null default '',
  last_name text not null default '',
  title text not null default '',
  company text not null default '',
  email text not null default '',
  industry text not null default '',
  source text not null default 'manual' check (source in ('apollo','linkedin','manual','referral','inbound')),
  stage text not null default 'new' check (stage in ('new','contacted','replied','meeting','proposal','closed-won','closed-lost')),
  notes text not null default '',
  last_contacted timestamptz,
  next_follow_up date,
  sequence_id uuid references public.email_sequences(id) on delete set null,
  current_step int,
  ai_suggested_action text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists pipeline_leads_user_id_idx on public.pipeline_leads(user_id);
create index if not exists pipeline_leads_stage_idx on public.pipeline_leads(user_id, stage);

-- ---------- Row-Level Security ----------
alter table public.user_profiles    enable row level security;
alter table public.lead_filters     enable row level security;
alter table public.message_templates enable row level security;
alter table public.linkedin_posts   enable row level security;
alter table public.growth_plans     enable row level security;
alter table public.email_sequences  enable row level security;
alter table public.pipeline_leads   enable row level security;

-- Helper macro: one set of CRUD policies per owned table.
-- (Supabase SQL editor doesn't support DO-block loops with DDL nicely,
-- so we repeat per table — boring but explicit.)

-- user_profiles
drop policy if exists "own profile read"   on public.user_profiles;
drop policy if exists "own profile write"  on public.user_profiles;
drop policy if exists "own profile update" on public.user_profiles;
drop policy if exists "own profile delete" on public.user_profiles;
create policy "own profile read"   on public.user_profiles for select using (auth.uid() = user_id);
create policy "own profile write"  on public.user_profiles for insert with check (auth.uid() = user_id);
create policy "own profile update" on public.user_profiles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own profile delete" on public.user_profiles for delete using (auth.uid() = user_id);

-- lead_filters
drop policy if exists "own filters read"   on public.lead_filters;
drop policy if exists "own filters write"  on public.lead_filters;
drop policy if exists "own filters update" on public.lead_filters;
drop policy if exists "own filters delete" on public.lead_filters;
create policy "own filters read"   on public.lead_filters for select using (auth.uid() = user_id);
create policy "own filters write"  on public.lead_filters for insert with check (auth.uid() = user_id);
create policy "own filters update" on public.lead_filters for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own filters delete" on public.lead_filters for delete using (auth.uid() = user_id);

-- message_templates
drop policy if exists "own templates read"   on public.message_templates;
drop policy if exists "own templates write"  on public.message_templates;
drop policy if exists "own templates update" on public.message_templates;
drop policy if exists "own templates delete" on public.message_templates;
create policy "own templates read"   on public.message_templates for select using (auth.uid() = user_id);
create policy "own templates write"  on public.message_templates for insert with check (auth.uid() = user_id);
create policy "own templates update" on public.message_templates for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own templates delete" on public.message_templates for delete using (auth.uid() = user_id);

-- linkedin_posts
drop policy if exists "own posts read"   on public.linkedin_posts;
drop policy if exists "own posts write"  on public.linkedin_posts;
drop policy if exists "own posts update" on public.linkedin_posts;
drop policy if exists "own posts delete" on public.linkedin_posts;
create policy "own posts read"   on public.linkedin_posts for select using (auth.uid() = user_id);
create policy "own posts write"  on public.linkedin_posts for insert with check (auth.uid() = user_id);
create policy "own posts update" on public.linkedin_posts for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own posts delete" on public.linkedin_posts for delete using (auth.uid() = user_id);

-- growth_plans
drop policy if exists "own plans read"   on public.growth_plans;
drop policy if exists "own plans write"  on public.growth_plans;
drop policy if exists "own plans update" on public.growth_plans;
drop policy if exists "own plans delete" on public.growth_plans;
create policy "own plans read"   on public.growth_plans for select using (auth.uid() = user_id);
create policy "own plans write"  on public.growth_plans for insert with check (auth.uid() = user_id);
create policy "own plans update" on public.growth_plans for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own plans delete" on public.growth_plans for delete using (auth.uid() = user_id);

-- email_sequences
drop policy if exists "own sequences read"   on public.email_sequences;
drop policy if exists "own sequences write"  on public.email_sequences;
drop policy if exists "own sequences update" on public.email_sequences;
drop policy if exists "own sequences delete" on public.email_sequences;
create policy "own sequences read"   on public.email_sequences for select using (auth.uid() = user_id);
create policy "own sequences write"  on public.email_sequences for insert with check (auth.uid() = user_id);
create policy "own sequences update" on public.email_sequences for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own sequences delete" on public.email_sequences for delete using (auth.uid() = user_id);

-- pipeline_leads
drop policy if exists "own pipeline read"   on public.pipeline_leads;
drop policy if exists "own pipeline write"  on public.pipeline_leads;
drop policy if exists "own pipeline update" on public.pipeline_leads;
drop policy if exists "own pipeline delete" on public.pipeline_leads;
create policy "own pipeline read"   on public.pipeline_leads for select using (auth.uid() = user_id);
create policy "own pipeline write"  on public.pipeline_leads for insert with check (auth.uid() = user_id);
create policy "own pipeline update" on public.pipeline_leads for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own pipeline delete" on public.pipeline_leads for delete using (auth.uid() = user_id);
