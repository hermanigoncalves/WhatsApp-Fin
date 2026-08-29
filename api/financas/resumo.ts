import { buscarResumoFinanceiro } from '../../lib/pluggy';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const resumo = await buscarResumoFinanceiro();
    return res.status(200).json(resumo);
  } catch (error: any) {
    console.error('Erro na API de finanças Pluggy:', error);
    return res.status(500).json({
      error: error.message || 'Erro interno ao consultar dados do Open Finance',
    });
  }
}
