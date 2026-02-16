export type AccountType = 'cash' | 'bank' | 'card' | 'wallet';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
}

export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Transaction {
  id: string;
  date: string; // ISO date string
  type: TransactionType;
  amount: number;
  categoryId?: string;
  accountId: string;
  toAccountId?: string; // for transfers
  note?: string;
  isRecurring?: boolean;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon?: string;
}

export interface FinanceData {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'salary', name: 'Salary', type: 'income' },
  { id: 'freelance', name: 'Freelance', type: 'income' },
  { id: 'investments', name: 'Investments', type: 'income' },
  { id: 'gifts-in', name: 'Gifts', type: 'income' },
  { id: 'other-income', name: 'Other', type: 'income' },
  { id: 'food', name: 'Food & Dining', type: 'expense' },
  { id: 'transport', name: 'Transport', type: 'expense' },
  { id: 'housing', name: 'Housing', type: 'expense' },
  { id: 'utilities', name: 'Utilities', type: 'expense' },
  { id: 'entertainment', name: 'Entertainment', type: 'expense' },
  { id: 'shopping', name: 'Shopping', type: 'expense' },
  { id: 'health', name: 'Health', type: 'expense' },
  { id: 'education', name: 'Education', type: 'expense' },
  { id: 'subscriptions', name: 'Subscriptions', type: 'expense' },
  { id: 'other-expense', name: 'Other', type: 'expense' },
];

export const DEFAULT_ACCOUNTS: Account[] = [
  { id: 'cash', name: 'Cash', type: 'cash', balance: 0 },
  { id: 'bank', name: 'Bank Account', type: 'bank', balance: 0 },
  { id: 'card', name: 'Credit Card', type: 'card', balance: 0 },
];

export const ACCOUNT_TYPE_ICONS: Record<AccountType, string> = {
  cash: '💵',
  bank: '🏦',
  card: '💳',
  wallet: '👛',
};
