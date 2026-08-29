import { ArrowDownRight, ArrowUpRight, Plus, Calendar, CreditCard, Play, Pause, MoreVertical, Wallet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Modal } from '../components/ui';
import { useStore, type TransactionType, type FixedFrequency } from '../store/useStore';
import { useState } from 'react';
import { formatCurrency } from '../utils/formatters';

export default function FixedTransactions() {
  const { fixedTransactions, categories, accounts, addFixedTransaction, toggleFixedStatus } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [catId, setCatId] = useState('');
  const [accId, setAccId] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [freq, setFreq] = useState<FixedFrequency>('Mensal');


  const handleAddFixedTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc || !amount || !catId || !accId || !dateStr) return;

    addFixedTransaction({
      description: desc,
      amount: parseFloat(amount.replace(',', '.')),
      type,
      categoryId: catId,
      accountId: accId,
      date: dateStr,
      frequency: freq,
      status: 'active'
    });

    setIsModalOpen(false);
    setDesc('');
    setAmount('');
    setDateStr('');
  };

  const totalExpenses = fixedTransactions
    .filter(t => t.type === 'expense' && t.status === 'active')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalIncome = fixedTransactions
    .filter(t => t.type === 'income' && t.status === 'active')
    .reduce((acc, t) => acc + t.amount, 0);
  const activeFixed = fixedTransactions.filter(t => t.status === 'active');
  const nextDueTx = activeFixed.length > 0
    ? [...activeFixed].sort((a, b) => (parseInt(a.date) || 1) - (parseInt(b.date) || 1))[0]
    : null;

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">Lançamentos Recorrentes</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Gerencie suas despesas fixas, assinaturas e rendimentos mensais.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Calendar size={18} className="mr-2" />
            Visão Geral
          </Button>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus size={18} className="mr-2" />
            Nova Recorrência
          </Button>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-3 mb-8">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Despesas Fixas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(totalExpenses)}</div>
            <p className="text-xs text-red-500 mt-1 font-medium items-center flex">
              <ArrowUpRight size={14} className="mr-1" />
              Comprometimento mensal
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Receitas Fixas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(totalIncome)}</div>
            <p className="text-xs text-green-600 mt-1 font-medium items-center flex">
              <ArrowDownRight size={14} className="mr-1" />
              Renda mensal garantida
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow bg-green-50/50 dark:bg-green-900/10 border-green-100 dark:border-green-900/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Próximo Vencimento</CardTitle>
          </CardHeader>
          <CardContent>
            {nextDueTx ? (
              <>
                <div className="text-lg font-bold text-slate-900 dark:text-white mb-1 truncate">{nextDueTx.description}</div>
                <p className="text-sm text-slate-500">
                  Dia {nextDueTx.date} • <span className={`font-semibold ${nextDueTx.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>{formatCurrency(nextDueTx.amount)}</span>
                </p>
              </>
            ) : (
              <>
                <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Nenhum agendamento</div>
                <p className="text-xs text-slate-500">Adicione uma recorrência para acompanhar.</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4 font-medium">Lançamento Fixo</th>
                  <th className="px-6 py-4 font-medium">Periodicidade</th>
                  <th className="px-6 py-4 font-medium">Conta de Débito/Crédito</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Valor</th>
                  <th className="px-6 py-4 font-medium text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {fixedTransactions.map((tx) => {
                  const cat = categories.find(c => c.id === tx.categoryId);
                  const acc = accounts.find(a => a.id === tx.accountId);
                  return (
                  <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                          tx.type === 'income' 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                            : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                          {tx.type === 'income' ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900 dark:text-white block">{tx.description}</span>
                          <span className="text-xs text-slate-500 mt-1 block">{cat?.name || 'Geral'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-700 dark:text-slate-300">{tx.date}</div>
                      <div className="text-xs text-slate-500">{tx.frequency}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        {acc?.name.includes('Cartão') ? <CreditCard size={14} /> : <Wallet size={14} className="opacity-0 hidden" />}
                        {acc?.name || 'Desconhecida'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {tx.status === 'active' ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800/50 gap-1.5 px-2.5 py-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 gap-1.5 px-2.5 py-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                          Pausado
                        </Badge>
                      )}
                    </td>
                    <td className={`px-6 py-4 text-right font-bold text-base ${
                      tx.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-slate-900 dark:text-slate-100'
                    }`}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" onClick={() => toggleFixedStatus(tx.id)} className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600">
                          {tx.status === 'active' ? <Pause size={16} /> : <Play size={16} />}
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600 ml-1">
                          <MoreVertical size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      {/* Empty State / CTA */}
      <div className="mt-8 text-center p-8 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Automatize suas Finanças</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
          Cadastre suas contas recorrentes aqui. O Assistente de IA do WhatsApp irá lançar essas transações e apenas pedir a sua confirmação para deduzir do saldo.
        </p>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus size={18} className="mr-2" />
          Cadastrar Nova Recorrência
        </Button>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nova Recorrência">
        <form onSubmit={handleAddFixedTx} className="space-y-4">
          <div className="grid grid-cols-2 gap-4 mb-2">
            <button 
              type="button" 
              onClick={() => setType('expense')}
              className={`py-2 rounded-lg border ${type === 'expense' ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 font-medium' : 'border-slate-200 dark:border-slate-800 text-slate-500'}`}
            >
              Despesa Fixa
            </button>
            <button 
              type="button"
              onClick={() => setType('income')}
              className={`py-2 rounded-lg border ${type === 'income' ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-medium' : 'border-slate-200 dark:border-slate-800 text-slate-500'}`}
            >
              Renda Fixa
            </button>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Descrição</label>
            <input 
              required
              type="text" 
              placeholder="Ex: Assinatura Netflix"
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
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Frequência</label>
              <select 
                value={freq}
                onChange={(e) => setFreq(e.target.value as FixedFrequency)}
                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-green-500 outline-none"
              >
                <option value="Mensal">Mensal</option>
                <option value="Semanal">Semanal</option>
                <option value="Anual">Anual</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Dia / Texto Referência</label>
              <input 
                required
                type="text" 
                placeholder="Ex: Todo dia 05"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-green-500 outline-none" 
              />
            </div>
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
          
          <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
            <Button type="button" variant="outline" className="w-full" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit" className="w-full">Cadastrar Recorrência</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
