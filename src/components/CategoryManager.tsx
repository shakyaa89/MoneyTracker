import { useState } from 'react';
import { Category } from '@/types/finance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  categories: Category[];
  onAdd: (cat: Category) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Category>) => void;
}

export function CategoryManager({ categories, onAdd, onDelete, onUpdate }: Props) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd({
      id: crypto.randomUUID(),
      name: name.trim(),
      type,
    });
    setName('');
  };

  const incomeCategories = categories.filter((c) => c.type === 'income');
  const expenseCategories = categories.filter((c) => c.type === 'expense');

  return (
    <div className="space-y-4 animate-fade-in">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Add Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Category name"
              className="flex-1"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <Select value={type} onValueChange={(v) => setType(v as 'income' | 'expense')}>
              <SelectTrigger className="w-full sm:w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
            <Button size="icon" className="w-full sm:w-10" onClick={handleAdd}><Plus className="w-4 h-4" /></Button>
          </div>
        </CardContent>
      </Card>

      {[
        { title: 'Income Categories', cats: incomeCategories, colorClass: 'text-income' },
        { title: 'Expense Categories', cats: expenseCategories, colorClass: 'text-expense' },
      ].map(({ title, cats, colorClass }) => (
        <div key={title}>
          <h4 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${colorClass}`}>{title}</h4>
          <div className="space-y-1">
            {cats.map((c) => (
              <div key={c.id} className="flex items-center justify-between p-2.5 rounded-lg bg-card border">
                <span className="text-sm">{c.name}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-expense" onClick={() => onDelete(c.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
