export type ColumnSortFamily = 'number' | 'date' | 'datetime' | 'time' | 'boolean' | 'string' | 'json' | 'unknown';

export interface ColumnTypeMetadata {
  family: ColumnSortFamily;
  rawType: string | null;
}

export type SortDirection = 'ascend' | 'descend' | null | undefined;

function isNil(value: unknown): boolean {
  return value === null || value === undefined || (typeof value === 'string' && value.trim() === '');
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'bigint') {
    return Number(value);
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function toBoolean(value: unknown): number | null {
  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }

  if (typeof value === 'number') {
    if (value === 1) return 1;
    if (value === 0) return 0;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes'].includes(normalized)) return 1;
    if (['false', '0', 'no'].includes(normalized)) return 0;
  }

  return null;
}

function toTimestamp(value: unknown, family: ColumnSortFamily): number | null {
  if (value instanceof Date) {
    const ts = value.getTime();
    return Number.isNaN(ts) ? null : ts;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) return null;

  if (family === 'time') {
    const timeMatch = trimmed.match(/^(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/);
    if (!timeMatch) return null;

    const hours = Number(timeMatch[1]);
    const minutes = Number(timeMatch[2]);
    const seconds = timeMatch[3] ? Number(timeMatch[3]) : 0;
    const millis = timeMatch[4] ? Number(timeMatch[4].padEnd(3, '0').slice(0, 3)) : 0;

    return ((hours * 60 + minutes) * 60 + seconds) * 1000 + millis;
  }

  const parsed = Date.parse(trimmed);
  return Number.isNaN(parsed) ? null : parsed;
}

function compareUnknown(a: unknown, b: unknown): number {
  const aNumber = toNumber(a);
  const bNumber = toNumber(b);

  if (aNumber !== null && bNumber !== null) {
    return aNumber - bNumber;
  }

  const aDate = toTimestamp(a, 'datetime');
  const bDate = toTimestamp(b, 'datetime');

  if (aDate !== null && bDate !== null) {
    return aDate - bDate;
  }

  return String(a).localeCompare(String(b), undefined, {
    numeric: true,
    sensitivity: 'base',
  });
}

export function compareQueryValues(
  a: unknown,
  b: unknown,
  family: ColumnSortFamily = 'unknown',
  sortOrder?: SortDirection
): number {
  if (isNil(a) && isNil(b)) return 0;
  if (isNil(a)) return 1;
  if (isNil(b)) return -1;

  let result = 0;

  if (family === 'number') {
    const aNumber = toNumber(a);
    const bNumber = toNumber(b);
    if (aNumber !== null && bNumber !== null) {
      result = aNumber - bNumber;
    } else {
      result = compareUnknown(a, b);
    }
  } else if (family === 'boolean') {
    const aBool = toBoolean(a);
    const bBool = toBoolean(b);
    if (aBool !== null && bBool !== null) {
      result = aBool - bBool;
    } else {
      result = compareUnknown(a, b);
    }
  } else if (family === 'date' || family === 'datetime' || family === 'time') {
    const aTime = toTimestamp(a, family);
    const bTime = toTimestamp(b, family);
    if (aTime !== null && bTime !== null) {
      result = aTime - bTime;
    } else {
      result = compareUnknown(a, b);
    }
  } else if (family === 'json') {
    result = JSON.stringify(a).localeCompare(JSON.stringify(b), undefined, {
      numeric: true,
      sensitivity: 'base',
    });
  } else if (family === 'string') {
    result = String(a).localeCompare(String(b), undefined, {
      numeric: true,
      sensitivity: 'base',
    });
  } else {
    result = compareUnknown(a, b);
  }

  if (sortOrder === 'descend') {
    return -result;
  }

  return result;
}