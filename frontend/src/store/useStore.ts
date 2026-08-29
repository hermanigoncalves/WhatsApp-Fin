import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export type AccountType = 'Conta Corrente' | 'Conta Poupança' | 'Cartão de Crédito' | 'Dinheiro' | 'Conta PJ';
export type TransactionType = 'income' | 'expense';
export type FixedFrequency = 'Mensal' | 'Anual' | 'Semanal';
export type FixedStatus = 'active' | 'paused';
export type InvestmentType = 'Ações' | 'FII' | 'Tesouro Direto' | 'CDB/LCI/LCA' | 'Cripto' | 'Outros';
export type SavingsGoalStatus = 'active' | 'completed' | 'paused';

export interface CreditCard {
  id: string;
  name: string;
  limit: number;
  availableLimit: number;
  closingDay: number;
  dueDay: number;
  network: string; // Visa, Mastercard, etc.
  color: string;
}

export interface UserSettings {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatarUrl: string;
  n8nWebhookUrl: string;
  notifyLowBalance: boolean;
  lowBalanceThreshold: number;
  notifyBudgetAlert: boolean;
  budgetAlertPercentage: number;
  notifyFixedDue: boolean;
  fixedDueDays: number;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  color: string;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  accountId: string;
  date: string;
}

export interface FixedTransaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  accountId: string;
  date: string;
  frequency: FixedFrequency;
  status: FixedStatus;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
}

export interface Investment {
  id: string;
  name: string;
  type: InvestmentType;
  ticker?: string;
  amountInvested: number;
  currentValue: number;
  quantity?: number;
  purchasePrice?: number;
  purchaseDate: string;
  color: string;
}

export interface Budget {
  categoryId: string;
  monthlyLimit: number;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  icon: string;
  color: string;
  deadline?: string;
  status: SavingsGoalStatus;
}

export interface SavingsContribution {
  id: string;
  goalId: string;
  amount: number;
  note?: string;
  date: string;
}

interface AppState {
  accounts: Account[];
  transactions: Transaction[];
  fixedTransactions: FixedTransaction[];
  categories: Category[];
  investments: Investment[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  savingsContributions: SavingsContribution[];
  userSettings: UserSettings;
  creditCards: CreditCard[];

  // Credit Cards
  addCreditCard: (card: CreditCard) => void;
  updateCreditCard: (id: string, updates: Partial<Omit<CreditCard, 'id'>>) => void;
  deleteCreditCard: (id: string) => void;

  // Accounts
  addAccount: (acc: Account) => void;
  updateAccount: (id: string, updates: Partial<Omit<Account, 'id'>>) => void;
  deleteAccount: (id: string) => void;

  // Transactions
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;

  // Fixed Transactions
  addFixedTransaction: (ft: Omit<FixedTransaction, 'id'>) => void;
  toggleFixedStatus: (id: string) => void;

  // Investments
  addInvestment: (inv: Omit<Investment, 'id'>) => void;
  updateInvestment: (id: string, updates: Partial<Omit<Investment, 'id'>>) => void;
  deleteInvestment: (id: string) => void;

  // Budgets
  setBudget: (categoryId: string, monthlyLimit: number) => void;
  removeBudget: (categoryId: string) => void;

  // Savings Goals
  addSavingsGoal: (goal: Omit<SavingsGoal, 'id' | 'currentAmount'>) => void;
  updateSavingsGoal: (id: string, updates: Partial<Omit<SavingsGoal, 'id'>>) => void;
  deleteSavingsGoal: (id: string) => void;

  // Savings Contributions
  addSavingsContribution: (contribution: Omit<SavingsContribution, 'id'>) => void;
  deleteSavingsContribution: (id: string) => void;

  // Settings
  updateSettings: (updates: Partial<UserSettings>) => void;
}

const defaultCategories: Category[] = [
  { id: 'cat_1', name: 'Alimentação',  type: 'expense', color: 'bg-orange-500' },
  { id: 'cat_2', name: 'Transporte',   type: 'expense', color: 'bg-blue-500'   },
  { id: 'cat_3', name: 'Moradia',      type: 'expense', color: 'bg-purple-500' },
  { id: 'cat_4', name: 'Saúde',        type: 'expense', color: 'bg-red-500'    },
  { id: 'cat_5', name: 'Salário',      type: 'income',  color: 'bg-green-500'  },
  { id: 'cat_6', name: 'Serviços',     type: 'expense', color: 'bg-slate-500'  },
  { id: 'cat_7', name: 'Software',     type: 'expense', color: 'bg-indigo-500' },
];

export const sampleDemoData = {
  accounts: [
    { id: 'acc_1', name: 'Conta Principal', type: 'Conta Corrente' as AccountType, balance: 2500.0, color: 'bg-slate-800' },
    { id: 'acc_2', name: 'Reserva Emergência', type: 'Conta Poupança' as AccountType, balance: 10000.0, color: 'bg-emerald-600' },
  ],
  transactions: [
    { id: 'tx_1', description: 'Supermercado', amount: 350.0, type: 'expense' as TransactionType, categoryId: 'cat_1', accountId: 'acc_1', date: new Date().toISOString() },
  ],
};

const initialAccounts: Account[] = [];
const initialTransactions: Transaction[] = [];
const initialInvestments: Investment[] = [];
const initialBudgets: Budget[] = [];

const updateBalance = (accounts: Account[], accountId: string, amount: number, type: TransactionType, reverse = false): Account[] =>
  accounts.map(acc => {
    if (acc.id !== accountId) return acc;
    const delta = type === 'income' ? amount : -amount;
    return { ...acc, balance: acc.balance + (reverse ? -delta : delta) };
  });

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      accounts: initialAccounts,
      transactions: initialTransactions,
      categories: defaultCategories,
      investments: initialInvestments,
      budgets: initialBudgets,
      savingsGoals: [],
      savingsContributions: [],
      userSettings: {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        avatarUrl: '',
        n8nWebhookUrl: '',
        notifyLowBalance: true,
        lowBalanceThreshold: 500,
        notifyBudgetAlert: true,
        budgetAlertPercentage: 80,
        notifyFixedDue: true,
        fixedDueDays: 5,
      },
      fixedTransactions: [],
      creditCards: [],

