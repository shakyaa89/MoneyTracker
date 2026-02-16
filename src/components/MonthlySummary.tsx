import { Transaction } from '@/types/finance';
import { ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';

interface Props {
  transactions: Transaction[];
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n);
}

export function MonthlySummary({ transactions }: Props) {
  const income = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expenses = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const net = income - expenses;

  return (
    <div className="grid grid-cols-3 gap-3 animate-slide-up">
      <div className="rounded-xl bg-income-muted p-3">
        <div className="flex items-center gap-1.5 mb-1">
          <ArrowUpRight className="w-3.5 h-3.5 text-income" />
          <span className="text-xs font-medium text-muted-foreground">Income</span>
        </div>
        <p className="font-mono font-bold text-sm text-income">{formatCurrency(income)}</p>
      </div>
      <div className="rounded-xl bg-expense-muted p-3">
        <div className="flex items-center gap-1.5 mb-1">
          <ArrowDownRight className="w-3.5 h-3.5 text-expense" />
          <span className="text-xs font-medium text-muted-foreground">Expenses</span>
        </div>
        <p className="font-mono font-bold text-sm text-expense">{formatCurrency(expenses)}</p>
      </div>
      <div className="rounded-xl bg-muted p-3">
        <div className="flex items-center gap-1.5 mb-1">
          <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">Net</span>
        </div>
        <p className={`font-mono font-bold text-sm ${net >= 0 ? 'text-income' : 'text-expense'}`}>{formatCurrency(net)}</p>
      </div>
    </div>
  );
}
