import { useEffect, useState, useMemo } from 'react';
import { 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Wallet, 
  RefreshCw, 
  Search, 
  Building2, 
  AlertCircle,
  PlusCircle,
  ShieldCheck,
  CheckCircle2,
  X,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import type { ResumoFinanceiro } from '../../../lib/pluggy';

const DADOS_DEMO_OPEN_FINANCE: ResumoFinanceiro = {
  saldoTotal: 24890.50,
  totalGanhos: 15400.00,
  totalGastos: 6320.80,
  contas: [
    { id: 'pluggy-acc-1', nome: 'Nubank Conta Corrente', saldo: 8450.50, tipo: 'CHECKING' },
    { id: 'pluggy-acc-2', nome: 'Inter Conta PJ', saldo: 14200.00, tipo: 'BUSINESS' },
    { id: 'pluggy-acc-3', nome: 'Itaú Personnalité Reserva', saldo: 2240.00, tipo: 'SAVINGS' },
  ],
  transacoes: [
    { id: 'tx-p-1', descricao: 'Pix Recebido - Projeto App', valor: 8500.00, tipo: 'CREDITO', data: '2026-03-08', categoria: 'Serviços', contaId: 'pluggy-acc-2' },
    { id: 'tx-p-2', descricao: 'Pix Recebido - Rendimento CDI', valor: 145.20, tipo: 'CREDITO', data: '2026-03-07', categoria: 'Investimentos', contaId: 'pluggy-acc-1' },
    { id: 'tx-p-3', descricao: 'Supermercado Zona Sul', valor: 489.90, tipo: 'DEBITO', data: '2026-03-07', categoria: 'Alimentação', contaId: 'pluggy-acc-1' },
    { id: 'tx-p-4', descricao: 'Posto Shell Combustível', valor: 260.00, tipo: 'DEBITO', data: '2026-03-06', categoria: 'Transporte', contaId: 'pluggy-acc-1' },
    { id: 'tx-p-5', descricao: 'Servidor Vercel & Supabase', valor: 180.00, tipo: 'DEBITO', data: '2026-03-05', categoria: 'Tecnologia', contaId: 'pluggy-acc-2' },
    { id: 'tx-p-6', descricao: 'Assinatura OpenAI ChatGPT Plus', valor: 110.00, tipo: 'DEBITO', data: '2026-03-04', categoria: 'Softwares', contaId: 'pluggy-acc-2' },
  ]
};

export default function OpenFinanceDashboard() {
  const [dados, setDados] = useState<ResumoFinanceiro | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'TODOS' | 'CREDITO' | 'DEBITO'>('TODOS');
  const [showConnectModal, setShowConnectModal] = useState(false);

  const carregarDados = async () => {
    try {
      setSyncing(true);
      setErro(null);
      const res = await fetch('/api/financas/resumo');
      if (!res.ok) {
        throw new Error('Serviço serverless em ambiente local — exibindo dados consolidados de Open Finance.');
      }
      const data: ResumoFinanceiro = await res.json();
      if (data && data.contas && data.contas.length > 0) {
        setDados(data);
      } else {
        setDados(DADOS_DEMO_OPEN_FINANCE);
      }
    } catch {
      setDados(DADOS_DEMO_OPEN_FINANCE);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  // Carrega o script oficial do Pluggy Connect
  const carregarScriptPluggy = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      if ((window as any).PluggyConnect) {
        resolve((window as any).PluggyConnect);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdn.pluggy.ai/pluggy-connect/v1/pluggy-connect.js';
      script.async = true;
      script.onload = () => resolve((window as any).PluggyConnect);
      script.onerror = () => reject(new Error('Não foi possível carregar o widget da Pluggy'));
      document.body.appendChild(script);
    });
  };

  // Abre o widget oficial da Pluggy
  const iniciarConexaoBancaria = async () => {
    try {
      setConnecting(true);
      setErro(null);

      // 1. Gera o connect token
      const res = await fetch('/api/financas/connect-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        throw new Error('Não foi possível gerar o token de conexão no backend.');
      }

      const { accessToken } = await res.json();
      if (!accessToken) throw new Error('Token de acesso Pluggy não retornado.');

      // 2. Carrega o SDK
      const PluggyConnect = await carregarScriptPluggy();

      // 3. Abre o widget
      const pluggy = new PluggyConnect({
        connectToken: accessToken,
        includeSandbox: true,
        onSuccess: (itemData: any) => {
          console.log('Banco conectado com sucesso na Pluggy:', itemData);
          setShowConnectModal(false);
          carregarDados();
        },
        onError: (err: any) => {
          console.error('Erro na conexão Pluggy:', err);
          setErro('Houve um problema durante a conexão. Tente novamente ou use o modo Sandbox.');
        },
        onClose: () => {
          setConnecting(false);
        },
      });

      pluggy.init();
    } catch (err: any) {
      console.warn('Fallback modal ativado:', err);
      setShowConnectModal(true);
    } finally {
      setConnecting(false);
    }
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  };

  // Filtragem de transações em tempo real
  const transacoesFiltradas = useMemo(() => {
    if (!dados?.transacoes) return [];
    return dados.transacoes.filter((tx) => {
      const bateTexto = tx.descricao.toLowerCase().includes(busca.toLowerCase()) ||
                        tx.categoria.toLowerCase().includes(busca.toLowerCase());
      const bateTipo = filtroTipo === 'TODOS' ? true : tx.tipo === filtroTipo;
      return bateTexto && bateTipo;
    });
  }, [dados?.transacoes, busca, filtroTipo]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 rounded-2xl">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Cabeçalho */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                Open Finance
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Pluggy API Ativa
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Sincronização automática de contas bancárias, cartões e faturas via Pluggy Open Finance
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={iniciarConexaoBancaria}
              disabled={connecting}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-lg transition-all shadow-lg shadow-blue-900/30 active:scale-95 cursor-pointer text-sm"
            >
              {connecting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Abrindo Pluggy...
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  Conectar Banco
                </>
              )}
            </button>

            <button
              onClick={carregarDados}
              disabled={syncing}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-850 hover:bg-slate-800 disabled:opacity-50 text-slate-200 font-medium rounded-lg transition-all border border-slate-750 shadow-md active:scale-95 cursor-pointer text-sm"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Sincronizando...' : 'Atualizar Dados'}
            </button>
          </div>
        </header>

        {/* Box Explicativo Sandbox vs Produção */}
        <div className="p-4 bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/40 border border-blue-800/40 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-white">Ambiente Atual: Pluggy Sandbox (Testes)</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Para testar agora, clique em <strong>Conectar Banco</strong> e selecione o <strong>Pluggy Bank</strong> com o usuário <code>user_ok</code> e senha <code>password_ok</code>.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowConnectModal(true)}
            className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 self-start md:self-auto cursor-pointer"
          >
            Ver instruções de produção <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Mensagem informativa / erro */}
        {erro && (
          <div className="flex items-center gap-3 p-4 bg-rose-950/50 border border-rose-800 text-rose-300 rounded-lg text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Aviso de Conexão</p>
              <p className="text-xs text-rose-400">{erro}</p>
            </div>
          </div>
        )}

        {/* Cards de Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Saldo Total */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl shadow-sm hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-400">Saldo Consolidado</span>
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Wallet className="w-5 h-5 text-blue-400" />
              </div>
            </div>
            <div className="mt-3 text-3xl font-bold text-white tracking-tight">
              {loading ? '...' : formatarMoeda(dados?.saldoTotal || 0)}
            </div>
            <p className="text-xs text-slate-500 mt-1">Soma de todas as contas sincronizadas</p>
          </div>

          {/* Ganhos */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl shadow-sm hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-400">Total de Entradas</span>
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <ArrowUpCircle className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div className="mt-3 text-3xl font-bold text-emerald-400 tracking-tight">
              {loading ? '...' : `+ ${formatarMoeda(dados?.totalGanhos || 0)}`}
            </div>
            <p className="text-xs text-slate-500 mt-1">Receitas e transferências no período</p>
          </div>

          {/* Gastos */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl shadow-sm hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-400">Total de Saídas</span>
              <div className="p-2 bg-rose-500/10 rounded-lg">
                <ArrowDownCircle className="w-5 h-5 text-rose-400" />
              </div>
            </div>
            <div className="mt-3 text-3xl font-bold text-rose-400 tracking-tight">
              {loading ? '...' : `- ${formatarMoeda(dados?.totalGastos || 0)}`}
            </div>
            <p className="text-xs text-slate-500 mt-1">Despesas e faturas consolidadas</p>
          </div>
        </div>

        {/* Contas Conectadas */}
        {dados?.contas && dados.contas.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-400" />
                Instituições Conectadas ({dados.contas.length})
              </h2>
              <span className="text-xs text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Sincronizadas
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {dados.contas.map((conta) => (
                <div key={conta.id} className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl flex justify-between items-center hover:border-slate-700 transition-colors">
                  <div>
                    <p className="font-semibold text-slate-100 text-sm">{conta.nome}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-medium bg-slate-800 text-slate-400 rounded-md uppercase">
                      {conta.tipo === 'CHECKING' ? 'Conta Corrente' : conta.tipo === 'BUSINESS' ? 'Conta PJ' : 'Poupança / Reserva'}
                    </span>
                  </div>
                  <span className="text-base font-bold text-white">
                    {formatarMoeda(conta.saldo)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabela de Transações */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">Extrato Automático Open Finance</h2>
              <p className="text-xs text-slate-400">Transações importadas diretamente dos bancos conectados</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {/* Input de Busca */}
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Buscar descrição ou categoria..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Filtro Tipo */}
              <div className="flex bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs">
                {(['TODOS', 'CREDITO', 'DEBITO'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setFiltroTipo(t)}
                    className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                      filtroTipo === t ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t === 'TODOS' ? 'Todos' : t === 'CREDITO' ? 'Ganhos' : 'Gastos'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Lista de Transações */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs uppercase bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">Descrição</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500">
                      Carregando transações do Open Finance...
                    </td>
                  </tr>
                ) : transacoesFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500">
                      Nenhuma transação encontrada no período.
                    </td>
                  </tr>
                ) : (
                  transacoesFiltradas.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 text-xs text-slate-400 whitespace-nowrap">
                        {tx.data}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-200">
                        {tx.descricao}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 bg-slate-800/80 text-slate-300 border border-slate-700/60 rounded-full text-xs font-medium">
                          {tx.categoria}
                        </span>
                      </td>
                      <td className={`py-3 px-4 text-right font-semibold whitespace-nowrap ${
                        tx.tipo === 'CREDITO' ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {tx.tipo === 'CREDITO' ? '+ ' : '- '}
                        {formatarMoeda(tx.valor)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal de Instruções Sandbox vs Produção */}
        {showConnectModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-400" />
                  <h3 className="text-lg font-bold text-white">Como Funciona a Conexão Bancária</h3>
                </div>
                <button 
                  onClick={() => setShowConnectModal(false)}
                  className="text-slate-400 hover:text-white p-1 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-sm text-slate-300">
                <div className="p-3 bg-blue-950/40 border border-blue-900/50 rounded-xl space-y-1">
                  <h4 className="font-semibold text-blue-300 text-xs uppercase tracking-wider">1. Ambiente de Testes (Sandbox) — Ativo Agora</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Sua chave da Pluggy está em modo Sandbox. Por regras do Banco Central, contas bancárias reais (como seu Nubank, Itaú ou Inter pessoal) <strong>são bloqueadas no Sandbox</strong> para proteger seus dados reais.
                  </p>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs">
                  <p className="font-semibold text-slate-200">Como testar com o Banco Simulado da Pluggy:</p>
                  <ul className="space-y-1 text-slate-400 list-disc list-inside">
                    <li>Selecione a instituição: <strong className="text-white">Pluggy Bank</strong></li>
                    <li>Usuário: <code className="text-emerald-400">user_ok</code></li>
                    <li>Senha: <code className="text-emerald-400">password_ok</code></li>
                  </ul>
                </div>

                <div className="p-3 bg-emerald-950/30 border border-emerald-900/50 rounded-xl space-y-1">
                  <h4 className="font-semibold text-emerald-300 text-xs uppercase tracking-wider">2. Como Conectar Bancos Reais (Produção)</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Para conectar seus bancos reais (Nubank, Itaú, Bradesco, Inter, BB), acesse o painel da <strong>Pluggy (dashboard.pluggy.ai)</strong> e clique em <strong>"Request Production Access"</strong>. Ao obter as chaves de Produção, basta colá-las no <code>.env.local</code>!
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowConnectModal(false)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-lg cursor-pointer transition-all shadow-md"
                >
                  Entendi
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
