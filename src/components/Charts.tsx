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
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Expenses by Category</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-40 text-muted-foreground text-sm">
          No expense data
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Expenses by Category</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-2 mt-2">
          {data.map((d, i) => (
            <div key={d.name} className="flex items-center gap-1.5 text-xs">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
              <span className="text-muted-foreground">{d.name}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
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
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Income vs Expenses ({year})</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={months}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.5rem',
                fontSize: '12px',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Bar dataKey="Income" fill="hsl(var(--income))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Expenses" fill="hsl(var(--expense))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
