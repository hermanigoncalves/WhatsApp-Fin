-- ============================================================
-- Migration 009: savings_goals
-- Objetivos de poupança financeira e histórico de depósitos
-- ============================================================

-- Tabela de Metas
create table if not exists public.savings_goals (
  id            uuid          primary key default gen_random_uuid(),
  user_id       uuid          not null references public.profiles(id) on delete cascade,
  name          text          not null,
  target_amount numeric(12,2) not null check (target_amount > 0),
  current_amount numeric(12,2) not null default 0 check (current_amount >= 0),
  icon          text          not null default '🎯',
  color         text          not null default 'bg-blue-500',
  deadline      date,
  status        text          not null default 'active' check (status in ('active', 'completed', 'paused')),
  created_at    timestamptz   not null default now(),
  updated_at    timestamptz   not null default now()
);

create index idx_savings_goals_user on public.savings_goals(user_id);

create trigger savings_goals_updated_at
  before update on public.savings_goals
  for each row execute function public.set_updated_at();

alter table public.savings_goals enable row level security;

create policy "Users can manage own savings goals"
  on public.savings_goals for all
  using (auth.uid() = user_id);

-- Tabela de Contribuições (Depósitos)
create table if not exists public.savings_contributions (
  id         uuid          primary key default gen_random_uuid(),
  goal_id    uuid          not null references public.savings_goals(id) on delete cascade,
  user_id    uuid          not null references public.profiles(id) on delete cascade,
  amount     numeric(12,2) not null check (amount > 0),
  note       text,
  date       timestamptz   not null default now(),
  created_at timestamptz   not null default now()
);

create index idx_savings_contributions_goal on public.savings_contributions(goal_id);
create index idx_savings_contributions_user on public.savings_contributions(user_id);

alter table public.savings_contributions enable row level security;

create policy "Users can manage own savings contributions"
  on public.savings_contributions for all
  using (auth.uid() = user_id);

-- Trigger: Atualiza automaticamente o current_amount do objetivo ao depositar
create or replace function public.update_savings_goal_amount()
returns trigger
language plpgsql
security definer
as $$
declare
  v_delta numeric;
begin
  if TG_OP = 'INSERT' then
    update public.savings_goals 
    set current_amount = current_amount + NEW.amount 
    where id = NEW.goal_id;
  elsif TG_OP = 'DELETE' then
    update public.savings_goals 
    set current_amount = current_amount - OLD.amount 
    where id = OLD.goal_id;
  end if;
  return coalesce(NEW, OLD);
end;
$$;

create trigger trg_savings_contribution_insert
  after insert on public.savings_contributions
  for each row execute function public.update_savings_goal_amount();

create trigger trg_savings_contribution_delete
  after delete on public.savings_contributions
  for each row execute function public.update_savings_goal_amount();
