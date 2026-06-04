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
import { AccountCalculator } from '@/components/AccountCalculator';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Plus,
  Download,
  Search,
  Wallet,
  Loader2,
  Lock,
  LayoutDashboard,
  History,
  CreditCard,
  BarChart3,
  Tags,
  Calculator,
  Sun,
  Moon,
  MoreHorizontal
} from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
  const [activeTab, setActiveTab] = useState('overview');

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });

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

  const toggleTheme = () => {
    const root = document.documentElement;
    if (root.classList.contains('dark')) {
      root.classList.remove('dark');
      setIsDarkMode(false);
    } else {
      root.classList.add('dark');
      setIsDarkMode(true);
    }
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

  const navItems = [
    { value: 'overview', label: 'Overview', icon: LayoutDashboard },
    { value: 'transactions', label: 'Transactions', icon: History },
    { value: 'accounts', label: 'Accounts', icon: CreditCard },
    { value: 'charts', label: 'Charts', icon: BarChart3 },
    { value: 'categories', label: 'Categories', icon: Tags },
    { value: 'calculator', label: 'Calculator', icon: Calculator },
  ];

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-background text-foreground transition-colors duration-300">

      {/* Desktop Left Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 fixed inset-y-0 left-0 sidebar-glass p-6 justify-between z-40">
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-md shadow-primary/20">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">MoneyTrack</h1>
              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Premium Wallet</span>
            </div>
          </div>

          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.value;
              return (
                <button
                  key={item.value}
                  onClick={() => setActiveTab(item.value)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 hover-scale-nav ${isActive
                      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                >
                  <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="space-y-4">
          <Button
            size="sm"
            onClick={() => { setEditTx(null); setTxDialogOpen(true); }}
            className="w-full py-5 rounded-xl gap-2 font-semibold shadow-md shadow-primary/20 hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" /> Add Transaction
          </Button>

          <div className="h-px bg-border" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground"
                aria-label="Toggle theme"
              >
                {isDarkMode ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
              </Button>
              {onLock && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onLock}
                  className="h-9 w-9 rounded-xl text-muted-foreground hover:text-expense"
                  aria-label="Lock screen"
                >
                  <Lock className="w-4.5 h-4.5" />
                </Button>
              )}
            </div>
            <span className="text-[10px] text-muted-foreground font-mono">v1.2.0</span>
          </div>
        </div>
      </aside>

      {/* Mobile Sticky Top Header */}
      <header className="lg:hidden sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
            <Wallet className="w-4.5 h-4.5" />
          </div>
          <h1 className="text-md font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">MoneyTrack</h1>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-8 w-8 rounded-lg text-muted-foreground"
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
          {onLock && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onLock}
              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-expense"
              aria-label="Lock screen"
            >
              <Lock className="w-4 h-4" />
            </Button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen pb-20 lg:pb-0">
        <main className="container max-w-7xl py-4 px-3 sm:py-6 sm:px-6 lg:px-8 space-y-4 sm:space-y-6 flex-1">

          {store.isSaving && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-accent/40 border border-accent px-3 py-1.5 rounded-full w-fit animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
              <span>Syncing financial data...</span>
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6 outline-none">

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4 sm:space-y-6 outline-none animate-fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">

                {/* Net Worth & Accounts */}
                <div className="lg:col-span-7 space-y-4 sm:space-y-6">
                  <NetWorthCard
                    accounts={store.accounts}
                    netWorth={store.netWorth}
                    readOnly
                  />
                </div>

                {/* Navigator, Summary, and Chart */}
                <div className="lg:col-span-5 space-y-4 sm:space-y-6">
                  <div className="card-premium p-4 sm:p-6 space-y-3 sm:space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Month Navigator</h3>
                    <MonthNavigator year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m); }} />
                    <MonthlySummary transactions={monthTransactions} />
                  </div>
                  <ExpensePieChart transactions={monthTransactions} categories={store.categories} />
                </div>
              </div>
            </TabsContent>

            {/* Transactions Tab */}
            <TabsContent value="transactions" className="space-y-4 sm:space-y-6 outline-none animate-fade-in">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base sm:text-lg font-bold">Transaction History</h2>
                  <p className="text-xs text-muted-foreground">Search and filter your expense & income records</p>
                </div>
                <div className="flex items-center gap-2 self-end">
                  <MonthNavigator year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m); }} />
                  <Button variant="outline" size="sm" className="h-9 w-9 rounded-xl shadow-sm" onClick={() => store.exportCSV(monthTransactions)} aria-label="Export CSV">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4">
                <div className="md:col-span-8 relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search note, category, account..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-10 rounded-xl bg-card border-border shadow-sm"
                  />
                </div>
                <div className="md:col-span-4">
                  <Select value={filterAccount} onValueChange={setFilterAccount}>
                    <SelectTrigger className="w-full h-10 rounded-xl bg-card border-border shadow-sm">
                      <SelectValue placeholder="All Accounts" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="all" className="rounded-lg">All Accounts</SelectItem>
                      {store.accounts.map((a) => (
                        <SelectItem key={a.id} value={a.id} className="rounded-lg">{a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <MonthlySummary transactions={monthTransactions} />

              <div className="pt-1">
                <TransactionList
                  transactions={monthTransactions}
                  allTransactions={store.transactions}
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
              </div>
            </TabsContent>

            {/* Accounts Tab */}
            <TabsContent value="accounts" className="space-y-4 sm:space-y-6 outline-none animate-fade-in">
              <div className="space-y-1">
                <h2 className="text-base sm:text-lg font-bold">Manage Accounts</h2>
                <p className="text-xs text-muted-foreground">Create, edit, or remove your wallet/bank accounts</p>
              </div>
              <NetWorthCard
                accounts={store.accounts}
                netWorth={store.netWorth}
                onAddAccount={(account) => {
                  void store.addAccount(account);
                }}
                onUpdateAccount={(id, updates) => {
                  void store.updateAccount(id, updates);
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
            <TabsContent value="charts" className="space-y-4 sm:space-y-6 outline-none animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base sm:text-lg font-bold">Financial Analysis</h2>
                  <p className="text-xs text-muted-foreground">Category distributions and monthly comparisons</p>
                </div>
                <div className="self-end sm:self-auto">
                  <MonthNavigator year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m); }} />
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <ExpensePieChart transactions={monthTransactions} categories={store.categories} />
                <IncomeExpenseBarChart allTransactions={store.transactions} year={year} />
              </div>
            </TabsContent>

            {/* Categories Tab */}
            <TabsContent value="categories" className="space-y-4 sm:space-y-6 outline-none animate-fade-in">
              <div className="space-y-1">
                <h2 className="text-base sm:text-lg font-bold">Transaction Categories</h2>
                <p className="text-xs text-muted-foreground">Configure your expense and income categories</p>
              </div>
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

            {/* Calculator Tab */}
            <TabsContent value="calculator" className="space-y-4 sm:space-y-6 outline-none animate-fade-in">
              <div className="space-y-1">
                <h2 className="text-base sm:text-lg font-bold">Account Calculator</h2>
                <p className="text-xs text-muted-foreground">Compute quick allocations across balances</p>
              </div>
              <AccountCalculator accounts={store.accounts} />
            </TabsContent>

          </Tabs>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-xl border-t px-2 py-1 flex items-center justify-around h-16">

        {/* Left Side: Overview & Transactions */}
        {navItems.slice(0, 2).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.value;
          return (
            <button
              key={item.value}
              onClick={() => setActiveTab(item.value)}
              className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 ${isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
            >
              <Icon className="w-6 h-6" />
            </button>
          );
        })}

        {/* Add Transaction Button inside navbar */}
        <button
          onClick={() => { setEditTx(null); setTxDialogOpen(true); }}
          className="flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 text-muted-foreground hover:text-foreground active:scale-95"
          aria-label="Add transaction"
        >
          <Plus className="w-6 h-6" />
        </button>

        {/* Right Side: Accounts */}
        {navItems.slice(2, 3).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.value;
          return (
            <button
              key={item.value}
              onClick={() => setActiveTab(item.value)}
              className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 ${isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
            >
              <Icon className="w-6 h-6" />
            </button>
          );
        })}

        {/* Dropdown Menu for "More" tabs (Charts, Categories, Calculator) */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex flex-col items-center justify-center p-3 rounded-xl text-muted-foreground outline-none">
            <MoreHorizontal className="w-6 h-6" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl p-1 w-40">
            {navItems.slice(3).map((item) => {
              const Icon = item.icon;
              return (
                <DropdownMenuItem
                  key={item.value}
                  onClick={() => setActiveTab(item.value)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm cursor-pointer"
                >
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <span>{item.label}</span>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>

      {/* Add/Edit Transaction Dialog */}
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
