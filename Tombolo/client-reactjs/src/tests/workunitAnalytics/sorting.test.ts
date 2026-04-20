import { describe, it, expect } from 'vitest';
import { compareQueryValues } from '@/components/admin/workunits/analytics/sorting';

describe('compareQueryValues', () => {
  it('sorts numeric values as numbers', () => {
    expect(compareQueryValues('10.5', '2.0', 'number')).toBeGreaterThan(0);
    expect(compareQueryValues(1, 12, 'number')).toBeLessThan(0);
  });

  it('sorts dates chronologically', () => {
    expect(compareQueryValues('2026-01-10', '2026-02-01', 'date')).toBeLessThan(0);
    expect(compareQueryValues('2026-03-01 05:00:00', '2026-03-01 04:59:59', 'datetime')).toBeGreaterThan(0);
  });

  it('sorts time values by clock order', () => {
    expect(compareQueryValues('09:30:00', '10:00:00', 'time')).toBeLessThan(0);
    expect(compareQueryValues('10:00:00.500', '10:00:00.050', 'time')).toBeGreaterThan(0);
  });

  it('sorts booleans and boolean-like values', () => {
    expect(compareQueryValues(false, true, 'boolean')).toBeLessThan(0);
    expect(compareQueryValues('1', '0', 'boolean')).toBeGreaterThan(0);
  });

  it('places null-like values at the end for ascending comparisons', () => {
    expect(compareQueryValues(null, 1, 'number')).toBeGreaterThan(0);
    expect(compareQueryValues(undefined, 'abc', 'string')).toBeGreaterThan(0);
    expect(compareQueryValues('', 'abc', 'string')).toBeGreaterThan(0);
    expect(compareQueryValues('   ', 'abc', 'string')).toBeGreaterThan(0);
    expect(compareQueryValues(null, undefined, 'unknown')).toBe(0);
    expect(compareQueryValues('', null, 'unknown')).toBe(0);
  });

  it('keeps null-like values at the end for descending comparisons', () => {
    expect(compareQueryValues(null, 1, 'number', 'descend')).toBeGreaterThan(0);
    expect(compareQueryValues(undefined, 'abc', 'string', 'descend')).toBeGreaterThan(0);
    expect(compareQueryValues('', 'abc', 'string', 'descend')).toBeGreaterThan(0);
    expect(compareQueryValues('   ', 'abc', 'string', 'descend')).toBeGreaterThan(0);
    expect(compareQueryValues(null, undefined, 'unknown', 'descend')).toBe(0);
    expect(compareQueryValues('', undefined, 'unknown', 'descend')).toBe(0);
  });

  it('falls back safely for unknown types', () => {
    expect(compareQueryValues('100', '2', 'unknown')).toBeGreaterThan(0);
    expect(compareQueryValues('apple', 'banana', 'unknown')).toBeLessThan(0);
  });
});
