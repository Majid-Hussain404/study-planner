-- Core study planner schema. Apply with the Supabase SQL editor or Supabase CLI.
create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  course text,
  university text,
  semester text,
  academic_year text,
  preferred_study_time text check (preferred_study_time in ('morning', 'afternoon', 'evening', 'flexible')),
  daily_study_hours numeric(4, 2) not null default 2 check (daily_study_hours between 0.5 and 16),
  study_preference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 120),
  code text,
  difficulty text not null default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'critical')),
  progress integer not null default 0 check (progress between 0 and 100),
  exam_date date,
  color text not null default '#548067',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create table public.topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subject_id uuid not null,
  title text not null check (length(trim(title)) between 1 and 160),
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'completed')),
  estimated_minutes integer not null default 60 check (estimated_minutes between 5 and 1440),
  mastery integer not null default 0 check (mastery between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (subject_id, user_id) references public.subjects (id, user_id) on delete cascade,
  unique (id, user_id)
);

create table public.deadlines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subject_id uuid,
  kind text not null check (kind in ('exam', 'assignment', 'project', 'other')),
  title text not null check (length(trim(title)) between 1 and 180),
  description text,
  due_at timestamptz not null,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'critical')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (subject_id, user_id) references public.subjects (id, user_id) on delete set null (subject_id)
);

create table public.availability (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  starts_at time not null,
  ends_at time not null,
  created_at timestamptz not null default now(),
  check (starts_at < ends_at),
  unique (user_id, weekday, starts_at)
);

create table public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subject_id uuid,
  topic_id uuid,
  title text not null check (length(trim(title)) between 1 and 180),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'planned' check (status in ('planned', 'in_progress', 'completed', 'missed', 'cancelled')),
  completed_minutes integer not null default 0 check (completed_minutes >= 0),
  completion_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (starts_at < ends_at),
  foreign key (subject_id, user_id) references public.subjects (id, user_id) on delete set null (subject_id),
  foreign key (topic_id, user_id) references public.topics (id, user_id) on delete set null (topic_id)
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subject_id uuid,
  title text not null default 'Untitled note' check (length(trim(title)) between 1 and 180),
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (subject_id, user_id) references public.subjects (id, user_id) on delete set null (subject_id)
);

create index subjects_user_id_idx on public.subjects (user_id);
create index topics_user_subject_idx on public.topics (user_id, subject_id);
create index deadlines_user_due_idx on public.deadlines (user_id, due_at);
create index sessions_user_start_idx on public.study_sessions (user_id, starts_at);
create index notes_user_updated_idx on public.notes (user_id, updated_at desc);

-- Create a profile for each new account. Profile data remains editable by its owner.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Keep updated_at consistent on edits.
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute procedure public.set_updated_at();
create trigger subjects_updated_at before update on public.subjects
  for each row execute procedure public.set_updated_at();
create trigger topics_updated_at before update on public.topics
  for each row execute procedure public.set_updated_at();
create trigger deadlines_updated_at before update on public.deadlines
  for each row execute procedure public.set_updated_at();
create trigger sessions_updated_at before update on public.study_sessions
  for each row execute procedure public.set_updated_at();
create trigger notes_updated_at before update on public.notes
  for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.subjects enable row level security;
alter table public.topics enable row level security;
alter table public.deadlines enable row level security;
alter table public.availability enable row level security;
alter table public.study_sessions enable row level security;
alter table public.notes enable row level security;

create policy "Users manage their own profile" on public.profiles
  for all to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "Users manage their own subjects" on public.subjects
  for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users manage their own topics" on public.topics
  for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users manage their own deadlines" on public.deadlines
  for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users manage their own availability" on public.availability
  for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users manage their own study sessions" on public.study_sessions
  for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users manage their own notes" on public.notes
  for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
