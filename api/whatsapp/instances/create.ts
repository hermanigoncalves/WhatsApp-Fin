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
    return res.status(500).json({ error: 'Variáveis de ambiente do Supabase não configuradas no servidor.' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { name, phone_number } = req.body || {};

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: 'O nome da instância é obrigatório.' });
  }

  // O user_id é OBRIGATORIAMENTE extraído do token JWT autenticado (Prevenção de IDOR/Spoofing)
  const userId = auth.user.id;

  const { data, error } = await supabase
    .from('whatsapp_instances')
    .insert([{
      name: name.trim().slice(0, 100),
      phone_number: phone_number ? String(phone_number).trim().slice(0, 30) : null,
      user_id: userId,
      status: 'DISCONNECTED',
    }])
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json(data);
}
