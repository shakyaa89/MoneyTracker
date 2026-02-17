import { useState, useEffect, useCallback } from 'react';
import {
  FinanceData,
  Account,
  Transaction,
  Category,
  DEFAULT_CATEGORIES,
  DEFAULT_ACCOUNTS,
} from '@/types/finance';
import { normalizeFinanceDate, parseFinanceDate } from '@/lib/dateTime';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';
const FINANCE_API = `${API_BASE_URL}/api/finance`;
const REQUEST_TIMEOUT_MS = 15000;

const EMPTY_DATA: FinanceData = {
  accounts: DEFAULT_ACCOUNTS,
  transactions: [],
  categories: DEFAULT_CATEGORIES,
};

function sanitizeFinanceData(data: FinanceData): FinanceData {
  return {
    ...data,
    transactions: Array.isArray(data.transactions)
      ? data.transactions.map((tx) => ({
          ...tx,
          date: normalizeFinanceDate(tx.date),
        }))
      : [],
  };
}

async function fetchFinanceData(): Promise<FinanceData> {
  const data = await requestJson<FinanceData>(FINANCE_API);
  return sanitizeFinanceData(data);
}

async function saveFinanceData(data: FinanceData): Promise<FinanceData> {
  const sanitizedData = sanitizeFinanceData(data);
  return requestJson(FINANCE_API, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(sanitizedData),
  });
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    if (!response.ok) {
      const message = await extractErrorMessage(response);
      throw new Error(message || 'Request failed');
    }
    return response.json() as Promise<T>;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    throw error instanceof Error ? error : new Error('Network request failed');
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function extractErrorMessage(response: Response): Promise<string | null> {
  try {
    const payload = await response.clone().json();
    if (payload && typeof payload.message === 'string') return payload.message;
    return null;
  } catch {
    return null;
  }
}

