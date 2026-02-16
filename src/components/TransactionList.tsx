import { Transaction, Category, Account } from '@/types/finance';
import { format } from 'date-fns';
import { ArrowUpRight, ArrowDownRight, ArrowLeftRight, Trash2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  transactions: Transaction[];
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

export function TransactionList({ transactions, categories, accounts, onDelete, onEdit, searchQuery, filterAccount, filterCategory }: Props) {
  let filtered = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter((t) => {
      const cat = categories.find((c) => c.id === t.categoryId)?.name || '';
      return (
        (t.note && t.note.toLowerCase().includes(q)) ||
        cat.toLowerCase().includes(q) ||
        t.amount.toString().includes(q)
      );
    });
  }
  if (filterAccount) {
    filtered = filtered.filter((t) => t.accountId === filterAccount || t.toAccountId === filterAccount);
  }
  if (filterCategory) {
    filtered = filtered.filter((t) => t.categoryId === filterCategory);
  }

  if (filtered.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-sm">No transactions yet</p>
      </div>
    );
  }

  // Group by date
  const grouped: Record<string, Transaction[]> = {};
  filtered.forEach((t) => {
    const key = t.date.slice(0, 10);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(t);
  });

  return (
    <div className="space-y-4 animate-fade-in">
      {Object.entries(grouped).map(([date, txs]) => (
        <div key={date}>
          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
            {format(new Date(date), 'EEE, MMM d')}
          </p>
          <div className="space-y-1.5">
            {txs.map((tx) => {
              const cfg = typeConfig[tx.type];
              const Icon = cfg.icon;
              const catName = categories.find((c) => c.id === tx.categoryId)?.name;
              const accName = accounts.find((a) => a.id === tx.accountId)?.name;
              const toAccName = accounts.find((a) => a.id === tx.toAccountId)?.name;
              const description = tx.note?.trim();
              const fallbackTitle = tx.type === 'transfer'
                ? `${accName} → ${toAccName}`
                : catName || 'Uncategorized';
              const title = description || fallbackTitle;
              const subtitle = tx.type === 'transfer'
                ? `${accName} → ${toAccName}`
                : [catName || 'Uncategorized', accName].filter(Boolean).join(' · ');

              return (
                <div key={tx.id} className="flex items-center gap-3 p-3 rounded-lg bg-card border hover:border-primary/20 transition-colors group">
                  <div className={`w-8 h-8 rounded-lg ${cfg.bgClass} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-4 h-4 ${cfg.colorClass}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {subtitle}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`font-mono font-semibold text-sm ${cfg.colorClass}`}>
                      {cfg.sign}{formatCurrency(tx.amount)}
                    </span>
                    <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(tx)}>
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-expense" onClick={() => onDelete(tx.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
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
