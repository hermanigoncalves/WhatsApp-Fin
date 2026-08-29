import { Card, CardContent, CardHeader, CardTitle, Badge } from '../components/ui';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import { useStore } from '../store/useStore';
import { formatCurrency } from '../utils/formatters';

const COLORS = ['#16A34A', '#2563EB', '#F59E0B', '#8B5CF6', '#EF4444', '#EC4899', '#14B8A6'];

export default function Reports() {
  const { transactions, categories, accounts } = useStore();


  // Build monthly data from transactions
  const monthlyMap = new Map<string, { income: number; expense: number }>();
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  transactions.forEach(tx => {
    const d = new Date(tx.date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!monthlyMap.has(key)) {
      monthlyMap.set(key, { income: 0, expense: 0 });
    }
    const entry = monthlyMap.get(key)!;
    if (tx.type === 'income') entry.income += tx.amount;
    else entry.expense += tx.amount;
  });

  // Sort by date key and convert to array
  const cashFlowData = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, data]) => {
      const month = parseInt(key.split('-')[1]);
      return { name: monthNames[month], ...data };
    });

  // If no data, provide a placeholder
  const chartData = cashFlowData.length > 0 ? cashFlowData : [
    { name: 'Atual', income: 0, expense: 0 }
  ];

  // Build category breakdown from expense transactions
  const categoryMap = new Map<string, number>();
  transactions
    .filter(t => t.type === 'expense')
    .forEach(tx => {
      const cat = categories.find(c => c.id === tx.categoryId);
      const name = cat?.name || 'Outros';
      categoryMap.set(name, (categoryMap.get(name) || 0) + tx.amount);
    });

  const categoryData = Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value }));

  // Build account balance data
  const accountData = accounts.map(acc => ({
    name: acc.name,
    balance: acc.balance
  }));

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">Análises e Relatórios</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Relatórios visuais detalhados da sua saúde financeira.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500"></span>
              <span className="text-slate-600 dark:text-slate-400">Receitas: <strong className="text-green-600">{formatCurrency(totalIncome)}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500"></span>
              <span className="text-slate-600 dark:text-slate-400">Despesas: <strong className="text-red-500">{formatCurrency(totalExpenses)}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chart - Line */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Receitas vs Despesas</CardTitle>
            <p className="text-sm text-slate-500 mt-1">Visão geral do fluxo de caixa ao longo do tempo</p>
          </div>
          <Badge variant="outline" className="hidden sm:inline-flex bg-slate-50 dark:bg-slate-800">
            Mensal
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] w-full mt-4">
            {transactions.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-400">
                <div className="text-center">
                  <p className="font-medium">Sem dados de transações ainda</p>
                  <p className="text-xs mt-1">Adicione transações para ver os gráficos</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    tickFormatter={(value) => `R$${value}`}
                    dx={-10}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value) => [formatCurrency(Number(value)), '']}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                  <Line type="monotone" dataKey="income" name="Receita" stroke="#16A34A" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="expense" name="Despesa" stroke="#EF4444" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Category Pie Chart */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Despesas por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {categoryData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-400">
                  <p className="font-medium">Sem despesas registradas</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {categoryData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => formatCurrency(Number(value))}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend iconType="circle" layout="vertical" verticalAlign="middle" align="right" />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Account Balances Bar Chart */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Saldo por Conta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {accountData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-400">
                  <p className="font-medium">Sem contas cadastradas</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={accountData} margin={{ top: 20, right: 0, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      tickFormatter={(value) => `R$${value}`}
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(100, 116, 139, 0.1)' }}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value) => [formatCurrency(Number(value)), 'Saldo']}
                    />
                    <Bar dataKey="balance" fill="#16A34A" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
