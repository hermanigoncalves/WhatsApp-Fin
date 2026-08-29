-- ============================================================
-- Migration 001: profiles
-- Extends auth.users with app-specific user data + settings
-- ============================================================

create table if not exists public.profiles (
  id                       uuid        primary key references auth.users(id) on delete cascade,
  first_name               text        not null default '',
  last_name                text        not null default '',
  phone                    text,
  avatar_url               text,
  n8n_webhook_url          text,
  -- Notification preferences
  notify_low_balance       boolean     not null default true,
  low_balance_threshold    numeric(12,2) not null default 500,
  notify_budget_alert      boolean     not null default true,
  budget_alert_percentage  integer     not null default 80 check (budget_alert_percentage between 1 and 100),
  notify_fixed_due         boolean     not null default true,
  fixed_due_days           integer     not null default 5  check (fixed_due_days between 1 and 30),
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

-- Auto-create profile when user registers
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, first_name)
  values (new.id, split_part(new.email, '@', 1));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- RLS
alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);
