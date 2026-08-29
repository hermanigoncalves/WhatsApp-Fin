-- ============================================================
-- Migration 007: budgets
-- Monthly spending limits per category (composite PK)
-- ============================================================

create table if not exists public.budgets (
  user_id       uuid          not null references public.profiles(id)  on delete cascade,
  category_id   uuid          not null references public.categories(id) on delete cascade,
  monthly_limit numeric(12,2) not null check (monthly_limit > 0),
  created_at    timestamptz   not null default now(),
  updated_at    timestamptz   not null default now(),
  primary key (user_id, category_id)
);

create trigger budgets_updated_at
  before update on public.budgets
  for each row execute function public.set_updated_at();

-- RLS
alter table public.budgets enable row level security;

create policy "Users can manage own budgets"
  on public.budgets for all
  using (auth.uid() = user_id);
