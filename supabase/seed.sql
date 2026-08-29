-- ============================================================
-- Seed: default data for local development
-- Run with: supabase db seed
-- ============================================================
-- NOTE: This seed creates a test user only in local dev.
-- In production, users register via Supabase Auth.

-- Create a test user (local dev only)
do $$
declare
  v_user_id uuid := '00000000-0000-0000-0000-000000000001';
begin
  -- Skip if user already exists
  if not exists (select 1 from auth.users where id = v_user_id) then

    insert into auth.users (
      id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) values (
      v_user_id,
      'dev@whatsappfin.local',
      crypt('dev123456', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      now(),
      now()
    );

  end if;
end $$;

-- Profile (will also be created by trigger on user insert above,
-- so use upsert to be safe)
insert into public.profiles (id, first_name, last_name, phone)
values (
  '00000000-0000-0000-0000-000000000001',
  'Dev',
  'User',
  '+55 11 99999-9999'
)
on conflict (id) do nothing;

-- Seed categories
select public.seed_default_categories('00000000-0000-0000-0000-000000000001');

-- Accounts
insert into public.accounts (user_id, name, type, balance, color) values
  ('00000000-0000-0000-0000-000000000001', 'Nubank',          'Conta Corrente', 2272.50, 'bg-slate-800'),
  ('00000000-0000-0000-0000-000000000001', 'Inter PJ',        'Conta PJ',       8320.00, 'bg-orange-500'),
  ('00000000-0000-0000-0000-000000000001', 'Carteira Física', 'Dinheiro',        120.00, 'bg-green-600');
