import { Transaction, Category, Account } from '@/types/finance';
import { format } from 'date-fns';
import { ArrowUpRight, ArrowDownRight, ArrowLeftRight, Trash2, Pencil, SearchX, Inbox } from 'lucide-react';
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
    const isFiltered = !!(searchQuery || filterAccount || filterCategory);
    return (
      <div className="card-premium p-8 text-center flex flex-col items-center justify-center max-w-md mx-auto my-6">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-4">
          {isFiltered ? <SearchX className="w-6 h-6" /> : <Inbox className="w-6 h-6" />}
        </div>
        <h3 className="text-sm font-semibold text-foreground">
          {isFiltered ? 'No search results' : 'No transactions yet'}
        </h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
          {isFiltered
            ? 'We couldn\'t find any transactions matching your filters. Try adjusting your query or category/account filters.'
            : 'Get started by logging your first transaction for this month using the Add button.'}
        </p>
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
                  {/* Redesigned Mobile layout */}
                  <div className="md:hidden rounded-2xl bg-card/60 hover:bg-card/90 border border-border/60 hover:border-primary/20 shadow-sm hover:shadow-md transition-all duration-300 p-4 space-y-3 relative overflow-hidden group">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                          tx.type === 'income' 
                            ? 'bg-income-muted text-income' 
                            : tx.type === 'expense' 
                            ? 'bg-expense-muted text-expense' 
                            : 'bg-transfer-muted text-transfer'
                        }`}>
                          <Icon className="w-4.5 h-4.5 stroke-[2.5]" />
                        </div>
                        <div className="min-w-0 space-y-1">
                          <p className="text-sm font-bold text-foreground leading-snug break-words tracking-tight">
                            {title}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {tx.type !== 'transfer' && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-primary/10 text-primary border border-primary/20">
                                {catName || 'Uncategorized'}
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-secondary text-secondary-foreground font-mono">
                              {tx.type === 'transfer' ? `${accName} → ${toAccName}` : accName}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className={`font-mono font-extrabold text-sm ${cfg.colorClass} whitespace-nowrap`}>
                          {cfg.sign}{formatCurrency(entry.amount)}
                        </span>
                      </div>
                    </div>

                    {balance && (
                      <div className="text-[10px] text-muted-foreground font-mono bg-muted/40 border border-border/40 px-2.5 py-1.5 rounded-xl space-y-1">
                        {tx.type !== 'transfer' ? (
                          <div className="flex items-center justify-between">
                            <span>Balance Shift</span>
                            <span className="font-semibold text-foreground/80">
                              {formatCurrency(balance.before)} → {formatCurrency(balance.after)}
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span>{accName} (From)</span>
                              <span className="font-semibold text-foreground/80">
                                {formatCurrency(balance.before)} → {formatCurrency(balance.after)}
                              </span>
                            </div>
                            {typeof balance.toBefore === 'number' && typeof balance.toAfter === 'number' && (
                              <div className="flex items-center justify-between">
                                <span>{toAccName} (To)</span>
                                <span className="font-semibold text-foreground/80">
                                  {formatCurrency(balance.toBefore)} → {formatCurrency(balance.toAfter)}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-border/40">
                      <div className="text-[10px] text-muted-foreground font-medium">
                        {formatTransactionDate(tx.date)} at {formatTransactionTime(tx.date)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg hover:bg-secondary hover:text-foreground text-muted-foreground"
                          onClick={() => onEdit(tx)}
                          aria-label="Edit transaction"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-expense hover:bg-expense/10"
                          onClick={() => onDelete(tx.id)}
                          aria-label="Delete transaction"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Redesigned Desktop layout */}
                  <div className="hidden md:flex items-center gap-4 p-4 rounded-2xl bg-card/60 hover:bg-card/90 border border-border/60 hover:border-primary/20 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
                    <div className={`w-10 h-10 rounded-xl ${
                      tx.type === 'income' 
                        ? 'bg-income-muted text-income' 
                        : tx.type === 'expense' 
                        ? 'bg-expense-muted text-expense' 
                        : 'bg-transfer-muted text-transfer'
                    } flex items-center justify-center flex-shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-105`}>
                      <Icon className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold truncate text-foreground tracking-tight">
                          {title}
                        </p>
                        <span className="text-[10px] text-muted-foreground font-medium shrink-0">
                          {formatTransactionTime(tx.date)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1.5 mt-1">
                        {tx.type !== 'transfer' && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-primary/10 text-primary border border-primary/20 tracking-wide">
                            {catName || 'Uncategorized'}
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-secondary text-secondary-foreground font-mono">
                          {tx.type === 'transfer' ? `${accName} → ${toAccName}` : accName}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      {balance && (
                        <div className="text-[10px] text-muted-foreground font-mono bg-muted/40 border border-border/40 px-3 py-1.5 rounded-xl text-right max-w-xs leading-normal">
                          {tx.type !== 'transfer' ? (
                            <p>Balance: <span className="font-semibold text-foreground/80">{formatCurrency(balance.before)} → {formatCurrency(balance.after)}</span></p>
                          ) : (
                            <div className="space-y-0.5">
                              <p>{accName}: <span className="font-semibold text-foreground/80">{formatCurrency(balance.before)} → {formatCurrency(balance.after)}</span></p>
                              {typeof balance.toBefore === 'number' && typeof balance.toAfter === 'number' && (
                                <p>{toAccName}: <span className="font-semibold text-foreground/80">{formatCurrency(balance.toBefore)} → {formatCurrency(balance.toAfter)}</span></p>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="text-right">
                        <p className="text-[10px] text-muted-foreground font-medium mb-1">
                          {formatTransactionDate(tx.date)}
                        </p>
                        <span className={`font-mono font-extrabold text-sm ${cfg.colorClass} whitespace-nowrap`}>
                          {cfg.sign}{formatCurrency(entry.amount)}
                        </span>
                      </div>
                      
                      <div className="flex opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-1 group-hover:translate-x-0 gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"
                          onClick={() => onEdit(tx)}
                          aria-label="Edit transaction"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-expense hover:bg-expense/10"
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
