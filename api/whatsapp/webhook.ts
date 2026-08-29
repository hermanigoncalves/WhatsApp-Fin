import { analisarMensagemFinanceira } from '../../lib/financeiro/analisador';
import { createClient } from '@supabase/supabase-js';

/**
 * Webhook Serverless para processamento de transações WhatsApp.
 * Arquitetura Stateless pura (sem instanciar sockets Baileys em Serverless).
 */
export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-bot-secret, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Validação opcional de secret token para comunicação segura bot-server -> webhook
  const secretHeader = req.headers['x-bot-secret'];
  const expectedSecret = process.env.BOT_SECRET_TOKEN;
  if (expectedSecret && secretHeader !== expectedSecret) {
    return res.status(401).json({ error: 'Unauthorized webhook invocation' });
  }

  const { message, text, sender, user_id, phone_number } = req.body || {};
  const rawText = message || text;

  if (!rawText || typeof rawText !== 'string') {
    return res.status(400).json({ error: 'Campo de texto da mensagem é obrigatório.' });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

  try {
    // 1. Processa e analisa a mensagem financeira com IA
    const transacao = await analisarMensagemFinanceira(rawText);

    // 2. Se o Supabase estiver configurado, persiste a transação
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data, error } = await supabase
        .from('transacoes')
        .insert([{
          user_id: user_id || null,
          valor: transacao.valor,
          descricao: transacao.descricao,
          categoria: transacao.categoria,
          tipo: transacao.tipo,
          telefone_origem: sender || phone_number || null,
        }])
        .select()
        .single();

      if (error) {
        console.error('[Webhook] Erro ao salvar transação no Supabase:', error);
        return res.status(500).json({ error: `Erro no banco: ${error.message}`, transacao });
      }

      return res.status(200).json({
        success: true,
        message: 'Transação processada e salva com sucesso',
        transacao: data || transacao,
      });
    }

    // Modo offline / sem banco: retorna a transação analisada com sucesso
    return res.status(200).json({
      success: true,
      mode: 'no-database-preview',
      message: 'Transação analisada com sucesso (banco de dados offline)',
      transacao,
    });

  } catch (error: any) {
    console.error('[Webhook] Falha no processamento:', error);
    return res.status(422).json({
      error: `Não foi possível interpretar a mensagem financeira: ${error.message}`,
    });
  }
}
