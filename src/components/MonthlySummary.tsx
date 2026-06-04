import { Transaction } from '@/types/finance';
import { ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';

interface Props {
  transactions: Transaction[];
}

function formatCurrency(n: number) {
  const absValue = Math.abs(n);
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(absValue);
  return `${n < 0 ? '-' : ''}Rs.${formatted}`;
}

export function MonthlySummary({ transactions }: Props) {
  const income = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expenses = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const net = income - expenses;

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3 animate-slide-up">
      <div className="rounded-xl bg-income-muted p-2.5 sm:p-3 flex flex-col justify-between">
        <div className="flex items-center gap-1 mb-1.5">
          <ArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-income flex-shrink-0" />
          <span className="text-[9px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground truncate">Income</span>
        </div>
        <p className="font-mono font-bold text-xs sm:text-sm text-income truncate">{formatCurrency(income)}</p>
      </div>
      <div className="rounded-xl bg-expense-muted p-2.5 sm:p-3 flex flex-col justify-between">
        <div className="flex items-center gap-1 mb-1.5">
          <ArrowDownRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-expense flex-shrink-0" />
          <span className="text-[9px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground truncate">Expenses</span>
        </div>
        <p className="font-mono font-bold text-xs sm:text-sm text-expense truncate">{formatCurrency(expenses)}</p>
      </div>
      <div className="rounded-xl bg-muted p-2.5 sm:p-3 flex flex-col justify-between">
        <div className="flex items-center gap-1 mb-1.5">
          <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-muted-foreground flex-shrink-0" />
          <span className="text-[9px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground truncate">Net</span>
        </div>
        <p className={`font-mono font-bold text-xs sm:text-sm truncate ${net >= 0 ? 'text-income' : 'text-expense'}`}>{formatCurrency(net)}</p>
      </div>
    </div>
  );
}
