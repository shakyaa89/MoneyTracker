import { useState } from 'react';
import { Category } from '@/types/finance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, Pencil } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface Props {
  categories: Category[];
  onAdd: (cat: Category) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Category>) => void;
}

export function CategoryManager({ categories, onAdd, onDelete, onUpdate }: Props) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [editOpen, setEditOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState('');
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<'income' | 'expense'>('expense');

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

  const handleStartEdit = (category: Category) => {
    setEditingCategoryId(category.id);
    setEditName(category.name);
    setEditType(category.type);
    setEditOpen(true);
  };

  const handleUpdate = () => {
    if (!editingCategoryId || !editName.trim()) return;
    onUpdate(editingCategoryId, {
      name: editName.trim(),
      type: editType,
    });
    setEditOpen(false);
    setEditingCategoryId('');
    setEditName('');
    setEditType('expense');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="card-premium p-5 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Add Category</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Category name"
            className="flex-1 rounded-xl"
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <Select value={type} onValueChange={(v) => setType(v as 'income' | 'expense')}>
            <SelectTrigger className="w-full sm:w-32 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="income" className="rounded-lg">Income</SelectItem>
              <SelectItem value="expense" className="rounded-lg">Expense</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleAdd} className="rounded-xl gap-2 font-semibold shadow-sm px-5">
            <Plus className="w-4 h-4" /> Add
          </Button>
        </div>
      </div>

      {[
        { title: 'Income Categories', cats: incomeCategories, colorClass: 'text-income' },
        { title: 'Expense Categories', cats: expenseCategories, colorClass: 'text-expense' },
      ].map(({ title, cats, colorClass }) => (
        <div key={title} className="space-y-2">
          <h4 className={`text-xs font-bold uppercase tracking-wider ${colorClass}`}>{title}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {cats.map((c) => (
              <div key={c.id} className="card-premium p-3.5 flex items-center justify-between hover-scale-subtle">
                <span className="text-sm font-semibold">{c.name}</span>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-muted-foreground hover:bg-secondary" onClick={() => handleStartEdit(c)} aria-label={`Edit ${c.name}`}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-muted-foreground hover:text-expense hover:bg-secondary" onClick={() => onDelete(c.id)} aria-label={`Delete ${c.name}`}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
            {cats.length === 0 && (
              <p className="text-xs text-muted-foreground py-2 col-span-full italic">No categories created yet</p>
            )}
          </div>
        </div>
      ))}

      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) {
            setEditingCategoryId('');
            setEditName('');
            setEditType('expense');
          }
        }}
      >
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Category name" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={editType} onValueChange={(v) => setEditType(v as 'income' | 'expense')}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="income" className="rounded-lg">Income</SelectItem>
                  <SelectItem value="expense" className="rounded-lg">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleUpdate} className="w-full rounded-xl">Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
