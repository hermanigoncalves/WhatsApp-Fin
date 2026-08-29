import { ArrowDownRight, ArrowUpRight, ArrowDownToLine, Plus, Search, Filter, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, Button, Badge, Modal } from '../components/ui';
import { useStore, type TransactionType } from '../store/useStore';
import { useState } from 'react';
import { formatCurrency, formatDate } from '../utils/formatters';

export default function Transactions() {
  const { transactions, categories, accounts, addTransaction, deleteTransaction } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [catId, setCatId] = useState('');
  const [accId, setAccId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);


  const handleAddTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc || !amount || !catId || !accId) return;

    addTransaction({
      description: desc,
      amount: parseFloat(amount.replace(',', '.')),
      type,
      categoryId: catId,
      accountId: accId,
      date: new Date(date).toISOString()
    });

    setIsModalOpen(false);
    setDesc('');
    setAmount('');
  };

  const filteredTx = transactions.filter(tx => 
    tx.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">Transações</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Veja e filtre todo o seu histórico de atividades.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <ArrowDownToLine size={18} className="mr-2" />
            Exportar
          </Button>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus size={18} className="mr-2" />
            Novo Registro
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Buscar por descrição ou categoria..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto">
                <Filter size={18} className="mr-2" />
                Filtros
              </Button>
              <select className="border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-green-500/50 shadow-sm appearance-none min-w-[120px]">
                <option>Todo Período</option>
                <option>Este Mês</option>
                <option>Esta Semana</option>
                <option>Hoje</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4 font-medium">Transação</th>
                  <th className="px-6 py-4 font-medium">Categoria</th>
                  <th className="px-6 py-4 font-medium">Conta / Método</th>
                  <th className="px-6 py-4 font-medium">Data</th>
                  <th className="px-6 py-4 font-medium text-right">Valor</th>
                  <th className="px-6 py-4 font-medium text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredTx.map((tx) => {
                  const cat = categories.find(c => c.id === tx.categoryId);
                  const acc = accounts.find(a => a.id === tx.accountId);
                  return (
                  <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          tx.type === 'income' 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                            : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                          {tx.type === 'income' ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
                        </div>
                        <span className="font-medium text-slate-900 dark:text-white">{tx.description}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline">{cat?.name || 'Geral'}</Badge>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                      {acc?.name || 'Desconhecida'}
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                      {formatDate(tx.date)}
                    </td>
                    <td className={`px-6 py-4 text-right font-medium ${
                      tx.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-slate-900 dark:text-slate-100'
                    }`}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => deleteTransaction(tx.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nova Transação">
        <form onSubmit={handleAddTx} className="space-y-4">
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
              placeholder="Ex: Almoço Cliente"
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
            <Button type="submit" className="w-full">Adicionar Lançamento</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
