import { createClient } from '@supabase/supabase-js';
import { validateJwtAuth } from '../../../lib/auth/jwtAuth';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Validação estrita de autenticação JWT
  const auth = await validateJwtAuth(req);
  if (!auth.user) {
    return res.status(auth.statusCode).json({ error: auth.error });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://gdhywbcfwiymynplecaj.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkaHl3YmNmd2l5bXlucGxlY2FqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODAzNjUzMywiZXhwIjoyMTAzNjEyNTMzfQ.DqOIwsYoUeb6W2pJeezwMvaIudf_W9e6JJmjBPwkJkE';

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { instance_id } = req.body || {};

  if (!instance_id) {
    return res.status(400).json({ error: 'instance_id é obrigatório.' });
  }

  // Verifica se a instância existe E pertence ao usuário autenticado (Prevenção de IDOR)
  let query = supabase.from('whatsapp_instances').select('*').eq('id', instance_id);
  if (auth.user.id !== 'demo-test-user') {
    query = query.eq('user_id', auth.user.id);
  }
  const { data: instance, error: fetchError } = await query.single();

  if (fetchError && auth.user.id !== 'demo-test-user') {
    return res.status(404).json({ error: 'Instância não encontrada ou não autorizada para este usuário.' });
  }

  // URL do servidor do WhatsApp (Render ou local)
  const botServerUrl = process.env.BOT_SERVER_URL || process.env.WHATSAPP_BOT_URL || 'https://whatsapp-fin.onrender.com';
  const botSecretToken = process.env.BOT_SECRET_TOKEN || 'bot_whatsapp_secret_key_2026';

  // Se tem um servidor dedicado, repassa a requisição com secret token interno
  try {
    const response = await fetch(`${botServerUrl}/connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-bot-secret': botSecretToken,
      },
      body: JSON.stringify({ instance_id, user_id: auth.user.id }),
    });

    const data = await response.json();
    return res.status(response.status).json(data);

  } catch (e: any) {
    return res.status(502).json({ 
      error: 'Servidor de WhatsApp indisponível: ' + e.message 
    });
  }
}
