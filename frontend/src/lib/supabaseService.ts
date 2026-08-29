import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Account, Transaction, Category, FixedTransaction, Budget, UserSettings, Investment, SavingsGoal, SavingsContribution } from '../store/useStore';
import type { SavingsGoalStatus } from '../store/useStore';

// ─── Types aligned with Supabase snake_case columns ─────────────────────────

type DbAccount = {
  id: string; user_id: string; name: string; type: string;
  balance: number; color: string; created_at: string;
};

type DbTransaction = {
  id: string; user_id: string; account_id: string; category_id: string;
  description: string; amount: number; type: string; date: string; created_at: string;
};

type DbFixedTransaction = {
  id: string; user_id: string; account_id: string; category_id: string;
  description: string; amount: number; type: string;
  day_of_month: number; frequency: string; status: string;
};

type DbCategory = {
  id: string; user_id: string; name: string; type: string; color: string;
};

type DbBudget = {
  user_id: string; category_id: string; monthly_limit: number;
};

type DbSavingsGoal = {
  id: string; user_id: string; name: string; target_amount: number;
  current_amount: number; icon: string; color: string; deadline?: string;
  status: string; created_at: string;
};

type DbSavingsContribution = {
  id: string; goal_id: string; user_id: string; amount: number;
  note?: string; date: string; created_at: string;
};

type DbInvestment = {
  id: string; user_id: string; name: string; type: string; ticker?: string;
  amount_invested: number; current_value: number; quantity?: number;
  purchase_price?: number; purchase_date: string; color: string;
};

type DbProfile = {
  id: string; first_name: string; last_name: string; phone?: string;
  avatar_url?: string; n8n_webhook_url?: string;
  notify_low_balance: boolean; low_balance_threshold: number;
  notify_budget_alert: boolean; budget_alert_percentage: number;
  notify_fixed_due: boolean; fixed_due_days: number;
};

// ─── Mappers: Supabase → Zustand ────────────────────────────────────────────

const toAccount    = (r: DbAccount):            Account          => ({ id: r.id, name: r.name, type: r.type as Account['type'], balance: Number(r.balance), color: r.color });
const toCategory   = (r: DbCategory):           Category         => ({ id: r.id, name: r.name, type: r.type as Category['type'], color: r.color });
const toTransaction = (r: DbTransaction):       Transaction      => ({ id: r.id, description: r.description, amount: Number(r.amount), type: r.type as Transaction['type'], categoryId: r.category_id, accountId: r.account_id, date: r.date });
const toFixedTx    = (r: DbFixedTransaction):   FixedTransaction => ({ id: r.id, description: r.description, amount: Number(r.amount), type: r.type as Transaction['type'], categoryId: r.category_id, accountId: r.account_id, date: String(r.day_of_month), frequency: r.frequency as FixedTransaction['frequency'], status: r.status as FixedTransaction['status'] });
const toInvestment = (r: DbInvestment):         Investment       => ({ id: r.id, name: r.name, type: r.type as Investment['type'], ticker: r.ticker, amountInvested: Number(r.amount_invested), currentValue: Number(r.current_value), quantity: r.quantity, purchasePrice: r.purchase_price, purchaseDate: r.purchase_date, color: r.color });
const toSavingsGoal = (r: DbSavingsGoal):       SavingsGoal      => ({ id: r.id, name: r.name, targetAmount: Number(r.target_amount), currentAmount: Number(r.current_amount), icon: r.icon, color: r.color, deadline: r.deadline, status: r.status as SavingsGoalStatus });
const toSavingsContribution = (r: DbSavingsContribution): SavingsContribution => ({ id: r.id, goalId: r.goal_id, amount: Number(r.amount), note: r.note, date: r.date });
const toBudget     = (r: DbBudget):             Budget           => ({ categoryId: r.category_id, monthlyLimit: Number(r.monthly_limit) });
const toSettings   = (r: DbProfile): Partial<UserSettings>      => ({ firstName: r.first_name, lastName: r.last_name, phone: r.phone ?? '', avatarUrl: r.avatar_url ?? '', n8nWebhookUrl: r.n8n_webhook_url ?? '', notifyLowBalance: r.notify_low_balance, lowBalanceThreshold: Number(r.low_balance_threshold), notifyBudgetAlert: r.notify_budget_alert, budgetAlertPercentage: r.budget_alert_percentage, notifyFixedDue: r.notify_fixed_due, fixedDueDays: r.fixed_due_days });

// ─── useSyncSupabase ─────────────────────────────────────────────────────────
// Loads all user data from Supabase and syncs into the Zustand store.

import { useStore } from '../store/useStore';

