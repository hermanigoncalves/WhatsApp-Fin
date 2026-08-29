import { useState } from 'react';
import { Plus, Trash2, Pencil, CreditCard as CreditCardIcon, Calendar, AlertCircle } from 'lucide-react';
import { Card, CardContent, Button, Modal } from '../components/ui';
import { useStore, type CreditCard } from '../store/useStore';
import { useAuth } from '../hooks/useAuth';
import { formatCurrency } from '../utils/formatters';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../lib/supabase';

const NETWORKS = ['Visa', 'Mastercard', 'Elo', 'American Express', 'Hipercard', 'Outro'];
const CARD_COLORS = [
  { label: 'Grafite',   value: 'from-slate-700 to-slate-900'    },
  { label: 'Ouro',      value: 'from-amber-500 to-yellow-700'   },
  { label: 'Azul',      value: 'from-blue-500 to-blue-900'      },
  { label: 'Verde',     value: 'from-emerald-500 to-emerald-800' },
  { label: 'Roxo',      value: 'from-indigo-500 to-indigo-900'  },
  { label: 'Rosa',      value: 'from-pink-500 to-rose-800'      },
];

const NetworkLogo = ({ network }: { network: string }) => {
  const logos: Record<string, string> = {
    Visa: 'VISA', Mastercard: 'MC', Elo: 'ELO',
    'American Express': 'AMEX', Hipercard: 'HIPER', Outro: '●●●',
  };
  return <span className="text-white font-black text-sm tracking-widest opacity-90">{logos[network] ?? '●●●'}</span>;
};

