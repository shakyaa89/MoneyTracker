import { useState, useEffect } from 'react';
import { Transaction, TransactionType, Category, Account } from '@/types/finance';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  accounts: Account[];
  onSave: (tx: Transaction) => Promise<boolean> | boolean;
  editTransaction?: Transaction | null;
}

export function TransactionDialog({ open, onOpenChange, categories, accounts, onSave, editTransaction }: Props) {
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');

  useEffect(() => {
    if (editTransaction) {
      setType(editTransaction.type);
      setAmount(editTransaction.amount.toString());
      setCategoryId(editTransaction.categoryId || '');
      setAccountId(editTransaction.accountId);
      setToAccountId(editTransaction.toAccountId || '');
      setDate(editTransaction.date.slice(0, 10));
      setNote(editTransaction.note || '');
    } else {
      setType('expense');
      setAmount('');
      setCategoryId('');
      setAccountId(accounts[0]?.id || '');
      setToAccountId('');
      setDate(new Date().toISOString().slice(0, 10));
      setNote('');
    }
  }, [editTransaction, open, accounts]);

  const filteredCategories = categories.filter((c) => c.type === type);

  const handleSave = async () => {
    const parsedAmount = parseFloat(amount);
    const description = note.trim();
    if (!parsedAmount || parsedAmount <= 0) return;
    if (!accountId) return;
    if (type !== 'transfer' && !categoryId) return;
    if (type === 'transfer' && !toAccountId) return;
    if (!description) return;

    const saved = await onSave({
      id: editTransaction?.id || crypto.randomUUID(),
      date,
      type,
      amount: parsedAmount,
      categoryId: type !== 'transfer' ? categoryId : undefined,
      accountId,
      toAccountId: type === 'transfer' ? toAccountId : undefined,
      note: description,
    });
    if (saved) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editTransaction ? 'Edit' : 'Add'} Transaction</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {/* Type selector */}
          <div className="grid grid-cols-3 gap-2">
            {(['income', 'expense', 'transfer'] as TransactionType[]).map((t) => (
              <Button
                key={t}
                variant={type === t ? 'default' : 'outline'}
                size="sm"
                onClick={() => setType(t)}
                className={type === t ? (t === 'income' ? 'bg-income hover:bg-income/90 text-income-foreground' : t === 'expense' ? 'bg-expense hover:bg-expense/90 text-expense-foreground' : 'bg-transfer hover:bg-transfer/90 text-transfer-foreground') : ''}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Button>
            ))}
          </div>

          <div className="space-y-2">
            <Label>Amount</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="font-mono text-lg"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>{type === 'transfer' ? 'From Account' : 'Account'}</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {type === 'transfer' && (
            <div className="space-y-2">
              <Label>To Account</Label>
              <Select value={toAccountId} onValueChange={setToAccountId}>
                <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                <SelectContent>
                  {accounts.filter((a) => a.id !== accountId).map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {type !== 'transfer' && (
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {filteredCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What is this transaction for?"
              rows={2}
            />
          </div>

          <Button onClick={handleSave} className="w-full">
            {editTransaction ? 'Update' : 'Add'} Transaction
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
