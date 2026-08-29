import { createConnectToken } from '../../lib/pluggy';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { itemId, clientUserId } = req.body || {};
    const accessToken = await createConnectToken(itemId, clientUserId);
    return res.status(200).json({ accessToken });
  } catch (error: any) {
    console.error('Erro ao gerar connect token Pluggy:', error);
    return res.status(500).json({
      error: error.message || 'Erro interno ao gerar token de conexão Pluggy',
    });
  }
}
