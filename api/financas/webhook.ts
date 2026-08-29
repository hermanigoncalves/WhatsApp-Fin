import { buscarResumoFinanceiro } from '../../lib/pluggy';

/**
 * Webhook oficial para receber notificações da Pluggy Open Finance
 * Eventos suportados:
 * - item/created: Banco conectado com sucesso
 * - item/updated: Sincronização de contas e transações finalizada
 * - item/error: Erro ou necessidade de atualização de consentimento
 * - transactions/created: Novas transações recebidas no banco
 */
export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Pluggy-Signature');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { event, itemId, data } = req.body || {};
    console.log(`[Pluggy Webhook] Evento recebido: ${event} para o Item: ${itemId}`);

    switch (event) {
      case 'item/created':
        console.log(`[Pluggy Webhook] Novo item/banco conectado: ${itemId}`);
        break;

      case 'item/updated':
        console.log(`[Pluggy Webhook] Item atualizado e sincronizado: ${itemId}`);
        // Aqui atualiza os saldos e dados consolidados
        break;

      case 'transactions/created':
        console.log(`[Pluggy Webhook] Novas transações disponíveis para o item: ${itemId}`, data);
        break;

      case 'item/error':
        console.warn(`[Pluggy Webhook] Alerta de erro ou consentimento expirado no item: ${itemId}`, data);
        break;

      default:
        console.log(`[Pluggy Webhook] Outro evento recebido: ${event}`);
    }

    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('[Pluggy Webhook] Erro ao processar evento:', error);
    return res.status(500).json({ error: error.message || 'Erro interno no processamento do webhook' });
  }
}
