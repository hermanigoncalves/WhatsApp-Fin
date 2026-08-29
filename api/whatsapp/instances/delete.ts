import { createClient } from '@supabase/supabase-js';
import { validateJwtAuth } from '../../../lib/auth/jwtAuth';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });

  // Validação estrita de autenticação JWT
  const auth = await validateJwtAuth(req);
  if (!auth.user) {
    return res.status(auth.statusCode).json({ error: auth.error });
  }

  const { instance_id } = req.query;
  if (!instance_id) return res.status(400).json({ error: 'instance_id é obrigatório.' });

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Variáveis de ambiente do Supabase não configuradas no servidor.' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Exclui a instância APENAS se pertencer ao usuário autenticado (Prevenção de IDOR)
  const { data: deleted, error: err1 } = await supabase
    .from('whatsapp_instances')
    .delete()
    .eq('id', instance_id)
    .eq('user_id', auth.user.id)
    .select();

  if (err1) {
    return res.status(500).json({ error: `Erro ao deletar instância: ${err1.message}` });
  }

  if (!deleted || deleted.length === 0) {
    return res.status(404).json({ error: 'Instância não encontrada ou não autorizada para este usuário.' });
  }

  // Exclui a sessão salva no banco (Baileys)
  await supabase
    .from('whatsapp_sessions')
    .delete()
    .eq('session_id', `session-${instance_id}`);

  return res.status(200).json({ success: true, message: 'Instância removida com sucesso.' });
}