      // Credit Cards
      addCreditCard: (card) => set((s) => ({ creditCards: [...s.creditCards, card] })),
      updateCreditCard: (id, updates) => set((s) => ({ creditCards: s.creditCards.map(c => c.id === id ? { ...c, ...updates } : c) })),
      deleteCreditCard: (id) => set((s) => ({ creditCards: s.creditCards.filter(c => c.id !== id) })),

      // Accounts
      addAccount: (acc) =>
        set((s) => ({ accounts: [...s.accounts, acc] })),

      updateAccount: (id, updates) =>
        set((s) => ({ accounts: s.accounts.map(a => a.id === id ? { ...a, ...updates } : a) })),

      deleteAccount: (id) =>
        set((s) => ({
          accounts: s.accounts.filter(a => a.id !== id),
          transactions: s.transactions.filter(t => t.accountId !== id),
          fixedTransactions: s.fixedTransactions.filter(ft => ft.accountId !== id),
        })),

      // Transactions
      addTransaction: (tx) =>
        set((s) => ({
          transactions: [{ ...tx, id: uuidv4() }, ...s.transactions],
          accounts: updateBalance(s.accounts, tx.accountId, tx.amount, tx.type),
        })),

      deleteTransaction: (id) =>
        set((s) => {
          const tx = s.transactions.find(t => t.id === id);
          if (!tx) return s;
          return {
            transactions: s.transactions.filter(t => t.id !== id),
            accounts: updateBalance(s.accounts, tx.accountId, tx.amount, tx.type, true),
          };
        }),

      // Fixed transactions
      addFixedTransaction: (ft) =>
        set((s) => ({ fixedTransactions: [...s.fixedTransactions, { ...ft, id: uuidv4() }] })),

      toggleFixedStatus: (id) =>
        set((s) => ({
          fixedTransactions: s.fixedTransactions.map(ft =>
            ft.id === id ? { ...ft, status: ft.status === 'active' ? 'paused' : 'active' } : ft
          ),
        })),

      // Investments
      addInvestment: (inv) =>
        set((s) => ({ investments: [...s.investments, { ...inv, id: uuidv4() }] })),

      updateInvestment: (id, updates) =>
        set((s) => ({ investments: s.investments.map(i => i.id === id ? { ...i, ...updates } : i) })),

      deleteInvestment: (id) =>
        set((s) => ({ investments: s.investments.filter(i => i.id !== id) })),

      // Budgets
      setBudget: (categoryId, monthlyLimit) =>
        set((s) => ({
          budgets: s.budgets.some(b => b.categoryId === categoryId)
            ? s.budgets.map(b => b.categoryId === categoryId ? { ...b, monthlyLimit } : b)
            : [...s.budgets, { categoryId, monthlyLimit }],
        })),

      removeBudget: (categoryId) =>
        set((s) => ({ budgets: s.budgets.filter(b => b.categoryId !== categoryId) })),

      // Savings Goals
      addSavingsGoal: (goal) =>
        set((s) => ({ savingsGoals: [...s.savingsGoals, { ...goal, id: uuidv4(), currentAmount: 0 }] })),
      
      updateSavingsGoal: (id, updates) =>
        set((s) => ({ savingsGoals: s.savingsGoals.map(g => g.id === id ? { ...g, ...updates } : g) })),
      
      deleteSavingsGoal: (id) =>
        set((s) => ({
          savingsGoals: s.savingsGoals.filter(g => g.id !== id),
          savingsContributions: s.savingsContributions.filter(c => c.goalId !== id),
        })),

      // Savings Contributions
      addSavingsContribution: (contribution) =>
        set((s) => {
          const newContribution = { ...contribution, id: uuidv4() };
          return {
            savingsContributions: [...s.savingsContributions, newContribution],
            savingsGoals: s.savingsGoals.map(g => 
              g.id === contribution.goalId 
                ? { ...g, currentAmount: g.currentAmount + contribution.amount }
                : g
            ),
          };
        }),
      
      deleteSavingsContribution: (id) =>
        set((s) => {
          const contribution = s.savingsContributions.find(c => c.id === id);
          if (!contribution) return s;
          return {
            savingsContributions: s.savingsContributions.filter(c => c.id !== id),
            savingsGoals: s.savingsGoals.map(g => 
              g.id === contribution.goalId 
                ? { ...g, currentAmount: g.currentAmount - contribution.amount }
                : g
            ),
          };
        }),

      // Settings
      updateSettings: (updates) =>
        set((s) => ({ userSettings: { ...s.userSettings, ...updates } })),
    }),
    { name: 'finance-store' }
  )
);
