import { useState } from 'react';
import { Plus, TrendingUp, TrendingDown, Trash2, Pencil, PieChart } from 'lucide-react';
import { PieChart as RePieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, Button, Modal } from '../components/ui';
import { useStore, type InvestmentType } from '../store/useStore';
import { formatCurrency } from '../utils/formatters';

const INVESTMENT_COLORS: Record<InvestmentType, string> = {
  'Ações':         '#3B82F6',
  'FII':           '#F59E0B',
  'Tesouro Direto':'#10B981',
  'CDB/LCI/LCA':  '#8B5CF6',
  'Cripto':        '#F97316',
  'Outros':        '#64748B',
};

const INVESTMENT_BG: Record<InvestmentType, string> = {
  'Ações':         'bg-blue-500',
  'FII':           'bg-amber-500',
  'Tesouro Direto':'bg-emerald-500',
  'CDB/LCI/LCA':  'bg-violet-500',
  'Cripto':        'bg-orange-400',
  'Outros':        'bg-slate-500',
};

export default function Investments() {
  const { investments, addInvestment, updateInvestment, deleteInvestment } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [type, setType] = useState<InvestmentType>('Ações');
  const [ticker, setTicker] = useState('');
  const [amountInvested, setAmountInvested] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);

  const resetForm = () => {
    setName(''); setType('Ações'); setTicker('');
    setAmountInvested(''); setCurrentValue('');
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    setEditingId(null);
  };

  const openAdd = () => { resetForm(); setIsModalOpen(true); };

  const openEdit = (id: string) => {
    const inv = investments.find(i => i.id === id);
    if (!inv) return;
    setName(inv.name);
    setType(inv.type);
    setTicker(inv.ticker ?? '');
    setAmountInvested(String(inv.amountInvested));
    setCurrentValue(String(inv.currentValue));
    setPurchaseDate(inv.purchaseDate);
    setEditingId(id);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name, type, ticker: ticker || undefined,
      amountInvested: parseFloat(amountInvested),
      currentValue: parseFloat(currentValue),
      purchaseDate,
      color: INVESTMENT_BG[type],
    };
    if (editingId) {
      updateInvestment(editingId, payload);
    } else {
      addInvestment(payload);
    }
    setIsModalOpen(false);
    resetForm();
  };

  const handleDelete = (id: string, invName: string) => {
    if (window.confirm(`Excluir investimento "${invName}"?`)) deleteInvestment(id);
  };

  // Summary calculations
  const totalInvested = investments.reduce((s, i) => s + i.amountInvested, 0);
  const totalCurrent  = investments.reduce((s, i) => s + i.currentValue, 0);
  const totalReturn   = totalCurrent - totalInvested;
  const returnPct     = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

  // Allocation chart data
  const allocationMap = new Map<InvestmentType, number>();
  investments.forEach(inv => {
    allocationMap.set(inv.type, (allocationMap.get(inv.type) ?? 0) + inv.currentValue);
  });
  const pieData = Array.from(allocationMap.entries()).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">Investimentos</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Acompanhe sua carteira e rentabilidade.</p>
        </div>
        <Button onClick={openAdd}>
          <Plus size={18} className="mr-2" />
          Novo Investimento
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500 mb-1">Total Investido</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(totalInvested)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500 mb-1">Valor Atual</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(totalCurrent)}</p>
          </CardContent>
        </Card>
        <Card className={totalReturn >= 0 ? 'border-green-200 dark:border-green-900/40' : 'border-red-200 dark:border-red-900/40'}>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500 mb-1">Rentabilidade Total</p>
            <div className="flex items-center gap-2">
              {totalReturn >= 0
                ? <TrendingUp size={20} className="text-green-500 shrink-0" />
                : <TrendingDown size={20} className="text-red-500 shrink-0" />
              }
              <p className={`text-2xl font-bold ${totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalReturn >= 0 ? '+' : ''}{formatCurrency(totalReturn)}
              </p>
              <span className={`text-sm font-medium ${totalReturn >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                ({returnPct >= 0 ? '+' : ''}{returnPct.toFixed(2)}%)
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart + Portfolio */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Pie chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart size={18} className="text-green-500" />
              Alocação por Classe
            </CardTitle>
          </CardHeader>
          <CardContent>
            {investments.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-slate-400 text-sm">Nenhum investimento cadastrado</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <RePieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={3} dataKey="value">
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={INVESTMENT_COLORS[entry.name as InvestmentType]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [formatCurrency(Number(v)), '']} />
                  <Legend />
                </RePieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Portfolio List */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Carteira</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {investments.length === 0 ? (
              <div className="py-10 text-center text-slate-400">
                <p className="font-medium">Nenhum investimento</p>
                <p className="text-xs mt-1">Clique em "Novo Investimento" para começar</p>
              </div>
            ) : (
              investments.map(inv => {
                const ret = inv.currentValue - inv.amountInvested;
                const pct = inv.amountInvested > 0 ? (ret / inv.amountInvested) * 100 : 0;
                const allocPct = totalCurrent > 0 ? (inv.currentValue / totalCurrent) * 100 : 0;
                return (
                  <div key={inv.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between gap-3 group">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0 ${inv.color}`}>
                        {inv.ticker ? inv.ticker.substring(0, 3) : inv.type.substring(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-white truncate">{inv.name}</p>
                        <p className="text-xs text-slate-500">{inv.type} · {allocPct.toFixed(1)}% da carteira</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-slate-900 dark:text-white">{formatCurrency(inv.currentValue)}</p>
                      <p className={`text-xs font-medium ${ret >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {ret >= 0 ? '+' : ''}{formatCurrency(ret)} ({pct >= 0 ? '+' : ''}{pct.toFixed(1)}%)
                      </p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button onClick={() => openEdit(inv.id)} className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDelete(inv.id, inv.name)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); resetForm(); }} title={editingId ? 'Editar Investimento' : 'Novo Investimento'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Nome</label>
              <input required type="text" placeholder="Ex: PETR4 / Bitcoin / Tesouro IPCA+" value={name} onChange={e => setName(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-green-500 outline-none" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Classe</label>
              <select value={type} onChange={e => setType(e.target.value as InvestmentType)}
                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-green-500 outline-none">
                <option>Ações</option>
                <option>FII</option>
                <option>Tesouro Direto</option>
                <option>CDB/LCI/LCA</option>
                <option>Cripto</option>
                <option>Outros</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Ticker (opcional)</label>
              <input type="text" placeholder="Ex: PETR4, BTC" value={ticker} onChange={e => setTicker(e.target.value.toUpperCase())}
                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-green-500 outline-none" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Valor Investido (R$)</label>
              <input required type="number" step="0.01" min="0" placeholder="0.00" value={amountInvested} onChange={e => setAmountInvested(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-green-500 outline-none" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Valor Atual (R$)</label>
              <input required type="number" step="0.01" min="0" placeholder="0.00" value={currentValue} onChange={e => setCurrentValue(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-green-500 outline-none" />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Data de Compra</label>
              <input required type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-green-500 outline-none" />
            </div>
          </div>
          <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" className="w-full" onClick={() => { setIsModalOpen(false); resetForm(); }}>Cancelar</Button>
            <Button type="submit" className="w-full">{editingId ? 'Salvar' : 'Adicionar'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
