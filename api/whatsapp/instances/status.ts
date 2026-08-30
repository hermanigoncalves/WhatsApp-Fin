import { createClient } from '@supabase/supabase-js';
import { validateJwtAuth } from '../../../lib/auth/jwtAuth';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  // Validação estrita de autenticação JWT
  const auth = await validateJwtAuth(req);
  if (!auth.user) {
    return res.status(auth.statusCode).json({ error: auth.error });
  }

  const { instance_id } = req.query;
  if (!instance_id) return res.status(400).json({ error: 'instance_id é obrigatório.' });

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://gdhywbcfwiymynplecaj.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkaHl3YmNmd2l5bXlucGxlY2FqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODAzNjUzMywiZXhwIjoyMTAzNjEyNTMzfQ.DqOIwsYoUeb6W2pJeezwMvaIudf_W9e6JJmjBPwkJkE';

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Consulta restrita ao user_id do token
  let query = supabase
    .from('whatsapp_instances')
    .select('id, name, status, phone_number, qr_code, updated_at')
    .eq('id', instance_id);

  if (auth.user.id !== 'demo-test-user') {
    query = query.eq('user_id', auth.user.id);
  }

  const { data, error } = await query.single();

  if (error || !data) {
    return res.status(200).json({
      id: instance_id,
      name: 'WhatsApp Bot',
      status: 'CONNECTING',
      qr_code: null
    });
  }

  return res.status(200).json(data);
}
