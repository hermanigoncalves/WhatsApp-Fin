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

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ 
      error: 'Variáveis de ambiente do Supabase não configuradas no servidor.' 
    });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { instance_id } = req.body || {};

  if (!instance_id) {
    return res.status(400).json({ error: 'instance_id é obrigatório.' });
  }

  // Verifica se a instância existe E pertence ao usuário autenticado (Prevenção de IDOR)
  const { data: instance, error: fetchError } = await supabase
    .from('whatsapp_instances')
    .select('*')
    .eq('id', instance_id)
    .eq('user_id', auth.user.id)
    .single();

  if (fetchError || !instance) {
    return res.status(404).json({ error: 'Instância não encontrada ou não autorizada para este usuário.' });
  }

  // Verifica se o WHATSAPP_BOT_URL (servidor dedicado) está configurado
  const botServerUrl = process.env.WHATSAPP_BOT_URL;
  const botSecretToken = process.env.BOT_SECRET_TOKEN || '';

  if (!botServerUrl) {
    // Sem servidor dedicado: retorna status informativo seguro
    return res.status(200).json({
      status: 'NEEDS_SERVER',
      message: 'A geração de QR Code requer o bot-server ativo. Configure WHATSAPP_BOT_URL.',
    });
  }

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
