-- ============================================================
-- Migration 006: investments
-- User investment portfolio tracking
-- ============================================================

create table if not exists public.investments (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references public.profiles(id) on delete cascade,
  name            text        not null,
  type            text        not null check (type in (
    'Ações',
    'FII',
    'Tesouro Direto',
    'CDB/LCI/LCA',
    'Cripto',
    'Outros'
  )),
  ticker          text,
  amount_invested numeric(12,2) not null check (amount_invested >= 0),
  current_value   numeric(12,2) not null check (current_value >= 0),
  quantity        numeric(18,6),
  purchase_price  numeric(12,2),
  purchase_date   date        not null,
  color           text        not null default 'bg-slate-500',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_investments_user on public.investments(user_id);

create trigger investments_updated_at
  before update on public.investments
  for each row execute function public.set_updated_at();

-- RLS
alter table public.investments enable row level security;

create policy "Users can manage own investments"
  on public.investments for all
  using (auth.uid() = user_id);
