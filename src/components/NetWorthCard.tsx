import { Account } from '@/types/finance';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Plus, Trash2, Pencil, Banknote, Building2, CreditCard, Wallet } from 'lucide-react';
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
  onUpdateAccount?: (id: string, updates: Partial<Account>) => void;
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

export function NetWorthCard({ accounts, netWorth, onAddAccount, onUpdateAccount, onDeleteAccount, readOnly }: Props) {
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('bank');
  const [balance, setBalance] = useState('');

  const accountTypeOptions: Array<{ value: AccountType; label: string; icon: typeof Banknote }> = [
    { value: 'cash', label: 'Cash', icon: Banknote },
    { value: 'bank', label: 'Bank', icon: Building2 },
    { value: 'card', label: 'Card', icon: CreditCard },
    { value: 'wallet', label: 'Wallet', icon: Wallet },
  ];

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
    setAddOpen(false);
  };

  const handleStartEdit = (account: Account) => {
    setEditingAccountId(account.id);
    setName(account.name);
    setType(account.type);
    setBalance(account.balance.toString());
    setEditOpen(true);
  };

  const handleUpdate = () => {
    if (!editingAccountId || !name.trim()) return;
    const bal = parseFloat(balance);
    if (Number.isNaN(bal) || bal < 0) return;
    onUpdateAccount?.(editingAccountId, {
      name: name.trim(),
      type,
      balance: bal,
    });
    setEditOpen(false);
    setEditingAccountId('');
    setName('');
    setType('bank');
    setBalance('');
  };

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="rounded-2xl p-5 sm:p-6 networth-card-gradient shadow-md relative overflow-hidden group hover:scale-[1.01] transition-all duration-300">
        <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
          <Wallet className="w-40 h-40" />
        </div>
        <div className="flex items-center gap-2 text-primary mb-1.5">
          <TrendingUp className="w-4.5 h-4.5" />
          <span className="text-xs font-bold uppercase tracking-widest">Net Worth Balance</span>
        </div>
        <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-mono">
          {formatCurrency(netWorth)}
        </p>
      </div>

      {!readOnly && (
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Accounts</h3>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 gap-1 text-xs rounded-xl shadow-sm">
                <Plus className="w-3.5 h-3.5" /> Add Account
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl max-w-sm">
              <DialogHeader>
                <DialogTitle>Add Account</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Savings" className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={type} onValueChange={(v) => setType(v as AccountType)}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {accountTypeOptions.map((option) => {
                        const Icon = option.icon;
                        return (
                          <SelectItem key={option.value} value={option.value}>
                            <span className="inline-flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              {option.label}
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Starting Balance</Label>
                  <Input type="number" value={balance} onChange={(e) => setBalance(e.target.value)} placeholder="0" className="rounded-xl" />
                </div>
                <Button onClick={handleAdd} className="w-full rounded-xl">Add Account</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog
            open={editOpen}
            onOpenChange={(open) => {
              setEditOpen(open);
              if (!open) {
                setEditingAccountId('');
                setName('');
                setType('bank');
                setBalance('');
              }
            }}
          >
            <DialogContent className="rounded-2xl max-w-sm">
              <DialogHeader>
                <DialogTitle>Edit Account</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Savings" className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={type} onValueChange={(v) => setType(v as AccountType)}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {accountTypeOptions.map((option) => {
                        const Icon = option.icon;
                        return (
                          <SelectItem key={option.value} value={option.value}>
                            <span className="inline-flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              {option.label}
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Balance</Label>
                  <Input type="number" value={balance} onChange={(e) => setBalance(e.target.value)} placeholder="0" className="rounded-xl" />
                </div>
                <Button onClick={handleUpdate} className="w-full rounded-xl">Save Changes</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
      {readOnly && (
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Accounts</h3>
      )}

      <div className="grid gap-2 sm:gap-2.5">
        {accounts.map((account) => (
          <div key={account.id} className="card-premium p-3.5 sm:p-4 flex items-center justify-between hover-scale-subtle">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground flex-shrink-0">
                {(() => {
                  const match = accountTypeOptions.find((option) => option.value === account.type);
                  const Icon = match?.icon || Banknote;
                  return <Icon className="h-4.5 w-4.5 text-muted-foreground" />;
                })()}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-xs sm:text-sm truncate">{account.name}</p>
                <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider leading-none mt-0.5">{account.type}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`font-mono font-bold text-xs sm:text-sm ${account.balance >= 0 ? 'text-income' : 'text-expense'}`}>
                {formatCurrency(account.balance)}
              </span>
              {!readOnly && onUpdateAccount && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-xl text-muted-foreground hover:bg-secondary"
                  onClick={() => handleStartEdit(account)}
                  aria-label={`Edit ${account.name}`}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
              )}
              {!readOnly && onDeleteAccount && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-xl text-muted-foreground hover:text-expense hover:bg-secondary"
                  onClick={() => onDeleteAccount(account.id)}
                  aria-label={`Delete ${account.name}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
