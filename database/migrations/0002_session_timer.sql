-- Persist the start time so an active study timer survives page refreshes.
alter table public.study_sessions
  add column if not exists started_at timestamptz;