export function useFinanceStore() {
  const [data, setData] = useState<FinanceData>(EMPTY_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setError(null);
        const loaded = await fetchFinanceData();
        if (mounted) setData(loaded);
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : 'Failed to load data');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const persistData = useCallback(async (next: FinanceData) => {
    setIsSaving(true);
    try {
      setError(null);
      const saved = await saveFinanceData(next);
      setData(saved);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save data');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Accounts
  const addAccount = useCallback(async (account: Account) => {
    const next = { ...data, accounts: [...data.accounts, account] };
    await persistData(next);
  }, [data, persistData]);

  const updateAccount = useCallback(async (id: string, updates: Partial<Account>) => {
    const next = {
      ...data,
      accounts: data.accounts.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    };
    await persistData(next);
  }, [data, persistData]);

  const deleteAccount = useCallback(async (id: string) => {
    const next = {
      ...data,
      accounts: data.accounts.filter((a) => a.id !== id),
      transactions: data.transactions.filter((t) => t.accountId !== id && t.toAccountId !== id),
    };
    await persistData(next);
  }, [data, persistData]);

  // Balance validation helper
  const wouldGoNegative = useCallback((accountId: string, deductAmount: number, currentData?: FinanceData): boolean => {
    const d = currentData || data;
    const account = d.accounts.find((a) => a.id === accountId);
    if (!account) return false;
    return account.balance - deductAmount < 0;
  }, [data]);

  // Transactions
  const addTransaction = useCallback(async (tx: Transaction): Promise<string | null> => {
    if (tx.type === 'expense' || tx.type === 'transfer') {
      const account = data.accounts.find((a) => a.id === tx.accountId);
      if (account && account.balance - tx.amount < 0) {
        return `Insufficient balance in "${account.name}". Available: Rs.${account.balance.toFixed(2)}`;
      }
    }

    const accounts = data.accounts.map((a) => {
      if (tx.type === 'income' && a.id === tx.accountId) {
        return { ...a, balance: a.balance + tx.amount };
      }
      if (tx.type === 'expense' && a.id === tx.accountId) {
        return { ...a, balance: a.balance - tx.amount };
      }
      if (tx.type === 'transfer') {
        if (a.id === tx.accountId) return { ...a, balance: a.balance - tx.amount };
        if (a.id === tx.toAccountId) return { ...a, balance: a.balance + tx.amount };
      }
      return a;
    });

    const next = { ...data, accounts, transactions: [...data.transactions, tx] };
    const ok = await persistData(next);
    return ok ? null : 'Failed to persist data. Please try again.';
  }, [data, persistData]);

  const deleteTransaction = useCallback(async (id: string) => {
    const tx = data.transactions.find((t) => t.id === id);
    if (!tx) return;

    const accounts = data.accounts.map((a) => {
      if (tx.type === 'income' && a.id === tx.accountId) {
        return { ...a, balance: a.balance - tx.amount };
      }
      if (tx.type === 'expense' && a.id === tx.accountId) {
        return { ...a, balance: a.balance + tx.amount };
      }
      if (tx.type === 'transfer') {
        if (a.id === tx.accountId) return { ...a, balance: a.balance + tx.amount };
        if (a.id === tx.toAccountId) return { ...a, balance: a.balance - tx.amount };
      }
      return a;
    });

    const next = { ...data, accounts, transactions: data.transactions.filter((t) => t.id !== id) };
    await persistData(next);
  }, [data, persistData]);

  const updateTransaction = useCallback(async (id: string, updated: Transaction): Promise<string | null> => {
    const old = data.transactions.find((t) => t.id === id);
    if (!old) return null;

    let accounts = data.accounts.map((a) => {
      if (old.type === 'income' && a.id === old.accountId) return { ...a, balance: a.balance - old.amount };
      if (old.type === 'expense' && a.id === old.accountId) return { ...a, balance: a.balance + old.amount };
      if (old.type === 'transfer') {
        if (a.id === old.accountId) return { ...a, balance: a.balance + old.amount };
        if (a.id === old.toAccountId) return { ...a, balance: a.balance - old.amount };
      }
      return a;
    });

    if (updated.type === 'expense' || updated.type === 'transfer') {
      const acc = accounts.find((a) => a.id === updated.accountId);
      if (acc && acc.balance - updated.amount < 0) {
        return `Insufficient balance in "${acc.name}". Available: Rs.${acc.balance.toFixed(2)}`;
      }
    }

    accounts = accounts.map((a) => {
      if (updated.type === 'income' && a.id === updated.accountId) return { ...a, balance: a.balance + updated.amount };
      if (updated.type === 'expense' && a.id === updated.accountId) return { ...a, balance: a.balance - updated.amount };
      if (updated.type === 'transfer') {
        if (a.id === updated.accountId) return { ...a, balance: a.balance - updated.amount };
        if (a.id === updated.toAccountId) return { ...a, balance: a.balance + updated.amount };
      }
      return a;
    });

    const next = {
      ...data,
      accounts,
      transactions: data.transactions.map((t) => (t.id === id ? updated : t)),
    };
    const ok = await persistData(next);
    return ok ? null : 'Failed to persist data. Please try again.';
  }, [data, persistData]);

  // Categories
  const addCategory = useCallback(async (cat: Category) => {
    const next = { ...data, categories: [...data.categories, cat] };
    await persistData(next);
  }, [data, persistData]);

  const updateCategory = useCallback(async (id: string, updates: Partial<Category>) => {
    const next = {
      ...data,
      categories: data.categories.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    };
    await persistData(next);
  }, [data, persistData]);

  const deleteCategory = useCallback(async (id: string) => {
    const next = {
      ...data,
      categories: data.categories.filter((c) => c.id !== id),
    };
    await persistData(next);
  }, [data, persistData]);

  const netWorth = data.accounts.reduce((sum, a) => sum + a.balance, 0);

  const getMonthTransactions = useCallback((year: number, month: number) => {
    return data.transactions.filter((t) => {
      const d = parseFinanceDate(t.date);
      if (!d) return false;
      return d.getFullYear() === year && d.getMonth() === month;
    });
  }, [data.transactions]);

  const exportCSV = useCallback((transactions: Transaction[]) => {
    const header = 'Date,Type,Amount,Category,Account,To Account,Note\n';
    const rows = transactions.map((t) => {
      const cat = data.categories.find((c) => c.id === t.categoryId)?.name || '';
      const acc = data.accounts.find((a) => a.id === t.accountId)?.name || '';
      const toAcc = data.accounts.find((a) => a.id === t.toAccountId)?.name || '';
      const note = (t.note || '').replace(/,/g, ';');
      return `${t.date},${t.type},${t.amount},${cat},${acc},${toAcc},${note}`;
    }).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transactions.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [data.categories, data.accounts]);

  return {
    ...data,
    isLoading,
    isSaving,
    error,
    netWorth,
    addAccount,
    updateAccount,
    deleteAccount,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addCategory,
    updateCategory,
    deleteCategory,
    getMonthTransactions,
    exportCSV,
  };
}
