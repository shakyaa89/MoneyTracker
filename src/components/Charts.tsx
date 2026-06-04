import { Transaction, Category } from '@/types/finance';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const COLORS = [
  'hsl(172, 66%, 40%)',
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
      const d = new Date(t.date);
      return d.getFullYear() === year && d.getMonth() === i;
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
