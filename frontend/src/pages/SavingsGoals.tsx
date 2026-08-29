import React, { useState } from 'react';
import { Target, Plus, CheckCircle2, TrendingUp, AlertCircle, Edit2, Trash2 } from 'lucide-react';
import { useStore, type SavingsGoal } from '../store/useStore';
import { useAuth } from '../hooks/useAuth';
import { db } from '../lib/supabaseService';
import { Button, Card, Modal } from '../components/ui';

export default function SavingsGoals() {
  const { user } = useAuth();
  const { savingsGoals } = useStore();
  
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);

  const totalSaved = savingsGoals.reduce((acc, goal) => acc + goal.currentAmount, 0);
  const totalTarget = savingsGoals.reduce((acc, goal) => acc + goal.targetAmount, 0);
  const globalProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  const handleCreateOrUpdateGoal = async (data: Omit<SavingsGoal, 'id' | 'currentAmount' | 'status'> & { id?: string }) => {
    if (!user) return;
    
    try {
      if (data.id) {
        useStore.getState().updateSavingsGoal(data.id, data);
        await db.upsertSavingsGoal(user.id, { 
          ...useStore.getState().savingsGoals.find(g => g.id === data.id)!, 
          ...data 
        });
      } else {
        const tempId = crypto.randomUUID();
        const newGoal: SavingsGoal = {
          ...data,
          id: tempId,
          currentAmount: 0,
          status: 'active'
        };
        useStore.getState().addSavingsGoal(newGoal);
        await db.upsertSavingsGoal(user.id, newGoal);
      }
      setIsGoalModalOpen(false);
      setSelectedGoal(null);
    } catch (error) {
      console.error('Error saving goal:', error);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (!user || !window.confirm('Tem certeza que deseja excluir este objetivo?')) return;
    try {
      useStore.getState().deleteSavingsGoal(id);
      await db.deleteSavingsGoal(id);
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  const handleDeposit = async (data: { amount: number; note: string; date: string }) => {
    if (!user || !selectedGoal) return;
    try {
      const contribution = { ...data, goalId: selectedGoal.id };
      useStore.getState().addSavingsContribution(contribution);
      await db.insertSavingsContribution(user.id, { ...contribution, id: crypto.randomUUID() });
      setIsDepositModalOpen(false);
      setSelectedGoal(null);
    } catch (error) {
      console.error('Error making deposit:', error);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Objetivos</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Acompanhe suas metas de economia</p>
        </div>
        <Button 
          onClick={() => { setSelectedGoal(null); setIsGoalModalOpen(true); }}
          className="w-full sm:w-auto flex items-center gap-2"
        >
          <Plus size={20} />
          Novo Objetivo
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0">
          <div className="p-6">
            <p className="text-green-50 text-sm font-medium mb-1">Total Guardado</p>
            <h3 className="text-3xl font-bold mb-4">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalSaved)}
            </h3>
            <div className="flex items-center gap-2 text-sm text-green-100 bg-white/20 rounded-full px-3 py-1 w-fit">
              <TrendingUp size={16} />
              <span>De {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalTarget)}</span>
            </div>
          </div>
        </Card>

        <Card className="md:col-span-2 p-6 flex flex-col justify-center">
          <div className="flex justify-between items-end mb-2">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Progresso Geral</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{globalProgress.toFixed(1)}%</p>
            </div>
          </div>
          <div className="w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 transition-all duration-500 rounded-full"
              style={{ width: `${Math.min(globalProgress, 100)}%` }}
            />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {savingsGoals.length > 0 ? savingsGoals.map((goal) => {
          const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
          
          return (
            <Card key={goal.id} className="p-5 flex flex-col relative group">
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setSelectedGoal(goal); setIsGoalModalOpen(true); }} className="text-slate-400 hover:text-blue-500 p-1">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => handleDeleteGoal(goal.id)} className="text-slate-400 hover:text-red-500 p-1">
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm ${goal.color}`}>
                  {goal.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">{goal.name}</h3>
                  {goal.deadline && (
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Prazo: {new Intl.DateTimeFormat('pt-BR').format(new Date(goal.deadline))}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-auto space-y-4">
                <div>
                  <div className="flex justify-between text-sm font-medium mb-1">
                    <span className="text-green-600 dark:text-green-400">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(goal.currentAmount)}
                    </span>
                    <span className="text-slate-500">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(goal.targetAmount)}
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 rounded-full ${goal.color}`}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-right mt-1 text-slate-500 dark:text-slate-400 font-medium">
                    {progress.toFixed(1)}% concluído
                  </p>
                </div>

                <Button 
                  onClick={() => { setSelectedGoal(goal); setIsDepositModalOpen(true); }}
                  className="w-full"
                  variant="outline"
                >
                  Depositar
                </Button>
              </div>
            </Card>
          );
        }) : (
          <div className="col-span-full">
            <div className="text-center p-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/50">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                <Target size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Nenhum objetivo definido</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-6">Comece criando o seu primeiro objetivo para acompanhar sua poupança.</p>
              <Button onClick={() => { setSelectedGoal(null); setIsGoalModalOpen(true); }}>
                Criar Objetivo
              </Button>
            </div>
          </div>
        )}
      </div>

      <GoalModal 
        isOpen={isGoalModalOpen} 
        onClose={() => { setIsGoalModalOpen(false); setSelectedGoal(null); }} 
        onSave={handleCreateOrUpdateGoal}
        goal={selectedGoal}
      />
      
      <DepositModal
        isOpen={isDepositModalOpen}
        onClose={() => { setIsDepositModalOpen(false); setSelectedGoal(null); }}
        onSave={handleDeposit}
        goal={selectedGoal}
      />
    </div>
  );
}

