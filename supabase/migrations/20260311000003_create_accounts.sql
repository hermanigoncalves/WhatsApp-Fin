-- ============================================================
-- Migration 003: accounts
-- Financial accounts (bank, cash, card, etc.)
-- ============================================================

create table if not exists public.accounts (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references public.profiles(id) on delete cascade,
  name       text        not null,
  type       text        not null check (type in (
    'Conta Corrente',
    'Conta Poupança',
    'Cartão de Crédito',
    'Dinheiro',
    'Conta PJ'
  )),
  balance    numeric(12,2) not null default 0,
  color      text        not null default 'bg-slate-800',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_accounts_user on public.accounts(user_id);

create trigger accounts_updated_at
  before update on public.accounts
  for each row execute function public.set_updated_at();

-- RLS
alter table public.accounts enable row level security;

create policy "Users can manage own accounts"
  on public.accounts for all
  using (auth.uid() = user_id);
