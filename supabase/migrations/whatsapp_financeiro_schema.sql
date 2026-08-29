-- Habilita extensão pgcrypto se ainda não tiver para uuid
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Criação da tabela de Sessões do Whatsapp (Baileys Auth)
CREATE TABLE IF NOT EXISTS public.whatsapp_sessions (
    session_id TEXT NOT NULL,
    type TEXT NOT NULL,
    id TEXT NOT NULL,
    data TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT whatsapp_sessions_pkey PRIMARY KEY (session_id, type, id)
);

-- Habilitar RLS para whatsapp_sessions (acesso via backend / service_role)
ALTER TABLE public.whatsapp_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "whatsapp_sessions_service_role_all" ON public.whatsapp_sessions
    FOR ALL USING (auth.role() = 'service_role');

-- Criação da tabela de Transações (Extratos enviados pelo Whatsapp e consolidados pelo GPT)
CREATE TABLE IF NOT EXISTS public.transacoes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    valor NUMERIC(12,2) NOT NULL,
    descricao TEXT NOT NULL,
    categoria TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa')),
    telefone_origem TEXT,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.transacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transacoes_user_select" ON public.transacoes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "transacoes_user_insert" ON public.transacoes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "transacoes_user_update" ON public.transacoes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "transacoes_user_delete" ON public.transacoes
    FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_transacoes_user_id ON public.transacoes(user_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_telefone ON public.transacoes(telefone_origem);

-- Tabela para gerenciar estado das Conexões de WhatsApp
CREATE TABLE IF NOT EXISTS public.whatsapp_instances (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone_number TEXT,
    qr_code TEXT,
    error_message TEXT,
    status TEXT NOT NULL DEFAULT 'DISCONNECTED' CHECK (status IN ('DISCONNECTED', 'QR_CODE_READY', 'CONNECTED', 'CONNECTING')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.whatsapp_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "whatsapp_instances_user_select" ON public.whatsapp_instances
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "whatsapp_instances_user_insert" ON public.whatsapp_instances
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "whatsapp_instances_user_update" ON public.whatsapp_instances
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "whatsapp_instances_user_delete" ON public.whatsapp_instances
    FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_user_id ON public.whatsapp_instances(user_id);
