-- Migration: Create tables for Pluggy Open Finance connections
-- Tables: pluggy_items, pluggy_accounts

-- ─── pluggy_items (connected bank items) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS pluggy_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pluggy_item_id TEXT NOT NULL,
  connector_id INTEGER NOT NULL,
  connector_name TEXT NOT NULL,
  status TEXT DEFAULT 'PENDING',
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, pluggy_item_id)
);

-- ─── pluggy_accounts (bank accounts from connected items) ────────────────────
CREATE TABLE IF NOT EXISTS pluggy_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pluggy_item_id TEXT NOT NULL,
  pluggy_account_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  subtype TEXT,
  balance NUMERIC(15,2) DEFAULT 0,
  currency_code TEXT DEFAULT 'BRL',
  account_number TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, pluggy_account_id)
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────
CREATE INDEX idx_pluggy_items_user ON pluggy_items(user_id);
CREATE INDEX idx_pluggy_accounts_user ON pluggy_accounts(user_id);
CREATE INDEX idx_pluggy_accounts_item ON pluggy_accounts(pluggy_item_id);

-- ─── Updated_at triggers ─────────────────────────────────────────────────────
CREATE TRIGGER set_pluggy_items_updated_at
  BEFORE UPDATE ON pluggy_items
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_pluggy_accounts_updated_at
  BEFORE UPDATE ON pluggy_accounts
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- ─── RLS Policies ────────────────────────────────────────────────────────────
ALTER TABLE pluggy_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pluggy_accounts ENABLE ROW LEVEL SECURITY;

-- pluggy_items: users can only see/manage their own
CREATE POLICY "pluggy_items_select" ON pluggy_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "pluggy_items_insert" ON pluggy_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "pluggy_items_update" ON pluggy_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "pluggy_items_delete" ON pluggy_items FOR DELETE USING (auth.uid() = user_id);

-- pluggy_accounts: users can only see/manage their own
CREATE POLICY "pluggy_accounts_select" ON pluggy_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "pluggy_accounts_insert" ON pluggy_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "pluggy_accounts_update" ON pluggy_accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "pluggy_accounts_delete" ON pluggy_accounts FOR DELETE USING (auth.uid() = user_id);
