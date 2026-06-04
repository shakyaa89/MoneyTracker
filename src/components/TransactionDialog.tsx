import { useState, useEffect } from 'react';
import { Transaction, TransactionType, Category, Account } from '@/types/finance';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { nowLocalDateTimeString, normalizeFinanceDate, parseFinanceDate, splitFinanceDateTime } from '@/lib/dateTime';
import { cn } from '@/lib/utils';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  accounts: Account[];
  onSave: (tx: Transaction) => Promise<boolean> | boolean;
  editTransaction?: Transaction | null;
}

function getCurrentLocalDateValue() {
  return nowLocalDateTimeString().slice(0, 10);
}

function getCurrentLocalTimeValue() {
  return nowLocalDateTimeString().slice(11, 16);
}

export function TransactionDialog({ open, onOpenChange, categories, accounts, onSave, editTransaction }: Props) {
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [date, setDate] = useState(getCurrentLocalDateValue());
  const [time, setTime] = useState(getCurrentLocalTimeValue());
  const [note, setNote] = useState('');
  const [validationError, setValidationError] = useState('');
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)');
    setIsDesktop(media.matches);
    const listener = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  useEffect(() => {
    if (editTransaction) {
      setType(editTransaction.type);
      setAmount(editTransaction.amount.toString());
      setCategoryId(editTransaction.categoryId || '');
      setAccountId(editTransaction.accountId);
      setToAccountId(editTransaction.toAccountId || '');
      const dateParts = splitFinanceDateTime(editTransaction.date);
      setDate(dateParts.date);
      setTime(dateParts.time);
      setNote(editTransaction.note || '');
      setValidationError('');
    } else {
      setType('expense');
      setAmount('');
      setCategoryId('');
      setAccountId('');
      setToAccountId('');
      setDate(getCurrentLocalDateValue());
      setTime(getCurrentLocalTimeValue());
      setNote('');
      setValidationError('');
    }
  }, [editTransaction, open]);

  useEffect(() => {
    if (type === 'transfer') {
      setCategoryId('');
    }
  }, [type]);

  const filteredCategories = categories.filter((c) => c.type === type);

  const getValidationError = () => {
    const parsedAmount = parseFloat(amount);
    const description = note.trim();

    if (!amount.trim() || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      return 'Please enter a valid amount greater than 0.';
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return 'Please select a date.';
    }
    if (!/^\d{2}:\d{2}$/.test(time)) {
      return 'Please select a time.';
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
    const dateTime = normalizeFinanceDate(`${date}T${time}`);

    const saved = await onSave({
      id: editTransaction?.id || crypto.randomUUID(),
      date: dateTime,
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

  const formContent = (
    <div className="space-y-4 pt-2 pb-4">
      {/* Type selector */}
      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Transaction type">
        {(['income', 'expense', 'transfer'] as TransactionType[]).map((t) => (
          <Button
            key={t}
            variant={type === t ? 'default' : 'outline'}
            size="sm"
            type="button"
            role="radio"
            aria-checked={type === t}
            onClick={() => setType(t)}
            className={type === t ? (t === 'income' ? 'bg-income hover:bg-income/90 text-income-foreground font-semibold rounded-xl' : t === 'expense' ? 'bg-expense hover:bg-expense/90 text-expense-foreground font-semibold rounded-xl' : 'bg-transfer hover:bg-transfer/90 text-transfer-foreground font-semibold rounded-xl') : 'rounded-xl'}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </Button>
        ))}
      </div>

      <div className="space-y-2">
        <Label htmlFor="tx-amount">Amount</Label>
        <Input
          id="tx-amount"
          type="number"
          step="0.01"
          min="0"
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value);
            if (validationError) setValidationError('');
          }}
          placeholder="0.00"
          className="font-mono text-lg rounded-xl"
          autoFocus={isDesktop}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="tx-date">Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="tx-date"
                type="button"
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal rounded-xl',
                  !date && 'text-muted-foreground',
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(parseFinanceDate(date) || new Date(), 'PPP') : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-2xl" align="start">
              <Calendar
                mode="single"
                selected={parseFinanceDate(date) || undefined}
                onSelect={(selectedDate) => {
                  if (!selectedDate) return;
                  setDate(format(selectedDate, 'yyyy-MM-dd'));
                  if (validationError) setValidationError('');
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-2">
          <Label htmlFor="tx-time">Time</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="tx-time"
                type="button"
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal rounded-xl',
                  !time && 'text-muted-foreground',
                )}
              >
                <Clock className="mr-2 h-4 w-4" />
                {time || 'Pick a time'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-3 rounded-2xl" align="start">
              <Input
                id="tx-time-input"
                type="time"
                value={time}
                onChange={(e) => {
                  setTime(e.target.value);
                  if (validationError) setValidationError('');
                }}
                className="rounded-lg"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="space-y-2">
        <Label>{type === 'transfer' ? 'From Account' : 'Account'}</Label>
        <div className="flex flex-wrap gap-2">
          {accounts.map((a) => (
            <Button
              key={a.id}
              type="button"
              size="sm"
              variant={accountId === a.id ? 'default' : 'outline'}
              className="rounded-xl font-semibold"
              aria-pressed={accountId === a.id}
              onClick={() => {
                setAccountId(a.id);
                if (toAccountId === a.id) setToAccountId('');
                if (validationError) setValidationError('');
              }}
            >
              {a.name}
            </Button>
          ))}
        </div>
      </div>

      {type === 'transfer' && (
        <div className="space-y-2">
          <Label>To Account</Label>
          <div className="flex flex-wrap gap-2">
            {accounts.filter((a) => a.id !== accountId).map((a) => (
              <Button
                key={a.id}
                type="button"
                size="sm"
                variant={toAccountId === a.id ? 'default' : 'outline'}
                className="rounded-xl font-semibold"
                aria-pressed={toAccountId === a.id}
                onClick={() => {
                  setToAccountId(a.id);
                  if (validationError) setValidationError('');
                }}
              >
                {a.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      {type !== 'transfer' && (
        <div className="space-y-2">
          <Label>Category</Label>
          <div className="flex flex-wrap gap-2">
            {filteredCategories.map((c) => (
              <Button
                key={c.id}
                type="button"
                size="sm"
                variant={categoryId === c.id ? 'default' : 'outline'}
                className="rounded-xl font-semibold"
                aria-pressed={categoryId === c.id}
                onClick={() => {
                  setCategoryId(c.id);
                  if (validationError) setValidationError('');
                }}
              >
                {c.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="tx-note">Description</Label>
        <Textarea
          id="tx-note"
          value={note}
          onChange={(e) => {
            setNote(e.target.value);
            if (validationError) setValidationError('');
          }}
          placeholder="What is this transaction for?"
          rows={2}
          className="rounded-xl"
        />
      </div>

      {validationError && (
        <p className="text-sm text-destructive font-medium" role="alert">{validationError}</p>
      )}

      <Button onClick={handleSave} className="w-full rounded-xl py-5 font-bold shadow-md shadow-primary/10">
        {editTransaction ? 'Update' : 'Add'} Transaction
      </Button>
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editTransaction ? 'Edit' : 'Add'} Transaction</DialogTitle>
          </DialogHeader>
          {formContent}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="px-4 max-h-[90vh] rounded-t-2xl flex flex-col">
        <DrawerHeader className="text-left px-0 pb-2 flex-shrink-0">
          <DrawerTitle>{editTransaction ? 'Edit' : 'Add'} Transaction</DrawerTitle>
        </DrawerHeader>
        <div className="overflow-y-auto no-scrollbar flex-1 pb-6">
          {formContent}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
