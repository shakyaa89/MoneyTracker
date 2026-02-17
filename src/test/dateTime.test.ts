import { describe, expect, it } from 'vitest';
import { getFinanceTimestamp, normalizeFinanceDate, parseFinanceDate, splitFinanceDateTime } from '@/lib/dateTime';

describe('dateTime utils', () => {
  it('normalizes date-only values to midnight', () => {
    expect(normalizeFinanceDate('2026-02-17')).toBe('2026-02-17T00:00');
  });

  it('preserves local datetime values with minute precision', () => {
    expect(normalizeFinanceDate('2026-02-17T07:20')).toBe('2026-02-17T07:20');
  });

  it('splits date and time correctly', () => {
    expect(splitFinanceDateTime('2026-02-17T19:05')).toEqual({
      date: '2026-02-17',
      time: '19:05',
    });
  });

  it('parses date-only values as valid dates', () => {
    const parsed = parseFinanceDate('2026-02-17');
    expect(parsed).not.toBeNull();
    expect(parsed?.getFullYear()).toBe(2026);
    expect(parsed?.getMonth()).toBe(1);
    expect(parsed?.getDate()).toBe(17);
  });

  it('sort timestamp respects higher time as more recent', () => {
    const earlier = getFinanceTimestamp('2026-02-17T07:10');
    const later = getFinanceTimestamp('2026-02-17T07:20');
    expect(later).toBeGreaterThan(earlier);
  });
});
