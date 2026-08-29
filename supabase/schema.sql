-- ============================================================
-- WhatsApp Fin — Schema Completo Supabase
-- Execute este arquivo completo no SQL Editor do Supabase
-- app.supabase.com → SQL Editor → New Query → Cole e Execute
-- ============================================================


-- ============================================================
-- EXTENSÕES NECESSÁRIAS
-- ============================================================
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- ============================================================
-- FUNÇÕES UTILITÁRIAS (devem vir primeiro)
-- ============================================================

-- updated_at automático em qualquer tabela
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ============================================================
-- 1. PROFILES
-- Estende auth.users com dados do perfil e configurações
-- ============================================================

create table if not exists public.profiles (
  id                       uuid          primary key references auth.users(id) on delete cascade,
  first_name               text          not null default '',
  last_name                text          not null default '',
  phone                    text,
  avatar_url               text,
  n8n_webhook_url          text,
  -- Preferências de notificação
  notify_low_balance       boolean       not null default true,
  low_balance_threshold    numeric(12,2) not null default 500,
  notify_budget_alert      boolean       not null default true,
  budget_alert_percentage  integer       not null default 80 check (budget_alert_percentage between 1 and 100),
  notify_fixed_due         boolean       not null default true,
  fixed_due_days           integer       not null default 5  check (fixed_due_days between 1 and 30),
  created_at               timestamptz   not null default now(),
  updated_at               timestamptz   not null default now()
);

-- Trigger: cria perfil automaticamente ao registrar
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

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);


-- ============================================================
-- 2. CATEGORIES
-- Categorias de transações por usuário
-- ============================================================

create table if not exists public.categories (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references public.profiles(id) on delete cascade,
  name       text        not null,
  type       text        not null check (type in ('income', 'expense')),
  color      text        not null default 'bg-slate-500',
  created_at timestamptz not null default now()
);

create index idx_categories_user on public.categories(user_id);

alter table public.categories enable row level security;

create policy "Users can manage own categories"
  on public.categories for all
  using (auth.uid() = user_id);

