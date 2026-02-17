function pad2(value: number) {
  return value.toString().padStart(2, '0');
}

function toLocalDateTimeString(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

export function nowLocalDateTimeString() {
  return toLocalDateTimeString(new Date());
}

export function parseFinanceDate(value: string | null | undefined): Date | null {
  if (!value || typeof value !== 'string') return null;

  const dateOnly = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnly) {
    const [, y, m, d] = dateOnly;
    return new Date(Number(y), Number(m) - 1, Number(d), 0, 0, 0, 0);
  }

  const localDateTime = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (localDateTime) {
    const [, y, m, d, h, min, s] = localDateTime;
    return new Date(Number(y), Number(m) - 1, Number(d), Number(h), Number(min), Number(s || '0'), 0);
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

export function normalizeFinanceDate(value: string | null | undefined) {
  const parsed = parseFinanceDate(value);
  return toLocalDateTimeString(parsed || new Date());
}

export function splitFinanceDateTime(value: string | null | undefined) {
  const normalized = normalizeFinanceDate(value);
  return {
    date: normalized.slice(0, 10),
    time: normalized.slice(11, 16),
  };
}

export function getFinanceTimestamp(value: string | null | undefined) {
  const parsed = parseFinanceDate(value);
  return parsed ? parsed.getTime() : Number.NEGATIVE_INFINITY;
}
