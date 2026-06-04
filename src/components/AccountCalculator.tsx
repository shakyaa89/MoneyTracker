import { useEffect, useMemo, useState } from 'react';
import { Account } from '@/types/finance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface Props {
  accounts: Account[];
}

type Operation = 'add' | 'subtract' | 'multiply' | 'divide';

const operationSymbol: Record<Operation, string> = {
  add: '+',
  subtract: '-',
  multiply: '×',
  divide: '÷',
};

function roundTo2(value: number) {
  return Math.round(value * 100) / 100;
}

function formatCurrency(amount: number) {
  const absValue = Math.abs(amount);
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(absValue);
  return `${amount < 0 ? '-' : ''}Rs. ${formatted}`;
}

export function AccountCalculator({ accounts }: Props) {
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [displayValue, setDisplayValue] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [pendingOperation, setPendingOperation] = useState<Operation | null>(null);
  const [shouldResetDisplay, setShouldResetDisplay] = useState(false);
  const [expression, setExpression] = useState('');

  const selectedAccount = useMemo(
    () => accounts.find((a) => a.id === accountId) || null,
    [accounts, accountId],
  );

  const baseBalance = selectedAccount?.balance ?? 0;

  useEffect(() => {
    const start = roundTo2(baseBalance);
    setDisplayValue(String(start));
    setPreviousValue(null);
    setPendingOperation(null);
    setShouldResetDisplay(false);
    setExpression(`Base: ${formatCurrency(start)}`);
  }, [baseBalance]);

  const applyOperation = (left: number, right: number, op: Operation): number | null => {
    if (op === 'add') return left + right;
    if (op === 'subtract') return left - right;
    if (op === 'multiply') return left * right;
    if (right === 0) return null;
    return left / right;
  };

  const handleDigit = (digit: string) => {
    if (shouldResetDisplay) {
      setDisplayValue(digit);
      setShouldResetDisplay(false);
      return;
    }

    if (displayValue === '0' && digit !== '.') {
      setDisplayValue(digit);
      return;
    }

    if (digit === '.' && displayValue.includes('.')) return;
    setDisplayValue(displayValue + digit);
  };

  const handleOperation = (op: Operation) => {
    const current = Number(displayValue);
    if (Number.isNaN(current)) return;

    if (shouldResetDisplay && previousValue !== null) {
      setPendingOperation(op);
      setExpression(`${formatCurrency(previousValue)} ${operationSymbol[op]}`);
      return;
    }

    if (previousValue !== null && pendingOperation) {
      const computed = applyOperation(previousValue, current, pendingOperation);
      if (computed === null) {
        setExpression('Cannot divide by zero');
        return;
      }
      const rounded = roundTo2(computed);
      setPreviousValue(rounded);
      setDisplayValue(String(rounded));
      setExpression(`${formatCurrency(rounded)} ${operationSymbol[op]}`);
    } else {
      setPreviousValue(current);
      setExpression(`${formatCurrency(current)} ${operationSymbol[op]}`);
    }

    setPendingOperation(op);
    setShouldResetDisplay(true);
  };

  const handleEquals = () => {
    if (previousValue === null || !pendingOperation) return;
    const current = Number(displayValue);
    if (Number.isNaN(current)) return;

    const computed = applyOperation(previousValue, current, pendingOperation);
    if (computed === null) {
      setExpression('Cannot divide by zero');
      return;
    }

    const rounded = roundTo2(computed);
    setExpression(`${formatCurrency(previousValue)} ${operationSymbol[pendingOperation]} ${formatCurrency(current)} =`);
    setDisplayValue(String(rounded));
    setPreviousValue(null);
    setPendingOperation(null);
    setShouldResetDisplay(true);
  };

  const handleClearEntry = () => {
    setDisplayValue('0');
  };

  const handleAllClear = () => {
    const start = roundTo2(baseBalance);
    setDisplayValue(String(start));
    setPreviousValue(null);
    setPendingOperation(null);
    setShouldResetDisplay(false);
    setExpression(`Base: ${formatCurrency(start)}`);
  };

  const handleSignToggle = () => {
    const current = Number(displayValue);
    if (Number.isNaN(current) || current === 0) return;
    setDisplayValue(String(roundTo2(current * -1)));
  };

  const handlePercent = () => {
    const current = Number(displayValue);
    if (Number.isNaN(current)) return;
    setDisplayValue(String(roundTo2(current / 100)));
  };

  return (
    <div className="card-premium p-6 space-y-4 animate-fade-in">
      <div className="space-y-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Account Calculator</h3>
        <p className="text-xs text-muted-foreground">
          Select an account and run calculations on its balance. This does not save or change account data.
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Account</Label>
        <Select value={accountId} onValueChange={setAccountId}>
          <SelectTrigger className="rounded-xl">
            <SelectValue placeholder="Select account" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            {accounts.map((account) => (
              <SelectItem key={account.id} value={account.id} className="rounded-lg">
                {account.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-1">
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Current balance</p>
          <p className="font-mono text-base font-extrabold text-foreground">{formatCurrency(baseBalance)}</p>
        </div>

        <div className="rounded-xl border border-border bg-card/50 p-4 flex flex-col justify-between">
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider truncate mb-1">{expression || 'Ready'}</p>
          <p className="font-mono text-lg font-extrabold text-right text-primary">{formatCurrency(Number(displayValue) || 0)}</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 pt-2">
        <Button type="button" variant="secondary" className="rounded-xl font-bold h-11 hover-scale-subtle" onClick={handleAllClear}>AC</Button>
        <Button type="button" variant="secondary" className="rounded-xl font-bold h-11 hover-scale-subtle" onClick={handleClearEntry}>CE</Button>
        <Button type="button" variant="secondary" className="rounded-xl font-bold h-11 hover-scale-subtle" onClick={handlePercent}>%</Button>
        <Button type="button" variant="secondary" className="rounded-xl font-bold h-11 hover-scale-subtle text-primary" onClick={() => handleOperation('divide')}>÷</Button>

        <Button type="button" variant="outline" className="rounded-xl font-semibold h-11 hover-scale-subtle" onClick={() => handleDigit('7')}>7</Button>
        <Button type="button" variant="outline" className="rounded-xl font-semibold h-11 hover-scale-subtle" onClick={() => handleDigit('8')}>8</Button>
        <Button type="button" variant="outline" className="rounded-xl font-semibold h-11 hover-scale-subtle" onClick={() => handleDigit('9')}>9</Button>
        <Button type="button" variant="secondary" className="rounded-xl font-bold h-11 hover-scale-subtle text-primary" onClick={() => handleOperation('multiply')}>×</Button>

        <Button type="button" variant="outline" className="rounded-xl font-semibold h-11 hover-scale-subtle" onClick={() => handleDigit('4')}>4</Button>
        <Button type="button" variant="outline" className="rounded-xl font-semibold h-11 hover-scale-subtle" onClick={() => handleDigit('5')}>5</Button>
        <Button type="button" variant="outline" className="rounded-xl font-semibold h-11 hover-scale-subtle" onClick={() => handleDigit('6')}>6</Button>
        <Button type="button" variant="secondary" className="rounded-xl font-bold h-11 hover-scale-subtle text-primary" onClick={() => handleOperation('subtract')}>−</Button>

        <Button type="button" variant="outline" className="rounded-xl font-semibold h-11 hover-scale-subtle" onClick={() => handleDigit('1')}>1</Button>
        <Button type="button" variant="outline" className="rounded-xl font-semibold h-11 hover-scale-subtle" onClick={() => handleDigit('2')}>2</Button>
        <Button type="button" variant="outline" className="rounded-xl font-semibold h-11 hover-scale-subtle" onClick={() => handleDigit('3')}>3</Button>
        <Button type="button" variant="secondary" className="rounded-xl font-bold h-11 hover-scale-subtle text-primary" onClick={() => handleOperation('add')}>+</Button>

        <Button type="button" variant="outline" className="rounded-xl font-semibold h-11 hover-scale-subtle" onClick={handleSignToggle}>+/-</Button>
        <Button type="button" variant="outline" className="rounded-xl font-semibold h-11 hover-scale-subtle" onClick={() => handleDigit('0')}>0</Button>
        <Button type="button" variant="outline" className="rounded-xl font-semibold h-11 hover-scale-subtle" onClick={() => handleDigit('.')}>.</Button>
        <Button type="button" className="rounded-xl font-bold h-11 hover-scale-subtle shadow-md shadow-primary/20" onClick={handleEquals}>=</Button>
      </div>
    </div>
  );
}
