-- ============================================================
-- Migration 002: categories
-- User-scoped transaction categories (income / expense)
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

-- RLS
alter table public.categories enable row level security;

create policy "Users can manage own categories"
  on public.categories for all
  using (auth.uid() = user_id);

-- Seed default categories for new users
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
