-- ============================================================
-- Migration 004: transactions
-- Individual income/expense transactions
-- Balance is updated via trigger to keep accounts in sync
-- ============================================================

create table if not exists public.transactions (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references public.profiles(id)  on delete cascade,
  account_id  uuid        not null references public.accounts(id)   on delete cascade,
  category_id uuid        not null references public.categories(id) on delete restrict,
  description text        not null,
  amount      numeric(12,2) not null check (amount > 0),
  type        text        not null check (type in ('income', 'expense')),
  date        timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

-- Query patterns: most recent by user, filter by account/category
-- Note: date_trunc is STABLE not IMMUTABLE, cannot be used in index expression
create index idx_transactions_user_date  on public.transactions(user_id, date desc);
create index idx_transactions_account    on public.transactions(account_id);
create index idx_transactions_category   on public.transactions(category_id);

-- Trigger: update account balance on insert/delete
create or replace function public.update_account_balance()
returns trigger
language plpgsql
security definer
as $$
declare
  v_delta numeric;
begin
  if TG_OP = 'INSERT' then
    v_delta := case when NEW.type = 'income' then NEW.amount else -NEW.amount end;
    update public.accounts set balance = balance + v_delta where id = NEW.account_id;

  elsif TG_OP = 'DELETE' then
    v_delta := case when OLD.type = 'income' then -OLD.amount else OLD.amount end;
    update public.accounts set balance = balance + v_delta where id = OLD.account_id;
  end if;
  return coalesce(NEW, OLD);
end;
$$;

create trigger trg_transaction_balance_insert
  after insert on public.transactions
  for each row execute function public.update_account_balance();

create trigger trg_transaction_balance_delete
  after delete on public.transactions
  for each row execute function public.update_account_balance();

-- RLS
alter table public.transactions enable row level security;

create policy "Users can manage own transactions"
  on public.transactions for all
  using (auth.uid() = user_id);
