import { useEffect, useState } from 'react';
import { useFinanceStore } from '@/hooks/useFinanceStore';
import { Transaction } from '@/types/finance';
import { NetWorthCard } from '@/components/NetWorthCard';
import { MonthNavigator } from '@/components/MonthNavigator';
import { MonthlySummary } from '@/components/MonthlySummary';
import { TransactionList } from '@/components/TransactionList';
import { TransactionDialog } from '@/components/TransactionDialog';
import { ExpensePieChart, IncomeExpenseBarChart, IncomePieChart, DailySpendingChart, NetSavingsLineChart } from '@/components/Charts';
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
  MoreHorizontal,
  Settings,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Activity,
  ChevronRight,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { getFinanceTimestamp, parseFinanceDate } from '@/lib/dateTime';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const colorThemes = [
  { id: 'teal', name: 'Teal (Default)', class: 'bg-[#14b8a6]' },
  { id: 'blue', name: 'Ocean Blue', class: 'bg-[#3b82f6]' },
  { id: 'violet', name: 'Royal Violet', class: 'bg-[#8b5cf6]' },
  { id: 'red', name: 'Ruby Red', class: 'bg-[#ef4444]' },
  { id: 'orange', name: 'Sunset Orange', class: 'bg-[#f97316]' },
  { id: 'emerald', name: 'Emerald Green', class: 'bg-[#10b981]' },
  { id: 'sky', name: 'Sky Blue', class: 'bg-[#0ea5e9]' },
  { id: 'indigo', name: 'Indigo', class: 'bg-[#6366f1]' },
  { id: 'fuchsia', name: 'Fuchsia Pink', class: 'bg-[#d946ef]' },
  { id: 'rose', name: 'Rose Pink', class: 'bg-[#f43f5e]' },
  { id: 'amber', name: 'Amber Gold', class: 'bg-[#d97706]' },
  { id: 'lime', name: 'Lime Green', class: 'bg-[#84cc16]' },
  { id: 'cyan', name: 'Cyan Blue', class: 'bg-[#06b6d4]' },
  { id: 'slate', name: 'Slate Steel', class: 'bg-[#64748b]' },
  { id: 'coffee', name: 'Coffee Brown', class: 'bg-[#854d0e]' },
  { id: 'forest', name: 'Forest Green', class: 'bg-[#15803d]' },
];

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

  const [themeColor, setThemeColor] = useState(() => {
    return localStorage.getItem('moneytrack-theme-color') || 'teal';
  });

  const handleThemeChange = (color: string) => {
    setThemeColor(color);
    localStorage.setItem('moneytrack-theme-color', color);
    document.documentElement.setAttribute('data-theme', color);
    toast.success(`Theme color updated to ${colorThemes.find((t) => t.id === color)?.name || color}!`);
  };

  useEffect(() => {
    if (store.error) {
      toast.error(store.error);
    }
  }, [store.error]);

  const monthTransactions = store.getMonthTransactions(year, month);

  // 1. Recent Transactions (last 5 records)
  const recentTransactions = [...store.transactions]
    .sort((a, b) => getFinanceTimestamp(b.date) - getFinanceTimestamp(a.date))
    .slice(0, 5);

  // 2. Financial Insights Calculations for selected month
  const totalIncome = monthTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = monthTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netSavings = totalIncome - totalExpense;

  const savingsRate = totalIncome > 0
    ? Math.max(0, Math.min(100, (netSavings / totalIncome) * 100))
    : 0;

  const expenseRatio = totalIncome > 0
    ? Math.min(100, (totalExpense / totalIncome) * 100)
    : 0;

  // Highest Expense Category
  const expenseTxs = monthTransactions.filter((t) => t.type === 'expense');
  const catMap: Record<string, number> = {};
  expenseTxs.forEach((t) => {
    const catId = t.categoryId || 'other';
    catMap[catId] = (catMap[catId] || 0) + t.amount;
  });

  let highestCatId = '';
  let highestCatAmount = 0;
  Object.entries(catMap).forEach(([catId, amt]) => {
    if (amt > highestCatAmount) {
      highestCatAmount = amt;
      highestCatId = catId;
    }
  });

  const highestCategory = store.categories.find((c) => c.id === highestCatId);

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
      localStorage.setItem('moneytrack-dark-mode', 'false');
    } else {
      root.classList.add('dark');
      setIsDarkMode(true);
      localStorage.setItem('moneytrack-dark-mode', 'true');
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
    { value: 'settings', label: 'Settings', icon: Settings },
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

                {/* Left Column: Net Worth, Recent Transactions, and Smart Insights */}
                <div className="lg:col-span-8 space-y-4 sm:space-y-6">
                  {/* Net Worth & Accounts */}
                  <NetWorthCard
                    accounts={store.accounts}
                    netWorth={store.netWorth}
                    readOnly
                  />

                  {/* Recent Transactions & Smart Insights Side-by-side */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">


                    {/* Smart Insights Card */}
                    <div className="card-premium p-5 space-y-4">
                      <div className="flex items-center gap-2 border-b pb-2">
                        <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                        <h3 className="text-sm font-semibold">Monthly Insights</h3>
                      </div>

                      {monthTransactions.length === 0 ? (
                        <div className="flex items-center justify-center h-48 text-muted-foreground text-xs italic">
                          Add transactions to unlock monthly insights.
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Insight 1: Spending Pace / Gauge */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground font-medium">Income Spent</span>
                              <span className="font-bold font-mono">{expenseRatio.toFixed(0)}%</span>
                            </div>
                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${expenseRatio > 80
                                  ? 'bg-expense shadow-sm shadow-expense/20'
                                  : expenseRatio > 50
                                    ? 'bg-yellow-500 shadow-sm shadow-yellow-500/20'
                                    : 'bg-income shadow-sm shadow-income/20'
                                  }`}
                                style={{ width: `${expenseRatio}%` }}
                              />
                            </div>
                            <p className="text-[10px] text-muted-foreground font-medium">
                              {expenseRatio > 80
                                ? '⚠️ Expenses are extremely high relative to income!'
                                : expenseRatio > 50
                                  ? 'Spend is moderate. Keep track of subscriptions and retail.'
                                  : '🎉 Great job! You are keeping expenses well within income limits.'}
                            </p>
                          </div>

                          {/* Insight 2: Highest Expense Category */}
                          {highestCategory && (
                            <div className="flex items-start gap-2.5 p-2 rounded-xl bg-accent/30 border border-accent/20">
                              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
                                <TrendingUp className="w-3.5 h-3.5" />
                              </div>
                              <div>
                                <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Top Spend Category</h4>
                                <p className="text-xs font-semibold text-foreground">
                                  {highestCategory.name}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  Spent <span className="font-bold font-mono text-expense">Rs.{highestCatAmount.toLocaleString('en-IN')}</span> this month.
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Insight 3: Savings Rate */}
                          <div className="flex items-start gap-2.5 p-2 rounded-xl bg-muted/40 border border-border/40">
                            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
                              <Activity className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Month Savings Rate</h4>
                              <p className="text-xs font-semibold text-foreground">
                                {savingsRate.toFixed(0)}% Savings Ratio
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                Saved <span className={`font-bold font-mono ${netSavings >= 0 ? 'text-income' : 'text-expense'}`}>{netSavings >= 0 ? '+' : ''}Rs.{netSavings.toLocaleString('en-IN')}</span>.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Recent Transactions Card */}
                    <div className="card-premium p-5 space-y-4">
                      <div className="flex items-center justify-between border-b pb-2">
                        <div className="flex items-center gap-2">
                          <History className="w-4 h-4 text-primary" />
                          <h3 className="text-sm font-semibold">Recent Activity</h3>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setActiveTab('transactions')}
                          className="h-7 text-xs text-muted-foreground hover:text-primary gap-0.5 px-2"
                        >
                          View All <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                      </div>

                      {recentTransactions.length === 0 ? (
                        <div className="flex items-center justify-center h-48 text-muted-foreground text-xs italic">
                          No transactions recorded yet.
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                          {recentTransactions.map((tx) => {
                            const cat = store.categories.find((c) => c.id === tx.categoryId);
                            const acc = store.accounts.find((a) => a.id === tx.accountId);
                            const toAcc = tx.toAccountId ? store.accounts.find((a) => a.id === tx.toAccountId) : null;
                            const isExpense = tx.type === 'expense';
                            const isIncome = tx.type === 'income';

                            return (
                              <div
                                key={tx.id}
                                onClick={() => handleEditTx(tx)}
                                className="flex items-center justify-between p-2.5 rounded-xl border border-transparent hover:border-border hover:bg-muted/30 transition-all cursor-pointer group"
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isIncome
                                    ? 'bg-income-muted text-income'
                                    : isExpense
                                      ? 'bg-expense-muted text-expense'
                                      : 'bg-transfer-muted text-transfer'
                                    }`}>
                                    {isIncome ? (
                                      <ArrowDownLeft className="w-4 h-4" />
                                    ) : isExpense ? (
                                      <ArrowUpRight className="w-4 h-4" />
                                    ) : (
                                      <ArrowLeftRight className="w-4 h-4" />
                                    )}
                                  </div>
                                  <div>
                                    <div className="text-xs font-semibold group-hover:text-primary transition-colors line-clamp-1">
                                      {tx.note || cat?.name || 'Uncategorized'}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono">
                                      {acc?.name}
                                      {toAcc && ` → ${toAcc.name}`}
                                      <span className="text-[8px] opacity-50">•</span>
                                      {parseFinanceDate(tx.date)?.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) || ''}
                                    </div>
                                  </div>
                                </div>
                                <div className={`text-xs font-bold font-mono text-right ${isIncome ? 'text-income' : isExpense ? 'text-expense' : 'text-transfer'
                                  }`}>
                                  {isIncome ? '+' : isExpense ? '-' : ''}Rs.{tx.amount.toLocaleString('en-IN')}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column: Month Navigator, Quick Actions, and Expense Chart */}
                <div className="lg:col-span-4 space-y-4 sm:space-y-6">
                  {/* Navigator and Summary */}
                  <div className="card-premium p-4 sm:p-5 space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Month Navigator</h3>
                    <MonthNavigator year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m); }} />
                    <MonthlySummary transactions={monthTransactions} />
                  </div>

                  {/* Quick Actions Panel */}
                  <div className="card-premium p-4 sm:p-5 space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Quick Shortcuts</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        onClick={() => { setEditTx(null); setTxDialogOpen(true); }}
                        className="py-4.5 rounded-xl text-xs gap-1.5 font-semibold shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" /> Log Spend
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => store.exportCSV(monthTransactions)}
                        className="py-4.5 rounded-xl text-xs gap-1.5 font-semibold border-border hover:bg-muted"
                      >
                        <FileText className="w-3.5 h-3.5 text-muted-foreground" /> Get Statement
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setActiveTab('categories')}
                        className="py-4.5 rounded-xl text-xs gap-1.5 font-semibold border-border hover:bg-muted"
                      >
                        <Tags className="w-3.5 h-3.5 text-muted-foreground" /> Categories
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setActiveTab('accounts')}
                        className="py-4.5 rounded-xl text-xs gap-1.5 font-semibold border-border hover:bg-muted"
                      >
                        <CreditCard className="w-3.5 h-3.5 text-muted-foreground" /> Balances
                      </Button>
                    </div>
                  </div>

                  {/* Expense Pie Chart */}
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
            <TabsContent value="charts" className="space-y-6 outline-none animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
                <div>
                  <h2 className="text-lg font-bold">Financial Analysis</h2>
                  <p className="text-xs text-muted-foreground">Detailed visual breakdown of income, expenses, and savings trends</p>
                </div>
                <div className="self-end sm:self-auto">
                  <MonthNavigator year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m); }} />
                </div>
              </div>

              {/* Month Analysis Section */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Monthly Breakdown</h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <ExpensePieChart transactions={monthTransactions} categories={store.categories} />
                  <IncomePieChart transactions={monthTransactions} categories={store.categories} />
                  <DailySpendingChart transactions={monthTransactions} year={year} month={month} />
                </div>
              </div>

              {/* Annual Analysis Section */}
              <div className="space-y-4 pt-4 border-t border-border">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Annual Comparison & Savings</h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <IncomeExpenseBarChart allTransactions={store.transactions} year={year} />
                  <NetSavingsLineChart allTransactions={store.transactions} year={year} />
                </div>
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

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-4 sm:space-y-6 outline-none animate-fade-in">
              <div className="space-y-1">
                <h2 className="text-base sm:text-lg font-bold">Settings</h2>
                <p className="text-xs text-muted-foreground">Customize your MoneyTrack experience</p>
              </div>

              <div className="card-premium p-6 space-y-6">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold">Accent Color</h3>
                  <p className="text-xs text-muted-foreground">Choose a theme color for buttons, active tabs, and highlights.</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
                  {colorThemes.map((theme) => {
                    const isActive = themeColor === theme.id;
                    return (
                      <button
                        key={theme.id}
                        onClick={() => handleThemeChange(theme.id)}
                        className={`relative flex flex-col items-center justify-center p-5 rounded-2xl border text-center transition-all duration-300 hover:scale-[1.02] active:scale-95 ${isActive
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm'
                          : 'border-border bg-card hover:bg-muted/50'
                          }`}
                      >
                        <div className="flex flex-col items-center gap-3">
                          <span className={`w-8 h-8 rounded-full ${theme.class} shadow-md flex items-center justify-center shrink-0`}>
                            {isActive && <div className="w-3 h-3 rounded-full bg-white shadow-sm" />}
                          </span>
                          <span className="text-xs font-semibold">{theme.name}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
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
