import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

interface Props {
  year: number;
  month: number;
  onChange: (year: number, month: number) => void;
}

export function MonthNavigator({ year, month, onChange }: Props) {
  const goBack = () => {
    if (month === 0) onChange(year - 1, 11);
    else onChange(year, month - 1);
  };

  const goForward = () => {
    if (month === 11) onChange(year + 1, 0);
    else onChange(year, month + 1);
  };

  const label = format(new Date(year, month), 'MMMM yyyy');

  return (
    <div className="flex items-center justify-between">
      <Button variant="ghost" size="icon" onClick={goBack} className="h-8 w-8">
        <ChevronLeft className="w-4 h-4" />
      </Button>
      <span className="text-sm font-semibold">{label}</span>
      <Button variant="ghost" size="icon" onClick={goForward} className="h-8 w-8">
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}