const CardVisual = ({ card }: { card: CreditCard }) => {
  const used = card.limit - card.availableLimit;
  const pct  = Math.min((used / card.limit) * 100, 100);
  const colorClass = CARD_COLORS.find(c => c.value === card.color)?.value ?? 'from-slate-700 to-slate-900';

  return (
    <div className={`relative rounded-3xl bg-gradient-to-br ${colorClass} p-6 shadow-2xl h-52 flex flex-col justify-between overflow-hidden select-none`}>
      {/* Decorative circles */}
      <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10" />
      <div className="absolute -right-4 top-12 w-24 h-24 rounded-full bg-white/10" />

      {/* Top row */}
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-white/60 text-xs font-medium uppercase tracking-widest mb-1">Cartão de Crédito</p>
          <p className="text-white font-bold text-lg truncate max-w-[200px]">{card.name}</p>
        </div>
        <NetworkLogo network={card.network} />
      </div>

      {/* Chip */}
      <div className="relative z-10 flex items-center gap-3">
        <div className="w-10 h-7 rounded-md bg-yellow-300/80 border border-yellow-200/40 shadow-inner" />
      </div>

      {/* Bottom row */}
      <div className="relative z-10 space-y-2">
        <div className="flex justify-between text-white text-xs opacity-70">
          <span>Fatura Usada: {formatCurrency(used)}</span>
          <span>Limite: {formatCurrency(card.limit)}</span>
        </div>
        <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${pct >= 80 ? 'bg-red-400' : pct >= 50 ? 'bg-yellow-300' : 'bg-emerald-400'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
};

type FormData = {
  name: string;
  network: string;
  limit: string;
  availableLimit: string;
  closingDay: string;
  dueDay: string;
  color: string;
};

const emptyForm: FormData = {
  name: '', network: 'Visa', limit: '', availableLimit: '',
  closingDay: '', dueDay: '', color: CARD_COLORS[0].value,
};

type FormFieldsProps = {
  form: FormData;
  onChange: (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
};

const FormFields = ({ form, onChange }: FormFieldsProps) => (
  <div className="space-y-4">
    <div>
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Nome do Cartão</label>
      <input required value={form.name} onChange={onChange('name')} placeholder="Ex: Nubank Ultraviolet"
        className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-green-500 outline-none" />
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Bandeira</label>
        <select value={form.network} onChange={onChange('network')}
          className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-green-500 outline-none">
          {NETWORKS.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Cor do Cartão</label>
        <select value={form.color} onChange={onChange('color')}
          className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-green-500 outline-none">
          {CARD_COLORS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Limite Total (R$)</label>
        <input required type="number" step="0.01" value={form.limit} onChange={onChange('limit')} placeholder="5000.00"
          className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-green-500 outline-none" />
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Limite Disponível (R$)</label>
        <input type="number" step="0.01" value={form.availableLimit} onChange={onChange('availableLimit')} placeholder="Igual ao limite"
          className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-green-500 outline-none" />
      </div>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block flex items-center gap-1.5">
          <Calendar size={14} className="text-green-500" /> Fechamento (dia)
        </label>
        <input required type="number" min="1" max="31" value={form.closingDay} onChange={onChange('closingDay')} placeholder="Ex: 3"
          className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-green-500 outline-none" />
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block flex items-center gap-1.5">
          <AlertCircle size={14} className="text-orange-400" /> Vencimento (dia)
        </label>
        <input required type="number" min="1" max="31" value={form.dueDay} onChange={onChange('dueDay')} placeholder="Ex: 10"
          className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-green-500 outline-none" />
      </div>
    </div>
  </div>
);

export default function CreditCards() {
  const { creditCards, addCreditCard, updateCreditCard, deleteCreditCard } = useStore();
  const { user } = useAuth();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingId, setEditingId]       = useState<string | null>(null);
  const [form, setForm]                 = useState<FormData>(emptyForm);

  const handleChange = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const toCard = (id: string, f: FormData): CreditCard => ({
    id,
    name: f.name,
    network: f.network,
    limit: parseFloat(f.limit),
    availableLimit: parseFloat(f.availableLimit || f.limit),
    closingDay: parseInt(f.closingDay),
    dueDay: parseInt(f.dueDay),
    color: f.color,
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const card = toCard(uuidv4(), form);
    addCreditCard(card);

    if (user) {
      await supabase.from('credit_cards').insert({
        id: card.id, user_id: user.id, name: card.name,
        network: card.network, credit_limit: card.limit,
        available_limit: card.availableLimit, closing_day: card.closingDay,
        due_day: card.dueDay, color: card.color,
      });
    }

    setForm(emptyForm);
    setIsCreateOpen(false);
  };

  const openEdit = (card: CreditCard) => {
    setForm({
      name: card.name, network: card.network, color: card.color,
      limit: String(card.limit), availableLimit: String(card.availableLimit),
      closingDay: String(card.closingDay), dueDay: String(card.dueDay),
    });
    setEditingId(card.id);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    const updates = {
      name: form.name, network: form.network, color: form.color,
      limit: parseFloat(form.limit), availableLimit: parseFloat(form.availableLimit),
      closingDay: parseInt(form.closingDay), dueDay: parseInt(form.dueDay),
    };
    updateCreditCard(editingId, updates);

    if (user) {
      await supabase.from('credit_cards').update({
        name: updates.name, network: updates.network, color: updates.color,
        credit_limit: updates.limit, available_limit: updates.availableLimit,
        closing_day: updates.closingDay, due_day: updates.dueDay,
      }).eq('id', editingId);
    }

    setEditingId(null);
    setForm(emptyForm);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Excluir este cartão?')) return;
    deleteCreditCard(id);
    if (user) await supabase.from('credit_cards').delete().eq('id', id);
  };

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">Cartões de Crédito</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Gerencie seus cartões, limites e faturas.</p>
        </div>
        <Button onClick={() => { setForm(emptyForm); setIsCreateOpen(true); }}>
          <Plus size={18} className="mr-2" /> Novo Cartão
        </Button>
      </div>

      {/* Summary Row */}
      {creditCards.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-5">
              <p className="text-sm text-slate-500 dark:text-slate-400">Limite Total Somado</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {formatCurrency(creditCards.reduce((sum, c) => sum + c.limit, 0))}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-sm text-slate-500 dark:text-slate-400">Disponível Total</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {formatCurrency(creditCards.reduce((sum, c) => sum + c.availableLimit, 0))}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-sm text-slate-500 dark:text-slate-400">Fatura em Uso</p>
              <p className="text-2xl font-bold text-orange-500 dark:text-orange-400 mt-1">
                {formatCurrency(creditCards.reduce((sum, c) => sum + (c.limit - c.availableLimit), 0))}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {creditCards.map(card => (
          <div key={card.id} className="group space-y-4">
            {/* Visual Card */}
            <div className="relative">
              <CardVisual card={card} />
              {/* Action buttons overlay */}
              <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                <button onClick={() => openEdit(card)}
                  className="p-2 rounded-xl bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors">
                  <Pencil size={14} />
                </button>
                <button onClick={() => handleDelete(card.id)}
                  className="p-2 rounded-xl bg-white/20 backdrop-blur-sm text-white hover:bg-red-500/60 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* Info Card */}
            <Card className="overflow-hidden">
              <CardContent className="pt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Calendar size={13} className="text-green-500" /> Fechamento
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Dia {card.closingDay}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <AlertCircle size={13} className="text-orange-400" /> Vencimento
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Dia {card.dueDay}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <CreditCardIcon size={13} className="text-blue-400" /> Bandeira
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{card.network}</span>
                </div>
                {/* Limit bar */}
                <div className="pt-1">
                  <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                    <span>Usado: {formatCurrency(card.limit - card.availableLimit)}</span>
                    <span>{Math.round(((card.limit - card.availableLimit) / card.limit) * 100)}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-700"
                      style={{ width: `${Math.min(((card.limit - card.availableLimit) / card.limit) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}

        {/* Empty state / Add button */}
        {creditCards.length === 0 && (
          <button onClick={() => { setForm(emptyForm); setIsCreateOpen(true); }}
            className="col-span-full flex flex-col items-center justify-center min-h-[240px] rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:border-green-500/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-300 group cursor-pointer">
            <div className="w-16 h-16 rounded-full bg-white dark:bg-slate-800 shadow border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 group-hover:text-green-500 group-hover:scale-110 transition-all duration-300 mb-4">
              <CreditCardIcon size={28} />
            </div>
            <span className="text-base font-semibold text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white">Adicionar Primeiro Cartão</span>
            <span className="text-sm text-slate-500 mt-1">Controle seus limites e faturas aqui</span>
          </button>
        )}
      </div>

      {/* Create Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Novo Cartão de Crédito">
        <form onSubmit={handleCreate} className="space-y-4">
          <FormFields form={form} onChange={handleChange} />
          <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
            <Button type="button" variant="outline" className="w-full" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
            <Button type="submit" className="w-full">Adicionar Cartão</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editingId} onClose={() => setEditingId(null)} title="Editar Cartão">
        <form onSubmit={handleEdit} className="space-y-4">
          <FormFields form={form} onChange={handleChange} />
          <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
            <Button type="button" variant="outline" className="w-full" onClick={() => setEditingId(null)}>Cancelar</Button>
            <Button type="submit" className="w-full">Salvar Alterações</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
