import { useEffect, useState } from 'react';
import { useFinanceStore } from '@/hooks/useFinanceStore';
import { Transaction } from '@/types/finance';
import { NetWorthCard } from '@/components/NetWorthCard';
import { MonthNavigator } from '@/components/MonthNavigator';
import { MonthlySummary } from '@/components/MonthlySummary';
import { TransactionList } from '@/components/TransactionList';
import { TransactionDialog } from '@/components/TransactionDialog';
import { ExpensePieChart, IncomeExpenseBarChart } from '@/components/Charts';
import { CategoryManager } from '@/components/CategoryManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Download, Search, Wallet, Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  onLock?: () => void;
}

const Index = ({ onLock }: Props) => {
  const store = useFinanceStore();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [txDialogOpen, setTxDialogOpen] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAccount, setFilterAccount] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  useEffect(() => {
    if (store.error) {
      toast.error(store.error);
    }
  }, [store.error]);

  const monthTransactions = store.getMonthTransactions(year, month);

  const handleSaveTx = async (tx: Transaction) => {
    let error: string | null;
    if (editTx) {
      error = await store.updateTransaction(tx.id, tx);
    } else {
      error = await store.addTransaction(tx);
    }
    if (error) {
      toast.error(error);
      return false;
    }
    setEditTx(null);
    setTxDialogOpen(false);
    return true;
  };

  const handleEditTx = (tx: Transaction) => {
    setEditTx(tx);
    setTxDialogOpen(true);
  };

  if (store.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading your data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="hidden sm:block sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b">
        <div className="container flex items-center justify-between h-14 max-w-2xl">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-bold">MoneyTrack</h1>
          </div>
          <div className="flex items-center gap-2">
            {onLock && (
              <Button type="button" size="sm" variant="outline" onClick={onLock} className="gap-1.5">
                <Lock className="w-4 h-4" />
                <span>Lock</span>
              </Button>
            )}
            <Button size="sm" onClick={() => { setEditTx(null); setTxDialogOpen(true); }} className="gap-1.5">
              <Plus className="w-4 h-4" /> Add
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-2xl py-4 space-y-6 pb-24 sm:pb-20">
        {store.isSaving && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Syncing data...</span>
          </div>
        )}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full h-auto grid-cols-2 sm:grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="accounts">Accounts</TabsTrigger>
            <TabsTrigger value="charts">Charts</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>

          {/* Overview Tab - Net worth + monthly summary only */}
          <TabsContent value="overview" className="space-y-6">
            {/* Net worth summary (read-only) */}
            <NetWorthCard
              accounts={store.accounts}
              netWorth={store.netWorth}
              readOnly
            />
            <div>
              <MonthNavigator year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m); }} />
              <div className="mt-3">
                <MonthlySummary transactions={monthTransactions} />
              </div>
            </div>
            <ExpensePieChart transactions={monthTransactions} categories={store.categories} />
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-4">
            <MonthNavigator year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m); }} />
            <MonthlySummary transactions={monthTransactions} />
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-8 h-9" />
              </div>
              <Select value={filterAccount} onValueChange={setFilterAccount}>
                <SelectTrigger className="w-full sm:w-32 h-9"><SelectValue placeholder="Account" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Accounts</SelectItem>
                  {store.accounts.map((a) => (<SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="h-9 w-full sm:w-auto" onClick={() => store.exportCSV(monthTransactions)}>
                <Download className="w-4 h-4" />
              </Button>
            </div>
            <TransactionList
              transactions={monthTransactions}
              categories={store.categories}
              accounts={store.accounts}
              onDelete={(id) => {
                void store.deleteTransaction(id);
              }}
              onEdit={handleEditTx}
              searchQuery={searchQuery}
              filterAccount={filterAccount === 'all' ? '' : filterAccount}
              filterCategory={filterCategory === 'all' ? '' : filterCategory}
            />
          </TabsContent>

          {/* Accounts Tab */}
          <TabsContent value="accounts">
            <NetWorthCard
              accounts={store.accounts}
              netWorth={store.netWorth}
              onAddAccount={(account) => {
                void store.addAccount(account);
              }}
              onDeleteAccount={(id) => {
                const acc = store.accounts.find((a) => a.id === id);
                const txCount = store.transactions.filter((t) => t.accountId === id || t.toAccountId === id).length;
                if (txCount > 0 && !window.confirm(`Delete "${acc?.name}"? This will also delete ${txCount} transaction(s).`)) return;
                void store.deleteAccount(id);
              }}
            />
          </TabsContent>

          {/* Charts Tab */}
          <TabsContent value="charts" className="space-y-4">
            <MonthNavigator year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m); }} />
            <ExpensePieChart transactions={monthTransactions} categories={store.categories} />
            <IncomeExpenseBarChart allTransactions={store.transactions} year={year} />
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories">
            <CategoryManager
              categories={store.categories}
              onAdd={(cat) => {
                void store.addCategory(cat);
              }}
              onDelete={(id) => {
                void store.deleteCategory(id);
              }}
              onUpdate={(id, updates) => {
                void store.updateCategory(id, updates);
              }}
            />
          </TabsContent>
        </Tabs>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-xl sm:hidden">
        <div className="container flex items-center justify-between h-14 max-w-2xl">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-bold">MoneyTrack</h1>
          </div>
          <div className="flex items-center gap-2">
            {onLock && (
              <Button type="button" size="sm" variant="outline" onClick={onLock} className="gap-1.5">
                <Lock className="w-4 h-4" />
                <span className="hidden sm:inline">Lock</span>
              </Button>
            )}
            <Button size="sm" onClick={() => { setEditTx(null); setTxDialogOpen(true); }} className="gap-1.5">
              <Plus className="w-4 h-4" /> Add
            </Button>
          </div>
        </div>
      </div>

      <TransactionDialog
        open={txDialogOpen}
        onOpenChange={(open) => { setTxDialogOpen(open); if (!open) setEditTx(null); }}
        categories={store.categories}
        accounts={store.accounts}
        onSave={handleSaveTx}
        editTransaction={editTx}
      />
    </div>
  );
};

export default Index;
