import { Plus, TrendingUp, MoreVertical, Trash2, Pencil, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Modal } from '../components/ui';
import { useStore, type AccountType } from '../store/useStore';
import { useState, useRef, useEffect } from 'react';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useAuth } from '../hooks/useAuth';
import { db } from '../lib/supabaseService';
import { v4 as uuidv4 } from 'uuid';

export default function Accounts() {
  const { accounts, transactions, addAccount, updateAccount, deleteAccount } = useStore();
  const { user } = useAuth();

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccId, setEditingAccId] = useState<string | null>(null);
  const [statementAccId, setStatementAccId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // New account form
  const [newAccName, setNewAccName] = useState('');
  const [newAccType, setNewAccType] = useState<AccountType>('Conta Corrente');
  const [newAccBalance, setNewAccBalance] = useState('');

  // Edit account form
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<AccountType>('Conta Corrente');
  const [editBalance, setEditBalance] = useState('');

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccName || !newAccBalance) return;
    
    const newAccount = {
      id: uuidv4(),
      name: newAccName,
      type: newAccType,
      balance: parseFloat(newAccBalance.replace(',', '.')),
      color: 'bg-green-600',
    };
    
    // Salva local (Zustand)
    addAccount(newAccount);
    
    // Salva na nuvem (Supabase) se tiver logado
    if (user) {
      await db.upsertAccount(user.id, newAccount);
    }

    setIsModalOpen(false);
    setNewAccName('');
    setNewAccBalance('');
    setNewAccType('Conta Corrente');
  };

  const openEditModal = (id: string) => {
    const acc = accounts.find(a => a.id === id);
    if (!acc) return;
    setEditName(acc.name);
    setEditType(acc.type);
    setEditBalance(String(acc.balance));
    setEditingAccId(id);
    setOpenMenuId(null);
  };

  const handleEditAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccId || !editName || !editBalance) return;
    
    const updates = {
      name: editName,
      type: editType,
      balance: parseFloat(editBalance.replace(',', '.')),
    };

    updateAccount(editingAccId, updates);
    
    if (user) {
      const acc = accounts.find(a => a.id === editingAccId);
      if (acc) {
        await db.upsertAccount(user.id, { ...acc, ...updates });
      }
    }

    setEditingAccId(null);
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir a conta "${name}"? Todas as transações associadas também serão removidas.`)) {
      deleteAccount(id);
      setOpenMenuId(null);
      if (user) {
        await db.deleteAccount(id);
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">Contas e Carteiras</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Gerencie suas contas bancárias e verifique seus saldos.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus size={18} className="mr-2" />
          Nova Conta
        </Button>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {accounts.map((acc) => (
          <Card key={acc.id} className="group hover:-translate-y-1 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/10 dark:hover:shadow-green-900/20 overflow-hidden relative">
            <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl rounded-full opacity-20 -mr-10 -mt-10 transition-opacity group-hover:opacity-40 ${acc.color}`} />

            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div className="flex items-center gap-3 relative z-10">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold shadow-md ${acc.color}`}>
                  {acc.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <CardTitle className="text-lg">{acc.name}</CardTitle>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{acc.type}</p>
                </div>
              </div>

              <div className="relative z-10" ref={openMenuId === acc.id ? menuRef : undefined}>
                <button
                  onClick={() => setOpenMenuId(openMenuId === acc.id ? null : acc.id)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1"
                >
                  <MoreVertical size={20} />
                </button>
                {openMenuId === acc.id && (
                  <div className="absolute right-0 top-8 w-44 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-200">
                    <button
                      onClick={() => openEditModal(acc.id)}
                      className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Pencil size={15} />
                      Editar
                    </button>
                    <div className="mx-3 border-t border-slate-100 dark:border-slate-800" />
                    <button
                      onClick={() => handleDelete(acc.id, acc.name)}
                      className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <Trash2 size={15} />
                      Excluir
                    </button>
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="mt-6 relative z-10">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Saldo Atual</p>
              <div className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                {formatCurrency(acc.balance)}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-sm">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <TrendingUp size={14} className="text-green-500" />
                  Ativa
                </span>
                <button
                  onClick={() => setStatementAccId(acc.id)}
                  className="text-green-600 dark:text-green-400 font-medium hover:underline"
                >
                  Ver Extrato
                </button>
              </div>
            </CardContent>
          </Card>
        ))}

        <button onClick={() => setIsModalOpen(true)} className="flex flex-col items-center justify-center min-h-[220px] rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-green-500/50 dark:hover:border-green-500/50 transition-all duration-300 group cursor-pointer focus:outline-none focus:ring-4 focus:ring-green-500/20">
          <div className="w-14 h-14 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 group-hover:text-green-500 group-hover:scale-110 transition-all duration-300 mb-4">
            <Plus size={24} />
          </div>
          <span className="text-base font-semibold text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
            Conectar Banco
          </span>
          <span className="text-sm text-slate-500 mt-1 max-w-[200px] text-center">
            Vincule seu banco ou adicione uma carteira manual
          </span>
        </button>
      </div>

      {/* New Account Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nova Conta ou Carteira">
        <form onSubmit={handleAddAccount} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Nome do Banco/Carteira</label>
            <input
              required type="text" placeholder="Ex: Banco Itaú"
              value={newAccName} onChange={(e) => setNewAccName(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Tipo de Conta</label>
            <select value={newAccType} onChange={(e) => setNewAccType(e.target.value as AccountType)}
              className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-green-500 outline-none">
              <option value="Conta Corrente">Conta Corrente</option>
              <option value="Conta Poupança">Conta Poupança</option>
              <option value="Conta PJ">Conta PJ</option>
              <option value="Cartão de Crédito">Cartão de Crédito</option>
              <option value="Dinheiro">Dinheiro Físico</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Saldo Inicial (R$)</label>
            <input
              required type="number" step="0.01" placeholder="0.00"
              value={newAccBalance} onChange={(e) => setNewAccBalance(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>
          <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
            <Button type="button" variant="outline" className="w-full" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit" className="w-full">Adicionar Conta</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Account Modal */}
      <Modal isOpen={!!editingAccId} onClose={() => setEditingAccId(null)} title="Editar Conta">
        <form onSubmit={handleEditAccount} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Nome do Banco/Carteira</label>
            <input
              required type="text" placeholder="Ex: Nubank"
              value={editName} onChange={(e) => setEditName(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Tipo de Conta</label>
            <select value={editType} onChange={(e) => setEditType(e.target.value as AccountType)}
              className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-green-500 outline-none">
              <option value="Conta Corrente">Conta Corrente</option>
              <option value="Conta Poupança">Conta Poupança</option>
              <option value="Conta PJ">Conta PJ</option>
              <option value="Cartão de Crédito">Cartão de Crédito</option>
              <option value="Dinheiro">Dinheiro Físico</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Saldo Atual (R$)</label>
            <input
              required type="number" step="0.01" placeholder="0.00"
              value={editBalance} onChange={(e) => setEditBalance(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>
          <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
            <Button type="button" variant="outline" className="w-full" onClick={() => setEditingAccId(null)}>Cancelar</Button>
            <Button type="submit" className="w-full">Salvar Alterações</Button>
          </div>
        </form>
      </Modal>

      {/* Statement Modal */}
      <Modal isOpen={!!statementAccId} onClose={() => setStatementAccId(null)} title="Extrato da Conta">
        {statementAccId && (() => {
          const acc = accounts.find(a => a.id === statementAccId);
          const accTransactions = transactions
            .filter(t => t.accountId === statementAccId)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

          return (
            <div className="space-y-6">
              <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
                <p className="text-sm text-slate-500 mb-1">Conta: <strong className="text-slate-900 dark:text-white">{acc?.name}</strong></p>
                <div className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                  {formatCurrency(acc?.balance || 0)}
                </div>
                <p className="text-sm text-slate-500 mt-1">Saldo atual</p>
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {accTransactions.length === 0 ? (
                  <div className="py-8 text-center text-slate-400">
                    <p className="font-medium">Nenhuma transação registrada</p>
                    <p className="text-xs mt-1">As transações desta conta aparecerão aqui.</p>
                  </div>
                ) : (
                  accTransactions.map(tx => (
                    <div key={tx.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          tx.type === 'income'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                          {tx.type === 'income' ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{tx.description}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{formatDate(tx.date)}</p>
                        </div>
                      </div>
                      <div className={`text-sm font-bold ${
                        tx.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-slate-900 dark:text-slate-100'
                      }`}>
                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