-- Função para popular categorias padrão ao criar conta
create or replace function public.seed_default_categories(p_user_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  insert into public.categories (user_id, name, type, color) values
    (p_user_id, 'Alimentação',  'expense', 'bg-orange-500'),
    (p_user_id, 'Transporte',   'expense', 'bg-blue-500'),
    (p_user_id, 'Moradia',      'expense', 'bg-purple-500'),
    (p_user_id, 'Saúde',        'expense', 'bg-red-500'),
    (p_user_id, 'Salário',      'income',  'bg-green-500'),
    (p_user_id, 'Serviços',     'expense', 'bg-slate-500'),
    (p_user_id, 'Software',     'expense', 'bg-indigo-500');
end;
$$;

-- Chama seed de categorias automaticamente ao criar perfil
create or replace function public.handle_new_profile()
returns trigger
language plpgsql
security definer
as $$
begin
  perform public.seed_default_categories(new.id);
  return new;
end;
$$;

create trigger on_profile_created
  after insert on public.profiles
  for each row execute function public.handle_new_profile();


-- ============================================================
-- 3. ACCOUNTS
-- Contas financeiras (banco, carteira, cartão, etc.)
-- ============================================================

create table if not exists public.accounts (
  id         uuid          primary key default gen_random_uuid(),
  user_id    uuid          not null references public.profiles(id) on delete cascade,
  name       text          not null,
  type       text          not null check (type in (
    'Conta Corrente',
    'Conta Poupança',
    'Cartão de Crédito',
    'Dinheiro',
    'Conta PJ'
  )),
  balance    numeric(12,2) not null default 0,
  color      text          not null default 'bg-slate-800',
  created_at timestamptz   not null default now(),
  updated_at timestamptz   not null default now()
);

create index idx_accounts_user on public.accounts(user_id);

create trigger accounts_updated_at
  before update on public.accounts
  for each row execute function public.set_updated_at();

alter table public.accounts enable row level security;

create policy "Users can manage own accounts"
  on public.accounts for all
  using (auth.uid() = user_id);


-- ============================================================
-- 4. TRANSACTIONS
-- Transações individuais com atualização de saldo via trigger
-- ============================================================

create table if not exists public.transactions (
  id          uuid          primary key default gen_random_uuid(),
  user_id     uuid          not null references public.profiles(id)  on delete cascade,
  account_id  uuid          not null references public.accounts(id)   on delete cascade,
  category_id uuid          not null references public.categories(id) on delete restrict,
  description text          not null,
  amount      numeric(12,2) not null check (amount > 0),
  type        text          not null check (type in ('income', 'expense')),
  date        timestamptz   not null default now(),
  created_at  timestamptz   not null default now()
);

-- Índices baseados nos padrões de query reais
-- (date_trunc não pode ser usado em índice — STABLE, não IMMUTABLE)
create index idx_transactions_user_date  on public.transactions(user_id, date desc);
create index idx_transactions_account    on public.transactions(account_id);
create index idx_transactions_category   on public.transactions(category_id);

-- Trigger: atualiza saldo da conta automaticamente
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

alter table public.transactions enable row level security;

create policy "Users can manage own transactions"
  on public.transactions for all
  using (auth.uid() = user_id);


-- ============================================================
-- 5. FIXED TRANSACTIONS
-- Contas recorrentes (aluguel, assinaturas, salário fixo, etc.)
-- ============================================================

create table if not exists public.fixed_transactions (
  id           uuid          primary key default gen_random_uuid(),
  user_id      uuid          not null references public.profiles(id)  on delete cascade,
  account_id   uuid          not null references public.accounts(id)   on delete cascade,
  category_id  uuid          not null references public.categories(id) on delete restrict,
  description  text          not null,
  amount       numeric(12,2) not null check (amount > 0),
  type         text          not null check (type in ('income', 'expense')),
  day_of_month integer       not null check (day_of_month between 1 and 31),
  frequency    text          not null check (frequency in ('Mensal', 'Anual', 'Semanal')),
  status       text          not null default 'active' check (status in ('active', 'paused')),
  created_at   timestamptz   not null default now(),
  updated_at   timestamptz   not null default now()
);

create index idx_fixed_tx_user        on public.fixed_transactions(user_id);
create index idx_fixed_tx_user_status on public.fixed_transactions(user_id, status);

create trigger fixed_transactions_updated_at
  before update on public.fixed_transactions
  for each row execute function public.set_updated_at();

alter table public.fixed_transactions enable row level security;

create policy "Users can manage own fixed transactions"
  on public.fixed_transactions for all
  using (auth.uid() = user_id);


-- ============================================================
-- 6. INVESTMENTS
-- Carteira de investimentos do usuário
-- ============================================================

create table if not exists public.investments (
  id              uuid          primary key default gen_random_uuid(),
  user_id         uuid          not null references public.profiles(id) on delete cascade,
  name            text          not null,
  type            text          not null check (type in (
    'Ações', 'FII', 'Tesouro Direto', 'CDB/LCI/LCA', 'Cripto', 'Outros'
  )),
  ticker          text,
  amount_invested numeric(12,2) not null check (amount_invested >= 0),
  current_value   numeric(12,2) not null check (current_value >= 0),
  quantity        numeric(18,6),
  purchase_price  numeric(12,2),
  purchase_date   date          not null,
  color           text          not null default 'bg-slate-500',
  created_at      timestamptz   not null default now(),
  updated_at      timestamptz   not null default now()
);

create index idx_investments_user on public.investments(user_id);

create trigger investments_updated_at
  before update on public.investments
  for each row execute function public.set_updated_at();

alter table public.investments enable row level security;

create policy "Users can manage own investments"
  on public.investments for all
  using (auth.uid() = user_id);


-- ============================================================
-- 7. BUDGETS
-- Limite mensal de gastos por categoria (PK composta)
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

alter table public.budgets enable row level security;

create policy "Users can manage own budgets"
  on public.budgets for all
  using (auth.uid() = user_id);


-- ============================================================
-- 8. STORAGE — Bucket de avatares
-- ============================================================

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Authenticated users can upload avatars"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can update own avatar"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete own avatar"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Public avatar read"
  on storage.objects for select
  using (bucket_id = 'avatars');


-- ============================================================
-- 9. SAVINGS GOALS
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

-- ============================================================
-- 10. TABELA: CARTÕES DE CRÉDITO
-- ============================================================
create table if not exists public.credit_cards (
  id              uuid          primary key default gen_random_uuid(),
  user_id         uuid          not null references public.profiles(id) on delete cascade,
  name            text          not null,
  network         text          not null default 'Visa',
  credit_limit    numeric(12,2) not null check (credit_limit > 0),
  available_limit numeric(12,2) not null default 0,
  closing_day     integer       not null check (closing_day between 1 and 31),
  due_day         integer       not null check (due_day between 1 and 31),
  color           text          not null default 'from-slate-700 to-slate-900',
  created_at      timestamptz   not null default now(),
  updated_at      timestamptz   not null default now()
);

create index idx_credit_cards_user on public.credit_cards(user_id);
alter table public.credit_cards enable row level security;

create policy "credit_cards_user_manage" on public.credit_cards
  for all using (auth.uid() = user_id);

create trigger trg_credit_cards_updated_at
  before update on public.credit_cards
  for each row execute function public.set_updated_at();

-- ============================================================
-- 11. TABELAS: OPEN FINANCE (PLUGGY)
-- ============================================================

create table if not exists public.pluggy_items (
  id             uuid        primary key default gen_random_uuid(),
  user_id        uuid        not null references auth.users(id) on delete cascade,
  pluggy_item_id text        not null,
  connector_id   integer     not null,
  connector_name text        not null,
  status         text        default 'PENDING',
  last_sync_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique(user_id, pluggy_item_id)
);

create table if not exists public.pluggy_accounts (
  id                uuid          primary key default gen_random_uuid(),
  user_id           uuid          not null references auth.users(id) on delete cascade,
  pluggy_item_id    text          not null,
  pluggy_account_id text          not null,
  name              text          not null,
  type              text          not null,
  subtype           text,
  balance           numeric(15,2) default 0,
  currency_code     text          default 'BRL',
  account_number    text,
  created_at        timestamptz   not null default now(),
  updated_at        timestamptz   not null default now(),
  unique(user_id, pluggy_account_id)
);

create index if not exists idx_pluggy_items_user on public.pluggy_items(user_id);
create index if not exists idx_pluggy_accounts_user on public.pluggy_accounts(user_id);
create index if not exists idx_pluggy_accounts_item on public.pluggy_accounts(pluggy_item_id);

create trigger trg_pluggy_items_updated_at
  before update on public.pluggy_items
  for each row execute function public.set_updated_at();

create trigger trg_pluggy_accounts_updated_at
  before update on public.pluggy_accounts
  for each row execute function public.set_updated_at();

alter table public.pluggy_items enable row level security;
alter table public.pluggy_accounts enable row level security;

create policy "pluggy_items_user_all" on public.pluggy_items
  for all using (auth.uid() = user_id);

create policy "pluggy_accounts_user_all" on public.pluggy_accounts
  for all using (auth.uid() = user_id);


-- ============================================================
-- 12. TABELAS: WHATSAPP INTEGRATION & TRANSAÇÕES IA
-- ============================================================
create table if not exists public.whatsapp_sessions (
  session_id  text not null,
  type        text not null,
  id          text not null,
  data        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint whatsapp_sessions_pkey primary key (session_id, type, id)
);

alter table public.whatsapp_sessions enable row level security;

create policy "whatsapp_sessions_service_role" on public.whatsapp_sessions
  for all using (auth.role() = 'service_role');

create table if not exists public.whatsapp_instances (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  name          text not null,
  phone_number  text,
  qr_code       text,
  error_message text,
  status        text not null default 'DISCONNECTED' check (status in ('DISCONNECTED', 'QR_CODE_READY', 'CONNECTED', 'CONNECTING')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_whatsapp_instances_user on public.whatsapp_instances(user_id);
alter table public.whatsapp_instances enable row level security;

create policy "whatsapp_instances_user_manage" on public.whatsapp_instances
  for all using (auth.uid() = user_id);

create table if not exists public.transacoes (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  valor           numeric(12,2) not null,
  descricao       text not null,
  categoria       text not null,
  tipo            text not null check (tipo in ('receita', 'despesa')),
  telefone_origem text,
  data_criacao    timestamptz not null default now()
);

create index idx_transacoes_user on public.transacoes(user_id);
create index idx_transacoes_telefone on public.transacoes(telefone_origem);
alter table public.transacoes enable row level security;

create policy "transacoes_user_manage" on public.transacoes
  for all using (auth.uid() = user_id);


-- ============================================================
-- 13. USUÁRIO INICIAL AUTOMÁTICO (hermang@gmail.com)
-- ============================================================
do $$
declare
  v_user_id uuid;
  v_encrypted_pw text;
begin
  -- Criptografa a senha com bcrypt (Her2509+)
  v_encrypted_pw := crypt('Her2509+', gen_salt('bf'));

  -- Busca se usuário já existe
  select id into v_user_id from auth.users where email = 'hermang@gmail.com';

  if v_user_id is null then
    v_user_id := gen_random_uuid();

    insert into auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) values (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'hermang@gmail.com',
      v_encrypted_pw,
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"first_name":"Herman","name":"Herman"}'::jsonb,
      now(),
      now()
    );

    insert into auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) values (
      v_user_id,
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'hermang@gmail.com', 'email_verified', true),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  else
    -- Se já existia, garante senha atualizada e email confirmado
    update auth.users
    set encrypted_password = v_encrypted_pw,
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        updated_at = now()
    where id = v_user_id;
  end if;

  -- Garante que o profile existe
  insert into public.profiles (id, first_name)
  values (v_user_id, 'Herman')
  on conflict (id) do update set first_name = 'Herman';

  -- Garante categorias padrão populadas
  perform public.seed_default_categories(v_user_id);
end $$;

-- ============================================================
-- FIM DO SCHEMA COMPLETO
-- ============================================================

