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
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (editTransaction) {
      setType(editTransaction.type);
      setAmount(editTransaction.amount.toString());
      setCategoryId(editTransaction.categoryId || '');
      setAccountId(editTransaction.accountId);
      setToAccountId(editTransaction.toAccountId || '');
      setDate(editTransaction.date.slice(0, 10));
      setNote(editTransaction.note || '');
      setValidationError('');
    } else {
      setType('expense');
      setAmount('');
      setCategoryId('');
      setAccountId(accounts[0]?.id || '');
      setToAccountId('');
      setDate(new Date().toISOString().slice(0, 10));
      setNote('');
      setValidationError('');
    }
  }, [editTransaction, open, accounts]);

  const filteredCategories = categories.filter((c) => c.type === type);

  const getValidationError = () => {
    const parsedAmount = parseFloat(amount);
    const description = note.trim();

    if (!amount.trim() || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      return 'Please enter a valid amount greater than 0.';
    }
    if (!date) {
      return 'Please select a date.';
    }
    if (!accountId) {
      return `Please select ${type === 'transfer' ? 'a from account' : 'an account'}.`;
    }
    if (type === 'transfer' && !toAccountId) {
      return 'Please select a to account.';
    }
    if (type !== 'transfer' && !categoryId) {
      return 'Please select a category.';
    }
    if (!description) {
      return 'Please enter a description.';
    }

    return null;
  };

  const handleSave = async () => {
    const error = getValidationError();
    if (error) {
      setValidationError(error);
      return;
    }

    setValidationError('');
    const parsedAmount = parseFloat(amount);
    const description = note.trim();

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
              onChange={(e) => {
                setAmount(e.target.value);
                if (validationError) setValidationError('');
              }}
              placeholder="0.00"
              className="font-mono text-lg"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>Date</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                if (validationError) setValidationError('');
              }}
            />
          </div>

          <div className="space-y-2">
            <Label>{type === 'transfer' ? 'From Account' : 'Account'}</Label>
            <Select
              value={accountId}
              onValueChange={(value) => {
                setAccountId(value);
                if (validationError) setValidationError('');
              }}
            >
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
              <Select
                value={toAccountId}
                onValueChange={(value) => {
                  setToAccountId(value);
                  if (validationError) setValidationError('');
                }}
              >
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
              <Select
                value={categoryId}
                onValueChange={(value) => {
                  setCategoryId(value);
                  if (validationError) setValidationError('');
                }}
              >
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
              onChange={(e) => {
                setNote(e.target.value);
                if (validationError) setValidationError('');
              }}
              placeholder="What is this transaction for?"
              rows={2}
            />
          </div>

          {validationError && (
            <p className="text-sm text-destructive">{validationError}</p>
          )}

          <Button onClick={handleSave} className="w-full">
            {editTransaction ? 'Update' : 'Add'} Transaction
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
