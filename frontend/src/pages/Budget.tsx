import { useState } from 'react';
import { Target, Plus, Pencil, Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '../components/ui';
import { useStore } from '../store/useStore';
import { formatCurrency } from '../utils/formatters';

export default function Budget() {
  const { categories, transactions, budgets, setBudget, removeBudget } = useStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [limitInput, setLimitInput] = useState('');

  const expenseCategories = categories.filter(c => c.type === 'expense');

  // Calculate current month spending per category
  const now = new Date();
  const monthlySpend = new Map<string, number>();
  transactions.forEach(tx => {
    if (tx.type !== 'expense') return;
    const d = new Date(tx.date);
    if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return;
    monthlySpend.set(tx.categoryId, (monthlySpend.get(tx.categoryId) ?? 0) + tx.amount);
  });

  const totalBudget = budgets.reduce((s, b) => s + b.monthlyLimit, 0);
  const totalSpent  = budgets.reduce((s, b) => s + (monthlySpend.get(b.categoryId) ?? 0), 0);

  const startEdit = (catId: string) => {
    const existing = budgets.find(b => b.categoryId === catId);
    setLimitInput(existing ? String(existing.monthlyLimit) : '');
    setEditingId(catId);
  };

  const saveEdit = (catId: string) => {
    const val = parseFloat(limitInput);
    if (!isNaN(val) && val > 0) setBudget(catId, val);
    setEditingId(null);
  };

  const getStatus = (spent: number, limit: number | undefined) => {
    if (!limit) return 'none';
    const pct = (spent / limit) * 100;
    if (pct >= 100) return 'over';
    if (pct >= 80) return 'warning';
    return 'ok';
  };

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">Orçamento Mensal</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Defina limites por categoria e acompanhe seus gastos.</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500 mb-1">Total Orçado</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(totalBudget)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500 mb-1">Total Gasto (mês)</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(totalSpent)}</p>
          </CardContent>
        </Card>
        <Card className={totalSpent > totalBudget && totalBudget > 0 ? 'border-red-200 dark:border-red-900/40' : 'border-green-200 dark:border-green-900/40'}>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500 mb-1">Disponível</p>
            <p className={`text-2xl font-bold ${totalSpent > totalBudget && totalBudget > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(Math.max(0, totalBudget - totalSpent))}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Category budget cards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target size={18} className="text-green-500" />
            Categorias de Despesa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {expenseCategories.map(cat => {
            const spent  = monthlySpend.get(cat.id) ?? 0;
            const budget = budgets.find(b => b.categoryId === cat.id);
            const limit  = budget?.monthlyLimit;
            const pct    = limit ? Math.min((spent / limit) * 100, 100) : 0;
            const status = getStatus(spent, limit);
            const isEditing = editingId === cat.id;

            return (
              <div key={cat.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${cat.color}`} />
                    <span className="font-medium text-slate-900 dark:text-white">{cat.name}</span>
                    {status === 'over' && <Badge variant="danger">Estourou!</Badge>}
                    {status === 'warning' && <Badge variant="warning">Atenção!</Badge>}
                  </div>

                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-500">R$</span>
                      <input
                        type="number" min="0" step="1" autoFocus
                        value={limitInput} onChange={e => setLimitInput(e.target.value)}
                        className="w-28 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                      />
                      <button onClick={() => saveEdit(cat.id)} className="p-1.5 rounded-lg bg-green-500 text-white hover:bg-green-600">
                        <Check size={14} />
                      </button>
                      <button onClick={() => setEditingId(null)} className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      {limit ? (
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {formatCurrency(spent)} / {formatCurrency(limit)}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-400 italic">Sem limite</span>
                      )}
                      <button onClick={() => startEdit(cat.id)} className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600">
                        <Pencil size={14} />
                      </button>
                      {limit && (
                        <button onClick={() => removeBudget(cat.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 hover:text-red-500">
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {limit ? (
                  <div>
                    <div className="h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          status === 'over' ? 'bg-red-500' : status === 'warning' ? 'bg-amber-400' : 'bg-green-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{pct.toFixed(0)}% do limite utilizado</p>
                  </div>
                ) : (
                  <button onClick={() => startEdit(cat.id)} className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1 hover:underline">
                    <Plus size={12} /> Definir limite
                  </button>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
