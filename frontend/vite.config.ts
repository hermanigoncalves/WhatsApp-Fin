import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const PLUGGY_CLIENT_ID = process.env.PLUGGY_CLIENT_ID || '4158d9a1-1d4a-4061-ad1f-178107528d1c';
const PLUGGY_CLIENT_SECRET = process.env.PLUGGY_CLIENT_SECRET || 'b24ab89f-85e6-4011-b306-5405aa79a989';

// Plugin para simular as rotas de API da Vercel durante o desenvolvimento local com Vite
function pluggyApiDevPlugin() {
  return {
    name: 'pluggy-api-dev-middleware',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        if (req.url === '/api/financas/connect-token' && req.method === 'POST') {
          try {
            // 1. Auth Pluggy
            const authRes = await fetch('https://api.pluggy.ai/auth', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                clientId: PLUGGY_CLIENT_ID,
                clientSecret: PLUGGY_CLIENT_SECRET,
              }),
            });
            const authData: any = await authRes.json();
            if (!authRes.ok || !authData.apiKey) {
              throw new Error(authData.message || 'Falha ao autenticar na Pluggy');
            }

            // 2. Connect Token
            const tokenRes = await fetch('https://api.pluggy.ai/connect_token', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-API-KEY': authData.apiKey,
              },
              body: JSON.stringify({}),
            });
            const tokenData: any = await tokenRes.json();

            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            res.end(JSON.stringify({ accessToken: tokenData.accessToken }));
            return;
          } catch (err: any) {
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
            return;
          }
        }

        if (req.url === '/api/financas/resumo' && req.method === 'GET') {
          try {
            // 1. Auth Pluggy
            const authRes = await fetch('https://api.pluggy.ai/auth', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                clientId: PLUGGY_CLIENT_ID,
                clientSecret: PLUGGY_CLIENT_SECRET,
              }),
            });
            const authData: any = await authRes.json();
            if (!authRes.ok || !authData.apiKey) {
              throw new Error(authData.message || 'Falha ao autenticar na Pluggy');
            }

            const headers = { 'X-API-KEY': authData.apiKey, 'Accept': 'application/json' };

            // 2. Contas
            const accsRes = await fetch('https://api.pluggy.ai/accounts', { headers });
            const accsData: any = accsRes.ok ? await accsRes.json() : { results: [] };
            const rawAccounts = accsData.results || [];

            // 3. Transações
            const txsRes = await fetch('https://api.pluggy.ai/transactions', { headers });
            const txsData: any = txsRes.ok ? await txsRes.json() : { results: [] };
            const rawTransactions = txsData.results || [];

            let saldoTotal = 0;
            const contas = rawAccounts.map((acc: any) => {
              saldoTotal += acc.balance || 0;
              return {
                id: acc.id,
                nome: acc.marketingName || acc.name || 'Conta Bancária',
                saldo: acc.balance || 0,
                tipo: acc.type,
              };
            });

            let totalGanhos = 0;
            let totalGastos = 0;
            const transacoes = rawTransactions.map((tx: any) => {
              const val = Math.abs(tx.amount);
              const isCredito = tx.amount > 0 || tx.type === 'CREDIT';
              if (isCredito) totalGanhos += val;
              else totalGastos += val;
              return {
                id: tx.id,
                descricao: tx.description || 'Transação',
                valor: val,
                tipo: isCredito ? 'CREDITO' : 'DEBITO',
                data: tx.date ? tx.date.split('T')[0] : new Date().toISOString().split('T')[0],
                categoria: tx.category || 'Geral',
                contaId: tx.accountId,
              };
            });

            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            res.end(JSON.stringify({
              saldoTotal,
              totalGanhos,
              totalGastos,
              contas,
              transacoes,
            }));
            return;
          } catch (err: any) {
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
            return;
          }
        }

        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    pluggyApiDevPlugin(),
  ],
});