// Modals Components

const ICONS = ['🎯', '🚗', '🏠', '✈️', '💻', '🎓', '💍', '🎮', '📱', '🚲', '💰', '🏖️'];
const COLORS = [
  { id: 'bg-blue-500 text-white', hex: '#3b82f6', name: 'Azul' },
  { id: 'bg-emerald-500 text-white', hex: '#10b981', name: 'Verde' },
  { id: 'bg-indigo-500 text-white', hex: '#6366f1', name: 'Anil' },
  { id: 'bg-rose-500 text-white', hex: '#f43f5e', name: 'Rosa' },
  { id: 'bg-amber-500 text-white', hex: '#f59e0b', name: 'Laranja' },
  { id: 'bg-slate-800 text-white', hex: '#1e293b', name: 'Preto' },
];

function GoalModal({ isOpen, onClose, onSave, goal }: any) {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [icon, setIcon] = useState('🎯');
  const [color, setColor] = useState('bg-blue-500 text-white');
  const [deadline, setDeadline] = useState('');

  React.useEffect(() => {
    if (goal && isOpen) {
      setName(goal.name);
      setTargetAmount(goal.targetAmount.toString());
      setIcon(goal.icon);
      setColor(goal.color);
      setDeadline(goal.deadline ? new Date(goal.deadline).toISOString().split('T')[0] : '');
    } else if (isOpen) {
      setName('');
      setTargetAmount('');
      setIcon('🎯');
      setColor('bg-blue-500 text-white');
      setDeadline('');
    }
  }, [goal, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...(goal ? { id: goal.id } : {}),
      name,
      targetAmount: Number(targetAmount),
      icon,
      color,
      deadline: deadline || undefined
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={goal ? "Editar Objetivo" : "Novo Objetivo"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Nome da Meta</label>
          <input required autoFocus type="text" placeholder="Ex: Viagem para o Japão" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-green-500 outline-none" />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Valor Alvo</label>
          <input required type="number" step="0.01" min="0" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-green-500 outline-none" />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Data Limite (Opcional)</label>
          <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-green-500 outline-none" />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Ícone</label>
          <div className="flex gap-2 flex-wrap">
            {ICONS.map((i) => (
              <button key={i} type="button" onClick={() => setIcon(i)} className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${icon === i ? 'bg-slate-200 dark:bg-slate-700 ring-2 ring-green-500' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                {i}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Cor Tema</label>
          <div className="flex gap-3">
            {COLORS.map((c) => (
              <button key={c.id} type="button" onClick={() => setColor(c.id)} className={`w-8 h-8 rounded-full shadow-sm transition-all flex items-center justify-center ${color === c.id ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 ring-green-500 scale-110' : 'hover:scale-110'}`} style={{ backgroundColor: c.hex }}>
                {color === c.id && <CheckCircle2 size={16} className="text-white" />}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit">Salvar</Button>
        </div>
      </form>
    </Modal>
  );
}

function DepositModal({ isOpen, onClose, onSave, goal }: any) {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setNote('');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      amount: Number(amount),
      date,
      note: note || undefined
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Contribuir para: ${goal?.name || ''}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 p-3 rounded-lg flex gap-3 text-sm mb-4">
          <AlertCircle size={20} className="shrink-0" />
          <p>O valor depositado aqui não será descontado do saldo de suas contas. É apenas um controle visual.</p>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Valor R$</label>
          <input required autoFocus type="number" step="0.01" min="0" placeholder="R$ 0,00" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-green-500 outline-none" />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Data</label>
          <input required type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-green-500 outline-none" />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Anotação (Opcional)</label>
          <input type="text" placeholder="Ex: Bônus salarial" value={note} onChange={(e) => setNote(e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-green-500 outline-none" />
        </div>
        
        <div className="pt-4 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit">Adicionar Fundos</Button>
        </div>
      </form>
    </Modal>
  );
}
