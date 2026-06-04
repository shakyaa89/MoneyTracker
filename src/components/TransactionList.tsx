import { Transaction, Category, Account } from '@/types/finance';
import { format } from 'date-fns';
import { ArrowUpRight, ArrowDownRight, ArrowLeftRight, Trash2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getFinanceTimestamp, parseFinanceDate } from '@/lib/dateTime';

interface Props {
  transactions: Transaction[];
  allTransactions?: Transaction[];
  categories: Category[];
  accounts: Account[];
  onDelete: (id: string) => void;
  onEdit: (tx: Transaction) => void;
  searchQuery?: string;
  filterAccount?: string;
  filterCategory?: string;
}

function formatCurrency(n: number) {
  const absValue = Math.abs(n);
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(absValue);
  return `${n < 0 ? '-' : ''}Rs.${formatted}`;
}

const typeConfig = {
  income: { icon: ArrowUpRight, colorClass: 'text-income', bgClass: 'bg-income-muted', sign: '+' },
  expense: { icon: ArrowDownRight, colorClass: 'text-expense', bgClass: 'bg-expense-muted', sign: '-' },
  transfer: { icon: ArrowLeftRight, colorClass: 'text-transfer', bgClass: 'bg-transfer-muted', sign: '' },
};

function formatTransactionDate(date: string) {
  const parsed = parseFinanceDate(date);
  if (!parsed) return 'No date';
  return format(parsed, 'dd MMM yyyy');
}

function formatTransactionTime(date: string) {
  const parsed = parseFinanceDate(date);
  if (!parsed) return 'No time';
  return format(parsed, 'hh:mm a');
}

function formatGroupDate(date: string) {
  const parsed = parseFinanceDate(date);
  if (!parsed) return 'Unknown date';
  return format(parsed, 'EEE, MMM d');
}

type BalanceSnapshot = {
  before: number;
  after: number;
  toBefore?: number;
  toAfter?: number;
};

type DisplayTransaction = {
  id: string;
  base: Transaction;
  amount: number;
  accountId: string;
};

function buildDisplayTransactions(transactions: Transaction[]): DisplayTransaction[] {
  return transactions.map((tx) => {
    return {
      id: tx.id,
      base: tx,
      amount: tx.amount,
      accountId: tx.accountId,
    };
  });
}

function buildBalanceSnapshots(accounts: Account[], transactions: Transaction[]) {
  const runningBalances = new Map(accounts.map((account) => [account.id, account.balance]));
  const snapshots: Record<string, BalanceSnapshot> = {};

  const sortedByNewest = [...transactions].sort(
    (a, b) => getFinanceTimestamp(b.date) - getFinanceTimestamp(a.date),
  );

  sortedByNewest.forEach((tx) => {
    if (tx.type === 'income') {
      const after = runningBalances.get(tx.accountId) ?? 0;
      const before = after - tx.amount;
      snapshots[tx.id] = { before, after };
      runningBalances.set(tx.accountId, before);
      return;
    }

    if (tx.type === 'expense') {
      const after = runningBalances.get(tx.accountId) ?? 0;
      const before = after + tx.amount;
      snapshots[tx.id] = { before, after };
      runningBalances.set(tx.accountId, before);
      return;
    }

    const fromAfter = runningBalances.get(tx.accountId) ?? 0;
    const fromBefore = fromAfter + tx.amount;
    let toBefore: number | undefined;
    let toAfter: number | undefined;

    if (tx.toAccountId) {
      toAfter = runningBalances.get(tx.toAccountId) ?? 0;
      toBefore = toAfter - tx.amount;
      runningBalances.set(tx.toAccountId, toBefore);
    }

    snapshots[tx.id] = {
      before: fromBefore,
      after: fromAfter,
      toBefore,
      toAfter,
    };
    runningBalances.set(tx.accountId, fromBefore);
  });

  return snapshots;
}

