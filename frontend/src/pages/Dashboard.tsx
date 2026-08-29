import { ArrowDownRight, ArrowUpRight, TrendingUp, Wallet, ArrowRight, Plus, AlertTriangle, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Modal } from '../components/ui';
import { Link } from 'react-router-dom';
import { BarChart3 } from 'lucide-react';
import { useStore, type TransactionType } from '../store/useStore';
import { useState } from 'react';
import { formatCurrency } from '../utils/formatters';

export default function Dashboard() {
  const { accounts, transactions, categories, addTransaction, budgets, userSettings, savingsGoals } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [catId, setCatId] = useState('');
  const [accId, setAccId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);


  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc || !amount || !catId || !accId || !date) return;

    addTransaction({
      description: desc,
      amount: parseFloat(amount.replace(',', '.')),
      type,
      categoryId: catId,
      accountId: accId,
      date: new Date(date).toISOString(),
    });

    setIsModalOpen(false);
    setDesc('');
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
  };

  // Calculate real summary data
  const totalBalance = accounts.reduce((acc, a) => acc + a.balance, 0);
  const monthlyIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);
  const monthlyExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);
  const cashFlow = monthlyIncome - monthlyExpenses;

  const summaryData = [
    {
      title: 'Saldo Total',
      value: formatCurrency(totalBalance),
      trend: '+12%',
      trendUp: true,
      icon: Wallet,
      color: 'text-slate-900 dark:text-white',
    },
    {
      title: 'Receita Mensal',
      value: formatCurrency(monthlyIncome),
      trend: '+4%',
      trendUp: true,
      icon: ArrowUpRight,
      color: 'text-green-600 dark:text-green-400',
    },
    {
      title: 'Despesas Mensais',
      value: formatCurrency(monthlyExpenses),
      trend: '-2%',
      trendUp: false,
      icon: ArrowDownRight,
      color: 'text-red-500 dark:text-red-400',
    },
    {
      title: 'Fluxo de Caixa',
      value: formatCurrency(cashFlow),
      trend: cashFlow >= 0 ? '+' : '',
      trendUp: cashFlow >= 0,
      icon: TrendingUp,
      color: 'text-blue-600 dark:text-blue-400',
    },
  ];

  const recentTransactions = transactions.slice(0, 5);

  // Smart alerts
  const now = new Date();
  const monthlySpend = new Map<string, number>();
  transactions.forEach(tx => {
    if (tx.type !== 'expense') return;
    const d = new Date(tx.date);
    if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return;
    monthlySpend.set(tx.categoryId, (monthlySpend.get(tx.categoryId) ?? 0) + tx.amount);
  });

  const alerts: { type: 'warning' | 'danger'; message: string }[] = [];
  if (userSettings.notifyLowBalance) {
    accounts.forEach(acc => {
      if (acc.balance < userSettings.lowBalanceThreshold)
        alerts.push({ type: 'danger', message: `Saldo baixo em ${acc.name}: ${formatCurrency(acc.balance)} (limite: ${formatCurrency(userSettings.lowBalanceThreshold)})` });
    });
  }
  if (userSettings.notifyBudgetAlert) {
    budgets.forEach(b => {
      const spent = monthlySpend.get(b.categoryId) ?? 0;
      const pct = (spent / b.monthlyLimit) * 100;
      const cat = categories.find(c => c.id === b.categoryId);
      const threshold = userSettings.budgetAlertPercentage;
      if (pct >= 100) alerts.push({ type: 'danger', message: `Orçamento de ${cat?.name} estourou! (${formatCurrency(spent)} / ${formatCurrency(b.monthlyLimit)})` });
      else if (pct >= threshold) alerts.push({ type: 'warning', message: `${cat?.name}: ${pct.toFixed(0)}% do orçamento (alerta a partir de ${threshold}%)` });
    });
  }

  const formatDate = (isoDate: string) => {
    const d = new Date(isoDate);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return `Hoje, ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    if (d.toDateString() === yesterday.toDateString()) return `Ontem, ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Aqui está seu resumo financeiro deste mês.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/reports">
            <Button variant="outline" className="hidden sm:inline-flex">
              Baixar Relatório
            </Button>
          </Link>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus size={18} className="mr-2" />
            Nova Transação
          </Button>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {summaryData.map((item) => (
          <Card key={item.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b-0 space-y-0">
              <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {item.title}
              </CardTitle>
              <div className={`p-2 bg-slate-100 dark:bg-slate-800 rounded-lg ${item.color}`}>
                <item.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{item.value}</div>
              <p className="text-xs mt-2 flex items-center font-medium">
                <span className={item.trendUp ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                  {item.trend}
                </span>
                <span className="text-slate-500 ml-2">em relação ao mês passado</span>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, i) => (
            <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
              alert.type === 'danger'
                ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-800/40'
                : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-800/40'
            }`}>
              <AlertTriangle size={16} className="shrink-0" />
              {alert.message}
            </div>
          ))}
        </div>
      )}


      {/* Savings Goals Widget */}
      {savingsGoals.length > 0 && (
        <Card className="hover:shadow-md transition-shadow bg-slate-900 text-white border-0">
          <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-6 justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center text-green-400">
                <Target size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold">Objetivos Financeiros</h3>
                <p className="text-slate-400 text-sm">
                  {savingsGoals.filter(g => g.status === 'active').length} metas ativas • {formatCurrency(savingsGoals.reduce((acc, g) => acc + g.currentAmount, 0))} guardados
                </p>
              </div>
            </div>
            <Link to="/goals">
              <Button variant="outline" className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-white">
                Ver Detalhes
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <Card className="min-h-[400px] flex flex-col hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Histórico de Fluxo de Caixa</CardTitle>
            <p className="text-sm text-slate-500 dark:text-slate-400">Receitas vs Despesas nos últimos 30 dias.</p>
          </CardHeader>
          <CardContent className="flex-1 flex items-center justify-center border-t border-slate-100 dark:border-slate-800 m-6 mt-0 rounded-xl bg-slate-50 dark:bg-slate-900/50 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-tr from-green-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="text-center text-slate-400">
              <BarChart3 size={48} className="mx-auto mb-4 opacity-20" />
              <p className="font-medium">Carregando visualização do gráfico...</p>
              <p className="text-xs mt-1">Verifique a aba de Relatórios para análises detalhadas.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <CardTitle>Atividade Recente</CardTitle>
            <Link to="/transactions" className="text-sm text-green-600 hover:text-green-700 dark:text-green-400 font-medium flex items-center group">
              Ver tudo 
              <ArrowRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentTransactions.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <p className="font-medium">Nenhuma transação ainda</p>
                  <p className="text-xs mt-1">Clique em "Nova Transação" para começar.</p>
                </div>
              ) : (
                recentTransactions.map((tx) => {
                  const acc = accounts.find(a => a.id === tx.accountId);
                  return (
                    <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                          tx.type === 'income' 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                            : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                          {tx.type === 'income' ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white leading-tight">{tx.description}</p>
                          <p className="text-xs text-slate-500 mt-1">{acc?.name || 'Desconhecida'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${
                          tx.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-slate-900 dark:text-slate-100'
                        }`}>
                          {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">{formatDate(tx.date)}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal - Nova Transação */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nova Transação">
        <form onSubmit={handleAddTransaction} className="space-y-4">
          <div className="grid grid-cols-2 gap-4 mb-2">
            <button 
              type="button" 
              onClick={() => setType('expense')}
              className={`py-2 rounded-lg border ${type === 'expense' ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 font-medium' : 'border-slate-200 dark:border-slate-800 text-slate-500'}`}
            >
              Despesa
            </button>
            <button 
              type="button"
              onClick={() => setType('income')}
              className={`py-2 rounded-lg border ${type === 'income' ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-medium' : 'border-slate-200 dark:border-slate-800 text-slate-500'}`}
            >
              Receita
            </button>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Descrição</label>
            <input 
              required
              type="text" 
              placeholder="Ex: Almoço no restaurante"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-green-500 outline-none" 
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Valor (R$)</label>
              <input 
                required
                type="number" 
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-green-500 outline-none" 
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Data</label>
              <input 
                required
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-green-500 outline-none" 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Categoria</label>
              <select 
                required
                value={catId}
                onChange={(e) => setCatId(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-green-500 outline-none"
              >
                <option value="" disabled>Selecione...</option>
                {categories.filter(c => c.type === type).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Conta</label>
              <select 
                required
                value={accId}
                onChange={(e) => setAccId(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-green-500 outline-none"
              >
                <option value="" disabled>Selecione...</option>
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
            <Button type="button" variant="outline" className="w-full" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit" className="w-full">Adicionar Transação</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
