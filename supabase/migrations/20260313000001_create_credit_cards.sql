-- Migration: Criação da tabela de cartões de crédito
CREATE TABLE IF NOT EXISTS public.credit_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    network TEXT NOT NULL DEFAULT 'Visa',
    credit_limit NUMERIC(12,2) NOT NULL CHECK (credit_limit > 0),
    available_limit NUMERIC(12,2) NOT NULL DEFAULT 0,
    closing_day INTEGER NOT NULL CHECK (closing_day BETWEEN 1 AND 31),
    due_day INTEGER NOT NULL CHECK (due_day BETWEEN 1 AND 31),
    color TEXT NOT NULL DEFAULT 'from-slate-700 to-slate-900',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_credit_cards_user_id ON public.credit_cards(user_id);

-- Habilitar RLS
ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
CREATE POLICY "credit_cards_user_select" ON public.credit_cards
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "credit_cards_user_insert" ON public.credit_cards
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "credit_cards_user_update" ON public.credit_cards
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "credit_cards_user_delete" ON public.credit_cards
    FOR DELETE USING (auth.uid() = user_id);

-- Trigger para updated_at automático
CREATE OR REPLACE TRIGGER set_credit_cards_updated_at
    BEFORE UPDATE ON public.credit_cards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
