# Supabase — Variáveis de Ambiente

Copie este arquivo para `frontend/.env` e preencha com os valores do seu projeto Supabase.

```bash
cp .env.example frontend/.env
```

## Como obter os valores

1. Acesse [app.supabase.com](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **Settings → API**
4. Copie **Project URL** e **anon public** key

---

```env
# frontend/.env
VITE_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> ⚠️ NUNCA adicione o `service_role key` no frontend — ele bypassa o RLS.
