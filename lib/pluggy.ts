declare const process: {
  env: Record<string, string | undefined>;
};

interface PluggyAuthResponse {
  apiKey: string;
}

export interface PluggyAccount {
  id: string;
  type: string;
  name: string;
  marketingName?: string;
  balance: number;
  currencyCode: string;
  number?: string;
  bankData?: {
    transferNumber?: string;
    closingBalance?: number;
  };
}

export interface PluggyTransaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  category?: string;
  type: 'CREDIT' | 'DEBIT';
  status: string;
  accountId: string;
}

export interface ResumoFinanceiro {
  saldoTotal: number;
  totalGanhos: number;
  totalGastos: number;
  contas: {
    id: string;
    nome: string;
    saldo: number;
    tipo: string;
  }[];
  transacoes: {
    id: string;
    descricao: string;
    valor: number;
    tipo: 'CREDITO' | 'DEBITO';
    data: string;
    categoria: string;
    contaId: string;
  }[];
}

const PLUGGY_BASE_URL = 'https://api.pluggy.ai';

// Cache do token para evitar chamadas de autenticação desnecessárias
let cachedApiKey: string | null = null;
let tokenExpiresAt: number = 0;

/**
 * Autentica na Pluggy e obtém o API Key (Bearer Token)
 */
export async function getPluggyApiKey(): Promise<string> {
  const now = Date.now();
  if (cachedApiKey && now < tokenExpiresAt) {
    return cachedApiKey;
  }

  const clientId = process.env.PLUGGY_CLIENT_ID;
  const clientSecret = process.env.PLUGGY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('PLUGGY_CLIENT_ID ou PLUGGY_CLIENT_SECRET não configurados no .env');
  }

  const response = await fetch(`${PLUGGY_BASE_URL}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientId,
      clientSecret,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Falha na autenticação com Pluggy: ${errorText}`);
  }

  const data: PluggyAuthResponse = await response.json();
  cachedApiKey = data.apiKey;
  // Define expiração para 1 hora e meia (as chaves costumam durar 2h)
  tokenExpiresAt = now + 90 * 60 * 1000;

  return cachedApiKey;
}

/**
 * Gera um Connect Token para inicializar o Pluggy Connect Widget no frontend
 */
export async function createConnectToken(itemId?: string, clientUserId?: string): Promise<string> {
  const apiKey = await getPluggyApiKey();
  const body: Record<string, any> = {};
  if (itemId) body.itemId = itemId;
  if (clientUserId) body.clientUserId = clientUserId;

  const response = await fetch(`${PLUGGY_BASE_URL}/connect_token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro ao gerar Connect Token na Pluggy: ${errorText}`);
  }

  const data = await response.json();
  return data.accessToken;
}

/**
 * Busca lista de conectores (bancos e instituições financeiras suportadas)
 */
export async function listarConectores(): Promise<any[]> {
  const apiKey = await getPluggyApiKey();
  const response = await fetch(`${PLUGGY_BASE_URL}/connectors?countries=BR`, {
    headers: {
      'X-API-KEY': apiKey,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro ao listar conectores na Pluggy: ${errorText}`);
  }

  const data = await response.json();
  return data.results || [];
}

/**
 * Busca todas as contas e transações e calcula o resumo consolidado
 */
export async function buscarResumoFinanceiro(): Promise<ResumoFinanceiro> {
  const apiKey = await getPluggyApiKey();
  const headers = {
    'X-API-KEY': apiKey,
    'Accept': 'application/json',
  };

  // 1. Busca Contas
  const accountsRes = await fetch(`${PLUGGY_BASE_URL}/accounts`, { headers });
  if (!accountsRes.ok) throw new Error('Erro ao buscar contas');
  const accountsData = await accountsRes.json();
  const rawAccounts: PluggyAccount[] = accountsData.results || [];

  // 2. Busca Transações
  const transactionsRes = await fetch(`${PLUGGY_BASE_URL}/transactions`, { headers });
  if (!transactionsRes.ok) throw new Error('Erro ao buscar transações');
  const transactionsData = await transactionsRes.json();
  const rawTransactions: PluggyTransaction[] = transactionsData.results || [];

  // 3. Normalização e Cálculos
  let saldoTotal = 0;
  const contasFormatadas = rawAccounts.map((acc) => {
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

  const transacoesFormatadas = rawTransactions.map((tx) => {
    const valorAbsoluto = Math.abs(tx.amount);
    const isCredito = tx.amount > 0 || tx.type === 'CREDIT';

    if (isCredito) {
      totalGanhos += valorAbsoluto;
    } else {
      totalGastos += valorAbsoluto;
    }

    return {
      id: tx.id,
      descricao: tx.description || 'Transação sem descrição',
      valor: valorAbsoluto,
      tipo: (isCredito ? 'CREDITO' : 'DEBITO') as 'CREDITO' | 'DEBITO',
      data: tx.date ? tx.date.split('T')[0] : new Date().toISOString().split('T')[0],
      categoria: tx.category || 'Geral',
      contaId: tx.accountId,
    };
  });

  // Ordena por data decrescente
  transacoesFormatadas.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

  return {
    saldoTotal,
    totalGanhos,
    totalGastos,
    contas: contasFormatadas,
    transacoes: transacoesFormatadas,
  };
}
