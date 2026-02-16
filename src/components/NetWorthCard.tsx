import { Account, ACCOUNT_TYPE_ICONS } from '@/types/finance';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { AccountType } from '@/types/finance';

interface Props {
  accounts: Account[];
  netWorth: number;
  onAddAccount?: (account: Account) => void;
  onDeleteAccount?: (id: string) => void;
  readOnly?: boolean;
}

function formatCurrency(amount: number) {
  const absValue = Math.abs(amount);
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(absValue);
  return `${amount < 0 ? '-' : ''}Rs.${formatted}`;
}

export function NetWorthCard({ accounts, netWorth, onAddAccount, onDeleteAccount, readOnly }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('bank');
  const [balance, setBalance] = useState('');

  const handleAdd = () => {
    if (!name.trim()) return;
    const bal = parseFloat(balance) || 0;
    if (bal < 0) return;
    onAddAccount?.({
      id: crypto.randomUUID(),
      name: name.trim(),
      type,
      balance: bal,
    });
    setName('');
    setType('bank');
    setBalance('');
    setOpen(false);
  };

  return (
    <div className="space-y-4 animate-slide-up">
      <Card className="border-0 bg-primary/10">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium uppercase tracking-wider">Net Worth</span>
          </div>
          <p className="text-3xl font-bold tracking-tight text-foreground font-mono">
            {formatCurrency(netWorth)}
          </p>
        </CardContent>
      </Card>

      {!readOnly && (
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Accounts</h3>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                <Plus className="w-3 h-3" /> Add
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Account</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Savings" />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={type} onValueChange={(v) => setType(v as AccountType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">💵 Cash</SelectItem>
                      <SelectItem value="bank">🏦 Bank</SelectItem>
                      <SelectItem value="card">💳 Card</SelectItem>
                      <SelectItem value="wallet">👛 Wallet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Starting Balance</Label>
                  <Input type="number" value={balance} onChange={(e) => setBalance(e.target.value)} placeholder="0" />
                </div>
                <Button onClick={handleAdd} className="w-full">Add Account</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
      {readOnly && (
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Accounts</h3>
      )}

      <div className="grid gap-2">
        {accounts.map((account) => (
          <Card key={account.id} className="border shadow-none">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">{ACCOUNT_TYPE_ICONS[account.type]}</span>
                <div>
                  <p className="font-medium text-sm">{account.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{account.type}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`font-mono font-semibold text-sm ${account.balance >= 0 ? 'text-income' : 'text-expense'}`}>
                  {formatCurrency(account.balance)}
                </span>
                {!readOnly && onDeleteAccount && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-expense"
                    onClick={() => onDeleteAccount(account.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
