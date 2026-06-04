import { Transaction, Category } from '@/types/finance';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, AreaChart, Area } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { parseFinanceDate } from '@/lib/dateTime';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(35, 90%, 55%)',
  'hsl(262, 60%, 55%)',
  'hsl(152, 60%, 42%)',
  'hsl(0, 72%, 55%)',
  'hsl(200, 70%, 50%)',
  'hsl(320, 60%, 50%)',
  'hsl(50, 80%, 50%)',
  'hsl(100, 50%, 45%)',
  'hsl(280, 50%, 60%)',
];

interface PieProps {
  transactions: Transaction[];
  categories: Category[];
}

export function ExpensePieChart({ transactions, categories }: PieProps) {
  const expenses = transactions.filter((t) => t.type === 'expense');
  const byCategory: Record<string, number> = {};
  expenses.forEach((t) => {
    const key = t.categoryId || 'other';
    byCategory[key] = (byCategory[key] || 0) + t.amount;
  });

  const data = Object.entries(byCategory).map(([catId, amount]) => ({
    name: categories.find((c) => c.id === catId)?.name || 'Other',
    value: amount,
  }));

  if (data.length === 0) {
    return (
      <div className="card-premium p-4 sm:p-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Expenses by Category</h3>
        <div className="flex items-center justify-center h-40 text-muted-foreground text-xs italic">
          No expense data
        </div>
      </div>
    );
  }

  return (
    <div className="card-premium p-4 sm:p-5 space-y-4">
      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Expenses by Category</h3>
      <div>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => `Rs.${value.toLocaleString('en-IN')}`} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-2">
          {data.map((d, i) => (
            <div key={d.name} className="flex items-center gap-1.5 text-[11px]">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
              <span className="text-muted-foreground font-medium">{d.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface BarProps {
  allTransactions: Transaction[];
  year: number;
}

export function IncomeExpenseBarChart({ allTransactions, year }: BarProps) {
  const months = Array.from({ length: 12 }, (_, i) => {
    const monthTx = allTransactions.filter((t) => {
      const d = parseFinanceDate(t.date);
      return d ? d.getFullYear() === year && d.getMonth() === i : false;
    });
    const income = monthTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = monthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return {
      month: new Date(year, i).toLocaleString('default', { month: 'short' }),
      Income: income,
      Expenses: expense,
    };
  });

  return (
    <div className="card-premium p-4 sm:p-5 space-y-4">
      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Income vs Expenses ({year})</h3>
      <div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={months}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.75rem',
                fontSize: '11px',
              }}
              formatter={(value: number) => `Rs.${value.toLocaleString('en-IN')}`}
            />
            <Legend wrapperStyle={{ fontSize: '11px' }} />
            <Bar dataKey="Income" fill="hsl(var(--income))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Expenses" fill="hsl(var(--expense))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function IncomePieChart({ transactions, categories }: PieProps) {
  const income = transactions.filter((t) => t.type === 'income');
  const byCategory: Record<string, number> = {};
  income.forEach((t) => {
    const key = t.categoryId || 'other';
    byCategory[key] = (byCategory[key] || 0) + t.amount;
  });

  const data = Object.entries(byCategory).map(([catId, amount]) => ({
    name: categories.find((c) => c.id === catId)?.name || 'Other',
    value: amount,
  }));

  if (data.length === 0) {
    return (
      <div className="card-premium p-4 sm:p-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Income by Category</h3>
        <div className="flex items-center justify-center h-40 text-muted-foreground text-xs italic">
          No income data
        </div>
      </div>
    );
  }

  return (
    <div className="card-premium p-4 sm:p-5 space-y-4">
      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Income by Category</h3>
      <div>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[(i + 3) % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => `Rs.${value.toLocaleString('en-IN')}`} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-2">
          {data.map((d, i) => (
            <div key={d.name} className="flex items-center gap-1.5 text-[11px]">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[(i + 3) % COLORS.length] }} />
              <span className="text-muted-foreground font-medium">{d.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface DailyProps {
  transactions: Transaction[];
  year: number;
  month: number;
}

export function DailySpendingChart({ transactions, year, month }: DailyProps) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const expenses = transactions.filter((t) => t.type === 'expense');
  
  const dailyData = Array.from({ length: daysInMonth }, (_, idx) => {
    const day = idx + 1;
    const dayString = day.toString().padStart(2, '0');
    const monthString = (month + 1).toString().padStart(2, '0');
    const targetDateStr = `${year}-${monthString}-${dayString}`;
    
    const dayExpenses = expenses
      .filter((t) => t.date.startsWith(targetDateStr))
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      day: day.toString(),
      Amount: dayExpenses,
    };
  });

  const totalSpent = expenses.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="card-premium p-4 sm:p-5 space-y-4 lg:col-span-2">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Daily Spending Timeline</h3>
          <p className="text-[10px] text-muted-foreground font-mono">Day-by-day expense breakdown</p>
        </div>
        <div className="text-right">
          <span className="text-xs font-semibold text-muted-foreground">Total Spent: </span>
          <span className="text-xs font-bold text-expense">Rs.{totalSpent.toLocaleString('en-IN')}</span>
        </div>
      </div>
      <div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={dailyData}>
            <defs>
              <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--expense))" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="hsl(var(--expense))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="day" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.75rem',
                fontSize: '11px',
              }}
              formatter={(value: number) => `Rs.${value.toLocaleString('en-IN')}`}
            />
            <Area type="monotone" dataKey="Amount" stroke="hsl(var(--expense))" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function NetSavingsLineChart({ allTransactions, year }: BarProps) {
  const monthsData = Array.from({ length: 12 }, (_, i) => {
    const monthTx = allTransactions.filter((t) => {
      const d = parseFinanceDate(t.date);
      return d ? d.getFullYear() === year && d.getMonth() === i : false;
    });
    const income = monthTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = monthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return {
      month: new Date(year, i).toLocaleString('default', { month: 'short' }),
      'Net Savings': income - expense,
    };
  });

  return (
    <div className="card-premium p-4 sm:p-5 space-y-4">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Monthly Net Savings ({year})</h3>
        <p className="text-[10px] text-muted-foreground font-mono">Net wealth growth rate (Income minus Expenses)</p>
      </div>
      <div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={monthsData}>
            <defs>
              <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.75rem',
                fontSize: '11px',
              }}
              formatter={(value: number) => `Rs.${value.toLocaleString('en-IN')}`}
            />
            <Area type="monotone" dataKey="Net Savings" stroke="hsl(var(--primary))" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSavings)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
