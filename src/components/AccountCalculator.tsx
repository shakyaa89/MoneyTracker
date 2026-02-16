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
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Account Calculator (View Only)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Select an account and run calculations on its balance. This does not save or change account data.
        </p>

        <div className="space-y-2">
          <Label>Account</Label>
          <Select value={accountId} onValueChange={setAccountId}>
            <SelectTrigger>
              <SelectValue placeholder="Select account" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-lg border bg-muted/40 p-3 space-y-1">
          <p className="text-xs text-muted-foreground">Current balance</p>
          <p className="font-mono text-sm font-semibold">{formatCurrency(baseBalance)}</p>
        </div>

        <div className="rounded-lg border bg-card p-3">
          <p className="text-xs text-muted-foreground truncate">{expression || 'Ready'}</p>
          <p className="font-mono text-xl font-semibold text-right">{formatCurrency(Number(displayValue) || 0)}</p>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <Button type="button" variant="outline" onClick={handleAllClear}>AC</Button>
          <Button type="button" variant="outline" onClick={handleClearEntry}>CE</Button>
          <Button type="button" variant="outline" onClick={handlePercent}>%</Button>
          <Button type="button" variant="outline" onClick={() => handleOperation('divide')}>÷</Button>

          <Button type="button" variant="outline" onClick={() => handleDigit('7')}>7</Button>
          <Button type="button" variant="outline" onClick={() => handleDigit('8')}>8</Button>
          <Button type="button" variant="outline" onClick={() => handleDigit('9')}>9</Button>
          <Button type="button" variant="outline" onClick={() => handleOperation('multiply')}>×</Button>

          <Button type="button" variant="outline" onClick={() => handleDigit('4')}>4</Button>
          <Button type="button" variant="outline" onClick={() => handleDigit('5')}>5</Button>
          <Button type="button" variant="outline" onClick={() => handleDigit('6')}>6</Button>
          <Button type="button" variant="outline" onClick={() => handleOperation('subtract')}>−</Button>

          <Button type="button" variant="outline" onClick={() => handleDigit('1')}>1</Button>
          <Button type="button" variant="outline" onClick={() => handleDigit('2')}>2</Button>
          <Button type="button" variant="outline" onClick={() => handleDigit('3')}>3</Button>
          <Button type="button" variant="outline" onClick={() => handleOperation('add')}>+</Button>

          <Button type="button" variant="outline" onClick={handleSignToggle}>+/-</Button>
          <Button type="button" variant="outline" onClick={() => handleDigit('0')}>0</Button>
          <Button type="button" variant="outline" onClick={() => handleDigit('.')}>.</Button>
          <Button type="button" onClick={handleEquals}>=</Button>
        </div>
      </CardContent>
    </Card>
  );
}
