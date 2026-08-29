-- ============================================================
-- Migration 005: fixed_transactions
-- Recurring fixed bills and incomes
-- ============================================================

create table if not exists public.fixed_transactions (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references public.profiles(id)  on delete cascade,
  account_id    uuid        not null references public.accounts(id)   on delete cascade,
  category_id   uuid        not null references public.categories(id) on delete restrict,
  description   text        not null,
  amount        numeric(12,2) not null check (amount > 0),
  type          text        not null check (type in ('income', 'expense')),
  day_of_month  integer     not null check (day_of_month between 1 and 31),
  frequency     text        not null check (frequency in ('Mensal', 'Anual', 'Semanal')),
  status        text        not null default 'active' check (status in ('active', 'paused')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_fixed_transactions_user        on public.fixed_transactions(user_id);
create index idx_fixed_transactions_user_status on public.fixed_transactions(user_id, status);

create trigger fixed_transactions_updated_at
  before update on public.fixed_transactions
  for each row execute function public.set_updated_at();

-- RLS
alter table public.fixed_transactions enable row level security;

create policy "Users can manage own fixed transactions"
  on public.fixed_transactions for all
  using (auth.uid() = user_id);