export function useSyncSupabase(userId: string | null) {
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const store = useStore();

  useEffect(() => {
    // Skip if no user — avoids 429 rate limit on unauthenticated calls
    if (!userId) {
      setLoading(false);
      return;
    }

    // Modo Usuário Teste (offline / sem banco ativo)
    if (userId === 'demo-test-user') {
      const currentState = useStore.getState();
      if (currentState.accounts.length === 0) {
        useStore.setState({
          accounts: [
            { id: 'acc_1', name: 'Nubank Principal', type: 'Conta Corrente', balance: 3450.80, color: 'bg-purple-600' },
            { id: 'acc_2', name: 'Inter PJ', type: 'Conta PJ', balance: 12890.00, color: 'bg-orange-500' },
            { id: 'acc_3', name: 'Carteira Física', type: 'Dinheiro', balance: 350.00, color: 'bg-emerald-600' },
          ],
          creditCards: [
            { id: 'cc_1', name: 'Nubank Ultravioleta', limit: 15000, availableLimit: 9850, closingDay: 5, dueDay: 12, network: 'Mastercard', color: 'from-purple-900 to-slate-900' },
            { id: 'cc_2', name: 'Inter Black', limit: 20000, availableLimit: 14500, closingDay: 15, dueDay: 22, network: 'Mastercard', color: 'from-orange-800 to-slate-900' },
          ],
          transactions: [
            { id: 'tx_1', description: 'Supermercado Pão de Açúcar', amount: 480.50, type: 'expense', categoryId: 'cat_1', accountId: 'acc_1', date: new Date().toISOString() },
            { id: 'tx_2', description: 'Pix Recebido - Consultoria', amount: 4500.00, type: 'income', categoryId: 'cat_5', accountId: 'acc_2', date: new Date(Date.now() - 86400000).toISOString() },
            { id: 'tx_3', description: 'Uber Viagem', amount: 38.90, type: 'expense', categoryId: 'cat_2', accountId: 'acc_1', date: new Date(Date.now() - 172800000).toISOString() },
          ],
          fixedTransactions: [
            { id: 'ft_1', description: 'Aluguel Escritório', amount: 1800.0, type: 'expense', categoryId: 'cat_3', accountId: 'acc_2', date: '5', frequency: 'Mensal', status: 'active' },
            { id: 'ft_2', description: 'Assinatura AWS / Vercel', amount: 240.0, type: 'expense', categoryId: 'cat_7', accountId: 'acc_1', date: '15', frequency: 'Mensal', status: 'active' },
          ],
          userSettings: {
            firstName: 'Hermani',
            lastName: 'Tester',
            email: 'teste@whatsappfin.com',
            phone: '+55 11 99999-9999',
            avatarUrl: '',
            n8nWebhookUrl: '',
            notifyLowBalance: true,
            lowBalanceThreshold: 500,
            notifyBudgetAlert: true,
            budgetAlertPercentage: 80,
            notifyFixedDue: true,
            fixedDueDays: 5,
          },
        });
      }
      setLoading(false);
      return;
    }

    let mounted = true;

    async function load() {
      try {
        const [
          { data: profile },
          { data: categories },
          { data: accounts },
          { data: transactions },
          { data: fixedTxs },
          { data: budgets },
          { data: investments },
          { data: savingsGoals },
          { data: savingsContributions },
        ] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', userId).single(),
          supabase.from('categories').select('*').eq('user_id', userId),
          supabase.from('accounts').select('*').eq('user_id', userId),
          supabase.from('transactions').select('*').eq('user_id', userId).order('date', { ascending: false }).limit(500),
          supabase.from('fixed_transactions').select('*').eq('user_id', userId),
          supabase.from('budgets').select('*').eq('user_id', userId),
          supabase.from('investments').select('*').eq('user_id', userId),
          supabase.from('savings_goals').select('*').eq('user_id', userId),
          supabase.from('savings_contributions').select('*').eq('user_id', userId).order('date', { ascending: false }),
        ]);

        if (!mounted) return;

        if (profile)      store.updateSettings(toSettings(profile as DbProfile));
        if (categories)   useStore.setState({ categories:        (categories   as DbCategory[]).map(toCategory)    });
        if (accounts)     useStore.setState({ accounts:          (accounts     as DbAccount[]).map(toAccount)      });
        if (transactions) useStore.setState({ transactions:      (transactions as DbTransaction[]).map(toTransaction) });
        if (fixedTxs)     useStore.setState({ fixedTransactions: (fixedTxs    as DbFixedTransaction[]).map(toFixedTx) });
        if (budgets)      useStore.setState({ budgets:           (budgets     as DbBudget[]).map(toBudget)         });
        if (investments)  useStore.setState({ investments:       (investments as DbInvestment[]).map(toInvestment) });
        if (savingsGoals) useStore.setState({ savingsGoals:      (savingsGoals as DbSavingsGoal[]).map(toSavingsGoal) });
        if (savingsContributions) useStore.setState({ savingsContributions: (savingsContributions as DbSavingsContribution[]).map(toSavingsContribution) });

      } catch (e: unknown) {
        if (mounted) setError(e instanceof Error ? e.message : 'Erro ao carregar dados');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, [userId]); // re-run only when userId changes

  return { loading, error };
}

// ─── Supabase write helpers ──────────────────────────────────────────────────

export const db = {

  // Profile
  saveProfile: async (userId: string, s: Partial<UserSettings>) => {
    await supabase.from('profiles').update({
      first_name: s.firstName, last_name: s.lastName, phone: s.phone,
      avatar_url: s.avatarUrl, n8n_webhook_url: s.n8nWebhookUrl,
      notify_low_balance: s.notifyLowBalance, low_balance_threshold: s.lowBalanceThreshold,
      notify_budget_alert: s.notifyBudgetAlert, budget_alert_percentage: s.budgetAlertPercentage,
      notify_fixed_due: s.notifyFixedDue, fixed_due_days: s.fixedDueDays,
    }).eq('id', userId);
  },

  // Accounts
  upsertAccount: async (userId: string, a: Account) => {
    await supabase.from('accounts').upsert({ id: a.id, user_id: userId, name: a.name, type: a.type, color: a.color });
  },
  deleteAccount: async (id: string) => { await supabase.from('accounts').delete().eq('id', id); },

  // Transactions
  insertTransaction: async (userId: string, tx: Transaction) => {
    await supabase.from('transactions').insert({ id: tx.id, user_id: userId, account_id: tx.accountId, category_id: tx.categoryId, description: tx.description, amount: tx.amount, type: tx.type, date: tx.date });
  },
  deleteTransaction: async (id: string) => { await supabase.from('transactions').delete().eq('id', id); },

  // Fixed Transactions
  upsertFixedTx: async (userId: string, ft: FixedTransaction) => {
    await supabase.from('fixed_transactions').upsert({ id: ft.id, user_id: userId, account_id: ft.accountId, category_id: ft.categoryId, description: ft.description, amount: ft.amount, type: ft.type, day_of_month: Number(ft.date), frequency: ft.frequency, status: ft.status });
  },
  toggleFixedStatus: async (id: string, status: string) => { await supabase.from('fixed_transactions').update({ status }).eq('id', id); },

  // Categories
  upsertCategory: async (userId: string, c: Category) => {
    await supabase.from('categories').upsert({ id: c.id, user_id: userId, name: c.name, type: c.type, color: c.color });
  },

  // Budgets
  upsertBudget: async (userId: string, b: Budget) => {
    await supabase.from('budgets').upsert({ user_id: userId, category_id: b.categoryId, monthly_limit: b.monthlyLimit });
  },
  deleteBudget: async (userId: string, categoryId: string) => { await supabase.from('budgets').delete().match({ user_id: userId, category_id: categoryId }); },

  // Investments
  upsertInvestment: async (userId: string, inv: Investment) => {
    await supabase.from('investments').upsert({ id: inv.id, user_id: userId, name: inv.name, type: inv.type, ticker: inv.ticker, amount_invested: inv.amountInvested, current_value: inv.currentValue, quantity: inv.quantity, purchase_price: inv.purchasePrice, purchase_date: inv.purchaseDate, color: inv.color });
  },
  deleteInvestment: async (id: string) => { await supabase.from('investments').delete().eq('id', id); },

  // Savings Goals
  upsertSavingsGoal: async (userId: string, g: SavingsGoal) => {
    await supabase.from('savings_goals').upsert({ id: g.id, user_id: userId, name: g.name, target_amount: g.targetAmount, current_amount: g.currentAmount, icon: g.icon, color: g.color, deadline: g.deadline, status: g.status });
  },
  deleteSavingsGoal: async (id: string) => { await supabase.from('savings_goals').delete().eq('id', id); },

  // Savings Contributions
  insertSavingsContribution: async (userId: string, c: SavingsContribution) => {
    await supabase.from('savings_contributions').insert({ id: c.id, goal_id: c.goalId, user_id: userId, amount: c.amount, note: c.note, date: c.date });
  },
  deleteSavingsContribution: async (id: string) => { await supabase.from('savings_contributions').delete().eq('id', id); },
};