export function TransactionList({ transactions, allTransactions, categories, accounts, onDelete, onEdit, searchQuery, filterAccount, filterCategory }: Props) {
  const sorted = [...transactions].sort((a, b) => getFinanceTimestamp(b.date) - getFinanceTimestamp(a.date));
  const balanceSnapshots = buildBalanceSnapshots(accounts, allTransactions ?? transactions);
  let filtered = buildDisplayTransactions(sorted);

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter((entry) => {
      const { base } = entry;
      const cat = categories.find((c) => c.id === base.categoryId)?.name || '';
      const displayAccountName = accounts.find((a) => a.id === entry.accountId)?.name || '';
      return (
        (base.note && base.note.toLowerCase().includes(q)) ||
        cat.toLowerCase().includes(q) ||
        displayAccountName.toLowerCase().includes(q) ||
        entry.amount.toString().includes(q)
      );
    });
  }
  if (filterAccount) {
    filtered = filtered.filter((entry) => {
      if (entry.base.type === 'transfer') {
        return entry.base.accountId === filterAccount || entry.base.toAccountId === filterAccount;
      }
      return entry.accountId === filterAccount;
    });
  }
  if (filterCategory) {
    filtered = filtered.filter((entry) => entry.base.categoryId === filterCategory);
  }

  if (filtered.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-sm">No transactions yet</p>
      </div>
    );
  }

  // Group by date
  const grouped: Record<string, DisplayTransaction[]> = {};
  filtered.forEach((entry) => {
    const parsed = parseFinanceDate(entry.base.date);
    const key = parsed ? format(parsed, 'yyyy-MM-dd') : 'unknown-date';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(entry);
  });

  return (
    <div className="space-y-4 animate-fade-in">
      {Object.entries(grouped).map(([date, txs]) => (
        <div key={date}>
          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
            {formatGroupDate(date)}
          </p>
          <div className="space-y-1.5">
            {txs.map((entry) => {
              const tx = entry.base;
              const cfg = typeConfig[tx.type];
              const Icon = cfg.icon;
              const catName = categories.find((c) => c.id === tx.categoryId)?.name;
              const accName = accounts.find((a) => a.id === entry.accountId)?.name;
              const toAccName = accounts.find((a) => a.id === tx.toAccountId)?.name;
              const description = tx.note?.trim();
              const fallbackTitle = tx.type === 'transfer'
                ? `${accName} → ${toAccName}`
                : catName || 'Uncategorized';
              const title = description || fallbackTitle;
              const subtitle = tx.type === 'transfer'
                ? `${accName} → ${toAccName}`
                : [catName || 'Uncategorized', accName].filter(Boolean).join(' · ');
              const balance = balanceSnapshots[tx.id];

              return (
                <div key={entry.id}>
                  <div className="md:hidden card-premium hover-scale-subtle p-3.5 space-y-2 relative overflow-hidden pl-5">
                    <div 
                      className="absolute left-0 top-0 bottom-0 w-1.5" 
                      style={{ 
                        backgroundColor: tx.type === 'income' 
                          ? 'hsl(var(--income))' 
                          : tx.type === 'expense' 
                          ? 'hsl(var(--expense))' 
                          : 'hsl(var(--transfer))' 
                      }} 
                    />
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg ${cfg.bgClass} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-4 h-4 ${cfg.colorClass}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold leading-tight break-words">{title}</p>
                        <p className="text-xs text-muted-foreground mt-1 break-words">{subtitle}</p>
                      </div>
                      <span className={`font-mono font-bold text-sm ${cfg.colorClass} whitespace-nowrap`}>
                        {cfg.sign}{formatCurrency(entry.amount)}
                      </span>
                    </div>

                    <div className="text-[11px] text-muted-foreground flex items-center justify-between pt-1">
                      <span>{formatTransactionDate(tx.date)}</span>
                      <span>{formatTransactionTime(tx.date)}</span>
                    </div>

                    {balance && tx.type !== 'transfer' && (
                      <p className="text-[11px] text-muted-foreground font-mono bg-muted/30 px-2 py-1 rounded">
                        Balance: {formatCurrency(balance.before)} → {formatCurrency(balance.after)}
                      </p>
                    )}
                    {balance && tx.type === 'transfer' && (
                      <div className="text-[11px] text-muted-foreground space-y-1 font-mono bg-muted/30 px-2 py-1 rounded">
                        <p>{accName || 'From'}: {formatCurrency(balance.before)} → {formatCurrency(balance.after)}</p>
                        {typeof balance.toBefore === 'number' && typeof balance.toAfter === 'number' && (
                          <p>{toAccName || 'To'}: {formatCurrency(balance.toBefore)} → {formatCurrency(balance.toAfter)}</p>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-1 pt-1 border-t border-border/40">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-xl hover:bg-secondary"
                        onClick={() => onEdit(tx)}
                        aria-label="Edit transaction"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-xl text-muted-foreground hover:text-expense hover:bg-secondary"
                        onClick={() => onDelete(tx.id)}
                        aria-label="Delete transaction"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="hidden md:flex items-center gap-4 p-4 card-premium hover-scale-subtle relative overflow-hidden pl-6 group">
                    <div 
                      className="absolute left-0 top-0 bottom-0 w-1.5" 
                      style={{ 
                        backgroundColor: tx.type === 'income' 
                          ? 'hsl(var(--income))' 
                          : tx.type === 'expense' 
                          ? 'hsl(var(--expense))' 
                          : 'hsl(var(--transfer))' 
                      }} 
                    />
                    <div className={`w-10 h-10 rounded-xl ${cfg.bgClass} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                      <Icon className={`w-5 h-5 ${cfg.colorClass}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate text-foreground">
                        {title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {subtitle}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate mt-1">
                        {formatTransactionTime(tx.date)}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-[10px] text-muted-foreground leading-none mb-1.5">
                          {formatTransactionDate(tx.date)}
                        </p>
                        <span className={`font-mono font-bold text-sm ${cfg.colorClass}`}>
                          {cfg.sign}{formatCurrency(entry.amount)}
                        </span>
                        {balance && tx.type !== 'transfer' && (
                          <p className="text-[10px] text-muted-foreground leading-none mt-1.5 font-mono">
                            {formatCurrency(balance.before)} → {formatCurrency(balance.after)}
                          </p>
                        )}
                        {balance && tx.type === 'transfer' && (
                          <div className="text-[10px] text-muted-foreground leading-tight mt-1.5 font-mono">
                            <p>{accName || 'From'}: {formatCurrency(balance.before)} → {formatCurrency(balance.after)}</p>
                            {typeof balance.toBefore === 'number' && typeof balance.toAfter === 'number' && (
                              <p className="mt-0.5">{toAccName || 'To'}: {formatCurrency(balance.toBefore)} → {formatCurrency(balance.toAfter)}</p>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground"
                          onClick={() => onEdit(tx)}
                          aria-label="Edit transaction"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-xl text-muted-foreground hover:text-expense hover:bg-secondary"
                          onClick={() => onDelete(tx.id)}
                          aria-label="Delete transaction"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
